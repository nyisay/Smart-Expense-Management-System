import type { DashboardSummary } from "./aggregate";
import { budgetProgress } from "@/features/budgets/calculations";
import { monthRange } from "@/features/budgets/schemas";

// Round a signed ratio to one decimal without converting financial values to Number.
export function exactRate(numerator: string, denominator: string) {
  const base = BigInt(denominator);
  if (base <= BigInt(0)) return null;
  const value = BigInt(numerator);
  const magnitude = value < BigInt(0) ? -value : value;
  const tenths = (magnitude * BigInt(1000) + base / BigInt(2)) / base;
  return `${value < BigInt(0) && tenths !== BigInt(0) ? "-" : ""}${tenths / BigInt(10)}.${tenths % BigInt(10)}%`;
}

export function fullBudgetMonth(filters: { from: string; to: string }) {
  const month = filters.from.slice(0, 7);
  const range = monthRange(month);
  return filters.from === range.from && filters.to === range.to ? month : null;
}

export function spendingInsights(
  summary: DashboardSummary,
  previousExpense: string | null,
  budgets: { categoryId: string; name: string; limit: string }[],
) {
  const largest = summary.categories[0] ?? null;
  const change = previousExpense === null ? null : (BigInt(summary.expense) - BigInt(previousExpense)).toString();
  return {
    largest,
    savingsRate: exactRate(summary.balance, summary.income),
    spendingChange: change,
    spendingChangeRate: change === null ? null : exactRate(change, previousExpense!),
    budgetNotices: budgets.flatMap((budget) => {
      const spent = summary.categories.find((category) => category.id === budget.categoryId)?.amount ?? "0";
      const progress = budgetProgress(spent, budget.limit);
      return progress.status === "within" ? [] : [{ ...budget, spent, ...progress }];
    }),
  };
}
