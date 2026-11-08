import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { MAX_AMOUNT_MINOR } from "../lib/money";
import {
  allocateShares,
  calculateBalances,
  repaymentPlan,
} from "../features/groups/calculations";
import {
  createGroupSchema,
  createExpenseSchema,
  settlementSchema,
} from "../features/groups/schemas";
import {
  createGroup,
  deleteGroup,
  addMember,
  listGroups,
  loadGroup,
  createExpense,
  editExpense,
  deleteExpense,
  recordSettlement,
} from "../features/groups/store";
import { loadDashboard } from "../features/dashboard/store";
import { assertLocalTestDatabase } from "./e2e/database";

const a = "aaaaaaaa-0000-4000-8000-000000000001";
const b = "bbbbbbbb-0000-4000-8000-000000000002";
const c = "cccccccc-0000-4000-8000-000000000003";
const split = (values: string[]) =>
  values.map((value, index) => ({ memberId: [a, b, c][index], value }));

test("unequal exact amounts support zero shares and a payer with no owed share", () => {
  assert.deepEqual(
    allocateShares(BigInt(100), "AMOUNT", split(["20", "30", "50"])).map(
      (share) => share.owedMinor,
    ),
    [BigInt(20), BigInt(30), BigInt(50)],
  );
  const shares = allocateShares(
    BigInt(100),
    "AMOUNT",
    split(["0", "40", "60"]),
  );
  assert.deepEqual(
    calculateBalances(
      [a, b, c],
      [{ payerMemberId: a, amountMinor: BigInt(100), shares }],
      [],
    ).map((member) => member.net),
    ["100", "-40", "-60"],
  );
});

test("percentage allocation uses exact basis points and deterministic largest remainders", () => {
  assert.deepEqual(
    allocateShares(BigInt(101), "PERCENT", split(["50", "25", "25"])).map(
      (share) => share.owedMinor,
    ),
    [BigInt(51), BigInt(25), BigInt(25)],
  );
  const input = split(["33.33", "33.33", "33.34"]);
  const result = allocateShares(BigInt(2), "PERCENT", input);
  assert.deepEqual(
    result.map((share) => share.owedMinor),
    [BigInt(1), BigInt(0), BigInt(1)],
  );
  assert.deepEqual(
    [...allocateShares(BigInt(2), "PERCENT", [...input].reverse())].sort(
      (left, right) => left.memberId.localeCompare(right.memberId),
    ),
    result,
  );
  assert.deepEqual(
    allocateShares(BigInt(1), "PERCENT", split(["0", "50", "50"])).map(
      (share) => share.owedMinor,
    ),
    [BigInt(0), BigInt(1), BigInt(0)],
  );
  const max = allocateShares(MAX_AMOUNT_MINOR, "PERCENT", input);
  assert.equal(
    max.reduce((sum, share) => sum + share.owedMinor, BigInt(0)),
    MAX_AMOUNT_MINOR,
  );
});

test("splits reject zero bills, invalid totals, negative/fractional amounts and duplicate participants", () => {
  for (const amount of [BigInt(0), BigInt(-1), MAX_AMOUNT_MINOR + BigInt(1)])
    assert.throws(() => allocateShares(amount, "AMOUNT", split(["1"])));
  for (const values of [
    ["20", "30", "49"],
    ["-1", "1", "100"],
    ["1.5", "2", "96.5"],
    ["0", "0", "0"],
    ["01", "0", "99"],
  ])
    assert.throws(() => allocateShares(BigInt(100), "AMOUNT", split(values)));
  for (const values of [
    ["33.33", "33.33", "33.33"],
    ["100.001", "0", "0"],
    ["101", "0", "0"],
    ["-1", "1", "100"],
    ["1e2", "0", "0"],
  ])
    assert.throws(() => allocateShares(BigInt(100), "PERCENT", split(values)));
  assert.throws(() =>
    allocateShares(BigInt(100), "AMOUNT", [
      { memberId: a, value: "50" },
      { memberId: a, value: "50" },
    ]),
  );
  assert.throws(() => allocateShares(BigInt(100), "AMOUNT", []));
  assert.throws(() =>
    allocateShares(BigInt(100), "AMOUNT", [
      { memberId: a, value: "50" },
      { memberId: a.toUpperCase(), value: "50" },
    ]),
  );
  assert.throws(() =>
    allocateShares(
      BigInt(100),
      "AMOUNT",
      Array.from({ length: 51 }, () => ({
        memberId: randomUUID(),
        value: "0",
      })),
    ),
  );
  assert.throws(() => allocateShares(BigInt(100), "OTHER", split(["100"])));
  assert.deepEqual(
    allocateShares(BigInt(100), "AMOUNT", [
      { memberId: a.toUpperCase(), value: "100" },
    ])[0].memberId,
    a,
  );
});

test("multiple bills, partial/full repayments, overpayments and repayment plans reconcile exactly", () => {
  const expenses = [
    {
      payerMemberId: a,
      amountMinor: BigInt(100),
      shares: allocateShares(BigInt(100), "AMOUNT", split(["20", "30", "50"])),
    },
    {
      payerMemberId: b,
      amountMinor: BigInt(60),
      shares: allocateShares(BigInt(60), "AMOUNT", split(["20", "20", "20"])),
    },
  ];
  const balances = calculateBalances([a, b, c], expenses, []);
  assert.deepEqual(
    balances.map((member) => member.net),
    ["60", "10", "-70"],
  );
  const plan = repaymentPlan(balances);
  assert.deepEqual(plan, [
    { fromMemberId: c, toMemberId: a, amount: "60" },
    { fromMemberId: c, toMemberId: b, amount: "10" },
  ]);
  const settlements = plan.map((payment) => ({
    ...payment,
    amountMinor: BigInt(payment.amount),
  }));
  assert.deepEqual(
    calculateBalances([a, b, c], expenses, settlements).map(
      (member) => member.net,
    ),
    ["0", "0", "0"],
  );
  assert.deepEqual(
    repaymentPlan(calculateBalances([a, b, c], expenses, settlements)),
    [],
  );
  const partial = calculateBalances([a, b, c], expenses, [
    { fromMemberId: c, toMemberId: a, amountMinor: BigInt(30) },
  ]);
  assert.deepEqual(
    partial.map((member) => member.net),
    ["30", "10", "-40"],
  );
  const overpaid = calculateBalances([a, b, c], expenses, [
    { fromMemberId: c, toMemberId: a, amountMinor: BigInt(80) },
  ]);
  assert.deepEqual(
    overpaid.map((member) => member.net),
    ["-20", "10", "10"],
  );
  assert.deepEqual(
    calculateBalances([a, b, c], [], []).map((member) => member.net),
    ["0", "0", "0"],
  );
  assert.throws(() => repaymentPlan([{ id: a, net: "1" }]));
});

const users: string[] = [];
const groups: string[] = [];
before(async () => {
  for (let index = 0; index < 2; index++)
    users.push(
      (
        await prisma.user.create({
          data: {
            email: `groups-${randomUUID()}@example.invalid`,
            name: "Group tests",
            passwordHash: "not-a-login-fixture",
          },
        })
      ).id,
    );
});
after(async () => {
  await prisma.settlement.deleteMany({ where: { groupId: { in: groups } } });
  await prisma.groupExpense.deleteMany({ where: { groupId: { in: groups } } });
  await prisma.groupMember.deleteMany({ where: { groupId: { in: groups } } });
  await prisma.group.deleteMany({ where: { id: { in: groups } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});
async function fixture(owner = users[0]) {
  const id = randomUUID();
  groups.push(id);
  await createGroup(owner, { id, name: "Test trip", selfName: "A" });
  const self = (await loadGroup(owner, id))!.members[0];
  const guestB = randomUUID();
  const guestC = randomUUID();
  await addMember(owner, { id: guestB, groupId: id, name: "B" });
  await addMember(owner, { id: guestC, groupId: id, name: "C" });
  return { groupId: id, members: [self.id, guestB, guestC] };
}
const bill = (group: Awaited<ReturnType<typeof fixture>>) => ({
  groupId: group.groupId,
  title: "Dinner",
  amount: "100",
  occurredOn: "2026-11-07",
  payerMemberId: group.members[0],
  mode: "AMOUNT",
  shares: group.members.map((memberId, index) => ({
    memberId,
    value: ["20", "30", "50"][index],
  })),
  submissionKey: randomUUID(),
});

test("confirmed group deletion is owned, stale-safe, atomic and separate from personal transactions", async () => {
  assertLocalTestDatabase();
  const group = await fixture();
  const other = await fixture(users[1]);
  const expense = bill(group);
  const saved = await createExpense(users[0], expense);
  await createExpense(users[1], bill(other));
  await recordSettlement(users[1], {
    groupId: other.groupId, fromMemberId: other.members[1], toMemberId: other.members[0],
    amount: "5", occurredOn: "2026-11-07", submissionKey: randomUUID(), confirmed: "yes",
  });
  await recordSettlement(users[0], {
    groupId: group.groupId, fromMemberId: group.members[1], toMemberId: group.members[0],
    amount: "30", occurredOn: "2026-11-07", submissionKey: randomUUID(), confirmed: "yes",
  });
  const category = await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } });
  const personal = await prisma.transaction.create({ data: {
    ownerId: users[0], type: "EXPENSE", categoryId: category.id, amountMinor: BigInt(77),
    occurredOn: new Date("2026-11-07T00:00:00Z"), submissionKey: randomUUID(),
  } });
  try {
    const listed = (await listGroups(users[0])).find((row) => row.id === group.groupId)!;
    const deletion = { groupId: group.groupId, updatedAt: listed.updatedAt.toISOString(), confirmed: "yes" };
    for (const principal of [users[1], null, randomUUID()]) await assert.rejects(deleteGroup(principal, deletion));
    await assert.rejects(deleteGroup(users[0], { ...deletion, confirmed: "no" }));
    await assert.rejects(deleteGroup(users[0], { ...deletion, updatedAt: "invalid" }));
    await assert.rejects(deleteGroup(users[0], { ...deletion, ownerId: users[1] }));
    const { submissionKey, ...fields } = expense;
    void submissionKey;
    await editExpense(users[0], { ...fields, id: saved.id, version: 1, amount: "101", shares: group.members.map((memberId, index) => ({ memberId, value: ["21", "30", "50"][index] })) });
    await assert.rejects(deleteGroup(users[0], deletion));
    const preserved = (await loadGroup(users[0], group.groupId))!;
    assert.equal(preserved.expenses[0].amount, "101");
    assert.equal(preserved.settlements.length, 1);
    assert.equal(preserved.members.length, 3);
    const latest = (await listGroups(users[0])).find((row) => row.id === group.groupId)!;
    assert.ok(latest.updatedAt > listed.updatedAt);
    const before = await loadDashboard(users[0], { from: "2026-11-01", to: "2026-11-30" });
    const results = await Promise.allSettled([
      deleteGroup(users[0], { ...deletion, updatedAt: latest.updatedAt.toISOString() }),
      deleteGroup(users[0], { ...deletion, updatedAt: latest.updatedAt.toISOString() }),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(await loadGroup(users[0], group.groupId), null);
    assert.deepEqual(await Promise.all([
      prisma.groupMember.count({ where: { groupId: group.groupId } }),
      prisma.groupExpense.count({ where: { groupId: group.groupId } }),
      prisma.expenseShare.count({ where: { groupId: group.groupId } }),
      prisma.settlement.count({ where: { groupId: group.groupId } }),
    ]), [0, 0, 0, 0]);
    const otherHistory = (await loadGroup(users[1], other.groupId))!;
    assert.equal(otherHistory.expenses.length, 1);
    assert.equal(otherHistory.settlements.length, 1);
    assert.ok(await prisma.transaction.findUnique({ where: { id: personal.id } }));
    const after = await loadDashboard(users[0], { from: "2026-11-01", to: "2026-11-30" });
    assert.equal(after.expense, before.expense);
    assert.equal(after.balance, before.balance);
  } finally {
    await prisma.transaction.deleteMany({ where: { id: personal.id } });
  }
});

test("deleting an empty group preserves the owner's other group history", async () => {
  assertLocalTestDatabase();
  const other = await fixture();
  await createExpense(users[0], bill(other));
  const id = randomUUID();
  groups.push(id);
  await createGroup(users[0], { id, name: "Empty group", selfName: "A" });
  const empty = (await listGroups(users[0])).find((row) => row.id === id)!;
  await deleteGroup(users[0], { groupId: id, updatedAt: empty.updatedAt.toISOString(), confirmed: "yes" });
  assert.equal(await loadGroup(users[0], id), null);
  const preserved = (await loadGroup(users[0], other.groupId))!;
  assert.equal(preserved.expenses.length, 1);
  assert.equal(preserved.members.length, 3);
});

test("group request schemas validate names, dates, amounts and settlement direction/confirmation", () => {
  assert.equal(
    createGroupSchema.safeParse({ id: randomUUID(), name: " ", selfName: "A" })
      .success,
    false,
  );
  assert.equal(
    createGroupSchema.safeParse({
      id: randomUUID(),
      name: "Trip",
      selfName: "A",
      ownerId: users[1],
    }).success,
    false,
  );
  const data = {
    groupId: randomUUID(),
    title: "Dinner",
    amount: "100",
    occurredOn: "2026-11-07",
    payerMemberId: a,
    mode: "AMOUNT",
    shares: split(["20", "30", "50"]),
    submissionKey: randomUUID(),
  };
  for (const changes of [
    { amount: "0" },
    { amount: "1.5" },
    { occurredOn: "2026-02-29" },
    { shares: split(["0", "0", "0"]) },
    { currency: "USD" },
    { ownerId: users[1] },
  ])
    assert.equal(
      createExpenseSchema.safeParse({ ...data, ...changes }).success,
      false,
    );
  const repayment = {
    groupId: data.groupId,
    fromMemberId: a,
    toMemberId: b,
    amount: "30",
    occurredOn: data.occurredOn,
    submissionKey: randomUUID(),
    confirmed: "yes",
  };
  for (const changes of [
    { toMemberId: a },
    { amount: "0" },
    { confirmed: "no" },
    { currency: "USD" },
  ])
    assert.equal(
      settlementSchema.safeParse({ ...repayment, ...changes }).success,
      false,
    );
});

test("owned groups and guest creation are retry-safe, unique and isolated", async () => {
  const id = randomUUID();
  groups.push(id);
  const input = { id, name: "Weekend", selfName: "A" };
  const [first, retry] = await Promise.all([
    createGroup(users[0], input),
    createGroup(users[0], input),
  ]);
  assert.equal(first.id, retry.id);
  const member = { id: randomUUID(), groupId: id, name: "Guest" };
  await Promise.all([addMember(users[0], member), addMember(users[0], member)]);
  await assert.rejects(
    addMember(users[0], { ...member, id: randomUUID(), name: " guest " }),
  );
  await assert.rejects(addMember(users[0], { ...member, name: "Different" }));
  await assert.rejects(createGroup(users[0], { ...input, name: "Different" }));
  assert.equal(
    (await loadGroup(users[0], id))?.members.filter((row) => row.isSelf).length,
    1,
  );
  assert.equal((await loadGroup(users[0], id))?.members.length, 2);
  assert.equal(await loadGroup(users[1], id), null);
  assert.equal(
    (await listGroups(users[1])).some((row) => row.id === id),
    false,
  );
  await assert.rejects(addMember(users[1], { ...member, id: randomUUID() }));
  for (const principal of [null, randomUUID(), "bad-id"]) {
    await assert.rejects(listGroups(principal));
    await assert.rejects(loadGroup(principal, id));
    await assert.rejects(
      createGroup(principal, { ...input, id: randomUUID() }),
    );
  }
});

test("participant limit is enforced before writing another member", async () => {
  const group = await fixture();
  await prisma.groupMember.createMany({
    data: Array.from({ length: 47 }, (_, index) => ({
      groupId: group.groupId,
      name: `Guest ${index}`,
    })),
  });
  await assert.rejects(
    addMember(users[0], {
      groupId: group.groupId,
      id: randomUUID(),
      name: "One too many",
    }),
    /50 participants/,
  );
  assert.equal((await loadGroup(users[0], group.groupId))?.members.length, 50);
});

test("group expenses and repayments persist once, calculate balances and never enter the personal dashboard", async () => {
  const group = await fixture();
  const data = bill(group);
  const baseline = await loadDashboard(users[0], {
    from: "2026-11-07",
    to: "2026-11-07",
  });
  const [first, retry] = await Promise.all([
    createExpense(users[0], data),
    createExpense(users[0], data),
  ]);
  assert.equal(first.id, retry.id);
  let loaded = (await loadGroup(users[0], group.groupId))!;
  assert.equal(loaded.expenses.length, 1);
  assert.deepEqual(
    loaded.balances.map((row) => row.net),
    ["80", "-30", "-50"],
  );
  const repayment = {
    groupId: group.groupId,
    fromMemberId: group.members[1],
    toMemberId: group.members[0],
    amount: "10",
    occurredOn: "2026-11-07",
    submissionKey: randomUUID(),
    confirmed: "yes",
  };
  const [paid, paidRetry] = await Promise.all([
    recordSettlement(users[0], repayment),
    recordSettlement(users[0], repayment),
  ]);
  assert.equal(paid.id, paidRetry.id);
  loaded = (await loadGroup(users[0], group.groupId))!;
  assert.deepEqual(
    loaded.balances.map((row) => row.net),
    ["70", "-20", "-50"],
  );
  assert.equal(loaded.total, "100");
  await assert.rejects(
    recordSettlement(users[0], { ...repayment, amount: "11" }),
  );
  await assert.rejects(createExpense(users[0], { ...data, title: "Changed" }));
  const secondBill = {
    ...data,
    amount: "60",
    title: "Transport",
    payerMemberId: group.members[1],
    shares: group.members.map((memberId) => ({ memberId, value: "20" })),
    submissionKey: randomUUID(),
  };
  await createExpense(users[0], secondBill);
  loaded = (await loadGroup(users[0], group.groupId))!;
  assert.deepEqual(
    loaded.balances.map((row) => row.net),
    ["50", "20", "-70"],
  );
  const after = await loadDashboard(users[0], {
    from: "2026-11-07",
    to: "2026-11-07",
  });
  assert.equal(after.expense, baseline.expense);
  assert.equal(after.income, baseline.income);
  assert.equal(after.balance, baseline.balance);
  assert.equal(
    await prisma.transaction.count({ where: { ownerId: users[0] } }),
    0,
  );
});

test("bill correction replaces shares atomically, rejects stale writes, and retains repayments", async () => {
  const group = await fixture();
  const data = bill(group);
  const created = await createExpense(users[0], data);
  const { submissionKey, ...original } = data;
  void submissionKey;
  const edit = {
    ...original,
    id: created.id,
    version: 1,
    amount: "101",
    mode: "PERCENT",
    shares: group.members.map((memberId, index) => ({
      memberId,
      value: ["50", "25", "25"][index],
    })),
  };
  const concurrent = await Promise.allSettled([
    editExpense(users[0], edit),
    editExpense(users[0], edit),
  ]);
  assert.equal(
    concurrent.filter((result) => result.status === "fulfilled").length,
    1,
  );
  let loaded = (await loadGroup(users[0], group.groupId))!;
  assert.equal(loaded.expenses[0].amount, "101");
  assert.equal(loaded.expenses[0].version, 2);
  assert.equal(
    loaded.expenses[0].shares.reduce(
      (sum, share) => sum + BigInt(share.amount),
      BigInt(0),
    ),
    BigInt(101),
  );
  await assert.rejects(
    editExpense(users[0], {
      ...edit,
      version: 2,
      shares: [{ memberId: group.members[0], value: "10" }],
    }),
  );
  await assert.rejects(
    deleteExpense(users[0], {
      groupId: group.groupId,
      id: created.id,
      version: 1,
      confirmed: "yes",
    }),
  );
  await recordSettlement(users[0], {
    groupId: group.groupId,
    fromMemberId: group.members[1],
    toMemberId: group.members[0],
    amount: "10",
    occurredOn: "2026-11-07",
    submissionKey: randomUUID(),
    confirmed: "yes",
  });
  await deleteExpense(users[0], {
    groupId: group.groupId,
    id: created.id,
    version: 2,
    confirmed: "yes",
  });
  loaded = (await loadGroup(users[0], group.groupId))!;
  assert.equal(loaded.expenses.length, 0);
  assert.equal(loaded.settlements.length, 1);
  assert.deepEqual(
    loaded.balances.map((row) => row.net),
    ["-10", "10", "0"],
  );
});

test("every mutation rejects cross-owner/group IDs and missing principals without partial writes", async () => {
  const group = await fixture();
  const other = await fixture(users[1]);
  const data = bill(group);
  const saved = await createExpense(users[0], data);
  const { submissionKey, ...fields } = data;
  void submissionKey;
  const edit = { ...fields, id: saved.id, version: 1 };
  const deletion = {
    groupId: group.groupId,
    id: saved.id,
    version: 1,
    confirmed: "yes",
  };
  const repayment = {
    groupId: group.groupId,
    fromMemberId: group.members[1],
    toMemberId: group.members[0],
    amount: "10",
    occurredOn: "2026-11-07",
    submissionKey: randomUUID(),
    confirmed: "yes",
  };
  for (const principal of [users[1], null, randomUUID()]) {
    await assert.rejects(
      createExpense(principal, { ...data, submissionKey: randomUUID() }),
    );
    await assert.rejects(editExpense(principal, edit));
    await assert.rejects(deleteExpense(principal, deletion));
    await assert.rejects(recordSettlement(principal, repayment));
    await assert.rejects(
      addMember(principal, {
        groupId: group.groupId,
        id: randomUUID(),
        name: "Unauthorized",
      }),
    );
  }
  await assert.rejects(
    createExpense(users[0], {
      ...data,
      payerMemberId: other.members[0],
      submissionKey: randomUUID(),
    }),
  );
  await assert.rejects(
    createExpense(users[0], {
      ...data,
      shares: [{ memberId: other.members[0], value: "100" }],
      submissionKey: randomUUID(),
    }),
  );
  await assert.rejects(
    editExpense(users[0], { ...edit, payerMemberId: other.members[0] }),
  );
  await assert.rejects(
    recordSettlement(users[0], { ...repayment, toMemberId: other.members[0] }),
  );
  const loaded = (await loadGroup(users[0], group.groupId))!;
  assert.equal(loaded.expenses.length, 1);
  assert.equal(loaded.expenses[0].version, 1);
  assert.equal(loaded.settlements.length, 0);
});
