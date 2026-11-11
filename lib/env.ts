import "server-only";
import { z } from "zod";

export const databaseUrlSchema = z.url().refine((value) => /^postgres(ql)?:/.test(value));

const schema = z.object({
  DATABASE_URL: databaseUrlSchema,
  AUTH_SECRET: z
    .string()
    .min(32)
    .refine((value) => !value.startsWith("REPLACE_")),
  AUTH_URL: z.url().refine((value) => {
    const url = new URL(value);
    const originOnly =
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;
    return (
      originOnly &&
      (url.protocol === "https:" ||
        (process.env.NODE_ENV !== "production" &&
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)))
    );
  }),
});

export function getServerEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const keys = [
      ...new Set(result.error.issues.map((issue) => issue.path[0])),
    ];
    throw new Error(
      `Missing or invalid server configuration: ${keys.join(", ")}`,
    );
  }
  return result.data;
}
