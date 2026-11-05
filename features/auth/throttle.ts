import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/env";

export const THROTTLE_WINDOW_MS = 15 * 60 * 1000;

export async function allowAuthAttempt(action: "login" | "register", email: string) {
  const window = Math.floor(Date.now() / THROTTLE_WINDOW_MS);
  const expiresAt = new Date((window + 1) * THROTTLE_WINDOW_MS);
  const secret = getServerEnv().AUTH_SECRET;
  for (const [scope, limit] of [["global", 500], [email, 5]] as const) {
    const keyHash = createHmac("sha256", secret)
      .update(`${action}:${scope}:${window}`).digest("hex");
    const record = await prisma.authThrottle.upsert({
      where: { keyHash },
      create: { keyHash, expiresAt },
      update: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    if (record.attempts > limit) return false;
  }
  await prisma.authThrottle.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return true;
}
