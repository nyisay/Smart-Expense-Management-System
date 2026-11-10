import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function isCurrentSession(userId: unknown, version: unknown) {
  const id = z.uuid().safeParse(userId);
  // Before this additive migration, encrypted JWTs contained no version claim.
  const parsedVersion = z.number().int().nonnegative().safeParse(version === undefined ? 0 : version);
  if (!id.success || !parsedVersion.success) return false;
  const user = await prisma.user.findUnique({
    where: { id: id.data }, select: { sessionVersion: true },
  });
  return user !== null && user.sessionVersion === parsedVersion.data;
}
