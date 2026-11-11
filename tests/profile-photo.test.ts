import "dotenv/config";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "../lib/prisma";
import { assertLocalTestDatabase } from "./e2e/database";
import { prepareProfilePhoto } from "../features/account/photo";
import { profilePhotoSchema } from "../features/account/schemas";
import { loadProfile, loadProfilePhoto, updateProfilePhoto, removeProfilePhoto } from "../features/account/store";

assertLocalTestDatabase();
const users: string[] = [];
async function account() {
  const user = await prisma.user.create({ data: { email: `photo-${randomUUID()}@example.invalid`, name: "Photo owner", passwordHash: "synthetic-unused-hash" } });
  users.push(user.id);
  return user;
}
async function photo() {
  const bytes = await sharp({ create: { width: 600, height: 400, channels: 3, background: "#8274c9" } }).jpeg().withMetadata().toBuffer();
  return new File([new Uint8Array(bytes)], "synthetic.jpg", { type: "image/jpeg" });
}
after(async () => {
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

test("profile photo validation rejects untrusted revisions, unsupported, oversized, corrupt and spoofed files", async () => {
  assert.deepEqual(profilePhotoSchema.parse({ expectedPhotoId: "" }), { expectedPhotoId: null });
  for (const value of [{}, { expectedPhotoId: 0 }, { expectedPhotoId: "bad" }, { expectedPhotoId: null, userId: randomUUID() }]) {
    assert.equal(profilePhotoSchema.safeParse(value).success, false);
  }
  const valid = await photo();
  for (const file of [null, new File([], "empty.png", { type: "image/png" }),
    new File([new Uint8Array(2_000_001)], "large.jpg", { type: "image/jpeg" }),
    new File(["<svg/>"], "bad.svg", { type: "image/svg+xml" }),
    new File(["corrupt"], "bad.png", { type: "image/png" }),
    new File([await valid.arrayBuffer()], "spoof.png", { type: "image/png" })]) {
    await assert.rejects(prepareProfilePhoto(file), /Choose a JPG|Unable to read/);
  }
  const huge = await sharp({ create: { width: 4000, height: 3001, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(prepareProfilePhoto(new File([new Uint8Array(huge)], "huge.png", { type: "image/png" })), /12 megapixels/);
  const frames = Buffer.concat([Buffer.alloc(10 * 10 * 3, 0), Buffer.alloc(10 * 10 * 3, 255)]);
  const animated = await sharp(frames, { raw: { width: 10, height: 20, channels: 3, pageHeight: 10 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  await assert.rejects(prepareProfilePhoto(new File([new Uint8Array(animated)], "animated.webp", { type: "image/webp" })), /static image/);
});

test("profile thumbnails decode to metadata-free 256px WebP with a bounded stored size", async () => {
  const thumbnail = await prepareProfilePhoto(await photo());
  const metadata = await sharp(thumbnail).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 256);
  assert.equal(metadata.height, 256);
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.icc, undefined);
  assert.ok(thumbnail.length <= 65536);
});

test("photo writes isolate owners, reject missing principals and stale revisions, and preserve account data", async () => {
  const [owner, other] = await Promise.all([account(), account()]);
  const file = await photo();
  for (const principal of [null, "bad", randomUUID()]) {
    await assert.rejects(loadProfilePhoto(principal));
    await assert.rejects(updateProfilePhoto(principal, { expectedPhotoId: null }, file));
    await assert.rejects(removeProfilePhoto(principal, { expectedPhotoId: randomUUID() }));
  }
  await assert.rejects(updateProfilePhoto(owner.id, { expectedPhotoId: null, userId: other.id }, file));
  await updateProfilePhoto(owner.id, { expectedPhotoId: null }, file);
  const saved = await loadProfile(owner.id);
  assert.ok(saved.profilePhotoId);
  assert.equal("profilePhoto" in saved, false);
  assert.equal(await loadProfilePhoto(other.id), null);
  await assert.rejects(updateProfilePhoto(owner.id, { expectedPhotoId: null }, file), /another tab/);
  await assert.rejects(removeProfilePhoto(other.id, { expectedPhotoId: saved.profilePhotoId }), /another tab/);
  assert.ok(await loadProfilePhoto(owner.id));
  const concurrent = await Promise.allSettled([
    updateProfilePhoto(owner.id, { expectedPhotoId: saved.profilePhotoId }, file),
    updateProfilePhoto(owner.id, { expectedPhotoId: saved.profilePhotoId }, file),
  ]);
  assert.equal(concurrent.filter((result) => result.status === "fulfilled").length, 1);
  const current = await loadProfile(owner.id);
  await assert.rejects(removeProfilePhoto(owner.id, { expectedPhotoId: saved.profilePhotoId }), /another tab/);
  await removeProfilePhoto(owner.id, { expectedPhotoId: current.profilePhotoId });
  assert.equal(await loadProfilePhoto(owner.id), null);
  assert.equal((await loadProfile(owner.id)).profilePhotoId, null);
  const after = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
  assert.equal(after.passwordHash, owner.passwordHash);
  assert.equal(after.email, owner.email);
  assert.equal(after.sessionVersion, owner.sessionVersion);
  assert.equal(after.name, owner.name);
});

test("database constraints prohibit unmatched photo revisions and oversized thumbnails", async () => {
  const owner = await account();
  await assert.rejects(prisma.user.update({ where: { id: owner.id }, data: { profilePhotoId: randomUUID() } }));
  await assert.rejects(prisma.user.update({ where: { id: owner.id }, data: { profilePhoto: new Uint8Array(65537), profilePhotoId: randomUUID() } }));
  assert.equal(await loadProfilePhoto(owner.id), null);
});
