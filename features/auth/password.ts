import "server-only";
import { argon2id, hash, verify } from "argon2";
import { randomBytes } from "node:crypto";

export function hashPassword(password: string) {
  return hash(password, { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

let dummyHash: Promise<string> | undefined;

export async function verifyPassword(passwordHash: string | undefined, password: string) {
  // Missing users still pay the password-verification cost.
  dummyHash ??= hashPassword(randomBytes(32).toString("hex"));
  const valid = await verify(passwordHash ?? await dummyHash, password);
  return passwordHash !== undefined && valid;
}
