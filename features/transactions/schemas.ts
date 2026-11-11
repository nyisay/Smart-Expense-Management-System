import { z } from "zod";
import { calendarDateSchema } from "@/lib/dates";
import { parseAmount } from "@/lib/money";
import { integerInputSchema } from "@/lib/validation";

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
  version: integerInputSchema(1, 2147483646),
});
export const deleteTransactionSchema = z.strictObject({
  id: z.uuid(),
  version: integerInputSchema(1, 2147483646),
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
    q: emptyOptional(z.string().trim().max(100)),
    minAmount: emptyOptional(z.string().refine((value) => value === "0" || amountSchema.safeParse(value).success, "Enter a valid whole-kyat minimum.")),
    maxAmount: emptyOptional(z.string().refine((value) => value === "0" || amountSchema.safeParse(value).success, "Enter a valid whole-kyat maximum.")),
    page: integerInputSchema(1, 1000000).default(1),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    path: ["to"],
    message: "End date must be on or after the start date.",
  })
  .refine((data) => data.minAmount === undefined || data.maxAmount === undefined || !/^\d+$/.test(data.minAmount) || !/^\d+$/.test(data.maxAmount) || BigInt(data.minAmount) <= BigInt(data.maxAmount), {
    path: ["maxAmount"], message: "Maximum must be at least the minimum.",
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
