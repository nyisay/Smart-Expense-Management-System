import "server-only";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CURRENCY } from "@/lib/money";
import { toDatabaseDate } from "@/lib/dates";
import {
  allocateShares,
  calculateBalances,
  repaymentPlan,
} from "./calculations";
import {
  createGroupSchema,
  addMemberSchema,
  createExpenseSchema,
  editExpenseSchema,
  deleteExpenseSchema,
  settlementSchema,
} from "./schemas";

export class GroupError extends Error {}
const unavailable = () =>
  new GroupError(
    "Group or record unavailable, or changed. Reload before trying again.",
  );
const retryConflict = () =>
  new GroupError(
    "This submission was already saved with different values. Reload before creating another record.",
  );

// Internal store: principal must come from the authenticated server session.
async function ownerId(input: unknown) {
  const id = z.uuid().safeParse(input);
  if (
    !id.success ||
    !(await prisma.user.findUnique({
      where: { id: id.data },
      select: { id: true },
    }))
  )
    throw new GroupError("Authentication required.");
  return id.data;
}

async function withGroup<T>(
  userId: unknown,
  groupId: string,
  operation: (tx: Prisma.TransactionClient, owner: string) => Promise<T>,
) {
  const owner = await ownerId(userId);
  return prisma.$transaction(async (tx) => {
    // One lock order serializes membership, bill and repayment writes within a group.
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "Group" WHERE "id" = ${groupId}::uuid AND "ownerId" = ${owner}::uuid FOR UPDATE`;
    if (!rows.length) throw unavailable();
    return operation(tx, owner);
  });
}

async function checkMembers(
  tx: Prisma.TransactionClient,
  groupId: string,
  ids: string[],
) {
  const unique = [...new Set(ids)];
  if (
    (await tx.groupMember.count({ where: { groupId, id: { in: unique } } })) !==
    unique.length
  )
    throw new GroupError(
      "Every payer and participant must belong to this group.",
    );
}

export async function createGroup(userId: unknown, input: unknown) {
  const owner = await ownerId(userId);
  const values = createGroupSchema.parse(input);
  try {
    return await prisma.group.create({
      data: {
        id: values.id,
        ownerId: owner,
        name: values.name,
        currency: CURRENCY,
        members: { create: { name: values.selfName, isSelf: true } },
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    )
      throw error;
    const existing = await prisma.group.findFirst({
      where: {
        id: values.id,
        ownerId: owner,
        name: values.name,
        members: { some: { isSelf: true, name: values.selfName } },
      },
      select: { id: true },
    });
    if (existing) return existing;
    throw retryConflict();
  }
}

export async function addMember(userId: unknown, input: unknown) {
  const values = addMemberSchema.parse(input);
  return withGroup(userId, values.groupId, async (tx) => {
    const existing = await tx.groupMember.findFirst({
      where: { id: values.id, groupId: values.groupId },
      select: { id: true, name: true },
    });
    if (existing) {
      if (existing.name !== values.name) throw retryConflict();
      return { id: existing.id };
    }
    if (
      (await tx.groupMember.count({ where: { groupId: values.groupId } })) >= 50
    )
      throw new GroupError(
        "This MVP supports up to 50 participants per group.",
      );
    try {
      return await tx.groupMember.create({
        data: { id: values.id, groupId: values.groupId, name: values.name },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new GroupError(
          "Use a unique participant name within this group.",
        );
      throw error;
    }
  });
}

export async function listGroups(userId: unknown) {
  const owner = await ownerId(userId);
  return prisma.group.findMany({
    where: { ownerId: owner },
    select: {
      id: true,
      name: true,
      currency: true,
      _count: { select: { members: true, expenses: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function loadGroup(userId: unknown, input: unknown) {
  const owner = await ownerId(userId);
  const id = z.uuid().parse(input);
  // shortcut: load the full group ledger for this MVP; aggregate/page it when histories grow large.
  return prisma.$transaction(
    async (tx) => {
      const group = await tx.group.findFirst({
        where: { id, ownerId: owner },
        select: {
          id: true,
          name: true,
          currency: true,
          members: {
            select: { id: true, name: true, isSelf: true },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          },
          expenses: {
            select: {
              id: true,
              title: true,
              amountMinor: true,
              payerMemberId: true,
              occurredOn: true,
              version: true,
              shares: {
                select: { memberId: true, owedMinor: true },
                orderBy: { memberId: "asc" },
              },
            },
            orderBy: [
              { occurredOn: "desc" },
              { createdAt: "desc" },
              { id: "desc" },
            ],
          },
          settlements: {
            select: {
              id: true,
              fromMemberId: true,
              toMemberId: true,
              amountMinor: true,
              occurredOn: true,
            },
            orderBy: [
              { occurredOn: "desc" },
              { createdAt: "desc" },
              { id: "desc" },
            ],
          },
        },
      });
      if (!group) return null;
      const balances = calculateBalances(
        group.members.map((member) => member.id),
        group.expenses,
        group.settlements,
      );
      return {
        id: group.id,
        name: group.name,
        currency: group.currency,
        members: group.members,
        total: group.expenses
          .reduce((sum, expense) => sum + expense.amountMinor, BigInt(0))
          .toString(),
        balances,
        plan: repaymentPlan(balances),
        expenses: group.expenses.map(
          ({ amountMinor, occurredOn, shares, ...expense }) => ({
            ...expense,
            amount: amountMinor.toString(),
            occurredOn: occurredOn.toISOString().slice(0, 10),
            shares: shares.map(({ memberId, owedMinor }) => ({
              memberId,
              amount: owedMinor.toString(),
            })),
          }),
        ),
        settlements: group.settlements.map(
          ({ amountMinor, occurredOn, ...settlement }) => ({
            ...settlement,
            amount: amountMinor.toString(),
            occurredOn: occurredOn.toISOString().slice(0, 10),
          }),
        ),
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}

export type GroupView = NonNullable<Awaited<ReturnType<typeof loadGroup>>>;
export type ExpenseView = GroupView["expenses"][number];

export async function createExpense(userId: unknown, input: unknown) {
  const values = createExpenseSchema.parse(input);
  const shares = allocateShares(values.amount, values.mode, values.shares);
  return withGroup(userId, values.groupId, async (tx) => {
    await checkMembers(tx, values.groupId, [
      values.payerMemberId,
      ...shares.map((share) => share.memberId),
    ]);
    const existing = await tx.groupExpense.findFirst({
      where: { groupId: values.groupId, submissionKey: values.submissionKey },
      include: { shares: true },
    });
    if (existing) {
      if (
        existing.title === values.title &&
        existing.amountMinor === values.amount &&
        existing.payerMemberId === values.payerMemberId &&
        existing.occurredOn.getTime() ===
          toDatabaseDate(values.occurredOn).getTime() &&
        existing.shares.length === shares.length &&
        shares.every((share) =>
          existing.shares.some(
            (row) =>
              row.memberId === share.memberId &&
              row.owedMinor === share.owedMinor,
          ),
        )
      )
        return { id: existing.id };
      throw retryConflict();
    }
    const expense = await tx.groupExpense.create({
      data: {
        groupId: values.groupId,
        title: values.title,
        amountMinor: values.amount,
        currency: CURRENCY,
        payerMemberId: values.payerMemberId,
        occurredOn: toDatabaseDate(values.occurredOn),
        submissionKey: values.submissionKey,
      },
      select: { id: true },
    });
    await tx.expenseShare.createMany({
      data: shares.map((share) => ({
        ...share,
        expenseId: expense.id,
        groupId: values.groupId,
      })),
    });
    return expense;
  });
}

export async function editExpense(userId: unknown, input: unknown) {
  const values = editExpenseSchema.parse(input);
  const shares = allocateShares(values.amount, values.mode, values.shares);
  return withGroup(userId, values.groupId, async (tx, owner) => {
    await checkMembers(tx, values.groupId, [
      values.payerMemberId,
      ...shares.map((share) => share.memberId),
    ]);
    const updated = await tx.groupExpense.updateMany({
      where: {
        id: values.id,
        groupId: values.groupId,
        version: values.version,
        group: { ownerId: owner },
      },
      data: {
        title: values.title,
        amountMinor: values.amount,
        payerMemberId: values.payerMemberId,
        occurredOn: toDatabaseDate(values.occurredOn),
        version: { increment: 1 },
      },
    });
    if (!updated.count) throw unavailable();
    await tx.expenseShare.deleteMany({
      where: {
        expenseId: values.id,
        groupId: values.groupId,
        expense: { group: { ownerId: owner } },
      },
    });
    await tx.expenseShare.createMany({
      data: shares.map((share) => ({
        ...share,
        expenseId: values.id,
        groupId: values.groupId,
      })),
    });
  });
}

export async function deleteExpense(userId: unknown, input: unknown) {
  const values = deleteExpenseSchema.parse(input);
  return withGroup(userId, values.groupId, async (tx, owner) => {
    const deleted = await tx.groupExpense.deleteMany({
      where: {
        id: values.id,
        groupId: values.groupId,
        version: values.version,
        group: { ownerId: owner },
      },
    });
    if (!deleted.count) throw unavailable();
  });
}

export async function recordSettlement(userId: unknown, input: unknown) {
  const values = settlementSchema.parse(input);
  return withGroup(userId, values.groupId, async (tx) => {
    await checkMembers(tx, values.groupId, [
      values.fromMemberId,
      values.toMemberId,
    ]);
    const existing = await tx.settlement.findFirst({
      where: { groupId: values.groupId, submissionKey: values.submissionKey },
    });
    if (existing) {
      if (
        existing.fromMemberId === values.fromMemberId &&
        existing.toMemberId === values.toMemberId &&
        existing.amountMinor === values.amount &&
        existing.occurredOn.getTime() ===
          toDatabaseDate(values.occurredOn).getTime()
      )
        return { id: existing.id };
      throw retryConflict();
    }
    return tx.settlement.create({
      data: {
        groupId: values.groupId,
        fromMemberId: values.fromMemberId,
        toMemberId: values.toMemberId,
        amountMinor: values.amount,
        currency: CURRENCY,
        occurredOn: toDatabaseDate(values.occurredOn),
        submissionKey: values.submissionKey,
      },
      select: { id: true },
    });
  });
}
