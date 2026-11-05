import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const directUrl = new URL(env("DIRECT_URL"));
// This local PostgreSQL instance listens on IPv4; the schema engine tries IPv6 first.
if (directUrl.hostname === "localhost") directUrl.hostname = "127.0.0.1";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl.toString(),
  },
});
