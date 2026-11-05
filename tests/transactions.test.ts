import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { prisma } from "../lib/prisma";
import {
  createTransactionSchema,
  transactionFiltersSchema,
} from "../features/transactions/schemas";
import {
  createTransaction,
  editTransaction,
  deleteTransaction,
  findTransaction,
  listTransactions,
  transactionCategories,
  TransactionError,
} from "../features/transactions/store";
import {
  calendarDateSchema,
  toDatabaseDate,
  todayInReportingTimezone,
} from "../lib/dates";
import { developmentSeedEmail } from "../prisma/dev-seed-guard";
import { formatAmount } from "../lib/money";

let owner: string;
let other: string;
let expenseCategory: string;
let incomeCategory: string;
const ids: string[] = [];

before(async () => {
  for (let index = 0; index < 2; index++) {
    const user = await prisma.user.create({
      data: {
        email: `transactions-${randomUUID()}@example.invalid`,
        name: "Transaction tests",
        passwordHash: "not-a-login-fixture",
      },
    });
    ids.push(user.id);
  }
  [owner, other] = ids;
  expenseCategory = (
    await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } })
  ).id;
  incomeCategory = (
    await prisma.category.findUniqueOrThrow({ where: { key: "income-salary" } })
  ).id;
});
after(async () => {
  await prisma.transaction.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});
const input = () => ({
  type: "EXPENSE",
  amount: "12500",
  categoryId: expenseCategory,
  occurredOn: "2026-11-06",
  merchant: "Test market",
  note: "Test note",
  submissionKey: randomUUID(),
});

test("transaction validation rejects malformed money, dates, identity injection and overlong fields", () => {
  assert.equal(createTransactionSchema.parse(input()).amount, BigInt(12500));
  for (const amount of [
    "0",
    "-1",
    "1.5",
    "1.0",
    "1e6",
    "01",
    "9000000000000001",
  ]) {
    assert.equal(
      createTransactionSchema.safeParse({ ...input(), amount }).success,
      false,
    );
  }
  for (const occurredOn of [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-2-01",
    "1899-12-31",
    "invalid",
  ]) {
    assert.equal(
      createTransactionSchema.safeParse({ ...input(), occurredOn }).success,
      false,
    );
  }
  assert.equal(
    createTransactionSchema.safeParse({ ...input(), ownerId: other }).success,
    false,
  );
  assert.equal(
    createTransactionSchema.safeParse({ ...input(), currency: "USD" }).success,
    false,
  );
  assert.equal(
    createTransactionSchema.safeParse({ ...input(), merchant: "x".repeat(201) })
      .success,
    false,
  );
  assert.equal(
    createTransactionSchema.safeParse({ ...input(), note: "x".repeat(1001) })
      .success,
    false,
  );
});

test("calendar dates preserve boundaries and report today in Asia/Yangon", () => {
  assert.equal(calendarDateSchema.parse("2024-02-29"), "2024-02-29");
  assert.equal(
    toDatabaseDate("2026-11-06").toISOString(),
    "2026-11-06T00:00:00.000Z",
  );
  assert.equal(
    todayInReportingTimezone(new Date("2026-11-05T18:00:00Z")),
    "2026-11-06",
  );
  assert.match(formatAmount("9000000000000000"), /9,000,000,000,000,000/);
});

test("filter validation rejects bad ranges, duplicate values, types and invalid page numbers", () => {
  for (const value of [
    { page: "0" },
    { page: "1.5" },
    { page: "1000001" },
    { type: "UNKNOWN" },
    { categoryId: "bad" },
    { from: "2026-11-10", to: "2026-11-01" },
    { type: ["INCOME", "EXPENSE"] },
  ]) {
    assert.equal(transactionFiltersSchema.safeParse(value).success, false);
  }
  assert.equal(
    transactionFiltersSchema.parse({
      type: "",
      categoryId: "",
      from: "",
      to: "",
    }).page,
    1,
  );
});

test("create, read, edit and confirmed delete persist exact amounts and versions", async () => {
  const record = await createTransaction(owner, {
    ...input(),
    amount: "9000000000000000",
  });
  assert.equal(record.amount, "9000000000000000");
  const loaded = await findTransaction(owner, record.id);
  assert.equal(loaded?.amount, record.amount);
  assert.equal(loaded?.occurredOn, "2026-11-06");
  const { submissionKey: _key, ...fields } = input();
  void _key;
  await editTransaction(owner, {
    ...fields,
    id: record.id,
    version: record.version,
    merchant: "Updated market",
  });
  assert.equal(
    (await findTransaction(owner, record.id))?.merchant,
    "Updated market",
  );
  await deleteTransaction(owner, {
    id: record.id,
    version: 2,
    confirmed: "yes",
  });
  assert.equal(await findTransaction(owner, record.id), null);
});

test("database create retries are idempotent, including concurrent submissions", async () => {
  const values = input();
  const results = await Promise.all([
    createTransaction(owner, values),
    createTransaction(owner, values),
  ]);
  assert.equal(results[0].id, results[1].id);
  assert.equal(
    await prisma.transaction.count({
      where: { ownerId: owner, submissionKey: values.submissionKey },
    }),
    1,
  );
  await assert.rejects(
    createTransaction(owner, { ...values, amount: "9999" }),
    TransactionError,
  );
});

test("unauthenticated and cross-user reads and writes fail without exposing transactions", async () => {
  const record = await createTransaction(owner, input());
  assert.equal(await findTransaction(other, record.id), null);
  const { submissionKey: _key, ...fields } = input();
  void _key;
  await assert.rejects(
    editTransaction(other, { ...fields, id: record.id, version: 1 }),
    TransactionError,
  );
  await assert.rejects(
    deleteTransaction(other, { id: record.id, version: 1, confirmed: "yes" }),
    TransactionError,
  );
  assert.equal((await listTransactions(other, {})).total, 0);
  for (const principal of [undefined, "", randomUUID()]) {
    await assert.rejects(listTransactions(principal, {}), TransactionError);
    await assert.rejects(
      createTransaction(principal, input()),
      TransactionError,
    );
    await assert.rejects(
      findTransaction(principal, record.id),
      TransactionError,
    );
    await assert.rejects(transactionCategories(principal), TransactionError);
    await assert.rejects(
      editTransaction(principal, { ...fields, id: record.id, version: 1 }),
      TransactionError,
    );
    await assert.rejects(
      deleteTransaction(principal, {
        id: record.id,
        version: 1,
        confirmed: "yes",
      }),
      TransactionError,
    );
  }
  assert.ok(await findTransaction(owner, record.id));
});

test("category/type validation and optimistic locking prevent partial or stale writes", async () => {
  await assert.rejects(
    createTransaction(owner, { ...input(), type: "INCOME" }),
    TransactionError,
  );
  await assert.rejects(
    createTransaction(owner, { ...input(), categoryId: randomUUID() }),
    TransactionError,
  );
  const record = await createTransaction(owner, input());
  const { submissionKey: _key, ...fields } = input();
  void _key;
  await editTransaction(owner, {
    ...fields,
    id: record.id,
    version: 1,
    type: "INCOME",
    categoryId: incomeCategory,
    amount: "150000",
  });
  assert.equal((await findTransaction(owner, record.id))?.version, 2);
  assert.equal((await findTransaction(owner, record.id))?.type, "INCOME");
  await assert.rejects(
    editTransaction(owner, { ...fields, id: record.id, version: 1 }),
    TransactionError,
  );
  await assert.rejects(
    deleteTransaction(owner, { id: record.id, version: 1, confirmed: "yes" }),
    TransactionError,
  );
  await assert.rejects(
    deleteTransaction(owner, { id: record.id, version: 2, confirmed: "no" }),
  );
  assert.equal((await findTransaction(owner, record.id))?.amount, "150000");
  await deleteTransaction(owner, {
    id: record.id,
    version: 2,
    confirmed: "yes",
  });
  assert.equal(await findTransaction(owner, record.id), null);
});

test("combined filtering has inclusive dates, deterministic pagination and owner isolation", async () => {
  await prisma.transaction.createMany({
    data: Array.from({ length: 25 }, (_, index) => ({
      ownerId: other,
      submissionKey: randomUUID(),
      type: "EXPENSE",
      amountMinor: BigInt(100 + index),
      categoryId: expenseCategory,
      occurredOn: toDatabaseDate("2026-11-05"),
    })),
  });
  await createTransaction(other, {
    ...input(),
    type: "INCOME",
    categoryId: incomeCategory,
    occurredOn: "2026-11-06",
  });
  const filters = {
    type: "EXPENSE",
    categoryId: expenseCategory,
    from: "2026-11-05",
    to: "2026-11-05",
  };
  const first = await listTransactions(other, filters);
  const second = await listTransactions(other, { ...filters, page: 2 });
  assert.equal(first.total, 25);
  assert.equal(first.records.length, 20);
  assert.equal(second.records.length, 5);
  assert.equal(
    new Set([...first.records, ...second.records].map((record) => record.id))
      .size,
    25,
  );
  assert.equal(
    (await listTransactions(other, { ...filters, page: 999 })).page,
    2,
  );
  assert.equal(
    (
      await listTransactions(other, {
        type: "INCOME",
        from: "2026-11-06",
        to: "2026-11-06",
      })
    ).total,
    1,
  );
  assert.equal(
    (await listTransactions(other, { from: "2026-11-07" })).total,
    0,
  );
  assert.equal((await listTransactions(owner, filters)).total, 0);
});

test("sample seed guard refuses production, missing opt-in and remote or other databases", () => {
  const allowed = {
    NODE_ENV: "development",
    ALLOW_DEV_SEED: "true",
    DATABASE_URL: "postgresql://localhost:5432/smart_expense_db",
    DEV_SEED_EMAIL: "test@example.invalid",
  };
  assert.equal(developmentSeedEmail(allowed), allowed.DEV_SEED_EMAIL);
  for (const overrides of [
    { NODE_ENV: "production" },
    { ALLOW_DEV_SEED: "false" },
    { DATABASE_URL: "postgresql://remote.example/smart_expense_db" },
    { DATABASE_URL: "postgresql://localhost/production" },
  ]) {
    assert.throws(() => developmentSeedEmail({ ...allowed, ...overrides }));
  }
});

test("sample seed is idempotent for a local account and refuses production before writing", async () => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: owner },
    select: { email: true },
  });
  const run = (mode: "development" | "production") =>
    spawnSync(
      process.execPath,
      ["--conditions=react-server", "--import", "tsx", "prisma/seed-dev.ts"],
      {
        env: {
          ...process.env,
          NODE_ENV: mode,
          ALLOW_DEV_SEED: "true",
          DEV_SEED_EMAIL: user.email,
        },
        encoding: "utf8",
        timeout: 15000,
      },
    );
  const before = await prisma.transaction.count({ where: { ownerId: owner } });
  assert.equal(run("production").status, 1);
  assert.equal(
    await prisma.transaction.count({ where: { ownerId: owner } }),
    before,
  );
  assert.equal(run("development").status, 0);
  assert.equal(
    await prisma.transaction.count({ where: { ownerId: owner } }),
    before + 24,
  );
  assert.equal(run("development").status, 0);
  assert.equal(
    await prisma.transaction.count({ where: { ownerId: owner } }),
    before + 24,
  );
});
