"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { allowAuthAttempt } from "@/features/auth/throttle";
import { TransactionError } from "@/features/transactions/store";
import { ReceiptError } from "./image";
import { extractReceipt, confirmReceipt } from "./service";
import type { ReceiptSuggestion } from "./schemas";

export type ExtractionState = {
  message: string;
  suggestion?: ReceiptSuggestion;
  reviewKey?: string;
};
export type ReceiptSaveState = {
  message: string;
  errors?: Record<string, string[]>;
};

export async function extractReceiptAction(
  _state: ExtractionState,
  form: FormData,
): Promise<ExtractionState> {
  const user = await requireUser();
  try {
    if (!(await allowAuthAttempt("receipt", user.id)))
      return {
        message:
          "Extraction limit reached. Try again in 15 minutes or enter the expense manually.",
      };
    const suggestion = await extractReceipt(user.id, form.get("image"));
    return {
      message: "Review every field before saving. Nothing has been saved yet.",
      suggestion,
      reviewKey: randomUUID(),
    };
  } catch (error) {
    return {
      message:
        error instanceof ReceiptError
          ? error.message
          : "Extraction unavailable or returned invalid data. Check local Ollama, retry, or enter the expense manually.",
    };
  }
}

export async function confirmReceiptAction(
  _state: ReceiptSaveState,
  form: FormData,
): Promise<ReceiptSaveState> {
  const user = await requireUser();
  let id: string;
  try {
    const result = await confirmReceipt(user.id, {
      amount: form.get("amount"),
      merchant: form.get("merchant"),
      occurredOn: form.get("occurredOn"),
      currency: form.get("currency"),
      categoryId: form.get("categoryId"),
      note: form.get("note") ?? "",
      submissionKey: form.get("submissionKey"),
      confirmed: form.get("confirmed"),
    });
    id = result.id;
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        message: "Please correct the highlighted fields.",
        errors: z.flattenError(error).fieldErrors,
      };
    return {
      message:
        error instanceof TransactionError
          ? error.message
          : "Unable to save right now. Your reviewed values have been kept. Please retry.",
    };
  }
  revalidatePath("/transactions", "layout");
  revalidatePath("/dashboard");
  redirect(`/transactions/${id}?saved=created`);
}
