import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { todayInReportingTimezone } from "@/lib/dates";
import { reportingHref, defaultDashboardRange, monthIndex, monthKey, type ReportingPath, type DashboardFilters } from "./filters";
import type { DashboardData } from "./store";

export function ReportingFilters({data, path = "/dashboard"}: {data: Pick<DashboardData, "filters" | "expenseCategories">; path?: ReportingPath}) {
  const prefix = path.slice(1);
  const href = (filters: DashboardFilters) => reportingHref(filters, path);
  const today = todayInReportingTimezone();
  const presets = [
    { label: "This month", ...defaultDashboardRange(today) },
    { label: "Month to date", from: `${today.slice(0, 7)}-01`, to: today },
    {
      label: "Last 6 months",
      from: `${monthKey(monthIndex(today) - 5)}-01`,
      to: today,
    },
    { label: "Year to date", from: `${today.slice(0, 4)}-01-01`, to: today },
  ];
  return (
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
                    href={href({
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
            key={JSON.stringify(data.filters)}
            action={path}
            method="get"
            aria-label={path === "/analytics" ? "Analytics filters" : "Dashboard filters"}
            className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-from`}>From</Label>
              <DatePicker
                id={`${prefix}-from`}
                label="From"
                name="from"
                required
                min="1900-01-01"
                max="9999-12-31"
                defaultValue={data.filters.from}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-to`}>To</Label>
              <DatePicker
                id={`${prefix}-to`}
                label="To"
                name="to"
                required
                min="1900-01-01"
                max="9999-12-31"
                defaultValue={data.filters.to}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-category`}>Expense category</Label>
              <NativeSelect
                id={`${prefix}-category`}
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
                <Link href={path}>Reset</Link>
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">
            {data.filters.from} → {data.filters.to}, inclusive · Asia/Yangon ·
            whole MMK. Every section below uses these filters.
          </p>
        </CardContent>
      </Card>
  );
}
