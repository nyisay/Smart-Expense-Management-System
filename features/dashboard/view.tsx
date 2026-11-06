import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import { todayInReportingTimezone } from "@/lib/dates";
import {
  dashboardHref,
  defaultDashboardRange,
  monthIndex,
  monthKey,
  relatedTransactionsHref,
} from "./filters";
import { DashboardCharts } from "./charts";
import type { DashboardData } from "./store";

export function DashboardView({ data }: { data: DashboardData }) {
  const today = todayInReportingTimezone();
  const presets = [
    { label: "This month", ...defaultDashboardRange(today) },
    {
      label: "Last 6 months",
      from: `${monthKey(monthIndex(today) - 5)}-01`,
      to: today,
    },
    { label: "Year to date", from: `${today.slice(0, 4)}-01-01`, to: today },
  ];
  const summary = [
    {
      label: "Income",
      value: data.income,
      icon: ArrowDownLeft,
      description: "Money received in this range",
      accent:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      label: "Expenses",
      value: data.expense,
      icon: ArrowUpRight,
      description: "Personal expenses in this range",
      accent: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      label: "Balance",
      value: data.balance,
      icon: Wallet,
      description: "Selected income minus expenses",
      accent:
        "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    },
  ];
  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-8 sm:py-10">
      <nav
        aria-label="Application"
        className="flex flex-wrap items-center justify-between gap-3 border-b pb-5"
      >
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight"
        >
          Smart Expense
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            MMK
          </span>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/receipts/new">Upload receipt</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">Transactions</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app">Account</Link>
          </Button>
        </div>
      </nav>
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
        </div>
        <Button size="lg" asChild>
          <Link href="/transactions/new">
            <Plus aria-hidden="true" />
            Add transaction
          </Link>
        </Button>
      </header>
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Date range &amp; category
            </p>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant={
                    data.filters.from === preset.from &&
                    data.filters.to === preset.to
                      ? "secondary"
                      : "ghost"
                  }
                  asChild
                >
                  <Link
                    href={dashboardHref({
                      ...data.filters,
                      from: preset.from,
                      to: preset.to,
                    })}
                  >
                    {preset.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
          <form
            action="/dashboard"
            method="get"
            aria-label="Dashboard filters"
            className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="dashboard-from">From</Label>
              <Input
                id="dashboard-from"
                name="from"
                type="date"
                required
                min="1900-01-01"
                max="9999-12-31"
                defaultValue={data.filters.from}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-to">To</Label>
              <Input
                id="dashboard-to"
                name="to"
                type="date"
                required
                min="1900-01-01"
                max="9999-12-31"
                defaultValue={data.filters.to}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-category">Expense category</Label>
              <NativeSelect
                id="dashboard-category"
                name="categoryId"
                className="w-full"
                defaultValue={data.filters.categoryId ?? ""}
              >
                <NativeSelectOption value="">All categories</NativeSelectOption>
                {data.expenseCategories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Apply filters</Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Reset</Link>
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">
            {data.filters.from} → {data.filters.to}, inclusive · Asia/Yangon ·
            whole MMK. Every section below uses these filters.
          </p>
        </CardContent>
      </Card>
      <section
        aria-label="Financial summary"
        className="grid gap-4 md:grid-cols-3"
      >
        {summary.map((item) => (
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
      </section>
      <DashboardCharts
        data={{
          filters: data.filters,
          categories: data.categories,
          months: data.months,
          expense: data.expense,
          expenseCategories: data.expenseCategories,
        }}
      />
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
            <ul className="divide-y">
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
            </ul>
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
