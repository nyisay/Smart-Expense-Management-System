import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/features/auth/password";
import { allowAuthAttempt } from "@/features/auth/throttle";
import { passwordChangeSchema, profileSchema } from "./schemas";

export class AccountError extends Error {}
const publicProfile = { name: true, email: true, createdAt: true } as const;
function principal(userId: unknown) {
  const result = z.uuid().safeParse(userId);
  if (!result.success) throw new AccountError("Your account is unavailable. Sign in again.");
  return result.data;
}

// Only a trusted server principal; actions never accept a target user from the form.
export async function loadProfile(userId: unknown) {
  const profile = await prisma.user.findUnique({ where: { id: principal(userId) }, select: publicProfile });
  if (!profile) throw new AccountError("Your account is unavailable. Sign in again.");
  return profile;
}

export async function updateProfile(userId: unknown, input: unknown) {
  const id = principal(userId);
  const values = profileSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id, name: values.expectedName }, data: { name: values.name },
    });
    if (!updated.count) throw new AccountError("Your profile changed in another tab. Reload settings before saving again.");
    return tx.user.findUniqueOrThrow({ where: { id }, select: publicProfile });
  });
}

export async function changePassword(userId: unknown, input: unknown) {
  const id = principal(userId);
  const values = passwordChangeSchema.parse(input);
  if (!await allowAuthAttempt("password-change", id))
    throw new AccountError("Too many password attempts. Try again in 15 minutes.");
  const user = await prisma.user.findUnique({
    where: { id }, select: { passwordHash: true, sessionVersion: true },
  });
  if (!await verifyPassword(user?.passwordHash, values.currentPassword) || !user)
    throw new AccountError("Current password is incorrect.");
  const passwordHash = await hashPassword(values.newPassword);
  const result = await prisma.user.updateMany({
    where: { id, passwordHash: user.passwordHash, sessionVersion: user.sessionVersion },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
  if (!result.count) throw new AccountError("Your password changed in another session. Sign in again before retrying.");
}
