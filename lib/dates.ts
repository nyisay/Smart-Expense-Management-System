import { z } from "zod";
import { REPORTING_TIMEZONE } from "./money";

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      value >= "1900-01-01" &&
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Enter a real date from 1900 onward.");

export function toDatabaseDate(value: string) {
  return new Date(`${calendarDateSchema.parse(value)}T00:00:00.000Z`);
}

export function todayInReportingTimezone(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: REPORTING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
