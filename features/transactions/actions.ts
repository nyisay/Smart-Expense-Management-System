"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import * as store from "./store";
import { safeReturnTo, transactionDetailHref } from "./navigation";

export type TransactionFormState = {
  message: string;
  errors?: Record<string, string[]>;
};

function failure(error: unknown): TransactionFormState {
  if (error instanceof z.ZodError)
    return {
      message: "Please correct the highlighted fields.",
      errors: z.flattenError(error).fieldErrors,
    };
  if (error instanceof store.TransactionError)
    return { message: error.message };
  return {
    message:
      "Unable to save changes right now. Your entered values have been kept. Please try again.",
  };
}

function fields(form: FormData) {
  return {
    type: form.get("type"),
    amount: form.get("amount"),
    categoryId: form.get("categoryId"),
    occurredOn: form.get("occurredOn"),
    merchant: form.get("merchant") ?? "",
    note: form.get("note") ?? "",
  };
}

export async function createTransactionAction(
  _state: TransactionFormState,
  form: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();
  let id: string;
  try {
    id = (
      await store.createTransaction(user.id, {
        ...fields(form),
        submissionKey: form.get("submissionKey"),
      })
    ).id;
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/transactions", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/budgets");
  redirect(`/transactions/${id}?saved=created`);
}

export async function editTransactionAction(
  _state: TransactionFormState,
  form: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();
  const id = form.get("id");
  try {
    await store.editTransaction(user.id, {
      ...fields(form),
      id,
      version: form.get("version"),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/transactions", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/budgets");
  redirect(transactionDetailHref(String(id), safeReturnTo(form.get("returnTo")), "updated"));
}

export async function deleteTransactionAction(
  _state: TransactionFormState,
  form: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();
  try {
    await store.deleteTransaction(user.id, {
      id: form.get("id"),
      version: form.get("version"),
      confirmed: form.get("confirmed"),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/transactions", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/budgets");
  const destination = new URL(safeReturnTo(form.get("returnTo")), "http://localhost");
  destination.searchParams.set("deleted", "yes");
  redirect(`${destination.pathname}${destination.search}`);
}
