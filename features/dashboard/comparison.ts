import { calendarDateSchema } from "@/lib/dates";
import { monthIndex, monthKey, type DashboardFilters } from "./filters";

export function previousPeriod(filters: Pick<DashboardFilters, "from" | "to">) {
  const { from, to } = filters;
  calendarDateSchema.parse(from);
  calendarDateSchema.parse(to);
  if (from > to) throw new Error("Invalid comparison range.");
  if (from.endsWith("-01") && from.slice(0, 7) === to.slice(0, 7)) {
    const previousMonth = monthKey(monthIndex(from) - 1);
    if (!calendarDateSchema.safeParse(`${previousMonth}-01`).success) return null;
    const [year, month] = previousMonth.split("-").map(Number);
    const previousLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const [currentYear, currentMonth] = from.slice(0, 7).split("-").map(Number);
    const fullMonth = Number(to.slice(8)) === new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
    const day = fullMonth ? previousLastDay : Math.min(Number(to.slice(8)), previousLastDay);
    return { from: `${previousMonth}-01`, to: `${previousMonth}-${String(day).padStart(2, "0")}`, label: fullMonth ? "Previous calendar month" : "Same days of previous month" };
  }
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const duration = new Date(`${to}T00:00:00Z`).getTime() - start + 86400000;
  const previousFrom = new Date(start - duration).toISOString().slice(0, 10);
  if (!calendarDateSchema.safeParse(previousFrom).success) return null;
  return { from: previousFrom, to: new Date(start - 86400000).toISOString().slice(0, 10), label: "Immediately preceding equal-length range" };
}
