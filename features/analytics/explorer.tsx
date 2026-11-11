"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CashflowChart } from "@/features/dashboard/cashflow";
import type { CashflowMode } from "@/features/dashboard/cashflow-data";
import type { DashboardData } from "@/features/dashboard/store";

export function AnalyticsExplorer({ data }: { data: Pick<DashboardData, "cashflowMonths" | "filters"> }) {
  const [mode, setMode] = useState<CashflowMode>("combined");
  return <section className="space-y-3" aria-label="Interactive cash flow explorer">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Explore monthly results or running net across this selection.</p>
      <div className="flex items-center gap-3"><Label htmlFor="analytics-chart-mode">Chart view</Label><NativeSelect id="analytics-chart-mode" value={mode} onChange={(event) => setMode(event.target.value === "net" || event.target.value === "cumulative" ? event.target.value : "combined")}>
        <NativeSelectOption value="combined">Income vs expenses</NativeSelectOption><NativeSelectOption value="net">Monthly net cash flow</NativeSelectOption><NativeSelectOption value="cumulative">Cumulative cash flow</NativeSelectOption>
      </NativeSelect></div>
    </div>
    <CashflowChart months={data.cashflowMonths} mode={mode} drilldownFilters={data.filters} />
  </section>;
}
