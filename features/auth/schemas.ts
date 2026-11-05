import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().max(254).email().transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
});

export const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(80),
});
