import { test } from "node:test";
import assert from "node:assert/strict";
import { cashflowPoints } from "../features/dashboard/cashflow-data";
import { dashboardHref, monthDrilldown, reportingHref } from "../features/dashboard/filters";

test("running cash flow starts at zero and preserves exact signed totals beyond chart precision", () => {
  assert.deepEqual(cashflowPoints([]), []);
  const points = cashflowPoints([
    { month: "2024-01", income: "18000000000000001", expense: "0", balance: "18000000000000001" },
    { month: "2024-02", income: "0", expense: "18000000000000002", balance: "-18000000000000002" },
    { month: "2024-03", income: "0", expense: "0", balance: "0" },
    { month: "2024-04", income: "5", expense: "0", balance: "5" },
  ]);
  assert.deepEqual(points.map((point) => point.cumulative), ["18000000000000001", "-1", "-1", "4"]);
  assert.equal(points.at(-1)?.cumulative, points.reduce((sum, point) => sum + BigInt(point.income) - BigInt(point.expense), BigInt(0)).toString());
  assert.equal(points[0].income, "18000000000000001");
  assert.equal(typeof points[0].incomeValue, "number");
});

test("month drill-down clips partial boundaries, leap days and year transitions, retaining category", () => {
  const filters = { from: "2023-12-15", to: "2024-03-05", categoryId: "00000000-0000-4000-8000-000000000001" };
  for (const [month, from, to] of [
    ["2023-12", "2023-12-15", "2023-12-31"],
    ["2024-01", "2024-01-01", "2024-01-31"],
    ["2024-02", "2024-02-01", "2024-02-29"],
    ["2024-03", "2024-03-01", "2024-03-05"],
  ]) assert.deepEqual(monthDrilldown(filters, month), { ...filters, from, to });
  for (const invalid of ["2023-11", "2024-04", "2024-13", "not-a-month"]) assert.throws(() => monthDrilldown(filters, invalid));
  assert.deepEqual(monthDrilldown({ from: "9999-12-01", to: "9999-12-31" }, "9999-12"), { from: "9999-12-01", to: "9999-12-31" });
});

test("analytics links preserve reporting filters without reverting to the dashboard", () => {
  const filters = { from: "2024-02-10", to: "2024-02-29", categoryId: "00000000-0000-4000-8000-000000000001" };
  const url = new URL(reportingHref(filters, "/analytics"), "https://example.invalid");
  assert.equal(url.pathname, "/analytics");
  assert.deepEqual(Object.fromEntries(url.searchParams), filters);
  assert.equal(dashboardHref(filters), reportingHref(filters, "/dashboard"));
  assert.equal(new URL(reportingHref({ ...filters, categoryId: undefined }, "/analytics"), url).searchParams.has("categoryId"), false);
});
