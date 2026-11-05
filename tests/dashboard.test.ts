import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import {
  aggregateDashboard,
  expensePercentage,
  type AggregateRow,
} from "../features/dashboard/aggregate";
import {
  dashboardFilterSchema,
  defaultDashboardRange,
  dashboardHref,
  relatedTransactionsHref,
} from "../features/dashboard/filters";
import { loadDashboard } from "../features/dashboard/store";
import { toDatabaseDate } from "../lib/dates";
import { MAX_AMOUNT_MINOR } from "../lib/money";

const november = { from: "2026-11-01", to: "2026-11-30" };
const users: string[] = [];
let food: string;
let travel: string;
let salary: string;

before(async () => {
  for (let index = 0; index < 4; index++) {
    const user = await prisma.user.create({
      data: {
        email: `dashboard-${randomUUID()}@example.invalid`,
        name: "Dashboard test",
        passwordHash: "not-a-login-fixture",
      },
    });
    users.push(user.id);
  }
  food = (
    await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } })
  ).id;
  travel = (
    await prisma.category.findUniqueOrThrow({
      where: { key: "expense-travel" },
    })
  ).id;
  salary = (
    await prisma.category.findUniqueOrThrow({ where: { key: "income-salary" } })
  ).id;
  const fixture = (
    categoryId: string,
    amount: number,
    date: string,
    ownerId = users[0],
  ) => ({
    ownerId,
    categoryId,
    type: categoryId === salary ? ("INCOME" as const) : ("EXPENSE" as const),
    amountMinor: BigInt(amount),
    occurredOn: toDatabaseDate(date),
    submissionKey: randomUUID(),
    merchant: "Dashboard fixture",
  });
  await prisma.transaction.createMany({
    data: [
      fixture(salary, 100000, "2026-11-01"),
      fixture(food, 30000, "2026-11-01"),
      fixture(travel, 20000, "2026-11-30"),
      fixture(salary, 15000, "2026-11-30"),
      fixture(food, 10000, "2026-12-01"),
      fixture(food, 5000, "2026-10-31"),
      fixture(food, 999999, "2026-11-15", users[1]),
    ],
  });
  await prisma.transaction.createMany({
    data: [food, travel].map((categoryId) => ({
      ownerId: users[3],
      categoryId,
      type: "EXPENSE",
      amountMinor: MAX_AMOUNT_MINOR,
      occurredOn: toDatabaseDate("2026-11-06"),
      submissionKey: randomUUID(),
    })),
  });
});

after(async () => {
  await prisma.transaction.deleteMany({ where: { ownerId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

test("dashboard filters handle defaults, leap months, invalid ranges and unsafe parameters", () => {
  assert.deepEqual(defaultDashboardRange("2024-02-15"), {
    from: "2024-02-01",
    to: "2024-02-29",
  });
  assert.deepEqual(dashboardFilterSchema("2026-11-06").parse({}), november);
  for (const input of [
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026-11-30", to: "2026-11-01" },
    { from: ["2026-11-01"] },
    { categoryId: "' OR true --" },
    { from: "1900-01-01", to: "2026-01-01" },
  ]) {
    assert.equal(dashboardFilterSchema().safeParse(input).success, false);
  }
  const filtered = { ...november, categoryId: food };
  assert.equal(
    new URL(dashboardHref(filtered), "http://localhost").searchParams.get(
      "categoryId",
    ),
    food,
  );
  assert.equal(
    new URL(
      dashboardHref({ ...filtered, categoryId: undefined }),
      "http://localhost",
    ).searchParams.has("categoryId"),
    false,
  );
  assert.ok(relatedTransactionsHref(filtered).startsWith("/transactions?"));
});

test("empty aggregation returns exact zero totals and zero-filled monthly buckets", () => {
  const result = aggregateDashboard([], {
    from: "2026-11-15",
    to: "2027-02-02",
  });
  assert.equal(result.income, "0");
  assert.equal(result.expense, "0");
  assert.equal(result.balance, "0");
  assert.deepEqual(result.categories, []);
  assert.deepEqual(
    result.months,
    ["2026-11", "2026-12", "2027-01", "2027-02"].map((month) => ({
      month,
      amount: "0",
    })),
  );
});

test("aggregation reconciles categories and months while excluding income from spending", () => {
  const rows: AggregateRow[] = [
    {
      type: "INCOME",
      categoryId: "salary",
      name: "Salary",
      month: "2026-11",
      amount: "100000",
    },
    {
      type: "EXPENSE",
      categoryId: "food",
      name: "Food",
      month: "2026-11",
      amount: "30000",
    },
    {
      type: "EXPENSE",
      categoryId: "food",
      name: "Food",
      month: "2026-12",
      amount: "10000",
    },
    {
      type: "EXPENSE",
      categoryId: "travel",
      name: "Travel",
      month: "2026-11",
      amount: "20000",
    },
  ];
  const result = aggregateDashboard(rows, {
    from: "2026-11-01",
    to: "2027-01-31",
  });
  assert.equal(result.income, "100000");
  assert.equal(result.expense, "60000");
  assert.equal(result.balance, "40000");
  assert.deepEqual(
    result.categories.map((row) => [row.name, row.amount]),
    [
      ["Food", "40000"],
      ["Travel", "20000"],
    ],
  );
  assert.equal(
    result.categories
      .reduce((sum, row) => sum + BigInt(row.amount), BigInt(0))
      .toString(),
    result.expense,
  );
  assert.equal(
    result.months
      .reduce((sum, row) => sum + BigInt(row.amount), BigInt(0))
      .toString(),
    result.expense,
  );
  assert.equal(result.months[2].amount, "0");
  assert.equal(expensePercentage("30000", "50000"), "60.0%");
  assert.equal(expensePercentage("0", "0"), "0.0%");
});

test("PostgreSQL dashboard totals include both calendar boundaries and isolate owners", async () => {
  const result = await loadDashboard(users[0], november);
  assert.equal(result.income, "115000");
  assert.equal(result.expense, "50000");
  assert.equal(result.balance, "65000");
  assert.deepEqual(result.months, [{ month: "2026-11", amount: "50000" }]);
  assert.equal(result.recent.length, 4);
  assert.ok(
    result.recent.every(
      (row) =>
        row.occurredOn >= november.from &&
        row.occurredOn <= november.to &&
        row.amount !== "999999",
    ),
  );
  assert.equal(
    result.categories
      .reduce((sum, row) => sum + BigInt(row.amount), BigInt(0))
      .toString(),
    result.expense,
  );
  const inside = await loadDashboard(users[0], {
    from: "2026-11-02",
    to: "2026-11-29",
  });
  assert.equal(inside.expense, "0");
  assert.equal(inside.income, "0");
  const crossing = await loadDashboard(users[0], {
    from: "2026-11-30",
    to: "2026-12-01",
  });
  assert.equal(crossing.expense, "30000");
  assert.deepEqual(
    crossing.months.map((row) => row.amount),
    ["20000", "10000"],
  );
});

test("category drill-down applies to every summary, chart and recent transaction", async () => {
  const result = await loadDashboard(users[0], {
    from: "2026-11-01",
    to: "2027-01-31",
    categoryId: food,
  });
  assert.equal(result.income, "0");
  assert.equal(result.expense, "40000");
  assert.equal(result.balance, "-40000");
  assert.deepEqual(
    result.categories.map((row) => row.id),
    [food],
  );
  assert.deepEqual(
    result.months.map((row) => row.amount),
    ["30000", "10000", "0"],
  );
  assert.equal(result.recent.length, 2);
  assert.ok(
    result.recent.every(
      (row) => row.categoryName === "Food" && row.type === "EXPENSE",
    ),
  );
  await assert.rejects(
    loadDashboard(users[0], { ...november, categoryId: salary }),
  );
  await assert.rejects(
    loadDashboard(users[0], { ...november, categoryId: randomUUID() }),
  );
});

test("empty accounts and absent sessions never expose another owner's chart data", async () => {
  const empty = await loadDashboard(users[2], november);
  assert.equal(empty.income, "0");
  assert.equal(empty.expense, "0");
  assert.equal(empty.balance, "0");
  assert.deepEqual(empty.categories, []);
  assert.deepEqual(empty.recent, []);
  for (const principal of [undefined, "", randomUUID(), "' OR true --"])
    await assert.rejects(loadDashboard(principal, november));
  const own = await loadDashboard(users[0], { ...november, ownerId: users[1] });
  assert.equal(own.expense, "50000");
});

test("database aggregate sums retain precision beyond JavaScript safe integers", async () => {
  const result = await loadDashboard(users[3], november);
  const expected = (MAX_AMOUNT_MINOR * BigInt(2)).toString();
  assert.equal(result.expense, expected);
  assert.equal(result.balance, `-${expected}`);
  assert.equal(result.months[0].amount, expected);
  assert.equal(
    result.categories
      .reduce((sum, row) => sum + BigInt(row.amount), BigInt(0))
      .toString(),
    expected,
  );
});
