import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import { ReportingFilters } from "@/features/dashboard/filter-form";
import { DashboardCharts } from "@/features/dashboard/charts";
import { ComparisonView } from "@/features/dashboard/comparison-view";
import { InsightsView } from "@/features/dashboard/insights-view";
import { dashboardHref, relatedTransactionsHref } from "@/features/dashboard/filters";
import type { DashboardData } from "@/features/dashboard/store";
import { AnalyticsExplorer } from "./explorer";

export function AnalyticsView({ data }: { data: DashboardData }) {
  return <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-8 sm:py-10">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Patterns in your personal ledger</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Analytics</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Compare income and spending, explore monthly cash flow and drill into the records behind each category.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href={dashboardHref(data.filters)}>View dashboard</Link></Button><Button asChild><Link href={relatedTransactionsHref(data.filters)}>View matching transactions</Link></Button></div>
    </header>
    <ReportingFilters data={data} path="/analytics" />
    <section aria-label="Analytics summary" className="grid gap-4 sm:grid-cols-3">{([
      ["Income", "income", data.income], ["Expenses", "expenses", data.expense], ["Net cash flow", "balance", data.balance],
    ] as const).map(([label, key, amount]) => <Card key={key} className="min-w-0"><CardHeader><CardTitle><h2>{label}</h2></CardTitle></CardHeader><CardContent><p data-summary={key} data-amount={amount} className="break-words text-2xl font-semibold tabular-nums">{formatAmount(amount)}</p><p className="mt-2 text-xs text-muted-foreground">Same selected dates and category</p></CardContent></Card>)}</section>
    <AnalyticsExplorer data={{ cashflowMonths: data.cashflowMonths, filters: data.filters }} />
    <ComparisonView data={data} />
    <DashboardCharts data={data} path="/analytics" />
    <InsightsView data={data} />
    <p className="pb-3 text-xs text-muted-foreground">Recorded personal transactions only. Group bills and repayments stay separate. Net cash flow is not a bank balance. Exact tables remain authoritative when chart coordinates are approximate.</p>
  </main>;
}
