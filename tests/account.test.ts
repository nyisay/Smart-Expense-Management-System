import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { profileSchema, passwordChangeSchema } from "../features/account/schemas";
import { loadProfile, updateProfile, changePassword } from "../features/account/store";
import { hashPassword, verifyPassword } from "../features/auth/password";
import { authenticate } from "../features/auth/service";
import { isCurrentSession } from "../features/auth/session-version";
import { assertLocalTestDatabase } from "./e2e/database";

assertLocalTestDatabase();
const fixtures: string[] = [];
const original = "Synthetic-old-password";
const replacement = "Synthetic-new-password";
async function account(name = "Original name") {
  const user = await prisma.user.create({ data: {
    email: `account-${randomUUID()}@example.invalid`, name, passwordHash: await hashPassword(original),
  } });
  fixtures.push(user.id);
  return user;
}
const change = (currentPassword = original, newPassword = replacement) => ({ currentPassword, newPassword, confirmPassword: newPassword });
after(async () => {
  await prisma.user.deleteMany({ where: { id: { in: fixtures } } });
  await prisma.$disconnect();
});

test("profile and password schemas bound input without trimming passwords or accepting target users", () => {
  assert.equal(profileSchema.parse({ name: "  မေ  ", expectedName: "Old" }).name, "မေ");
  for (const name of ["", "   ", "x".repeat(81)]) assert.equal(profileSchema.safeParse({ name, expectedName: "Old" }).success, false);
  for (const extra of [{ userId: randomUUID() }, { email: "other@example.invalid" }, { sessionVersion: 0 }]) {
    assert.equal(profileSchema.safeParse({ name: "New", expectedName: "Old", ...extra }).success, false);
    assert.equal(passwordChangeSchema.safeParse({ ...change(), ...extra }).success, false);
  }
  for (const input of [change(""), change(original, "short"), change(original, "x".repeat(129)), change(original, original), { ...change(), confirmPassword: "different-password" }]) {
    assert.equal(passwordChangeSchema.safeParse(input).success, false);
  }
  assert.equal(passwordChangeSchema.parse(change(original, " 12 characters long ")).newPassword, " 12 characters long ");
});

test("owned profiles expose only public fields, persist names, preserve credentials and reject stale edits", async () => {
  const [owner, other] = await Promise.all([account(), account("Other name")]);
  assert.deepEqual(Object.keys(await loadProfile(owner.id)).sort(), ["createdAt", "email", "name"]);
  for (const id of [null, "bad-id", randomUUID()]) {
    await assert.rejects(loadProfile(id));
    await assert.rejects(updateProfile(id, { name: "New", expectedName: owner.name }));
  }
  await assert.rejects(updateProfile(owner.id, { name: "Stolen", expectedName: other.name }));
  await assert.rejects(updateProfile(owner.id, { name: "Stolen", expectedName: owner.name, userId: other.id }));
  const saved = await updateProfile(owner.id, { name: "  New profile  ", expectedName: owner.name });
  assert.equal(saved.name, "New profile");
  assert.equal((await loadProfile(other.id)).name, other.name);
  const persisted = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
  assert.equal(persisted.email, owner.email);
  assert.ok(persisted.passwordHash === owner.passwordHash);
  assert.equal(persisted.sessionVersion, 0);
  await assert.rejects(updateProfile(owner.id, { name: "Stale", expectedName: owner.name }));
  const results = await Promise.allSettled([
    updateProfile(owner.id, { name: "First", expectedName: saved.name }),
    updateProfile(owner.id, { name: "Second", expectedName: saved.name }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
});

test("session checks reject invalid principals/versions while preserving legacy version-zero sessions", async () => {
  const user = await account();
  assert.equal(await isCurrentSession(user.id, undefined), true);
  assert.equal(await isCurrentSession(user.id, 0), true);
  for (const version of [1, -1, "0", null, NaN]) assert.equal(await isCurrentSession(user.id, version), false);
  assert.equal(await isCurrentSession(null, 0), false);
  assert.equal(await isCurrentSession(randomUUID(), 0), false);
  await updateProfile(user.id, { name: "Changed", expectedName: user.name });
  assert.equal(await isCurrentSession(user.id, 0), true);
});

test("wrong current passwords, invalid input and missing principals never mutate credentials", async () => {
  const user = await account();
  for (const id of [null, "bad-id", randomUUID()]) await assert.rejects(changePassword(id, change()));
  await assert.rejects(changePassword(user.id, change("wrong-current-password")), /Current password is incorrect/);
  await assert.rejects(changePassword(user.id, { ...change(), confirmPassword: "mismatched-password" }));
  await assert.rejects(changePassword(user.id, { ...change(), userId: randomUUID() }));
  const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.ok(unchanged.passwordHash === user.passwordHash);
  assert.equal(unchanged.sessionVersion, 0);
});

test("password change atomically revokes old and legacy sessions, accepts only the new password and isolates other users", async () => {
  const [user, other] = await Promise.all([account(), account()]);
  const authenticated = await authenticate({ email: user.email, password: original });
  assert.equal(authenticated?.sessionVersion, 0);
  await changePassword(user.id, change());
  const changed = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(changed.sessionVersion, 1);
  assert.ok(changed.passwordHash !== user.passwordHash);
  assert.equal(await verifyPassword(changed.passwordHash, replacement), true);
  assert.equal(await verifyPassword(changed.passwordHash, original), false);
  assert.equal(await isCurrentSession(user.id, authenticated?.sessionVersion), false);
  assert.equal(await isCurrentSession(user.id, undefined), false);
  assert.equal(await isCurrentSession(user.id, 1), true);
  assert.equal(await isCurrentSession(other.id, 0), true);
  assert.equal(await authenticate({ email: user.email, password: original }), null);
  assert.equal((await authenticate({ email: user.email, password: replacement }))?.sessionVersion, 1);
  assert.ok((await prisma.user.findUniqueOrThrow({ where: { id: other.id } })).passwordHash === other.passwordHash);
});

test("concurrent password changes allow only one update of the verified credential version", async () => {
  const user = await account();
  const results = await Promise.allSettled([
    changePassword(user.id, change(original, "First-new-password")),
    changePassword(user.id, change(original, "Second-new-password")),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).sessionVersion, 1);
});

test("password verification attempts are bounded before accepting a later correct password", async () => {
  const user = await account();
  for (let index = 0; index < 5; index++) await assert.rejects(changePassword(user.id, change("Wrong-current-password")));
  await assert.rejects(changePassword(user.id, change()), /Too many password attempts/);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).sessionVersion, 0);
});
