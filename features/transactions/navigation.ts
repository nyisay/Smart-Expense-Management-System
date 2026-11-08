import { transactionFiltersSchema, type TransactionFilters } from "./schemas";

export function transactionListHref(filters: TransactionFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
  }
  return `/transactions${params.size ? `?${params}` : ""}`;
}

// Rebuild only known ledger filters; never redirect to an arbitrary submitted URL.
export function safeReturnTo(value: unknown) {
  if (typeof value !== "string" || !/^\/transactions(?:\?|$)/.test(value) || value.length > 2000) return "/transactions";
  const params = new URL(value, "http://localhost").searchParams;
  if ([...params.keys()].some((key) => params.getAll(key).length !== 1)) return "/transactions";
  const parsed = transactionFiltersSchema.safeParse(Object.fromEntries(params));
  return parsed.success ? transactionListHref(parsed.data) : "/transactions";
}

export function transactionDetailHref(id: string, returnTo: string, saved?: string) {
  const params = new URLSearchParams();
  if (saved) params.set("saved", saved);
  if (returnTo !== "/transactions") params.set("returnTo", safeReturnTo(returnTo));
  return `/transactions/${id}${params.size ? `?${params}` : ""}`;
}
