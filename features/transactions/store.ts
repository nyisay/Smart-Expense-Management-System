import "server-only";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toDatabaseDate } from "@/lib/dates";
import { CURRENCY } from "@/lib/money";
import {
  createTransactionSchema,
  editTransactionSchema,
  deleteTransactionSchema,
  transactionFiltersSchema,
  type TransactionView,
} from "./schemas";

export const PAGE_SIZE = 20;
export class TransactionError extends Error {}

// Internal database boundary: callers must supply the server-authenticated user ID.
async function ownerId(value: unknown) {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw new TransactionError("Authentication required.");
  const exists = await prisma.user.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!exists) throw new TransactionError("Authentication required.");
  return parsed.data;
}

const selection = {
  id: true,
  type: true,
  amountMinor: true,
  currency: true,
  categoryId: true,
  category: { select: { name: true } },
  occurredOn: true,
  merchant: true,
  note: true,
  version: true,
} satisfies Prisma.TransactionSelect;

function view(
  record: Prisma.TransactionGetPayload<{ select: typeof selection }>,
): TransactionView {
  return {
    id: record.id,
    type: record.type,
    amount: record.amountMinor.toString(),
    currency: record.currency,
    categoryId: record.categoryId,
    categoryName: record.category.name,
    occurredOn: record.occurredOn.toISOString().slice(0, 10),
    merchant: record.merchant ?? "",
    note: record.note ?? "",
    version: record.version,
  };
}

async function checkCategory(id: string, type: "INCOME" | "EXPENSE") {
  if (
    !(await prisma.category.findFirst({
      where: { id, type },
      select: { id: true },
    }))
  ) {
    throw new TransactionError(
      "Choose a category matching the transaction type.",
    );
  }
}

export async function transactionCategories(userId: unknown) {
  await ownerId(userId);
  return prisma.category.findMany({
    select: { id: true, name: true, type: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function listTransactions(userId: unknown, input: unknown) {
  const owner = await ownerId(userId);
  const filters = transactionFiltersSchema.parse(input);
  const where: Prisma.TransactionWhereInput = {
    ownerId: owner,
    type: filters.type,
    categoryId: filters.categoryId,
    amountMinor: {
      gte: filters.minAmount === undefined ? undefined : BigInt(filters.minAmount),
      lte: filters.maxAmount === undefined ? undefined : BigInt(filters.maxAmount),
    },
    OR: filters.q ? ["merchant", "note"].map((field) => ({
      [field]: { contains: filters.q!.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" as const },
    })) : undefined,
    occurredOn: {
      gte: filters.from ? toDatabaseDate(filters.from) : undefined,
      lte: filters.to ? toDatabaseDate(filters.to) : undefined,
    },
  };
  return prisma.$transaction(
    async (tx) => {
      const total = await tx.transaction.count({ where });
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const page = Math.min(filters.page, pages);
      const records = await tx.transaction.findMany({
        where,
        select: selection,
        orderBy: [
          { occurredOn: "desc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      });
      return { records: records.map(view), total, page, pages };
    },
    { isolationLevel: "RepeatableRead" },
  );
}

export async function findTransaction(userId: unknown, id: unknown) {
  const owner = await ownerId(userId);
  const record = await prisma.transaction.findFirst({
    where: { id: z.uuid().parse(id), ownerId: owner },
    select: selection,
  });
  return record ? view(record) : null;
}

export async function createTransaction(userId: unknown, input: unknown) {
  const owner = await ownerId(userId);
  const values = createTransactionSchema.parse(input);
  await checkCategory(values.categoryId, values.type);
  const data = {
    ownerId: owner,
    submissionKey: values.submissionKey,
    type: values.type,
    amountMinor: values.amount,
    currency: CURRENCY,
    categoryId: values.categoryId,
    occurredOn: toDatabaseDate(values.occurredOn),
    merchant: values.merchant || null,
    note: values.note || null,
  };
  try {
    return view(await prisma.transaction.create({ data, select: selection }));
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    )
      throw error;
    const existing = await prisma.transaction.findUnique({
      where: {
        ownerId_submissionKey: {
          ownerId: owner,
          submissionKey: values.submissionKey,
        },
      },
      select: selection,
    });
    if (
      existing &&
      existing.type === data.type &&
      existing.amountMinor === data.amountMinor &&
      existing.categoryId === data.categoryId &&
      existing.occurredOn.getTime() === data.occurredOn.getTime() &&
      existing.merchant === data.merchant &&
      existing.note === data.note
    )
      return view(existing);
    throw new TransactionError(
      "This submission was already saved with different values. Reload before creating another transaction.",
    );
  }
}

export async function editTransaction(userId: unknown, input: unknown) {
  const owner = await ownerId(userId);
  const values = editTransactionSchema.parse(input);
  await checkCategory(values.categoryId, values.type);
  const result = await prisma.transaction.updateMany({
    where: { id: values.id, ownerId: owner, version: values.version },
    data: {
      type: values.type,
      amountMinor: values.amount,
      categoryId: values.categoryId,
      occurredOn: toDatabaseDate(values.occurredOn),
      merchant: values.merchant || null,
      note: values.note || null,
      version: { increment: 1 },
    },
  });
  if (!result.count)
    throw new TransactionError(
      "Transaction unavailable or changed. Reload before trying again.",
    );
}

export async function deleteTransaction(userId: unknown, input: unknown) {
  const owner = await ownerId(userId);
  const values = deleteTransactionSchema.parse(input);
  const result = await prisma.transaction.deleteMany({
    where: { id: values.id, ownerId: owner, version: values.version },
  });
  if (!result.count)
    throw new TransactionError(
      "Transaction unavailable or changed. Reload before trying again.",
    );
}
