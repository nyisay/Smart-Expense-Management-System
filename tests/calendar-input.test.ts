import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCalendarInput, serializeCalendarSelection } from "../lib/calendar-input";

test("calendar input rejects invalid days and preserves the supported boundaries", () => {
  for (const value of ["", "2026-02-29", "2026-04-31", "1899-12-31", "10000-01-01", "2026-1-01"]) assert.equal(parseCalendarInput(value), undefined);
  for (const value of ["1900-01-01", "2028-02-29", "9999-12-31"]) assert.equal(serializeCalendarSelection(parseCalendarInput(value)!), value);
});

test("month selections serialize only the month and validate it", () => {
  for (const value of ["1900-01", "2028-02", "9999-12"]) assert.equal(serializeCalendarSelection(parseCalendarInput(value, "month")!, "month"), value);
  for (const value of ["2026-00", "2026-13", "2026-2", "1899-12", "2026-02-01"]) assert.equal(parseCalendarInput(value, "month"), undefined);
});

test("picker dates round-trip in Yangon regardless of the browser timezone or DST", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Pacific/Kiritimati", "Pacific/Apia"]) {
      process.env.TZ = zone;
      for (const day of ["2026-03-08", "2026-11-01", "2028-02-29", "2011-12-30"]) {
        const date = parseCalendarInput(day)!;
        assert.equal(date.getFullYear(), Number(day.slice(0, 4)));
        assert.equal(serializeCalendarSelection(date), day);
        assert.equal(serializeCalendarSelection(date, "month"), day.slice(0, 7));
      }
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
