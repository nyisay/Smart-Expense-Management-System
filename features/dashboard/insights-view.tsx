import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import type { DashboardData } from "./store";

export function InsightsView({ data }: { data: DashboardData }) {
  const insights = data.insights;
  return <Card>
    <CardHeader><CardTitle><h2>Spending insights</h2></CardTitle></CardHeader>
    <CardContent className="space-y-4 text-sm">
      <p className="text-muted-foreground">Rules use only your recorded personal transactions and the selected dates/category. Missing records can change these results.</p>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div><dt className="font-medium">Largest expense category</dt><dd className="mt-2 break-words">{insights.largest ? `${insights.largest.name}: ${formatAmount(insights.largest.amount)}` : "No expenses recorded in this range."}</dd></div>
        <div><dt className="font-medium">Cash-flow savings rate</dt><dd className="mt-2">{insights.savingsRate === null ? "Unavailable: no income in this selection." : `${insights.savingsRate} · (income − expenses) ÷ income. Recorded cash flow, not bank savings.`}</dd></div>
        <div><dt className="font-medium">Expense change</dt><dd className="mt-2 break-words">{insights.spendingChange === null ? data.comparison.reason : `${formatAmount(insights.spendingChange)}${insights.spendingChangeRate === null ? " · Percentage unavailable: previous expenses were zero." : ` (${insights.spendingChangeRate})`} against ${data.comparison.range?.from} to ${data.comparison.range?.to}.`}</dd></div>
      </dl>
      <div className="space-y-2 border-t pt-4">
        <h3 className="font-medium">Budget notices</h3>
        {data.budgetMonth ? insights.budgetNotices.length ? <ul className="space-y-2">{insights.budgetNotices.map((budget) => <li key={budget.categoryId} className="break-words rounded-lg bg-muted/40 p-3">{budget.name}: {budget.status === "over" ? `overspent by ${formatAmount(budget.overspend)}` : budget.status === "reached" ? "limit reached" : "80% threshold reached"}. Spent {formatAmount(budget.spent)} of {formatAmount(budget.limit)} ({budget.percentage}).</li>)}</ul> : <p>No saved budgets at or above 80% in this selection. Unset limits are unbudgeted.</p> : <p>Budget notices require one full calendar month. Partial ranges do not prorate monthly limits.</p>}
        <Link className="inline-block underline underline-offset-4" href={`/budgets?month=${data.filters.from.slice(0, 7)}`}>Review full-month budgets</Link>
      </div>
    </CardContent>
  </Card>;
}
