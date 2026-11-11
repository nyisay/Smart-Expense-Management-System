import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { transactionFiltersSchema, editTransactionSchema, deleteTransactionSchema } from "../features/transactions/schemas";
import { editExpenseSchema, deleteExpenseSchema } from "../features/groups/schemas";
import { saveBudgetSchema, removeBudgetSchema } from "../features/budgets/schemas";

const id = "00000000-0000-4000-8000-000000000001";
const invalidIntegers: unknown[] = [true, false, null, ["1"], [], {}, "", " ", "1e2", "0x10", "1.0", "+1", "-1", "1.5", 1.5, NaN, Infinity, "9".repeat(100)];

test("pagination accepts bounded integer scalars and rejects unintended coercion", () => {
  assert.equal(transactionFiltersSchema.parse({}).page, 1);
  for (const page of [1, "1", "0002", 1000000, "1000000"]) {
    assert.equal(transactionFiltersSchema.parse({ page }).page, Number(page));
  }
  for (const page of [...invalidIntegers, 0, "0", 1000001]) {
    assert.equal(transactionFiltersSchema.safeParse({ page }).success, false, `Unexpected page type: ${typeof page}`);
  }
});

test("transaction and group revision schemas reject booleans, arrays, missing values and alternate numeric notation", () => {
  const schemas = [editTransactionSchema.shape.version, deleteTransactionSchema.shape.version, editExpenseSchema.shape.version, deleteExpenseSchema.shape.version];
  for (const schema of schemas) {
    for (const version of [1, "1", 2147483646, "2147483646"]) assert.equal(schema.safeParse(version).success, true);
    for (const version of [...invalidIntegers, undefined, 0, "0", 2147483647]) assert.equal(schema.safeParse(version).success, false);
  }
});

test("budget revisions require explicit zero for creation and positive revisions for edits/removal", () => {
  const input = { month: "2026-11", categoryId: id, amount: "100" };
  for (const version of [0, "0"]) assert.equal(saveBudgetSchema.safeParse({ ...input, version }).success, true);
  assert.equal(saveBudgetSchema.safeParse({ ...input, id, version: "1" }).success, true);
  assert.equal(removeBudgetSchema.safeParse({ month: input.month, categoryId: id, id, version: "1" }).success, true);
  for (const version of [...invalidIntegers, undefined]) {
    assert.equal(saveBudgetSchema.safeParse({ ...input, id, version }).success, false);
    assert.equal(removeBudgetSchema.safeParse({ month: input.month, categoryId: id, id, version }).success, false);
  }
  assert.equal(saveBudgetSchema.safeParse({ ...input, version: 1 }).success, false);
  assert.equal(removeBudgetSchema.safeParse({ month: input.month, categoryId: id, id, version: 0 }).success, false);
});

test("Prisma rejects malformed or non-PostgreSQL configuration before connecting without exposing values", () => {
  for (const connection of ["not-a-url", "https://synthetic-config-secret@example.invalid/database", ""]) {
    const child = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", `try { require("./lib/prisma.ts"); process.stdout.write("accepted"); } catch (error) { process.stdout.write(error instanceof Error ? error.message : "unknown"); process.exitCode = 1; }`], {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: connection },
      timeout: 10000,
      windowsHide: true,
    });
    assert.equal(child.status, 1);
    assert.match(child.stdout, /DATABASE_URL/);
    assert.doesNotMatch(child.stdout + child.stderr, /synthetic-config-secret/);
  }
});
