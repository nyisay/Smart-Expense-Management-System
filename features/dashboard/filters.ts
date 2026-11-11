import { z } from "zod";
import { calendarDateSchema, todayInReportingTimezone } from "@/lib/dates";

export function monthIndex(date: string) {
  return Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
}

export function monthKey(index: number) {
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function defaultDashboardRange(today = todayInReportingTimezone()) {
  const first = `${today.slice(0, 7)}-01`;
  const last = new Date(`${first}T00:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  return { from: first, to: last.toISOString().slice(0, 10) };
}

export function dashboardFilterSchema(today = todayInReportingTimezone()) {
  const defaults = defaultDashboardRange(today);
  return z
    .object({
      from: calendarDateSchema.default(defaults.from),
      to: calendarDateSchema.default(defaults.to),
      categoryId: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.uuid().optional(),
      ),
    })
    .refine((value) => value.from <= value.to, {
      path: ["to"],
      message: "End date must be on or after the start date.",
    })
    .refine((value) => monthIndex(value.to) - monthIndex(value.from) < 120, {
      path: ["to"],
      message: "Choose a range of at most 120 calendar months.",
    });
}

export type DashboardFilters = z.output<
  ReturnType<typeof dashboardFilterSchema>
>;

export type ReportingPath = "/dashboard" | "/analytics";

export function reportingHref(filters: DashboardFilters, path: ReportingPath, categoryId = filters.categoryId) {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (categoryId) params.set("categoryId", categoryId);
  return `${path}?${params}`;
}

export function monthDrilldown(filters: DashboardFilters, month: string): DashboardFilters {
  const first = calendarDateSchema.parse(`${month}-01`);
  const last = new Date(`${first}T00:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const end = last.toISOString().slice(0, 10);
  if (first > filters.to || end < filters.from) throw new Error("Month is outside the selected range.");
  return { ...filters, from: filters.from > first ? filters.from : first, to: filters.to < end ? filters.to : end };
}

export function dashboardHref(
  filters: DashboardFilters,
  categoryId = filters.categoryId,
) {
  return reportingHref(filters, "/dashboard", categoryId);
}

export function relatedTransactionsHref(filters: DashboardFilters) {
  return dashboardHref(filters).replace("/dashboard?", "/transactions?");
}

export function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}
