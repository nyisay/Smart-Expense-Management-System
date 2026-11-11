import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import { relatedTransactionsHref } from "./filters";
import { DashboardCharts } from "./charts";
import { ReportingFilters } from "./filter-form";
import { CashflowChart } from "./cashflow";
import { ComparisonView } from "./comparison-view";
import { InsightsView } from "./insights-view";
import { RecentTable } from "./recent-table";
import type { DashboardData } from "./store";

export function DashboardView({ data }: { data: DashboardData }) {
  const summary = [
    {
      label: "Income",
      value: data.income,
      icon: ArrowDownLeft,
      description: "Money received in this range",
      accent:
        "bg-[var(--positive)]/10 text-[var(--positive)]",
    },
    {
      label: "Expenses",
      value: data.expense,
      icon: ArrowUpRight,
      description: "Personal expenses in this range",
      accent: "bg-[var(--negative)]/10 text-[var(--negative)]",
    },
    {
      label: "Balance",
      value: data.balance,
      icon: Wallet,
      description: "Selected income minus expenses",
      accent:
        "bg-primary/10 text-primary",
    },
  ];
  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-8 sm:py-10">

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Your finances, in focus
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            See what comes in, where it goes, and what remains.
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Reporting period: <time dateTime={data.filters.from}>{data.filters.from}</time> — <time dateTime={data.filters.to}>{data.filters.to}</time> · MMK</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/transactions/new">
            <Plus aria-hidden="true" />
            Add transaction
          </Link>
        </Button>
      </header>
      <ReportingFilters data={data} />
      <section
        aria-label="Financial summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[summary[2], summary[0], summary[1]].map((item) => (
          <Card key={item.label} className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                <h2>{item.label}</h2>
              </CardTitle>
              <span className={`rounded-lg p-2 ${item.accent}`}>
                <item.icon className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <p
                data-summary={item.label.toLowerCase()}
                data-amount={item.value}
                className="text-2xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere] lg:text-3xl"
              >
                {formatAmount(item.value)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card className="min-w-0">
          <CardHeader><CardTitle><h2>Savings rate</h2></CardTitle><span className="text-xs text-muted-foreground">Recorded cash flow</span></CardHeader>
          <CardContent><p className="text-2xl font-semibold tracking-tight tabular-nums">{data.insights.savingsRate ?? "Unavailable"}</p><p className="mt-2 text-xs text-muted-foreground">{data.insights.savingsRate === null ? "No income in this selection" : "Net cash flow divided by income"}</p></CardContent>
        </Card>
      </section>
      <section id="analytics" aria-label="Financial analytics" className="space-y-6">
      <CashflowChart months={data.cashflowMonths} />
      <DashboardCharts
        data={{
          filters: data.filters,
          categories: data.categories,
          months: data.months,
          expense: data.expense,
          expenseCategories: data.expenseCategories,
        }}
      />
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-2"><ComparisonView data={data} /><InsightsView data={data} /></div>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 sm:flex-row">
          <div>
            <CardTitle>
              <h2>Recent transactions</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              The latest 8 entries matching this dashboard
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={relatedTransactionsHref(data.filters)}>
              View all
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recent.length ? (
            <><RecentTable records={data.recent} /><ul className="divide-y md:hidden">
              {data.recent.map((record) => (
                <li key={record.id}>
                  <Link
                    href={`/transactions/${record.id}`}
                    className="grid gap-3 rounded-lg px-2 py-4 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="rounded-lg bg-muted p-2">
                        {record.type === "INCOME" ? (
                          <ArrowDownLeft
                            className="size-4"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {record.merchant || record.categoryName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.categoryName} ·{" "}
                          <time dateTime={record.occurredOn}>
                            {record.occurredOn}
                          </time>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                      <p className="text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">
                        {record.type === "INCOME" ? "+" : "−"}
                        {formatAmount(record.amount)}
                      </p>
                      <Badge variant="secondary">
                        {record.type === "INCOME" ? "Income" : "Expense"}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul></>
          ) : (
            <div className="space-y-2 py-9 text-center">
              <p className="font-medium">No transactions in this range</p>
              <p className="text-sm text-muted-foreground">
                Try different dates or record your first transaction.
              </p>
              <Button variant="outline" className="mt-3" asChild>
                <Link href="/transactions/new">Add a transaction</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="pb-3 text-xs text-muted-foreground">
        Balance is income minus expenses for the selected records, not a bank
        balance. Group expenses and settlements are separate.
      </p>
    </main>
  );
}
