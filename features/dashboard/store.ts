import "server-only";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toDatabaseDate } from "@/lib/dates";
import { dashboardFilterSchema } from "./filters";
import { aggregateDashboard, type AggregateRow } from "./aggregate";

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
      const rows = await tx.$queryRaw<AggregateRow[]>(Prisma.sql`
      SELECT t."type", t."categoryId", c."name", to_char(t."occurredOn", 'YYYY-MM') AS "month",
             sum(t."amountMinor")::text AS "amount"
      FROM "Transaction" t JOIN "Category" c ON c."id" = t."categoryId"
      WHERE t."ownerId" = ${ownerId}::uuid AND t."occurredOn" >= ${filters.from}::date AND t."occurredOn" <= ${filters.to}::date
      ${categoryCondition}
      GROUP BY t."type", t."categoryId", c."name", to_char(t."occurredOn", 'YYYY-MM')
    `);
      const [recent, expenseCategories] = await Promise.all([
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
      ]);
      return {
        ...aggregateDashboard(rows, filters),
        filters,
        expenseCategories,
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
