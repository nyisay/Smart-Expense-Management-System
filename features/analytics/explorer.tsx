"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { CashflowChart } from "@/features/dashboard/cashflow";
import type { CashflowMode } from "@/features/dashboard/cashflow-data";
import type { DashboardData } from "@/features/dashboard/store";

export function AnalyticsExplorer({ data }: { data: Pick<DashboardData, "cashflowMonths" | "filters"> }) {
  const [mode, setMode] = useState<CashflowMode>("combined");
  return <section className="space-y-3" aria-label="Interactive cash flow explorer">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Explore monthly results or running net across this selection.</p>
      <div className="flex items-center gap-3"><Label htmlFor="analytics-chart-mode">Chart view</Label><FormSelect id="analytics-chart-mode" value={mode} onValueChange={(value) => setMode(value === "net" || value === "cumulative" ? value : "combined")} options={[{value:"combined",label:"Income vs expenses"},{value:"net",label:"Monthly net cash flow"},{value:"cumulative",label:"Cumulative cash flow"}]} /></div>
    </div>
    <CashflowChart months={data.cashflowMonths} mode={mode} drilldownFilters={data.filters} />
  </section>;
}
