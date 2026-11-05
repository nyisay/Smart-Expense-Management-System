import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { authenticate, register } from "../features/auth/service";
import { hashPassword, verifyPassword } from "../features/auth/password";
import { credentialsSchema, registrationSchema } from "../features/auth/schemas";
import { allowAuthAttempt } from "../features/auth/throttle";
import { parseAmount, serializeAmount, MAX_AMOUNT_MINOR } from "../lib/money";
import { owned } from "../lib/ownership";

const prefix = `foundation-${randomUUID()}`;
const email = `${prefix}@example.invalid`;
const password = `Test-only-${randomUUID()}`;
const emails: string[] = [email];

after(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = users.map((user) => user.id);
  const groups = await prisma.group.findMany({ where: { ownerId: { in: ids } }, select: { id: true } });
  const groupIds = groups.map((group) => group.id);
  await prisma.settlement.deleteMany({ where: { groupId: { in: groupIds } } });
  await prisma.groupExpense.deleteMany({ where: { groupId: { in: groupIds } } });
  await prisma.groupMember.deleteMany({ where: { groupId: { in: groupIds } } });
  await prisma.group.deleteMany({ where: { id: { in: groupIds } } });
  await prisma.transaction.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.receipt.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("Zod normalizes emails and bounds credentials without trimming passwords", () => {
  assert.equal(credentialsSchema.parse({ email: " USER@EXAMPLE.COM ", password }).email, "user@example.com");
  assert.equal(registrationSchema.safeParse({ email, password: "short", name: "Test" }).success, false);
  assert.equal(credentialsSchema.safeParse({ email, password: "x".repeat(129) }).success, false);
  assert.equal(registrationSchema.safeParse({ email, password, name: " " }).success, false);
  assert.equal(credentialsSchema.parse({ email, password: " spaced password " }).password, " spaced password ");
});

test("MMK parsing and serialization preserve exact whole-kyat values", () => {
  assert.equal(parseAmount(MAX_AMOUNT_MINOR.toString()), MAX_AMOUNT_MINOR);
  assert.equal(serializeAmount(parseAmount("1234567890123456")), "1234567890123456");
  for (const value of ["0", "-1", "1.5", "1.0", "1e3", "01", "1,000", "9000000000000001"]) {
    assert.throws(() => parseAmount(value));
  }
});

test("Argon2id hashes are salted and reject wrong passwords", async () => {
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.match(first, /^\$argon2id\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(first, password), true);
  assert.equal(await verifyPassword(first, "Incorrect-password"), false);
  assert.equal(await verifyPassword(undefined, password), false);
});

test("registration persists a safe hash and duplicate emails remain generic, including races", async () => {
  const input = { email, password, name: "Foundation test" };
  const outcomes = await Promise.all([register(input), register({ ...input, email: email.toUpperCase() })]);
  assert.equal(outcomes[0].ok, true);
  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.equal(await prisma.user.count({ where: { email } }), 1);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  assert.notEqual(user.passwordHash, password);
  assert.match(user.passwordHash, /^\$argon2id\$/);
  const valid = await authenticate({ email: email.toUpperCase(), password });
  assert.equal(valid?.id, user.id);
  assert.equal(Object.hasOwn(valid ?? {}, "passwordHash"), false);
  assert.equal(await authenticate({ email, password: "Incorrect-password" }), null);
  assert.equal(await authenticate({ email: `${prefix}-missing@example.invalid`, password }), null);
});

test("shared database throttling atomically bounds concurrent attempts", async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => allowAuthAttempt("login", `${prefix}-limit@example.invalid`)));
  assert.equal(results.filter(Boolean).length, 5);
});

test("ownership predicates isolate financial records and database constraints prevent cross-group data", async () => {
  const owner = await prisma.user.create({ data: { email: `${prefix}-owner@example.invalid`, name: "Owner", passwordHash: await hashPassword(password) } });
  const other = await prisma.user.create({ data: { email: `${prefix}-other@example.invalid`, name: "Other", passwordHash: await hashPassword(password) } });
  emails.push(owner.email, other.email);
  const category = await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } });
  const record = await prisma.transaction.create({ data: { ownerId: owner.id, type: "EXPENSE", categoryId: category.id, amountMinor: BigInt(100), occurredOn: new Date("2026-11-06T00:00:00Z"), submissionKey: randomUUID() } });
  assert.equal(await prisma.transaction.findFirst({ where: owned.transaction(record.id, other.id) }), null);
  assert.equal((await prisma.transaction.updateMany({ where: owned.transaction(record.id, other.id), data: { note: "forbidden" } })).count, 0);
  assert.equal((await prisma.transaction.deleteMany({ where: owned.transaction(record.id, other.id) })).count, 0);
  assert.equal((await prisma.transaction.findFirst({ where: owned.transaction(record.id, owner.id) }))?.amountMinor, BigInt(100));
  const receipt = await prisma.receipt.create({ data: { ownerId: other.id } });
  await assert.rejects(prisma.transaction.update({ where: { id: record.id }, data: { receiptId: receipt.id } }));
  await assert.rejects(prisma.transaction.update({ where: { id: record.id }, data: { amountMinor: BigInt(-1) } }));
  const group = await prisma.group.create({ data: { ownerId: owner.id, name: "Test group", members: { create: [{ name: "A", isSelf: true }, { name: "B" }] } }, include: { members: true } });
  const second = await prisma.group.create({ data: { ownerId: other.id, name: "Other group", members: { create: { name: "C", isSelf: true } } }, include: { members: true } });
  assert.equal(await prisma.group.findFirst({ where: owned.group(group.id, other.id) }), null);
  await assert.rejects(prisma.groupExpense.create({ data: { groupId: group.id, payerMemberId: second.members[0].id, title: "Invalid payer", amountMinor: BigInt(100), occurredOn: new Date(), submissionKey: randomUUID() } }));
  const expenseId = randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.groupExpense.create({ data: { id: expenseId, groupId: group.id, payerMemberId: group.members[0].id, title: "Unequal bill", amountMinor: BigInt(100), occurredOn: new Date(), submissionKey: randomUUID() } });
    await tx.expenseShare.createMany({ data: group.members.map((member, index) => ({ expenseId, groupId: group.id, memberId: member.id, owedMinor: BigInt(index === 0 ? 30 : 70) })) });
  });
  assert.equal(await prisma.groupExpense.findFirst({ where: owned.groupRecord(expenseId, other.id) }), null);
  await assert.rejects(prisma.expenseShare.update({ where: { expenseId_memberId: { expenseId, memberId: group.members[0].id } }, data: { owedMinor: BigInt(29) } }));
  assert.equal((await prisma.expenseShare.findMany({ where: { expenseId } })).reduce((sum, share) => sum + share.owedMinor, BigInt(0)), BigInt(100));
  await assert.rejects(prisma.settlement.create({ data: { groupId: group.id, fromMemberId: group.members[0].id, toMemberId: group.members[0].id, amountMinor: BigInt(10), occurredOn: new Date(), submissionKey: randomUUID() } }));
});
