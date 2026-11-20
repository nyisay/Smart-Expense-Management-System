import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const directUrl = new URL(env("DIRECT_URL"));
// This local PostgreSQL instance listens on IPv4; the schema engine tries IPv6 first.
if (directUrl.hostname === "localhost") directUrl.hostname = "127.0.0.1";
if (directUrl.searchParams.get("sslmode") === "require") {
  directUrl.searchParams.set("sslmode", "verify-full");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl.toString(),
  },
});
