import "server-only";
import { requireUser } from "@/features/auth/session";
import * as store from "./store";

export async function getTransactionList(filters: unknown) {
  const user = await requireUser();
  return store.listTransactions(user.id, filters);
}
export async function getTransaction(id: unknown) {
  const user = await requireUser();
  return store.findTransaction(user.id, id);
}
export async function getCategories() {
  const user = await requireUser();
  return store.transactionCategories(user.id);
}
