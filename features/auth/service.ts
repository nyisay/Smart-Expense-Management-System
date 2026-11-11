import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { credentialsSchema, registrationSchema } from "./schemas";
import { hashPassword, verifyPassword } from "./password";
import { allowAuthAttempt } from "./throttle";

const publicUser = { id: true, name: true, email: true } as const;

export async function authenticate(input: unknown) {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  if (!await allowAuthAttempt("login", email)) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, passwordHash: true, sessionVersion: true } });
  if (!await verifyPassword(user?.passwordHash, password) || !user) return null;
  return { id: user.id, name: user.name, email: user.email, sessionVersion: user.sessionVersion };
}

export async function register(input: unknown) {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Use a valid email, a name up to 80 characters, and a password of 12–128 characters." };
  }
  const { email, password, name } = parsed.data;
  if (!await allowAuthAttempt("register", email)) {
    return { ok: false, message: "Too many attempts. Please try again in 15 minutes." };
  }
  const passwordHash = await hashPassword(password);
  try {
    await prisma.user.create({ data: { email, name, passwordHash }, select: publicUser });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
  }
  return { ok: true, message: "If registration can be completed, you can now sign in." };
}
