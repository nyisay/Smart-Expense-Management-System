import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { assertLocalTestDatabase } from "./e2e/database";
import { previousPeriod } from "../features/dashboard/comparison";
import { aggregateDashboard } from "../features/dashboard/aggregate";
import { loadDashboard } from "../features/dashboard/store";
import { toDatabaseDate } from "../lib/dates";
import { exactRate, fullBudgetMonth, spendingInsights } from "../features/dashboard/insights";

assertLocalTestDatabase();
const users: string[] = [];
after(async () => {
  await prisma.budget.deleteMany({ where: { ownerId: { in: users } } });
  await prisma.transaction.deleteMany({ where: { ownerId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

test("comparisons align months, month-to-date, leap days and equal-length custom ranges", () => {
  assert.deepEqual(previousPeriod({ from: "2024-03-01", to: "2024-03-31" }), { from: "2024-02-01", to: "2024-02-29", label: "Previous calendar month" });
  assert.equal(previousPeriod({ from: "2024-03-01", to: "2024-03-30" })?.to, "2024-02-29");
  assert.equal(previousPeriod({ from: "2026-01-01", to: "2026-01-08" })?.from, "2025-12-01");
  assert.deepEqual(previousPeriod({ from: "2026-03-04", to: "2026-03-06" }), { from: "2026-03-01", to: "2026-03-03", label: "Immediately preceding equal-length range" });
  assert.equal(previousPeriod({ from: "1900-01-01", to: "1900-01-31" }), null);
  assert.equal(previousPeriod({ from: "1900-01-02", to: "1900-01-04" }), null);
});

test("cash flow zero-fills income and expenses while retaining negative and large exact nets", () => {
  const result = aggregateDashboard([
    { type: "INCOME", categoryId: "income", name: "Salary", month: "2026-11", amount: "18000000000000000" },
    { type: "EXPENSE", categoryId: "food", name: "Food", month: "2026-11", amount: "18000000000000001" },
  ], { from: "2026-11-01", to: "2026-12-31" });
  assert.deepEqual(result.cashflowMonths, [
    { month: "2026-11", income: "18000000000000000", expense: "18000000000000001", balance: "-1" },
    { month: "2026-12", income: "0", expense: "0", balance: "0" },
  ]);
  assert.equal(result.months[0].amount, result.expense);
});

test("database comparisons share owner/category predicates and suppress missing or future history", async () => {
  for (let index = 0; index < 2; index++) users.push((await prisma.user.create({ data: { email: `analytics-${randomUUID()}@example.invalid`, name: "Analytics test", passwordHash: "not-a-login-fixture" } })).id);
  const food = await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } });
  const salary = await prisma.category.findUniqueOrThrow({ where: { key: "income-salary" } });
  await prisma.transaction.createMany({ data: [
    { date: "2025-09-01", income: true, amount: "1" },
    { date: "2025-10-01", income: true, amount: "800" },
    { date: "2025-10-08", income: false, amount: "200" },
    { date: "2025-10-09", income: false, amount: "900" },
    { date: "2025-11-01", income: true, amount: "1000" },
    { date: "2025-11-08", income: false, amount: "300" },
  ].map((row) => ({ ownerId: users[0], categoryId: row.income ? salary.id : food.id, type: row.income ? "INCOME" as const : "EXPENSE" as const, amountMinor: BigInt(row.amount), occurredOn: toDatabaseDate(row.date), submissionKey: randomUUID() })) });
  const filters = { from: "2025-11-01", to: "2025-11-08" };
  const result = await loadDashboard(users[0], filters);
  assert.equal(result.income, "1000");
  assert.deepEqual(result.comparison.summary, { income: "800", expense: "200", balance: "600" });
  assert.equal(result.cashflowMonths[0].balance, "700");
  const category = await loadDashboard(users[0], { ...filters, categoryId: food.id });
  assert.equal(category.comparison.summary?.income, "0");
  assert.equal(category.comparison.summary?.expense, "200");
  assert.equal(category.income, "0");
  assert.equal((await loadDashboard(users[1], filters)).comparison.summary, null);
  assert.equal((await loadDashboard(users[0], { from: "9999-01-01", to: "9999-01-31" })).comparison.summary, null);
  await prisma.budget.create({ data: { ownerId: users[0], categoryId: food.id, month: toDatabaseDate("2025-11-01"), limitMinor: BigInt(250) } });
  assert.equal((await loadDashboard(users[0], filters)).insights.budgetNotices.length, 0);
  const monthly = await loadDashboard(users[0], { from: "2025-11-01", to: "2025-11-30" });
  assert.equal(monthly.insights.budgetNotices[0].overspend, "50");
  assert.equal(monthly.insights.savingsRate, "70.0%");
  assert.equal(category.insights.savingsRate, null);
  assert.equal((await loadDashboard(users[1], { from: "2025-11-01", to: "2025-11-30" })).insights.budgetNotices.length, 0);
});

test("insights handle signed rates, zero income, exact thresholds and insufficient history", () => {
  assert.equal(exactRate("-1", "3"), "-33.3%");
  assert.equal(exactRate("1", "0"), null);
  assert.equal(exactRate("18000000000000001", "18000000000000000"), "100.0%");
  assert.equal(fullBudgetMonth({ from: "2024-02-01", to: "2024-02-29" }), "2024-02");
  assert.equal(fullBudgetMonth({ from: "2024-02-01", to: "2024-02-28" }), null);
  const summary = aggregateDashboard([{ type: "EXPENSE", categoryId: "food", name: "Food", month: "2025-11", amount: "80" }], { from: "2025-11-01", to: "2025-11-30" });
  const result = spendingInsights(summary, null, [{ categoryId: "food", name: "Food", limit: "100" }]);
  assert.equal(result.budgetNotices[0].status, "approaching");
  assert.equal(result.savingsRate, null);
  assert.equal(result.spendingChange, null);
  assert.equal(spendingInsights(summary, "0", []).spendingChangeRate, null);
  assert.equal(spendingInsights(summary, "100", []).spendingChangeRate, "-20.0%");
  assert.equal(spendingInsights({ ...summary, income: "40", balance: "-40" }, "100", []).savingsRate, "-100.0%");
});
