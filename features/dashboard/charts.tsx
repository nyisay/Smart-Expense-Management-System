"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/money";
import { dashboardHref, formatMonth } from "./filters";
import { expensePercentage } from "./aggregate";
import type { DashboardData } from "./store";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
const compact = (value: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

type ChartData = Pick<
  DashboardData,
  "filters" | "categories" | "months" | "expense" | "expenseCategories"
>;

export function DashboardCharts({ data }: { data: ChartData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const color = (id: string) =>
    COLORS[
      Math.max(
        0,
        data.expenseCategories.findIndex((category) => category.id === id),
      ) % COLORS.length
    ];
  // Numeric values are chart coordinates only; labels and totals use exact integer strings.
  const categoryData = data.categories.map((category) => ({
    ...category,
    value: Number(category.amount),
  }));
  const monthData = data.months.map((month) => ({
    ...month,
    value: Number(month.amount),
  }));
  function select(id: string) {
    if (pending) return;
    const categoryId = data.filters.categoryId === id ? undefined : id;
    startTransition(() =>
      router.push(dashboardHref({ ...data.filters, categoryId })),
    );
  }
  return (
    <section
      className="space-y-3"
      aria-label="Spending visualizations"
      aria-busy={pending}
    >
      <p
        role="status"
        aria-live="polite"
        className="min-h-5 text-sm text-muted-foreground"
      >
        {pending
          ? "Updating all totals, charts and transactions…"
          : data.filters.categoryId
            ? "Expense category selected. All dashboard sections use this filter; income is zero in an expense-only category."
            : "Select a category in the donut or its table to explore the related transactions."}
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2>Where your money goes</h2>
            </CardTitle>
            <CardDescription>
              Expense categories · {formatAmount(data.expense)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.categories.length ? (
              <>
                <div
                  className="relative h-64 w-full min-w-0"
                  role="group"
                  aria-label="Expense category donut chart"
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    initialDimension={{ width: 320, height: 256 }}
                  >
                    <PieChart accessibilityLayer>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="id"
                        innerRadius="58%"
                        outerRadius="85%"
                        paddingAngle={categoryData.length > 1 ? 3 : 0}
                        stroke="var(--card)"
                        strokeWidth={3}
                        isAnimationActive={false}
                        onClick={(_entry, index) => {
                          const category = categoryData[index];
                          if (category) select(category.id);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {categoryData.map((category) => (
                          <Cell key={category.id} fill={color(category.id)} />
                        ))}
                      </Pie>
                      <Tooltip
                        wrapperStyle={{ zIndex: 20 }}
                        allowEscapeViewBox={{ x: false, y: false }}
                        content={({ active, payload }) => {
                          const category = data.categories.find(
                            (item) => item.id === payload?.[0]?.name,
                          );
                          return active && category ? (
                            <div className="max-w-56 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md">
                              <p className="font-medium">{category.name}</p>
                              <p className="mt-1 break-words tabular-nums">
                                {formatAmount(category.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {expensePercentage(
                                  category.amount,
                                  data.expense,
                                )}{" "}
                                of expenses
                              </p>
                            </div>
                          ) : null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-medium">Expenses</span>
                    <span className="text-xs text-muted-foreground">MMK</span>
                  </div>
                </div>
                <table className="w-full table-fixed text-left text-sm">
                  <caption className="sr-only">
                    Exact expense category totals. Activate a category button to
                    filter the entire dashboard.
                  </caption>
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="py-2 font-normal">
                        Category
                      </th>
                      <th scope="col" className="py-2 text-right font-normal">
                        Amount / share
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.categories.map((category) => (
                      <tr key={category.id}>
                        <th scope="row" className="py-2 font-normal">
                          <button
                            type="button"
                            aria-disabled={pending}
                            aria-pressed={
                              data.filters.categoryId === category.id
                            }
                            onClick={() => select(category.id)}
                            className="inline-flex items-center gap-2 rounded px-1 py-2 text-left text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:opacity-50"
                          >
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: color(category.id) }}
                              aria-hidden="true"
                            />
                            {category.name}
                          </button>
                        </th>
                        <td className="max-w-48 py-2 text-right">
                          <p className="font-medium tabular-nums [overflow-wrap:anywhere]">
                            {formatAmount(category.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expensePercentage(category.amount, data.expense)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.filters.categoryId && (
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    disabled={pending}
                    onClick={() => { if (data.filters.categoryId) select(data.filters.categoryId); }}
                  >
                    Clear category selection
                  </Button>
                )}
              </>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-2 px-5 text-center">
                <p className="font-medium">No expenses in this range</p>
                <p className="text-sm text-muted-foreground">
                  Add an expense or choose different dates to see your category
                  breakdown.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2>Monthly expense trend</h2>
            </CardTitle>
            <CardDescription>
              Monthly totals within the selected dates · MMK
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.expense !== "0" ? (
              <div
                className="h-80 w-full min-w-0"
                role="group"
                aria-label="Monthly expense bar chart"
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  initialDimension={{ width: 480, height: 320 }}
                >
                  <BarChart
                    data={monthData}
                    accessibilityLayer
                    margin={{ top: 15, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      tickFormatter={compact}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                      content={({ active, label }) => {
                        const month = data.months.find(
                          (item) => item.month === label,
                        );
                        return active && month ? (
                          <div className="max-w-56 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md">
                            <p className="font-medium">
                              {formatMonth(month.month)}
                            </p>
                            <p className="mt-1 break-words tabular-nums">
                              {formatAmount(month.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expenses
                            </p>
                          </div>
                        ) : null;
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name="Expenses"
                      fill="var(--chart-1)"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={56}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-80 flex-col items-center justify-center gap-2 text-center">
                <p className="font-medium">No spending to plot yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Your monthly trend will appear when this range contains an
                  expense.
                </p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Missing months count as zero. Choose a longer range to compare
              months.
            </p>
            <details className="mt-5 border-t pt-4">
              <summary className="cursor-pointer rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                View exact monthly amounts
              </summary>
              <div className="mt-3 max-h-72 overflow-auto" tabIndex={0} role="region" aria-label="Monthly expense table">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Exact monthly expenses for the selected date and category
                    filters
                  </caption>
                  <thead>
                    <tr className="text-muted-foreground">
                      <th scope="col" className="py-2 font-normal">
                        Month
                      </th>
                      <th scope="col" className="py-2 text-right font-normal">
                        Expenses (MMK)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.months.map((month) => (
                      <tr key={month.month}>
                        <th scope="row" className="py-2 font-normal">
                          {formatMonth(month.month)}
                        </th>
                        <td className="py-2 text-right tabular-nums">
                          {formatAmount(month.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
