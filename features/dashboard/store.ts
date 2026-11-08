import "server-only";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toDatabaseDate, todayInReportingTimezone } from "@/lib/dates";
import { dashboardFilterSchema } from "./filters";
import { aggregateDashboard, type AggregateRow } from "./aggregate";
import { previousPeriod } from "./comparison";
import { fullBudgetMonth, spendingInsights } from "./insights";

// Internal store: public callers obtain this principal through requireUser().
export async function loadDashboard(userId: unknown, input: unknown) {
  const ownerId = z.uuid().parse(userId);
  if (
    !(await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    }))
  )
    throw new Error("Authentication required.");
  const filters = dashboardFilterSchema().parse(input);
  const previous = previousPeriod(filters);
  const budgetMonth = fullBudgetMonth(filters);
  return prisma.$transaction(
    async (tx) => {
      if (
        filters.categoryId &&
        !(await tx.category.findFirst({
          where: { id: filters.categoryId, type: "EXPENSE" },
          select: { id: true },
        }))
      ) {
        throw new Error("Choose an available expense category.");
      }
      const from = toDatabaseDate(filters.from);
      const to = toDatabaseDate(filters.to);
      const categoryCondition = filters.categoryId
        ? Prisma.sql`AND t."categoryId" = ${filters.categoryId}::uuid`
        : Prisma.empty;
      const grouped = (range: { from: string; to: string }) => tx.$queryRaw<AggregateRow[]>(Prisma.sql`
      SELECT t."type", t."categoryId", c."name", to_char(t."occurredOn", 'YYYY-MM') AS "month",
             sum(t."amountMinor")::text AS "amount"
      FROM "Transaction" t JOIN "Category" c ON c."id" = t."categoryId"
      WHERE t."ownerId" = ${ownerId}::uuid AND t."occurredOn" >= ${range.from}::date AND t."occurredOn" <= ${range.to}::date
      ${categoryCondition}
      GROUP BY t."type", t."categoryId", c."name", to_char(t."occurredOn", 'YYYY-MM')
    `);
      const rows = await grouped(filters);
      const [recent, expenseCategories, previousRows, firstEntry, budgets] = await Promise.all([
        tx.transaction.findMany({
          where: {
            ownerId,
            occurredOn: { gte: from, lte: to },
            categoryId: filters.categoryId,
          },
          select: {
            id: true,
            type: true,
            amountMinor: true,
            occurredOn: true,
            merchant: true,
            category: { select: { name: true } },
          },
          orderBy: [
            { occurredOn: "desc" },
            { createdAt: "desc" },
            { id: "desc" },
          ],
          take: 8,
        }),
        tx.category.findMany({
          where: { type: "EXPENSE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        previous ? grouped(previous) : Promise.resolve([]),
        tx.transaction.findFirst({ where: { ownerId }, orderBy: { occurredOn: "asc" }, select: { occurredOn: true } }),
        budgetMonth ? tx.budget.findMany({ where: { ownerId, month: toDatabaseDate(`${budgetMonth}-01`), categoryId: filters.categoryId }, select: { categoryId: true, limitMinor: true, category: { select: { name: true } } } }) : Promise.resolve([]),
      ]);
      const futureRange = filters.to > todayInReportingTimezone();
      const hasHistory = previous && firstEntry && firstEntry.occurredOn.toISOString().slice(0, 10) <= previous.from && previousRows.length > 0;
      const previousSummary = previous && hasHistory && !futureRange ? aggregateDashboard(previousRows, previous) : null;
      const summary = aggregateDashboard(rows, filters);
      return {
        ...summary,
        budgetMonth,
        insights: spendingInsights(summary, previousSummary?.expense ?? null, budgets.map((budget) => ({ categoryId: budget.categoryId, name: budget.category.name, limit: budget.limitMinor.toString() }))),
        filters,
        expenseCategories,
        comparison: {
          range: previous,
          summary: previousSummary ? { income: previousSummary.income, expense: previousSummary.expense, balance: previousSummary.balance } : null,
          reason: futureRange ? "Choose Month to date or an ended range for an aligned comparison." : !hasHistory ? "Not enough earlier recorded history for a reliable comparison." : null,
        },
        recent: recent.map((record) => ({
          id: record.id,
          type: record.type,
          amount: record.amountMinor.toString(),
          occurredOn: record.occurredOn.toISOString().slice(0, 10),
          merchant: record.merchant ?? "",
          categoryName: record.category.name,
        })),
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
