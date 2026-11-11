import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { calendarDateSchema } from "./dates";
import { REPORTING_TIMEZONE } from "./money";

export type CalendarPrecision = "day" | "month";

export function parseCalendarInput(value: string, precision: CalendarPrecision = "day"): Date | undefined {
  const fullDate = precision === "month" ? `${value}-01` : value;
  if (!calendarDateSchema.safeParse(fullDate).success) return undefined;
  const [year, month, day] = fullDate.split("-").map(Number);
  // UTC construction avoids days skipped by a device's historical timezone changes.
  return new TZDate(Date.UTC(year, month - 1, day, 12), REPORTING_TIMEZONE);
}

export function serializeCalendarSelection(date: Date, precision: CalendarPrecision = "day") {
  return format(new TZDate(date.getTime(), REPORTING_TIMEZONE), precision === "month" ? "yyyy-MM" : "yyyy-MM-dd");
}
