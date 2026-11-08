"use client";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import { formatMonth } from "./filters";
import type { DashboardSummary } from "./aggregate";

export function CashflowChart({ months }: { months: DashboardSummary["cashflowMonths"] }) {
  const points = months.map((month) => ({ ...month, incomeValue: Number(month.income), expenseValue: Number(month.expense), netValue: Number(month.balance) }));
  const hasData = months.some((month) => month.income !== "0" || month.expense !== "0");
  return <Card className="min-w-0">
    <CardHeader><CardTitle><h2>Income, expenses and net cash flow</h2></CardTitle><CardDescription>Same selected dates and category · MMK. Net means income minus expenses.</CardDescription></CardHeader>
    <CardContent>
      {hasData ? <div role="group" aria-label="Monthly income, expense and net cash flow chart" className="h-80 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 320 }}>
          <ComposedChart data={points} accessibilityLayer margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={28} />
            <YAxis width={58} tickFormatter={(value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" />
            <Legend />
            <Tooltip content={({ active, label }) => {
              const month = months.find((item) => item.month === label);
              return active && month ? <div className="max-w-56 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md"><p>{formatMonth(month.month)}</p><p>Income: {formatAmount(month.income)}</p><p>Expenses: {formatAmount(month.expense)}</p><p>Net: {formatAmount(month.balance)}</p></div> : null;
            }} />
            <Bar name="Income" dataKey="incomeValue" fill="var(--chart-2)" maxBarSize={48} isAnimationActive={false} />
            <Bar name="Expenses" dataKey="expenseValue" fill="var(--chart-1)" maxBarSize={48} isAnimationActive={false} />
            <Line name="Net cash flow" dataKey="netValue" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div> : <p className="py-8 text-center text-muted-foreground">No income or expenses in this range.</p>}
      <details className="mt-4 border-t pt-4"><summary className="cursor-pointer rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">View exact cash flow amounts</summary>
        <div className="mt-3 max-h-72 overflow-auto" role="region" aria-label="Exact monthly cash flow table" tabIndex={0}>
          <table className="w-full text-left text-sm"><caption className="sr-only">Exact monthly income, expenses and net cash flow in MMK</caption><thead><tr><th scope="col" className="py-2">Month</th><th scope="col" className="py-2 text-right">Income</th><th scope="col" className="py-2 text-right">Expenses</th><th scope="col" className="py-2 text-right">Net</th></tr></thead><tbody>{months.map((month) => <tr key={month.month} className="border-t"><th scope="row" className="py-2 font-normal">{formatMonth(month.month)}</th><td className="p-2 text-right tabular-nums">{formatAmount(month.income)}</td><td className="p-2 text-right tabular-nums">{formatAmount(month.expense)}</td><td className="p-2 text-right tabular-nums">{formatAmount(month.balance)}</td></tr>)}</tbody></table>
        </div>
      </details>
    </CardContent>
  </Card>;
}
