import { z } from "zod";
import { calendarDateSchema } from "@/lib/dates";
import { createTransactionSchema } from "@/features/transactions/schemas";

export const budgetMonthSchema = z.string().regex(/^\d{4}-\d{2}$/).refine(
  (value) => calendarDateSchema.safeParse(`${value}-01`).success,
  "Choose a valid month from 1900 onward.",
);
const identity = {
  month: budgetMonthSchema,
  categoryId: z.uuid(),
  version: z.coerce.number().int().min(0).max(2147483646),
  id: z.preprocess((value) => value === "" || value === null ? undefined : value, z.uuid().optional()),
};
export const saveBudgetSchema = z.strictObject({
  ...identity,
  amount: createTransactionSchema.shape.amount,
}).refine((value) => value.version === 0 || !!value.id, "Reload the budget before editing.");
export const removeBudgetSchema = z.strictObject(identity).refine((value) => value.version > 0 && !!value.id, "Reload the budget before removing it.");

export function monthRange(month: string) {
  budgetMonthSchema.parse(month);
  const [year, number] = month.split("-").map(Number);
  return {
    from: `${month}-01`,
    to: new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10),
  };
}
