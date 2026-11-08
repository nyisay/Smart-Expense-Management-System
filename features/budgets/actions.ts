"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { saveBudget, removeBudget, BudgetError } from "./store";
import { budgetMonthSchema } from "./schemas";

export async function budgetAction(_state: { message: string }, form: FormData) {
  const user = await requireUser();
  let month: string;
  try {
    month = budgetMonthSchema.parse(form.get("month"));
    const identity = { month, categoryId: form.get("categoryId"), version: form.get("version"), id: form.get("id") };
    const intent = z.enum(["save", "remove"]).parse(form.get("intent"));
    if (intent === "remove") await removeBudget(user.id, identity);
    else await saveBudget(user.id, { ...identity, amount: form.get("amount") });
  } catch (error) {
    return { message: error instanceof BudgetError ? error.message : error instanceof z.ZodError ? "Enter a valid positive whole-kyat limit and month." : "Unable to update this budget. Your input has been kept." };
  }
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect(`/budgets?month=${month}&saved=yes`);
}
