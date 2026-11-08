import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { assertLocalTestDatabase } from "./e2e/database";
import { prisma } from "../lib/prisma";
import { budgetProgress } from "../features/budgets/calculations";
import { budgetMonthSchema, monthRange } from "../features/budgets/schemas";
import { loadBudgets, saveBudget, removeBudget } from "../features/budgets/store";
import { createTransaction } from "../features/transactions/store";

assertLocalTestDatabase();
const users: string[] = [];
after(async () => {
  await prisma.budget.deleteMany({ where: { ownerId: { in: users } } });
  await prisma.transaction.deleteMany({ where: { ownerId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

test("monthly budgets handle exact limits, thresholds, overspend and calendar boundaries", () => {
  assert.equal(budgetProgress("9000000000000001", null).status, "unbudgeted");
  assert.equal(budgetProgress("79", "100").status, "within");
  assert.equal(budgetProgress("80", "100").status, "approaching");
  assert.equal(budgetProgress("100", "100").status, "reached");
  assert.equal(budgetProgress("101", "100").overspend, "1");
  assert.equal(budgetProgress("9000000000000001", "9000000000000000").overspend, "1");
  assert.equal(budgetProgress("0", "100").remaining, "100");
  assert.equal(budgetProgress("101", "100").progress, 100);
  assert.throws(() => budgetProgress("1", "0"));
  assert.equal(budgetMonthSchema.safeParse("2026-13").success, false);
  assert.deepEqual(monthRange("2024-02"), { from: "2024-02-01", to: "2024-02-29" });
  assert.equal(monthRange("9999-12").to, "9999-12-31");
});

test("budget storage isolates owners, preserves transactions, rejects stale limits and never rolls over", async () => {
  for (let index = 0; index < 2; index++) users.push((await prisma.user.create({ data: { email: `budget-${randomUUID()}@example.invalid`, name: "Budget test", passwordHash: "not-a-login-fixture" } })).id);
  const food = await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } });
  const salary = await prisma.category.findUniqueOrThrow({ where: { key: "income-salary" } });
  const input = { month: "2026-11", categoryId: food.id, version: 0, amount: "100" };
  await assert.rejects(saveBudget(null, input));
  await assert.rejects(saveBudget(randomUUID(), input));
  await assert.rejects(saveBudget(users[0], { ...input, categoryId: salary.id }));
  for (const amount of ["0", "1.5", "9000000000000001"]) await assert.rejects(saveBudget(users[0], { ...input, amount }));
  await Promise.all([saveBudget(users[0], input), saveBudget(users[0], input)]);
  await createTransaction(users[0], { type: "EXPENSE", amount: "101", categoryId: food.id, occurredOn: "2026-11-30", merchant: "Budget fixture", note: "", submissionKey: randomUUID() });
  await createTransaction(users[0], { type: "EXPENSE", amount: "40", categoryId: food.id, occurredOn: "2026-12-01", merchant: "Next month", note: "", submissionKey: randomUUID() });
  const row = (await loadBudgets(users[0], "2026-11")).categories.find((category) => category.id === food.id)!;
  assert.equal(row.spent, "101");
  assert.equal(row.overspend, "1");
  const identity = { month: input.month, categoryId: food.id, version: row.version, id: row.budgetId };
  await assert.rejects(saveBudget(users[1], { ...identity, amount: "500" }));
  await assert.rejects(removeBudget(users[1], identity));
  assert.equal((await loadBudgets(users[1], input.month)).categories.find((category) => category.id === food.id)?.limit, null);
  await saveBudget(users[0], { ...identity, amount: "200" });
  await assert.rejects(saveBudget(users[0], { ...identity, amount: "300" }));
  await assert.rejects(removeBudget(users[0], identity));
  const current = (await loadBudgets(users[0], input.month)).categories.find((category) => category.id === food.id)!;
  await removeBudget(users[0], { ...identity, version: current.version });
  await saveBudget(users[0], input);
  await assert.rejects(saveBudget(users[0], { ...identity, amount: "400" }));
  assert.equal((await loadBudgets(users[0], "2026-12")).categories.find((category) => category.id === food.id)?.limit, null);
  assert.equal(await prisma.transaction.count({ where: { ownerId: users[0] } }), 2);
});
