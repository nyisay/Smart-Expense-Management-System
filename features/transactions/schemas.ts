import { z } from "zod";
import { calendarDateSchema } from "@/lib/dates";
import { parseAmount } from "@/lib/money";

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);
const optionalText = (limit: number) =>
  z.string().trim().max(limit).default("");
const amountSchema = z.string().transform((value, ctx) => {
  try {
    return parseAmount(value);
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Enter a positive whole-kyat amount within the supported limit.",
    });
    return z.NEVER;
  }
});
const fields = {
  type: transactionTypeSchema,
  amount: amountSchema,
  categoryId: z.uuid("Choose a category."),
  occurredOn: calendarDateSchema,
  merchant: optionalText(200),
  note: optionalText(1000),
};

export const createTransactionSchema = z.strictObject({
  ...fields,
  submissionKey: z.uuid(),
});
export const editTransactionSchema = z.strictObject({
  ...fields,
  id: z.uuid(),
  version: z.coerce.number().int().min(1).max(2147483646),
});
export const deleteTransactionSchema = z.strictObject({
  id: z.uuid(),
  version: z.coerce.number().int().min(1).max(2147483646),
  confirmed: z.literal("yes", "Confirm deletion first."),
});

const emptyOptional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    schema.optional(),
  );
export const transactionFiltersSchema = z
  .object({
    type: emptyOptional(transactionTypeSchema),
    categoryId: emptyOptional(z.uuid()),
    from: emptyOptional(calendarDateSchema),
    to: emptyOptional(calendarDateSchema),
    page: z.coerce.number().int().min(1).max(1000000).default(1),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    path: ["to"],
    message: "End date must be on or after the start date.",
  });

export type TransactionFilters = z.output<typeof transactionFiltersSchema>;
export type CategoryOption = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};
export type TransactionView = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  currency: "MMK";
  categoryId: string;
  categoryName: string;
  occurredOn: string;
  merchant: string;
  note: string;
  version: number;
};
