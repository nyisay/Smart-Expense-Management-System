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

  const adapter = new PrismaPg({ connectionString: connection.data });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
