import "server-only";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toDatabaseDate } from "@/lib/dates";
import { saveBudgetSchema, removeBudgetSchema, monthRange } from "./schemas";
import { budgetProgress } from "./calculations";

export class BudgetError extends Error {}
async function owner(input: unknown) {
  const id = z.uuid().safeParse(input);
  if (!id.success || !await prisma.user.findUnique({ where: { id: id.data }, select: { id: true } }))
    throw new BudgetError("Authentication required.");
  return id.data;
}

export async function saveBudget(userId: unknown, input: unknown) {
  const ownerId = await owner(userId);
  const values = saveBudgetSchema.parse(input);
  if (!await prisma.category.findFirst({ where: { id: values.categoryId, type: "EXPENSE" }, select: { id: true } }))
    throw new BudgetError("Choose an expense category.");
  const where = { ownerId, categoryId: values.categoryId, month: toDatabaseDate(`${values.month}-01`) };
  if (values.version === 0) {
    try {
      await prisma.budget.create({ data: { ...where, limitMinor: values.amount } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const existing = await prisma.budget.findUnique({ where: { ownerId_categoryId_month: where } });
      if (existing?.limitMinor !== values.amount) throw new BudgetError("Budget changed. Reload before saving.");
    }
  } else {
    const result = await prisma.budget.updateMany({ where: { ...where, id: values.id, version: values.version }, data: { limitMinor: values.amount, version: { increment: 1 } } });
    if (!result.count) throw new BudgetError("Budget unavailable or changed. Reload before saving.");
  }
}

export async function removeBudget(userId: unknown, input: unknown) {
  const ownerId = await owner(userId);
  const values = removeBudgetSchema.parse(input);
  const result = await prisma.budget.deleteMany({ where: { ownerId, id: values.id, categoryId: values.categoryId, month: toDatabaseDate(`${values.month}-01`), version: values.version } });
  if (!result.count) throw new BudgetError("Budget unavailable or changed. Reload before removing it.");
}

export async function loadBudgets(userId: unknown, month: string) {
  const ownerId = await owner(userId);
  const range = monthRange(month);
  return prisma.$transaction(async (tx) => {
    const [categories, limits, spending] = await Promise.all([
      tx.category.findMany({ where: { type: "EXPENSE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      tx.budget.findMany({ where: { ownerId, month: toDatabaseDate(range.from) }, select: { id: true, categoryId: true, limitMinor: true, version: true } }),
      tx.$queryRaw<{ categoryId: string; amount: string }[]>`SELECT "categoryId", SUM("amountMinor")::text AS amount FROM "Transaction" WHERE "ownerId" = ${ownerId}::uuid AND "type" = 'EXPENSE' AND "occurredOn" >= ${range.from}::date AND "occurredOn" <= ${range.to}::date GROUP BY "categoryId"`,
    ]);
    return {
      month,
      categories: categories.map((category) => {
        const budget = limits.find((limit) => limit.categoryId === category.id);
        const spent = spending.find((row) => row.categoryId === category.id)?.amount ?? "0";
        const limit = budget?.limitMinor.toString() ?? null;
        return { ...category, id: category.id, budgetId: budget?.id ?? null, limit, spent, version: budget?.version ?? 0, ...budgetProgress(spent, limit) };
      }),
    };
  }, { isolationLevel: "RepeatableRead" });
}

export type BudgetMonth = Awaited<ReturnType<typeof loadBudgets>>;
