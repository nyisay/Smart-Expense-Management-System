import "server-only";
import {
  transactionCategories,
  createTransaction,
} from "@/features/transactions/store";
import { prepareReceiptImage } from "./image";
import { ollamaExtractor, type ReceiptExtractor } from "./provider";
import { confirmReceiptSchema, reviewSuggestion } from "./schemas";

// Trusted server principal only; public actions resolve the persisted session user.
export async function extractReceipt(
  userId: unknown,
  file: unknown,
  extractor: ReceiptExtractor = ollamaExtractor(),
) {
  const categories = (await transactionCategories(userId)).filter(
    (category) => category.type === "EXPENSE",
  );
  const image = await prepareReceiptImage(file);
  const result = await extractor(image, categories);
  return reviewSuggestion(
    result,
    categories.map((category) => category.id),
  );
}

export async function confirmReceipt(userId: unknown, input: unknown) {
  const values = confirmReceiptSchema.parse(input);
  return createTransaction(userId, {
    type: "EXPENSE",
    amount: values.amount.toString(),
    categoryId: values.categoryId,
    occurredOn: values.occurredOn,
    merchant: values.merchant,
    note: values.note,
    submissionKey: values.submissionKey,
  });
}
