import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { databaseUrlSchema } from "./env";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connection = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  if (!connection.success) {
    throw new Error("Missing or invalid database configuration: DATABASE_URL.");
  }

  const connectionUrl = new URL(connection.data);
  if (connectionUrl.searchParams.get("sslmode") === "require") {
    connectionUrl.searchParams.set("sslmode", "verify-full");
  }

  const adapter = new PrismaPg({ connectionString: connectionUrl.toString() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
