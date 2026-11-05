import { z } from "zod";

export function developmentSeedEmail(env: Record<string, string | undefined>) {
  if (env.NODE_ENV !== "development" || env.ALLOW_DEV_SEED !== "true") {
    throw new Error(
      "Sample seeding requires NODE_ENV=development and ALLOW_DEV_SEED=true.",
    );
  }
  const url = new URL(env.DATABASE_URL ?? "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.pathname !== "/smart_expense_db"
  ) {
    throw new Error(
      "Sample seeding is restricted to the local smart_expense_db database.",
    );
  }
  return z.email().parse(env.DEV_SEED_EMAIL).toLowerCase();
}
