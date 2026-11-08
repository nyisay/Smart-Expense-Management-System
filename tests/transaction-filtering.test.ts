import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { assertLocalTestDatabase } from "./e2e/database";
import { listTransactions } from "../features/transactions/store";
import { transactionFiltersSchema } from "../features/transactions/schemas";
import { safeReturnTo } from "../features/transactions/navigation";

assertLocalTestDatabase();
const owners: string[] = [];
after(async () => {
  await prisma.transaction.deleteMany({ where: { ownerId: { in: owners } } });
  await prisma.user.deleteMany({ where: { id: { in: owners } } });
  await prisma.$disconnect();
});

test("filter validation rejects malformed bounds and unsafe return URLs", () => {
  for (const values of [{ minAmount: "1.5" }, { maxAmount: "x" }, { minAmount: "20", maxAmount: "10" }, { q: "x".repeat(101) }, { maxAmount: "9000000000000001" }]) {
    assert.equal(transactionFiltersSchema.safeParse(values).success, false);
  }
  assert.equal(transactionFiltersSchema.parse({ minAmount: "0" }).minAmount, "0");
  for (const value of ["https://example.com", "//example.com", "/transactions/other", "/transactions?q=x&q=y", "/transactions?minAmount=bad"]) assert.equal(safeReturnTo(value), "/transactions");
  assert.equal(safeReturnTo("/transactions?q=shop&minAmount=100&page=2"), "/transactions?q=shop&minAmount=100&page=2");
});

test("database search uses literal text, exact inclusive amounts and consistent owned pagination", async () => {
  for (let i = 0; i < 2; i++) owners.push((await prisma.user.create({ data: { email: `filter-${randomUUID()}@example.invalid`, name: "Filter test", passwordHash: "not-a-login-fixture" } })).id);
  const food = await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } });
  await prisma.transaction.createMany({ data: Array.from({ length: 23 }, (_, i) => ({
    ownerId: i === 22 ? owners[1] : owners[0], type: "EXPENSE" as const, categoryId: food.id,
    amountMinor: BigInt(i === 21 ? "9000000000000000" : "100"), occurredOn: new Date("2025-11-08T00:00:00Z"), submissionKey: randomUUID(),
    merchant: i === 0 ? "100%_Shop" : "Shop", note: i === 1 ? "special note" : null,
  })) });
  assert.equal((await listTransactions(owners[0], { q: "%_" })).total, 1);
  assert.equal((await listTransactions(owners[0], { q: "SPECIAL NOTE" })).total, 1);
  const first = await listTransactions(owners[0], { q: "shop", minAmount: "100", maxAmount: "100" });
  const second = await listTransactions(owners[0], { q: "shop", minAmount: "100", maxAmount: "100", page: 2 });
  assert.equal(first.total, 21); assert.equal(first.records.length, 20); assert.equal(second.records.length, 1);
  assert.equal(new Set([...first.records, ...second.records].map((row) => row.id)).size, 21);
  assert.equal((await listTransactions(owners[0], { minAmount: "9000000000000000", maxAmount: "9000000000000000" })).records[0].amount, "9000000000000000");
  await assert.rejects(listTransactions(undefined, {}));
  assert.equal((await listTransactions(owners[1], { q: "special note" })).total, 0);
});
