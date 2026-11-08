import { monthIndex, monthKey, type DashboardFilters } from "./filters";

export type AggregateRow = {
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  name: string;
  month: string;
  amount: string;
};

// SQL has already grouped the authenticated, filtered rows; keep all arithmetic exact.
export function aggregateDashboard(
  rows: AggregateRow[],
  filters: DashboardFilters,
) {
  let income = BigInt(0);
  let expense = BigInt(0);
  const categories = new Map<
    string,
    { id: string; name: string; amount: bigint }
  >();
  const months = new Map<string, bigint>();
  const monthlyIncome = new Map<string, bigint>();
  for (
    let index = monthIndex(filters.from);
    index <= monthIndex(filters.to);
    index++
  )
    months.set(monthKey(index), BigInt(0));
  for (const row of rows) {
    const amount = BigInt(row.amount);
    if (row.type === "INCOME") {
      income += amount;
      monthlyIncome.set(row.month, (monthlyIncome.get(row.month) ?? BigInt(0)) + amount);
      continue;
    }
    expense += amount;
    const category = categories.get(row.categoryId) ?? {
      id: row.categoryId,
      name: row.name,
      amount: BigInt(0),
    };
    category.amount += amount;
    categories.set(row.categoryId, category);
    months.set(row.month, (months.get(row.month) ?? BigInt(0)) + amount);
  }
  return {
    income: income.toString(),
    expense: expense.toString(),
    balance: (income - expense).toString(),
    categories: [...categories.values()]
      .sort((a, b) =>
        a.amount === b.amount
          ? a.name.localeCompare(b.name)
          : a.amount > b.amount
            ? -1
            : 1,
      )
      .map((category) => ({ ...category, amount: category.amount.toString() })),
    months: [...months].map(([month, amount]) => ({
      month,
      amount: amount.toString(),
    })),
    cashflowMonths: [...months].map(([month, amount]) => ({
      month,
      income: (monthlyIncome.get(month) ?? BigInt(0)).toString(),
      expense: amount.toString(),
      balance: ((monthlyIncome.get(month) ?? BigInt(0)) - amount).toString(),
    })),
  };
}

export type DashboardSummary = ReturnType<typeof aggregateDashboard>;

export function expensePercentage(amount: string, total: string) {
  const denominator = BigInt(total);
  if (!denominator) return "0.0%";
  const tenths =
    (BigInt(amount) * BigInt(1000) + denominator / BigInt(2)) / denominator;
  return `${tenths / BigInt(10)}.${tenths % BigInt(10)}%`;
}
