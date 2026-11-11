import { test as base, expect, type Page, type Request } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { removeTestAccount } from "./database";

const date = "2026-11-08";
const dashboard = "/dashboard?from=2026-11-01&to=2026-11-30";
const test = base.extend<{ account: { email: string; password: string } }>({
  account: async ({}, provide) => {
    const account = {
      email: `e2e-${randomUUID()}@example.invalid`,
      password: randomUUID(),
    };
    try {
      await provide(account);
    } finally {
      await removeTestAccount(account.email);
    }
  },
});

test("shadcn calendar selection keeps exact dates, keyboard access and budget months", async ({ page, account }, testInfo) => {
  const browserSession = await page.context().newCDPSession(page);
  await browserSession.send("Emulation.setTimezoneOverride", { timezoneId: "America/Los_Angeles" });
  await registerAndLogin(page, account);
  await page.goto("/transactions/new");
  const trigger = page.getByRole("button", { name: "Choose Date", exact: true });
  await expect(trigger).toBeEnabled();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const picker = page.getByRole("dialog", { name: "Date picker", exact: true });
  await expect(picker).toBeVisible();
  await picker.getByRole("spinbutton", { name: "Year", exact: true }).fill("2028");
  await picker.getByRole("combobox").selectOption("1");
  await expect(picker.getByRole("button", { name: /February 29, 2028/ })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const popup = await picker.boundingBox();
  const viewport = page.viewportSize()!;
  expect(popup && popup.x >= 0 && popup.y >= 0 && popup.x + popup.width <= viewport.width + 1 && popup.y + popup.height <= viewport.height + 1).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("date-picker.png"), fullPage: true });
  await picker.getByRole("button", { name: /February 29, 2028/ }).focus();
  await page.keyboard.press("Enter");
  await expect(picker).toBeHidden();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue("2028-02-29");
  await expect(trigger).toBeFocused();
  await trigger.click();
  const selectedDay = picker.getByRole("button", { name: /February 29, 2028/ });
  await selectedDay.hover();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await selectedDay.click();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue("2028-02-29");
  await expect(picker).toBeHidden();
  await trigger.click();
  const fields = page.getByRole("group", { name: "Transaction details", exact: true });
  await fields.evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
  await picker.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue("2028-02-29");
  await page.keyboard.press("Escape");
  await expect(picker).toBeHidden();
  await fields.evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByLabel("Amount (MMK)", { exact: true }).fill("125");
  await page.getByLabel("Category", { exact: true }).selectOption({ label: "Food" });
  await trigger.click();
  await picker.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Create transaction", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\/new$/);
  await expect(page.getByLabel("Date", { exact: true })).toBeFocused();
  await page.getByLabel("Date", { exact: true }).fill("2026-02-29");
  expect(await page.getByLabel("Date", { exact: true }).evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
  await trigger.click();
  await picker.getByRole("spinbutton", { name: "Year", exact: true }).fill("2028");
  await picker.getByRole("combobox").selectOption("1");
  await picker.getByRole("button", { name: /February 29, 2028/ }).click();
  await page.getByRole("button", { name: "Create transaction", exact: true }).click();
  await expect(page).toHaveURL(/saved=created/);
  await page.goto("/dashboard?from=2028-02-29&to=2028-02-29");
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "125");
  await page.getByRole("button", { name: "Choose From", exact: true }).click();
  await page.getByRole("dialog", { name: "From picker", exact: true }).getByRole("button", { name: /February 28, 2028/ }).click();
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page).toHaveURL(/from=2028-02-28/);
  await page.goto("/transactions?from=2028-02-29&to=2028-02-29");
  await page.getByRole("button", { name: "Choose From", exact: true }).click();
  await page.getByRole("dialog", { name: "From picker", exact: true }).getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByLabel("From", { exact: true })).toHaveValue("");
  await page.goto("/budgets?month=2028-02");
  await page.getByRole("button", { name: "Choose Budget month", exact: true }).click();
  const months = page.getByRole("dialog", { name: "Budget month picker", exact: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await months.getByRole("button", { name: "Mar", exact: true }).click();
  await expect(page.getByLabel("Budget month", { exact: true })).toHaveValue("2028-03");
  await page.getByRole("button", { name: "Choose month", exact: true }).click();
  await expect(page).toHaveURL(/month=2028-03/);
});

test("advanced filters survive transaction editing and deletion", async ({ page, account }) => {
  await registerAndLogin(page, account);
  await createTransaction(page, "EXPENSE", "150", "Food", "Search shop");
  await page.goto("/transactions");
  await page.getByLabel("Search merchant or note").fill("search");
  await page.getByLabel("Minimum (MMK)").fill("100");
  await page.getByLabel("Maximum (MMK)").fill("200");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("main").getByText("1 transaction", { exact: true })).toBeVisible();
  await accessibleAndFits(page);
  const filtered = new URL(page.url()).searchParams;
  await page.getByRole("link", { name: /View details for Search shop/ }).filter({ visible: true }).click();
  await page.getByRole("link", { name: "Edit transaction", exact: true }).click();
  await page.getByLabel("Amount (MMK)", { exact: true }).fill("180");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("updated");
  await page.getByRole("link", { name: "Back to transactions", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/transactions" && url.searchParams.get("q") === filtered.get("q"));
  await expect(page.getByLabel("Minimum (MMK)")).toHaveValue("100");
  await page.getByRole("link", { name: /View details for Search shop/ }).filter({ visible: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No matching transactions" })).toBeVisible();
  await expect(page.getByLabel("Search merchant or note")).toHaveValue("search");
});

test("dedicated analytics explores real cash flow, category and clipped month filters", async ({ page, account }, testInfo) => {
  await page.goto("/analytics?from=2024-02-10&to=2024-03-05");
  await expect(page).toHaveURL(/\/login/);
  await registerAndLogin(page, account);
  const range = "/analytics?from=2024-02-10&to=2024-03-05";
  await page.goto(range);
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
  await expect(page.getByRole("main").locator('[data-summary="balance"]')).toHaveAttribute("data-amount", "0");
  await expect(page.getByText("No income or expenses in this range.", { exact: true })).toBeVisible();
  await accessibleAndFits(page);

  await page.goto(dashboard);
  await expect(page.getByRole("link", { name: "Add transaction", exact: true })).toBeVisible();
  await createTransaction(page, "INCOME", "1000", "Salary", "Analytics income", "2024-02-10");
  await createTransaction(page, "EXPENSE", "200", "Food", "Analytics food", "2024-02-29");
  await createTransaction(page, "EXPENSE", "300", "Travel", "Analytics travel", "2024-03-05");
  await createTransaction(page, "EXPENSE", "999", "Food", "Outside selection", "2024-03-06");
  await page.goto(range);
  await expect(page.getByRole("main").locator('[data-summary="income"]')).toHaveAttribute("data-amount", "1000");
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "500");
  await expect(page.getByRole("main").locator('[data-summary="balance"]')).toHaveAttribute("data-amount", "500");
  await page.getByLabel("Chart view", { exact: true }).selectOption("net");
  await expect(page.getByRole("heading", { name: "Monthly net cash flow", exact: true })).toBeVisible();
  await page.getByLabel("Chart view", { exact: true }).selectOption("cumulative");
  await expect(page.getByRole("heading", { name: "Cumulative selected-range cash flow", exact: true })).toBeVisible();
  await page.getByText("View exact cash flow amounts", { exact: true }).click();
  const table = page.getByRole("region", { name: "Exact monthly cash flow table", exact: true });
  await expect(table.getByRole("columnheader", { name: "Running net", exact: true })).toBeVisible();
  await expect(table.getByRole("row").filter({ hasText: "Feb 2024" })).toContainText("800");
  await expect(table.getByRole("row").filter({ hasText: "Mar 2024" })).toContainText("500");
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("analytics-cumulative.png"), fullPage: true });
  await table.getByRole("link", { name: "Feb 2024", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && url.searchParams.get("from") === "2024-02-10" && url.searchParams.get("to") === "2024-02-29");
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "200");
  await page.goto(range);
  await page.getByLabel("Chart view", { exact: true }).selectOption("net");
  const netChart = page.getByRole("group", { name: "Monthly net cash flow chart", exact: true });
  const netDot = await netChart.locator(".recharts-line-dots .recharts-dot").last().boundingBox();
  const surface = netChart.getByRole("application");
  const surfaceBounds = await surface.boundingBox();
  expect(netDot && surfaceBounds).toBeTruthy();
  await surface.click({ position: { x: netDot!.x - surfaceBounds!.x + netDot!.width / 2, y: netDot!.y - surfaceBounds!.y + netDot!.height / 2 } });
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && url.searchParams.get("from") === "2024-03-01" && url.searchParams.get("to") === "2024-03-05");
  await page.goto(range);
  await page.getByRole("group", { name: "Monthly income, expense and net cash flow chart", exact: true }).locator(".recharts-bar-rectangle").last().click();
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && url.searchParams.get("from") === "2024-03-01" && url.searchParams.get("to") === "2024-03-05");
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "300");
  await page.goto(range);
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && !!url.searchParams.get("categoryId"));
  const category = new URL(page.url()).searchParams.get("categoryId");
  await expect(page.getByRole("main").locator('[data-summary="income"]')).toHaveAttribute("data-amount", "0");
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "200");
  await page.getByRole("link", { name: "View matching transactions", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/transactions" && url.searchParams.get("categoryId") === category && url.searchParams.get("to") === "2024-03-05");
  await page.goto(`${range}&categoryId=${category}`);
  await workspaceNavigate(page, "Dashboard");
  await expect(page).toHaveURL((url) => url.pathname === "/dashboard" && url.searchParams.get("categoryId") === category);
  await workspaceNavigate(page, "Analytics");
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && url.searchParams.get("categoryId") === category);
  await page.getByRole("button", { name: "Clear category selection", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && !url.searchParams.get("categoryId"));
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "500");
  await chooseDate(page, "To", "2024-02-29");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && url.searchParams.get("to") === "2024-02-29" && !url.searchParams.get("categoryId"));
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "200");
  await page.goto("/analytics?from=2024-02-30");
  await expect(page.getByRole("heading", { name: "Analytics filters need attention", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Reset analytics filters", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
});

test("cash flow comparisons and rule-based insights reconcile recorded amounts", async ({ page, account }, testInfo) => {
  await registerAndLogin(page, account);
  await createTransaction(page, "INCOME", "1", "Salary", "History", "2025-09-01");
  await createTransaction(page, "INCOME", "800", "Salary", "Previous income", "2025-10-01");
  await createTransaction(page, "EXPENSE", "200", "Food", "Previous expense", "2025-10-08");
  await createTransaction(page, "INCOME", "1000", "Salary", "Current income", "2025-11-01");
  await createTransaction(page, "EXPENSE", "300", "Food", "Current expense", "2025-11-08");
  await page.goto("/budgets?month=2025-11");
  await page.getByLabel("Food monthly limit (MMK)", { exact: true }).fill("250");
  await page.getByRole("button", { name: "Save Food budget", exact: true }).click();
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Budget updated" })).toBeVisible();
  await page.goto("/dashboard?from=2025-11-01&to=2025-11-30");
  await expect(page.getByRole("main").getByText("70.0%", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText(/Food: overspent by MMK/)).toContainText("50");
  await expect(page.getByRole("main").getByText(/MMK\s*100 \(50.0%\)/)).toBeVisible();
  await page.getByRole("main").getByText("View exact cash flow amounts", { exact: true }).click();
  const table = page.getByRole("region", { name: "Exact monthly cash flow table", exact: true });
  await expect(table).toContainText("1,000");
  await expect(table).toContainText("300");
  await expect(table).toContainText("700");
  const tableScroll = table.locator("[data-slot=table-container]");
  await tableScroll.focus();
  await expect(tableScroll).toBeFocused();
  if (testInfo.project.name.includes("mobile")) {
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => tableScroll.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  }
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("analytics-insights.png"), fullPage: true });
  await page.goto("/dashboard?from=2025-11-01&to=2025-11-08");
  await expect(page.getByRole("main").getByText("Budget notices require one full calendar month.", { exact: false })).toBeVisible();
  await expect(page.getByRole("main").getByText("Same days of previous month:", { exact: false })).toContainText("2025-10-08");
});

async function registerAndLogin(
  page: Page,
  account: { email: string; password: string },
  name = "A",
) {
  await page.goto("/register");
  await page
    .getByRole("main")
    .getByLabel("Name", { exact: true })
    .filter({ visible: true })
    .fill(name);
  await page
    .getByRole("main")
    .getByLabel("Email", { exact: true })
    .filter({ visible: true })
    .fill(account.email);
  await page
    .getByRole("main")
    .getByLabel("Password", { exact: true })
    .filter({ visible: true })
    .fill(account.password);
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "If registration can be completed",
  );
  await expect(page.locator('[data-slot="toast"][data-kind="success"]')).toContainText("Registration request received");
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  await page.getByRole("link", { name: "Go to sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByLabel("Email", { exact: true })
    .filter({ visible: true })
    .fill(account.email);
  await page
    .getByRole("main")
    .getByLabel("Password", { exact: true })
    .filter({ visible: true })
    .fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("link", { name: "Add transaction", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="toast"][data-kind="success"]')).toContainText("Signed in successfully");
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
}

test("logout confirmation supports No, Escape and Yes from Settings and navigation", async ({ page, account }, testInfo) => {
  await registerAndLogin(page, account);
  await page.goto("/app");
  const name = page.getByLabel("Display name", { exact: true });
  await name.fill("Unsaved profile draft");
  const settingsLogout = page.getByRole("main").getByRole("button", { name: "Sign out", exact: true });
  const dialog = page.getByRole("alertdialog", { name: "Are you sure you want to log out?", exact: true });
  const posts: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") posts.push(new URL(request.url()).pathname); });
  await settingsLogout.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "No", exact: true })).toBeFocused();
  const footer = dialog.locator('[data-slot="alert-dialog-footer"]');
  await expect(footer).toHaveCSS("flex-direction", "row");
  await expect(footer).toHaveCSS("justify-content", "center");
  await expect(dialog.getByRole("button", { name: "Yes", exact: true })).toHaveAttribute("data-variant", "destructive");
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Yes", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "No", exact: true })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("logout-confirmation.png"), fullPage: true });
  await dialog.getByRole("button", { name: "No", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(settingsLogout).toBeFocused();
  await expect(name).toHaveValue("Unsaved profile draft");
  await settingsLogout.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(settingsLogout).toBeFocused();
  expect(posts).toEqual([]);
  await settingsLogout.click();
  await dialog.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/analytics");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const mobile = (page.viewportSize()?.width ?? 1366) < 1024;
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  else {
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await dialog.getByRole("button", { name: "No", exact: true }).click();
    await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  }
  const sidebarLogout = page.getByRole("button", { name: "Log out", exact: true }).filter({ visible: true });
  await sidebarLogout.click();
  await expect(dialog.getByRole("button", { name: "No", exact: true })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dialog.getByRole("button", { name: "No", exact: true }).click();
  await expect(sidebarLogout).toBeFocused();
  if (mobile) await expect(page.getByRole("dialog", { name: "Workspace navigation", exact: true })).toBeVisible();
  await sidebarLogout.click();
  await dialog.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("toast notifications cover native validation, repeated authentication errors and registration", async ({ page, account }, testInfo) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  const notice = page.locator('[data-slot="toast"]');
  await expect(notice).toHaveAttribute("data-kind", "error");
  await expect(notice).toContainText("Please check your input");
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("validation-toast.png"), fullPage: true });
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  await expect(notice).toHaveCount(0);

  await registerAndLogin(page, account);
  await page.goto("/app");
  await page.getByRole("main").getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const failLogin = async () => {
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(`${account.password}-wrong`);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText("Unable to sign in");
    await expect(notice).toHaveAttribute("data-kind", "error");
    await expect(notice).toContainText("Unable to sign in");
  };
  await failLogin();
  const firstId = await notice.getAttribute("data-toast-id");
  await accessibleAndFits(page);
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  await failLogin();
  expect(await notice.getAttribute("data-toast-id")).not.toBe(firstId);
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: testInfo.outputPath("login-error-toast.png"), fullPage: true });
});

async function workspaceNavigate(page: Page, name: string) {
  await expect(page.locator(".app-shell")).toBeVisible();
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  if (await trigger.isVisible()) await trigger.click();
  await page.getByRole("link", { name, exact: true }).filter({ visible: true }).click();
}

test("workspace navigation, Frosted Glass, collapse and mobile drawer preserve existing pages", async ({ page, account }, testInfo) => {
  await registerAndLogin(page, account);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
  const mobile = testInfo.project.name.includes("mobile");
  if (!mobile) {
    await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
    await expect(page.locator(".app-shell")).toHaveAttribute("data-collapsed", "true");
    await page.getByRole("link", { name: "Transactions", exact: true }).focus();
    await expect(page.getByRole("tooltip")).toContainText("Transactions");
    await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await accessibleAndFits(page);
    await page.screenshot({ path: testInfo.outputPath("mobile-navigation.png"), fullPage: true });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  }
  await workspaceNavigate(page, "Budgets");
  await expect(page.getByRole("heading", { name: "Monthly category budgets" })).toBeVisible();
  if (mobile) await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("link", { name: "Budgets", exact: true }).filter({ visible: true })).toHaveAttribute("aria-current", "page");
  if (mobile) await page.keyboard.press("Escape");
  await workspaceNavigate(page, "Settings");
  await expect(page.getByRole("heading", { name: "Account settings" })).toBeVisible();
  await expect(page.getByLabel("Appearance", { exact: true })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
  await expect(page.getByLabel("Appearance", { exact: true })).toHaveCount(0);
  await accessibleAndFits(page);
  await workspaceNavigate(page, "Analytics");
  await expect(page).toHaveURL(/\/analytics$/);
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
  await page.goto("/dashboard?from=2025-11-01&to=2025-11-08");
  await workspaceNavigate(page, "Analytics");
  await expect(page).toHaveURL((url) => url.pathname === "/analytics" && !url.hash && url.searchParams.get("from") === "2025-11-01" && url.searchParams.get("to") === "2025-11-08");
  await expect(page.getByRole("heading", { name: "Income, expenses and net cash flow" })).toBeVisible();
  await page.goto("/transactions/new");
  await page.getByLabel("Amount (MMK)", { exact: true }).fill("12345");
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await expect(page.getByRole("menuitem", { name: "Account settings", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Amount (MMK)", { exact: true })).toHaveValue("12345");
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("workspace-frosted.png"), fullPage: true });
  await workspaceNavigate(page, "Settings");
  await page.evaluate(() => localStorage.setItem("smart-expense-theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
  if (mobile) {
    for (const viewport of [{ width: 768, height: 1024 }, { width: 800, height: 360 }]) {
      await page.setViewportSize(viewport);
      await page.getByRole("button", { name: "Open navigation" }).click();
      await accessibleAndFits(page);
      await page.getByRole("button", { name: "Log out", exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  }
});

async function chooseDate(page: Page, label: string, value: string) {
  await page.getByRole("main").getByRole("button", { name: `Choose ${label}`, exact: true }).click();
  const picker = page.getByRole("dialog", { name: `${label} picker`, exact: true });
  const [year, month, day] = value.split("-");
  await picker.getByRole("spinbutton", { name: "Year", exact: true }).fill(year);
  await picker.getByRole("combobox").selectOption(String(Number(month) - 1));
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  await picker.getByRole("button", { name: new RegExp(`${monthName} ${Number(day)}, ${year}`) }).click();
  await expect(page.getByRole("main").getByLabel(label, { exact: true })).toHaveValue(value);
}

async function accessibleAndFits(page: Page) {
  await test.step(`Accessibility and width: ${new URL(page.url()).pathname}`, async () => {
    await expect(page.locator("main:visible")).toHaveCount(1);
    await expect(page.locator("main:visible")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(result.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    }))).toEqual([]);
  });
}

async function createTransaction(
  page: Page,
  type: "INCOME" | "EXPENSE",
  amount: string,
  category: string,
  merchant: string,
  occurredOn = date,
) {
  if (
    await page
      .getByRole("link", { name: "Add transaction", exact: true })
      .count()
  ) {
    await page
      .getByRole("link", { name: "Add transaction", exact: true })
      .click();
  } else {
    await page
      .getByRole("link", { name: "Back to transactions", exact: true })
      .click();
    await page
      .getByRole("link", { name: "New transaction", exact: true })
      .click();
  }
  await expect(page).toHaveURL(/\/transactions\/new$/);
  await page
    .getByRole("main")
    .getByLabel("Type", { exact: true })
    .filter({ visible: true })
    .selectOption(type);
  await page
    .getByRole("main")
    .getByLabel("Amount (MMK)", { exact: true })
    .filter({ visible: true })
    .fill(amount);
  await page
    .getByRole("main")
    .getByLabel("Category", { exact: true })
    .filter({ visible: true })
    .selectOption({ label: category });
  await chooseDate(page, "Date", occurredOn);
  await page
    .getByRole("main")
    .getByLabel("Merchant or source")
    .filter({ visible: true })
    .fill(merchant);
  await page
    .getByRole("button", { name: "Create transaction", exact: true })
    .click();
  await expect(page).toHaveURL(/\/transactions\/[a-f0-9-]+\?saved=created$/);
  return new URL(page.url()).pathname;
}

test("registration, secure session, expenses, chart interaction, edit/delete and responsive accessibility", async ({
  page,
  account,
}, testInfo) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("login.png"), fullPage: true });
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await accessibleAndFits(page);
  await registerAndLogin(page, account);
  const cookie = (await page.context().cookies()).find(
    (entry) => entry.name === "__Secure-authjs.session-token",
  );
  expect(!!cookie?.httpOnly && cookie.secure && cookie.sameSite === "Lax").toBe(
    true,
  );
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
  await expect(
    page.getByRole("main").getByText("No expenses in this range", { exact: true }),
  ).toBeVisible();
  await accessibleAndFits(page);
  await createTransaction(
    page,
    "INCOME",
    "100000",
    "Salary",
    "Synthetic salary",
  );
  const foodPath = await createTransaction(
    page,
    "EXPENSE",
    "30000",
    "Food",
    "Synthetic food",
  );
  await createTransaction(
    page,
    "EXPENSE",
    "20000",
    "Travel",
    "Synthetic travel",
  );
  await page.goto(dashboard);
  await expect(
    page.getByRole("main").locator('[data-summary="income"]'),
  ).toHaveAttribute("data-amount", "100000");
  await expect(
    page.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "50000");
  await expect(
    page.getByRole("main").locator('[data-summary="balance"]'),
  ).toHaveAttribute("data-amount", "50000");
  await expect(
    page.getByRole("main").locator(".recharts-pie-sector"),
  ).toHaveCount(2);
  const donut = page
    .getByRole("group", { name: "Expense category donut chart", exact: true })
    .locator("svg.recharts-surface");
  const donutBounds = await donut.boundingBox();
  expect(donutBounds).not.toBeNull();
  // A sector's bounding-box center can be inside the donut hole; use a point on its visible ring.
  const point = {
    x: donutBounds!.width / 2 + 43,
    y: donutBounds!.height / 2 - 74,
  };
  await donut.hover({ position: point });
  await expect(
    page.getByRole("group", { name: "Expense category donut chart", exact: true }).locator(".recharts-tooltip-wrapper"),
  ).toBeVisible();
  await accessibleAndFits(page);
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  await donut.click({ position: point });
  await expect(
    page.getByRole("button", { name: "Food", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Food", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Food", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Food", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "30000");
  await expect(
    page.getByRole("main").locator('[data-summary="income"]'),
  ).toHaveAttribute("data-amount", "0");
  await expect(
    page.getByRole("link", { name: /Synthetic travel/ }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "View all", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?.*categoryId=/);
  await accessibleAndFits(page);
  await page.goto(`${foodPath}/edit`);
  await page
    .getByRole("main")
    .getByLabel("Amount (MMK)", { exact: true })
    .filter({ visible: true })
    .fill("35000");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/saved=updated/);
  await page.goto(dashboard);
  await expect(
    page.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "55000");
  await page.goto(foodPath);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await accessibleAndFits(page);
  await page
    .getByRole("button", { name: "Keep transaction", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete permanently", exact: true })
    .click();
  await expect(page).toHaveURL(/\/transactions\?deleted=yes$/);
  await page.goto(dashboard);
  await expect(
    page.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "20000");
  await page
    .getByRole("main")
    .getByLabel("From", { exact: true })
    .filter({ visible: true })
    .fill("2026-11-09");
  await page
    .getByRole("main")
    .getByLabel("To", { exact: true })
    .filter({ visible: true })
    .fill("2026-11-09");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "0");
});

async function mockScenario(mode: string) {
  const response = await fetch("http://127.0.0.1:3198/scenario", {
    method: "POST",
    body: mode,
  });
  expect(response.ok).toBe(true);
}
async function uploadReceipt(page: Page) {
  const image = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1100">
    <rect width="600" height="1100" fill="white"/>
    <g fill="black" font-family="sans-serif" font-size="28">
      <text x="24" y="60">SYNTHETIC RECEIPT</text>
      <text x="24" y="130">Synthetic receipt shop</text>
      <text x="24" y="200">Date: 2026-11-08</text>
      <text x="24" y="270">Meal: Ks 15,000.00</text>
      <text x="24" y="340">Tax: Ks 3,000.00</text>
      <text x="24" y="760">FINAL TOTAL: Ks 18,000.00</text>
      <text x="24" y="840">Cash: Ks 20,000.00</text>
      <text x="24" y="920">Change: Ks 2,000.00</text>
    </g></svg>`))
    .png()
    .toBuffer();
  await page
    .getByRole("main")
    .getByLabel("Receipt image", { exact: true })
    .filter({ visible: true })
    .setInputFiles({
      name: "synthetic.png",
      mimeType: "image/png",
      buffer: image,
    });
  await page
    .getByRole("button", { name: /Extract (receipt|another image)/ })
    .click();
}

test("receipt drag and drop validates files, preserves picker access and saves only after review", async ({ page, account }, testInfo) => {
  await registerAndLogin(page, account);
  await workspaceNavigate(page, "Receipt Scanner");
  const zone = page.getByRole("group", { name: "Receipt image upload", exact: true });
  const input = page.getByLabel("Receipt image", { exact: true });
  const error = page.getByRole("main").locator("#receipt-upload-error");
  let uploads = 0;
  page.on("request", (request) => { if (request.method() === "POST" && new URL(request.url()).pathname === "/receipts/new") uploads++; });
  const transfer = (files: { name: string; type: string; size?: number; base64?: string }[]) => page.evaluateHandle((items) => {
    const data = new DataTransfer();
    for (const item of items) {
      const bytes = item.base64 ? Uint8Array.from(atob(item.base64), (character) => character.charCodeAt(0)) : new Uint8Array(item.size ?? 1);
      data.items.add(new File([bytes], item.name, { type: item.type }));
    }
    return data;
  }, files);
  async function drop(files: { name: string; type: string; size?: number; base64?: string }[]) {
    const data = await transfer(files);
    try { await zone.dispatchEvent("drop", { dataTransfer: data }); }
    finally { await data.dispose(); }
  }
  for (const file of [
    { name: "unsupported.gif", type: "image/gif" },
    { name: "empty.png", type: "image/png", size: 0 },
    { name: "oversized.png", type: "image/png", size: 4_000_001 },
  ]) {
    await drop([file]);
    await expect(error).toHaveText("Choose a JPG, PNG or WebP image up to 4 MB.");
    expect(await input.evaluate((element: HTMLInputElement) => element.files?.length)).toBe(0);
  }
  await drop([{ name: "one.png", type: "image/png" }, { name: "two.png", type: "image/png" }]);
  await expect(error).toHaveText("Choose one receipt image at a time.");
  const pixels = await sharp({ create: { width: 80, height: 100, channels: 3, background: "white" } }).png().toBuffer();
  await input.focus();
  const choosing = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await choosing).setFiles({ name: "keyboard.png", mimeType: "image/png", buffer: pixels });
  await expect(error).toHaveText("");
  const preview = page.getByRole("img", { name: "Selected receipt for checking extracted fields" });
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const oldPreview = await preview.getAttribute("src");
  const file = { name: "dropped.png", type: "image/png", base64: pixels.toString("base64") };
  const dragging = await transfer([file]);
  try {
    await zone.dispatchEvent("dragenter", { dataTransfer: dragging });
    await expect(zone).toHaveAttribute("data-dragging", "true");
    await input.dispatchEvent("dragenter", { dataTransfer: dragging });
    await input.dispatchEvent("dragleave", { dataTransfer: dragging });
    await expect(zone).toHaveAttribute("data-dragging", "true");
    await zone.dispatchEvent("dragleave", { dataTransfer: dragging });
    await expect(zone).toHaveAttribute("data-dragging", "false");
    await zone.dispatchEvent("dragenter", { dataTransfer: dragging });
    await accessibleAndFits(page);
    await page.screenshot({ path: testInfo.outputPath("receipt-dropzone.png"), fullPage: true });
    await zone.dispatchEvent("drop", { dataTransfer: dragging });
  } finally { await dragging.dispose(); }
  await expect(zone).toHaveAttribute("data-dragging", "false");
  expect(await input.evaluate((element: HTMLInputElement) => element.files?.[0]?.name)).toBe("dropped.png");
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(async (url) => { try { await fetch(url!); return false; } catch { return true; } }, oldPreview)).toBe(true);
  const text = await page.evaluateHandle(() => { const data = new DataTransfer(); data.setData("text/uri-list", "https://example.invalid"); return data; });
  try { await zone.dispatchEvent("drop", { dataTransfer: text }); }
  finally { await text.dispose(); }
  expect(await input.evaluate((element: HTMLInputElement) => element.files?.[0]?.name)).toBe("dropped.png");
  await expect(page).toHaveURL(/\/receipts\/new$/);
  expect(uploads).toBe(0);
  await expect(page.getByRole("button", { name: "Confirm and save expense", exact: true })).toHaveCount(0);
  await mockScenario("normal");
  let release = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/receipts/new", async (route) => { if (route.request().method() === "POST") await held; await route.continue(); });
  try {
    await page.getByRole("button", { name: "Extract receipt", exact: true }).click();
    await expect(input).toBeDisabled();
    await expect(zone).toHaveAttribute("aria-disabled", "true");
    await drop([{ ...file, name: "ignored-while-pending.png" }]);
    expect(await input.evaluate((element: HTMLInputElement) => element.files?.[0]?.name)).toBe("dropped.png");
  } finally { release(); }
  await expect(page.getByLabel("Final total (whole kyat)", { exact: true })).toHaveValue("12500");
  await page.getByLabel("Final total (whole kyat)", { exact: true }).fill("18000");
  await page.getByLabel("Merchant (optional)", { exact: true }).fill("Dropped synthetic receipt");
  await chooseDate(page, "Transaction date", date);
  const otherTab = await page.context().newPage();
  try {
    await otherTab.goto(dashboard);
    await expect(otherTab.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "0");
  } finally { await otherTab.close(); }
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm and save expense", exact: true }).click();
  await expect(page).toHaveURL(/saved=created/);
  await page.goto(dashboard);
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "18000");
});

test("receipt validation, uncertainty, editable review, explicit save and dashboard refresh", async ({
  page,
  account,
}, testInfo) => {
  await registerAndLogin(page, account);
  await workspaceNavigate(page, "Receipt Scanner");
  await accessibleAndFits(page);
  let uploadRequests = 0;
  const countUploads = (request: Request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/receipts/new") uploadRequests++;
  };
  page.on("request", countUploads);
  await page
    .getByRole("main")
    .getByLabel("Receipt image", { exact: true })
    .filter({ visible: true })
    .setInputFiles({
      name: "bad.gif",
      mimeType: "image/gif",
      buffer: Buffer.from("not an image"),
    });
  await page
    .getByRole("button", { name: "Extract receipt", exact: true })
    .click();
  await expect(
    page.getByRole("main").getByText("Choose a JPG, PNG or WebP image up to 4 MB.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("main").getByLabel("Receipt image", { exact: true }).filter({ visible: true }).setInputFiles({
    name: "oversized.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(4_000_001),
  });
  await page.getByRole("button", { name: "Extract receipt", exact: true }).click();
  await expect(page.locator("#receipt-image:visible")).toHaveJSProperty("validationMessage", "Choose a JPG, PNG or WebP image up to 4 MB.");
  await expect(page.locator("#receipt-upload-error:visible")).toHaveText("Choose a JPG, PNG or WebP image up to 4 MB.");
  expect(uploadRequests).toBe(0);
  page.off("request", countUploads);
  await mockScenario("normal");
  await uploadReceipt(page);
  await expect(page.getByRole("main").getByLabel("Final total (whole kyat)", { exact: true })).toHaveValue("12500");
  await expect(page.getByRole("main").getByLabel("Currency", { exact: true })).toHaveValue("MMK");
  const receiptPreview = page.getByRole("img", { name: "Selected receipt for checking extracted fields" });
  await expect(receiptPreview).toBeVisible();
  await expect.poll(() => receiptPreview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const previewRegion = page.getByRole("region", { name: "Selected receipt image preview" });
  await previewRegion.focus();
  await page.keyboard.press("End");
  await expect.poll(() => previewRegion.evaluate((region) => region.scrollTop)).toBeGreaterThan(0);
  const previousPreview = await receiptPreview.getAttribute("src");
  expect(previousPreview).toMatch(/^blob:/);
  const previewToggle = page.getByRole("button", { name: "Selected image preview", exact: true });
  await previewToggle.focus();
  await page.keyboard.press("Enter");
  await expect(previewToggle).toHaveAttribute("aria-expanded", "false");
  await expect(receiptPreview).not.toBeVisible();
  await page.keyboard.press("Enter");
  await expect(receiptPreview).toBeVisible();
  await expect(receiptPreview).toHaveAttribute("src", previousPreview!);
  await mockScenario("ambiguous");
  await uploadReceipt(page);
  expect(await page.evaluate(async (url) => {
    try { await fetch(url!); return false; } catch { return true; }
  }, previousPreview)).toBe(true);
  await expect(
    page.getByRole("main").getByText("2. Review and confirm", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByLabel("Final total (whole kyat)", { exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("main").getByLabel("Transaction date", { exact: true }),
  ).toHaveValue("");
  await page
    .getByRole("main")
    .getByLabel("Final total (whole kyat)", { exact: true })
    .filter({ visible: true })
    .fill("18000");
  await chooseDate(page, "Transaction date", date);
  await page
    .getByRole("main")
    .getByLabel("Merchant (optional)", { exact: true })
    .filter({ visible: true })
    .fill("Corrected synthetic receipt");
  const confirmation = page.getByRole("checkbox");
  await expect(
    page.getByRole("button", { name: "Confirm and save expense", exact: true }),
  ).toBeDisabled();
  await confirmation.check();
  await page
    .getByRole("main")
    .getByLabel("Note (optional)", { exact: true })
    .filter({ visible: true })
    .fill("User reviewed");
  await expect(confirmation).not.toBeChecked();
  await accessibleAndFits(page);
  await page.screenshot({
    path: testInfo.outputPath("receipt-review.png"),
    fullPage: true,
  });
  // A failed replacement extraction must not discard corrections to the current review.
  await mockScenario("failure");
  await uploadReceipt(page);
  await expect(page.getByRole("main").getByText(/Ollama extraction failed/)).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByLabel("Final total (whole kyat)", { exact: true }),
  ).toHaveValue("18000");
  await expect(
    page.getByRole("main").getByLabel("Merchant (optional)", { exact: true }),
  ).toHaveValue("Corrected synthetic receipt");
  const otherTab = await page.context().newPage();
  await otherTab.goto(dashboard);
  await expect(
    otherTab.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "0");
  await otherTab.close();
  await confirmation.check();
  await page
    .getByRole("button", { name: "Confirm and save expense", exact: true })
    .click();
  await expect(page).toHaveURL(/\/transactions\/[a-f0-9-]+\?saved=created$/);
  await page.goto(dashboard);
  await expect(
    page.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "18000");
  await expect(
    page.getByRole("link", { name: /Corrected synthetic receipt/ }),
  ).toBeVisible();
});

test("unequal group bills, invalid totals, percentage editing and recorded repayments", async ({
  page,
  account,
}, testInfo) => {
  await registerAndLogin(page, account);
  await workspaceNavigate(page, "Groups & Splitting");
  await page.getByRole("link", { name: "Create group", exact: true }).click();
  await page
    .getByRole("main")
    .getByLabel("Group name", { exact: true })
    .filter({ visible: true })
    .fill("Synthetic trip");
  await page.getByRole("button", { name: "Create group", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/[a-f0-9-]+\?saved=yes$/);
  const groupPath = new URL(page.url()).pathname;
  for (const name of ["B", "C"]) {
    await page
      .getByRole("link", { name: "Add participant", exact: true })
      .click();
    await page
      .getByRole("main")
      .getByLabel("Participant or guest name", { exact: true })
      .filter({ visible: true })
      .fill(name);
    await page
      .getByRole("button", { name: "Add participant", exact: true })
      .click();
    await expect(page).toHaveURL(/saved=yes/);
  }
  await page
    .getByRole("link", { name: "Add group expense", exact: true })
    .click();
  await page
    .getByRole("main")
    .getByLabel("Bill title", { exact: true })
    .filter({ visible: true })
    .fill("Synthetic dinner");
  await page
    .getByRole("main")
    .getByLabel("Bill total (MMK)", { exact: true })
    .filter({ visible: true })
    .fill("100");
  await chooseDate(page, "Date", date);
  await page
    .getByRole("main")
    .getByLabel("Who paid?", { exact: true })
    .filter({ visible: true })
    .selectOption({ label: "A" });
  await page
    .getByRole("main")
    .getByLabel("A (you)", { exact: true })
    .filter({ visible: true })
    .fill("20");
  await page
    .getByRole("main")
    .getByLabel("B", { exact: true })
    .filter({ visible: true })
    .fill("30");
  await page
    .getByRole("main")
    .getByLabel("C", { exact: true })
    .filter({ visible: true })
    .fill("49");
  await page
    .getByRole("button", { name: "Save group expense", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Share amounts must equal",
  );
  await expect(
    page.getByRole("main").getByLabel("Bill title", { exact: true }),
  ).toHaveValue("Synthetic dinner");
  await page
    .getByRole("main")
    .getByLabel("C", { exact: true })
    .filter({ visible: true })
    .fill("50");
  await accessibleAndFits(page);
  await page
    .getByRole("button", { name: "Save group expense", exact: true })
    .click();
  await expect(page).toHaveURL(/saved=yes/);
  await expect(page.getByRole("main").locator("[data-net]")).toHaveCount(3);
  const shareToggle = page.getByRole("button", { name: "View exact shares", exact: true });
  await shareToggle.focus();
  await page.keyboard.press("Enter");
  await expect(shareToggle).toHaveAttribute("aria-expanded", "true");
  expect(
    (
      await page
        .getByRole("main")
        .locator("[data-net]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-net")),
        )
    ).sort(),
  ).toEqual(["-30", "-50", "80"].sort());
  await page
    .getByRole("link", { name: "Record repayment", exact: true })
    .click();
  await page
    .getByRole("main")
    .getByLabel("Who repaid?", { exact: true })
    .filter({ visible: true })
    .selectOption({ label: "B" });
  await page
    .getByRole("main")
    .getByLabel("Who received it?", { exact: true })
    .filter({ visible: true })
    .selectOption({ label: "A" });
  await page
    .getByRole("main")
    .getByLabel("Repaid amount (MMK)", { exact: true })
    .filter({ visible: true })
    .fill("10");
  await chooseDate(page, "Repayment date", date);
  await expect(
    page.getByRole("button", { name: "Record repayment", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Record repayment", exact: true })
    .click();
  await expect(page).toHaveURL(/saved=yes/);
  await page.getByRole("link", { name: "Edit bill", exact: true }).click();
  await page
    .getByRole("main")
    .getByLabel("Bill total (MMK)", { exact: true })
    .filter({ visible: true })
    .fill("101");
  await page
    .getByRole("main")
    .getByLabel("Allocate shares by", { exact: true })
    .filter({ visible: true })
    .selectOption("PERCENT");
  await page
    .getByRole("main")
    .getByLabel("A (you)", { exact: true })
    .filter({ visible: true })
    .fill("50");
  await page
    .getByRole("main")
    .getByLabel("B", { exact: true })
    .filter({ visible: true })
    .fill("25");
  await page
    .getByRole("main")
    .getByLabel("C", { exact: true })
    .filter({ visible: true })
    .fill("25");
  await expect(page.getByRole("main").locator("#split-preview")).toContainText(
    "MMK 51",
  );
  await page
    .getByRole("button", { name: "Save bill changes", exact: true })
    .click();
  await expect(page).toHaveURL(/saved=yes/);
  expect(
    (
      await page
        .getByRole("main")
        .locator("[data-net]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-net")),
        )
    ).sort(),
  ).toEqual(["40", "-15", "-25"].sort());
  await expect(
    page.getByRole("main").locator("[data-group-total]"),
  ).toHaveAttribute("data-group-total", "101");
  await expect(
    page.getByRole("heading", { name: "Who owes whom", exact: true }),
  ).toBeVisible();
  await accessibleAndFits(page);
  await page.screenshot({
    path: testInfo.outputPath("group-balances.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("main").locator("[data-group-total]"),
  ).toHaveAttribute("data-group-total", "101");
  await page.goto(dashboard);
  await expect(
    page.getByRole("main").locator('[data-summary="expenses"]'),
  ).toHaveAttribute("data-amount", "0");
  await page.goto(groupPath);
  await page.getByRole("link", { name: "Back to groups", exact: true }).click();
  const deleteGroup = page.getByRole("button", { name: "Delete group Synthetic trip", exact: true });
  await deleteGroup.click();
  await expect(page.getByRole("alertdialog")).toContainText("recorded repayment(s)");
  await expect(page.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Synthetic trip", exact: true })).toBeVisible();
  await deleteGroup.click();
  const otherTab = await page.context().newPage();
  try {
    await otherTab.goto(groupPath);
    await otherTab.getByRole("link", { name: "Add participant", exact: true }).click();
    await otherTab.getByLabel("Participant or guest name", { exact: true }).fill("D");
    await otherTab.getByRole("button", { name: "Add participant", exact: true }).click();
    await expect(otherTab).toHaveURL(/saved=yes/);
  } finally {
    await otherTab.close();
  }
  await page.getByRole("button", { name: "Delete group permanently", exact: true }).click();
  await expect(page.getByRole("alertdialog").getByRole("alert")).toContainText("changed");
  await page.reload();
  await deleteGroup.click();
  await expect(page.getByRole("alertdialog")).toContainText("4 participant(s)");
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("group-delete-confirmation.png"), fullPage: true });
  await page.getByRole("button", { name: "Delete group permanently", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\?deleted=yes$/);
  await expect(page.getByRole("main").getByRole("status")).toContainText("Group deleted");
  await expect(page.getByRole("link", { name: "Synthetic trip", exact: true })).toHaveCount(0);
  await page.goto(groupPath);
  await expect(page.getByRole("heading", { name: "Group or bill not found", exact: true })).toBeVisible();
  await page.goto(dashboard);
  await expect(page.getByRole("main").locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "0");
});

test("two real browser sessions isolate records and logout protects routes", async ({
  page,
  browser,
  account,
}) => {
  await registerAndLogin(page, account);
  const privatePath = await createTransaction(
    page,
    "EXPENSE",
    "100",
    "Food",
    "Private synthetic expense",
  );
  await page.goto("/groups/new");
  await page
    .getByRole("main")
    .getByLabel("Group name", { exact: true })
    .fill("Private synthetic group");
  await page.getByRole("button", { name: "Create group", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/[a-f0-9-]+\?saved=yes$/);
  const privateGroup = new URL(page.url()).pathname;
  const other = {
    email: `e2e-${randomUUID()}@example.invalid`,
    password: randomUUID(),
  };
  const second = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: "https://127.0.0.1:3196",
  });
  try {
    const otherPage = await second.newPage();
    await registerAndLogin(otherPage, other, "Other");
    await otherPage.goto(dashboard);
    await expect(
      otherPage.getByRole("main").locator('[data-summary="expenses"]'),
    ).toHaveAttribute("data-amount", "0");
    await otherPage.goto("/analytics?from=2026-11-01&to=2026-11-30");
    await expect(otherPage.locator('[data-summary="expenses"]')).toHaveAttribute("data-amount", "0");
    await expect(otherPage.getByText("No income or expenses in this range.", { exact: true })).toBeVisible();
    await otherPage.goto(privatePath);
    await expect(
      otherPage.getByText("Transaction not found", { exact: true }),
    ).toBeVisible();
    await expect(
      otherPage.getByText("Private synthetic expense", { exact: true }),
    ).toHaveCount(0);
    await otherPage.goto(privateGroup);
    await expect(
      otherPage.getByRole("heading", {
        name: "Group or bill not found",
        exact: true,
      }),
    ).toBeVisible();
    await otherPage.goto("/transactions/not-a-uuid");
    await expect(
      otherPage.getByRole("heading", {
        name: "Transaction not found",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/app");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Yes", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto(dashboard);
    await expect(page).toHaveURL(/\/login$/);
    await page.goBack();
    await expect(page.locator("main:visible")).not.toContainText(
      "Private synthetic group",
    );
  } finally {
    await second.close();
    await removeTestAccount(other.email);
  }
});


test("glass surfaces remain accessible with reduced transparency and forced colors", async ({ page, context }, testInfo) => {
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-transparency", value: "reduce" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.goto("/login");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-transparency: reduce)").matches)).toBe(true);
  await accessibleAndFits(page);
  await expect(page.locator("section.glass-panel")).toHaveCSS("backdrop-filter", "none");
  await page.screenshot({ path: testInfo.outputPath("reduced-transparency.png"), fullPage: true });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.reload();
  const systemText = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "CanvasText";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(page.locator('label[for="auth-email"]')).toHaveCSS("color", systemText);
  await expect(page.locator('label[for="auth-password"]')).toHaveCSS("color", systemText);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator('[data-slot="toast"][data-kind="error"]')).toBeVisible();
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("forced-colors.png"), fullPage: true });
});


test("monthly category budgets preserve expenses and do not roll over", async ({ page, account }, testInfo) => {
  await registerAndLogin(page, account);
  await createTransaction(page, "EXPENSE", "100", "Food", "Budget meal");
  await page.goto("/budgets?month=2026-11");
  const limit = page.getByLabel("Food monthly limit (MMK)", { exact: true });
  await limit.fill("100");
  await page.getByRole("button", { name: "Save Food budget", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Food budget progress" })).toHaveAttribute("aria-valuenow", "100");
  await limit.fill("0");
  await page.getByRole("button", { name: "Save Food budget", exact: true }).click();
  await expect(page.getByRole("main").getByText("Enter a valid positive whole-kyat limit and month.", { exact: true })).toBeVisible();
  await expect(limit).toHaveValue("0");
  await limit.fill("80");
  await page.getByRole("button", { name: "Save Food budget", exact: true }).click();
  await expect(page.locator("[data-budget-category=Food]")).toHaveAttribute("data-overspend", "20");
  await accessibleAndFits(page);
  await page.screenshot({ path: testInfo.outputPath("budgets.png"), fullPage: true });
  await page.getByLabel("Budget month", { exact: true }).fill("2026-12");
  await page.getByRole("button", { name: "Choose month", exact: true }).click();
  await expect(limit).toHaveValue("");
  await expect(page.getByRole("progressbar", { name: "Food budget progress" })).toHaveCount(0);
  await page.goto("/budgets?month=2026-11");
  await page.getByRole("button", { name: "Remove Food limit", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Food budget progress" })).toHaveCount(0);
  await page.goto(dashboard);
  await expect(page.locator("[data-summary=expenses]")).toHaveAttribute("data-amount", "100");
});
