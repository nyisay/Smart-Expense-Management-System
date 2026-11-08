import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import type { DashboardData } from "./store";

export function ComparisonView({ data }: { data: DashboardData }) {
  const comparison = data.comparison;
  return <Card><CardHeader><CardTitle><h2>Previous-period comparison</h2></CardTitle></CardHeader><CardContent className="space-y-3">
    {comparison.range && <p className="text-sm text-muted-foreground">{comparison.range.label}: {comparison.range.from} to {comparison.range.to}. Same category scope.</p>}
    {comparison.summary ? <>
      <p className="text-sm">Recorded entries only; gaps in your ledger may affect comparisons.</p>
      <dl className="grid gap-3 sm:grid-cols-3">{([
        ["Income", data.income, comparison.summary.income],
        ["Expenses", data.expense, comparison.summary.expense],
        ["Net cash flow", data.balance, comparison.summary.balance],
      ] as const).map(([name, current, previous]) => <div key={name} className="rounded-lg bg-muted/40 p-3"><dt className="text-sm font-medium">{name}</dt><dd className="mt-2 break-words text-sm">Selected: {formatAmount(current)}<br />Previous: {formatAmount(previous)}<br />Change: {formatAmount(BigInt(current) - BigInt(previous))}</dd></div>)}</dl>
    </> : <p className="text-sm text-muted-foreground">{comparison.reason}</p>}
  </CardContent></Card>;
}
