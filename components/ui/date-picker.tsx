"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { TZDate } from "@date-fns/tz";
import { cn } from "cn";
import { Calendar } from "./calendar";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover";
import { parseCalendarInput, serializeCalendarSelection, type CalendarPrecision } from "@/lib/calendar-input";
import { calendarDateSchema, todayInReportingTimezone } from "@/lib/dates";
import { REPORTING_TIMEZONE } from "@/lib/money";

type DatePickerProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "defaultValue" | "onChange" | "min" | "max"> & {
  id: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  precision?: CalendarPrecision;
  min?: string;
  max?: string;
};

const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2000, index, 1))));
const subscribeToHydration = () => () => {};

export function DatePicker({ id, label, value, defaultValue = "", onValueChange, precision = "day", min = precision === "month" ? "1900-01" : "1900-01-01", max = precision === "month" ? "9999-12" : "9999-12-31", className, disabled, ...props }: DatePickerProps) {
  const [draft, setDraft] = useState(defaultValue);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const current = value ?? draft;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>();
  const input = useRef<HTMLInputElement>(null);
  // Retain the opened calendar during Radix's exit animation without constructing it during prerender.
  const selected = month ? parseCalendarInput(current, precision) : undefined;
  const first = month ? parseCalendarInput(min, precision) : undefined;
  const last = month ? parseCalendarInput(max, precision) : undefined;
  const view = month ?? selected ?? first;
  const invalid = !!current && (!calendarDateSchema.safeParse(precision === "month" ? `${current}-01` : current).success || current < min || current > max);

  useEffect(() => {
    input.current?.setCustomValidity(invalid ? `Choose a real ${precision === "month" ? "month" : "date"} between ${min} and ${max}.` : "");
  }, [invalid, precision, min, max]);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { if (value === undefined) setDraft(defaultValue); setOpen(false); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  function change(next: string) {
    if (value === undefined) setDraft(next);
    onValueChange?.(next);
  }
  function select(next: Date | undefined) {
    if (input.current?.matches(":disabled")) return;
    change(next ? serializeCalendarSelection(next, precision) : "");
    setOpen(false);
  }
  function toggle(next: boolean) {
    if (next && input.current?.matches(":disabled")) return;
    if (next) setMonth(parseCalendarInput(current, precision) ?? parseCalendarInput(todayInReportingTimezone()));
    setOpen(next);
  }

  return <Popover open={open} onOpenChange={toggle}>
    <PopoverAnchor asChild><div className="relative min-w-0">
      <Input {...props} ref={input} id={id} disabled={disabled} type="text" value={current}
        placeholder={precision === "month" ? "YYYY-MM" : "YYYY-MM-DD"}
        pattern={precision === "month" ? "[0-9]{4}-[0-9]{2}" : "[0-9]{4}-[0-9]{2}-[0-9]{2}"}
        maxLength={precision === "month" ? 7 : 10} className={cn("pr-12", className)}
        onChange={(event) => change(event.target.value)}
        onKeyDown={(event) => { if (event.altKey && event.key === "ArrowDown") { event.preventDefault(); toggle(true); } }} />
      <PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" disabled={disabled || !hydrated} aria-label={`Choose ${label}`} className="absolute right-0 top-0"><CalendarIcon aria-hidden="true" /></Button></PopoverTrigger>
    </div></PopoverAnchor>
    {first && last && view && <PopoverContent align="start" collisionPadding={16} aria-label={`${label} picker`} className="w-[min(320px,calc(100vw-2rem))] max-h-[min(calc(100dvh-2rem),var(--radix-popover-content-available-height))] overflow-y-auto border border-border p-2 [&_button]:transition-none">
      <div className="flex items-center justify-between gap-3 px-2">
        <Label htmlFor={`${id}-year`}>Year</Label>
        <Input id={`${id}-year`} key={view.getFullYear()} type="number" min={first.getFullYear()} max={last.getFullYear()} defaultValue={view.getFullYear()} className="w-28"
          onChange={(event) => { const year = Number(event.target.value); if (Number.isInteger(year) && year >= first.getFullYear() && year <= last.getFullYear()) setMonth(new TZDate(Date.UTC(year, view.getMonth(), 1, 12), REPORTING_TIMEZONE)); }} />
      </div>
      {precision === "month" ? <div className="grid grid-cols-3 gap-1 p-1" aria-label="Months">
        {monthNames.map((name, index) => {
          const date = new TZDate(Date.UTC(view.getFullYear(), index, 1, 12), REPORTING_TIMEZONE);
          const key = serializeCalendarSelection(date, "month");
          return <Button key={name} type="button" variant={current === key ? "default" : "ghost"} aria-pressed={current === key} disabled={key < min || key > max} onClick={() => select(date)}>{name.slice(0, 3)}</Button>;
        })}
      </div> : <Calendar mode="single" required timeZone={REPORTING_TIMEZONE} autoFocus selected={selected} month={view} onMonthChange={setMonth}
        onSelect={select} startMonth={first} endMonth={last} disabled={[{ before: first }, { after: last }]} captionLayout="dropdown-months"
        labels={{ labelDayButton: (day, modifiers) => `${format(day, "EEEE, MMMM d, yyyy")}${modifiers.selected ? ", selected" : ""}${modifiers.today ? ", today" : ""}` }}
        className="w-full [--cell-size:2.5rem]" />}
      <div className="flex justify-between gap-2 border-t border-border pt-2">
        <Button type="button" variant="ghost" onClick={() => select(undefined)}>Clear</Button>
        <Button type="button" variant="outline" onClick={() => select(parseCalendarInput(todayInReportingTimezone()))}>{precision === "month" ? "This month" : "Today"}</Button>
      </div>
    </PopoverContent>}
  </Popover>;
}
