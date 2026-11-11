import { z } from "zod";

export function integerInputSchema(min: number, max: number) {
  return z.union([
    z.number(),
    z.string().max(16).regex(/^\d+$/).transform(Number),
  ]).pipe(z.number().int().min(min).max(max));
}
