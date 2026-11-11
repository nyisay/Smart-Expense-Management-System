"use client";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

import { Disclosure } from '@/components/ui/disclosure';
import { Bar, CartesianGrid, ComposedChart, Dot, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import { formatMonth, monthDrilldown, reportingHref, type DashboardFilters } from "./filters";
import { cashflowPoints, type CashflowMode } from "./cashflow-data";
import type { DashboardSummary } from "./aggregate";

export function CashflowChart({ months, mode = "combined", drilldownFilters }: { months: DashboardSummary["cashflowMonths"]; mode?: CashflowMode; drilldownFilters?: DashboardFilters }) {
  const points = cashflowPoints(months);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const title = mode === "cumulative" ? "Cumulative selected-range cash flow" : mode === "net" ? "Monthly net cash flow" : "Income, expenses and net cash flow";
  function inspect(month: unknown) {
    if (!drilldownFilters || pending || typeof month !== "string" || !months.some((item) => item.month === month)) return;
    startTransition(() => router.push(reportingHref(monthDrilldown(drilldownFilters, month), "/analytics")));
  }
  const hasData = months.some((month) => month.income !== "0" || month.expense !== "0");
  return <Card className="min-w-0" aria-busy={pending}>
    <CardHeader><CardTitle><h2>{title}</h2></CardTitle><CardDescription>Same selected dates and category · MMK. Net means income minus expenses.</CardDescription></CardHeader>
    <CardContent>
      {drilldownFilters && <p className="mb-3 text-sm text-muted-foreground" role="status">{pending ? "Loading this month's analysis…" : "Click a bar or line point, or use a month table link to inspect it. Partial boundary months keep the selected dates."}</p>}
      {mode === "cumulative" && <p className="mb-3 text-sm text-muted-foreground">Running net starts at zero at the beginning of this selection. It is not an opening or bank balance.</p>}
      {hasData ? <div role="group" aria-label={mode === "combined" ? "Monthly income, expense and net cash flow chart" : `${title} chart`} className="h-80 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 320 }}>
          <ComposedChart data={points} accessibilityLayer margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={28} />
            <YAxis width={58} tickFormatter={(value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" />
            <Legend />
            <Tooltip content={({ active, label }) => {
              const month = points.find((item) => item.month === label);
              return active && month ? <div className="max-w-56 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md"><p>{formatMonth(month.month)}</p><p>Income: {formatAmount(month.income)}</p><p>Expenses: {formatAmount(month.expense)}</p><p>Net: {formatAmount(month.balance)}</p>{mode === "cumulative" && <p>Running net: {formatAmount(month.cumulative)}</p>}</div> : null;
            }} />
            {mode === "combined" && <Bar name="Income" dataKey="incomeValue" fill="var(--chart-2)" maxBarSize={48} isAnimationActive={false} cursor={drilldownFilters ? "pointer" : undefined} onClick={(_, index) => inspect(points[index]?.month)} />}
            {mode === "combined" && <Bar name="Expenses" dataKey="expenseValue" fill="var(--chart-1)" maxBarSize={48} isAnimationActive={false} cursor={drilldownFilters ? "pointer" : undefined} onClick={(_, index) => inspect(points[index]?.month)} />}
            <Line name={mode === "cumulative" ? "Running net" : "Net cash flow"} dataKey={mode === "cumulative" ? "cumulativeValue" : "netValue"} stroke="var(--chart-3)" strokeWidth={2}
              dot={drilldownFilters ? (point) => <Dot key={point.index} className="cursor-pointer" cx={point.cx} cy={point.cy} r={5} fill="var(--chart-3)" stroke="var(--chart-3)" onClick={() => inspect(points[point.index]?.month)} /> : { r: 3 }}
              activeDot={drilldownFilters ? (point) => <Dot key={point.index} className="cursor-pointer" cx={point.cx} cy={point.cy} r={7} fill="var(--chart-3)" stroke="var(--background)" onClick={() => inspect(points[point.index]?.month)} /> : undefined}
              isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div> : <p className="py-8 text-center text-muted-foreground">No income or expenses in this range.</p>}
      <Disclosure title="View exact cash flow amounts" className="mt-4">
        <div className="mt-3 max-h-72 overflow-auto" role="region" aria-label="Exact monthly cash flow table" tabIndex={0}>
          <Table className="w-full text-left text-sm">
            <TableCaption className="sr-only">Exact monthly income, expenses and net cash flow in MMK{mode === "cumulative" && "; running net starts at zero for the selected range"}</TableCaption>
            <TableHeader><TableRow>
              <TableHead scope="col" className="py-2">Month</TableHead>
              <TableHead scope="col" className="py-2 text-right">Income</TableHead>
              <TableHead scope="col" className="py-2 text-right">Expenses</TableHead>
              <TableHead scope="col" className="py-2 text-right">Net</TableHead>
              {mode === "cumulative" && <TableHead scope="col" className="py-2 text-right">Running net</TableHead>}
            </TableRow></TableHeader>
            <TableBody>{points.map((month) => <TableRow key={month.month} className="border-t">
              <TableHead scope="row" className="py-2 font-normal">{drilldownFilters ? <Link className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring" href={reportingHref(monthDrilldown(drilldownFilters, month.month), "/analytics")}>{formatMonth(month.month)}</Link> : formatMonth(month.month)}</TableHead>
              <TableCell className="p-2 text-right tabular-nums">{formatAmount(month.income)}</TableCell>
              <TableCell className="p-2 text-right tabular-nums">{formatAmount(month.expense)}</TableCell>
              <TableCell className="p-2 text-right tabular-nums">{formatAmount(month.balance)}</TableCell>
              {mode === "cumulative" && <TableCell className="p-2 text-right tabular-nums">{formatAmount(month.cumulative)}</TableCell>}
            </TableRow>)}</TableBody>
          </Table>
        </div>
      </Disclosure>
    </CardContent>
  </Card>;
}
