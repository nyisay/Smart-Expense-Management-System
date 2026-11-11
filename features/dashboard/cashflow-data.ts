import type { DashboardSummary } from "./aggregate";

export type CashflowMode = "combined" | "net" | "cumulative";

export function cashflowPoints(months: DashboardSummary["cashflowMonths"]) {
  let cumulative = BigInt(0);
  return months.map((month) => {
    cumulative += BigInt(month.balance);
    // Numbers are chart coordinates only; exact strings remain authoritative for labels and tables.
    return { ...month, cumulative: cumulative.toString(), incomeValue: Number(month.income), expenseValue: Number(month.expense), netValue: Number(month.balance), cumulativeValue: Number(cumulative) };
  });
}
