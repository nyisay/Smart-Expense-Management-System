import { z } from "zod";
import { calendarDateSchema } from "@/lib/dates";
import { parseAmount } from "@/lib/money";
import { createTransactionSchema } from "@/features/transactions/schemas";

export const receiptFields = [
  "merchant",
  "total",
  "date",
  "currency",
  "categoryId",
] as const;
export const extractionSchema = z.strictObject({
  merchant: z.string().max(200).nullable(),
  total: z.string().max(40).nullable(),
  date: z.string().max(40).nullable(),
  currency: z.string().max(10).nullable(),
  categoryId: z.string().max(80).nullable(),
  uncertain: z.array(z.enum(receiptFields)).max(5),
});

export type ReceiptSuggestion = z.output<typeof extractionSchema>;
export const previousReviewSchema = z.object({
  suggestion: extractionSchema,
  reviewKey: z.uuid(),
});

export function reviewSuggestion(
  input: unknown,
  expenseCategoryIds: string[],
): ReceiptSuggestion {
  const data = extractionSchema.parse(input);
  data.merchant = data.merchant?.trim() || null;
  data.currency = data.currency?.trim().toUpperCase() || null;
  if (!data.currency || !/^[A-Z]{3}$/.test(data.currency)) data.currency = null;
  if (!calendarDateSchema.safeParse(data.date).success) data.date = null;
  if (!data.categoryId || !expenseCategoryIds.includes(data.categoryId))
    data.categoryId = null;
  try {
    parseAmount(data.total ?? "");
  } catch {
    data.total = null;
  }
  for (const field of data.uncertain) data[field] = null;
  // Never reinterpret a foreign or unknown currency amount as whole kyat.
  if (data.currency !== "MMK") data.total = null;
  data.uncertain = receiptFields.filter((field) => data[field] === null);
  return data;
}

export const confirmReceiptSchema = createTransactionSchema
  .omit({ type: true })
  .extend({
    currency: z.literal(
      "MMK",
      "Only MMK is supported. Verify the currency and enter a whole-kyat amount.",
    ),
    confirmed: z.literal("yes", "Review all fields and confirm before saving."),
  });
