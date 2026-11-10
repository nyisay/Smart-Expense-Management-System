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
  await expect(page).toHaveURL(/\/dashboard#analytics$/);
  await page.goto("/dashboard?from=2025-11-01&to=2025-11-08");
  await workspaceNavigate(page, "Analytics");
  await expect(page).toHaveURL((url) => url.pathname === "/dashboard" && url.hash === "#analytics" && url.searchParams.get("from") === "2025-11-01" && url.searchParams.get("to") === "2025-11-08");
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
  await page
    .getByRole("main")
    .getByLabel("Date", { exact: true })
    .filter({ visible: true })
    .fill(occurredOn);
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
  await page
    .getByRole("main")
    .getByLabel("Transaction date", { exact: true })
    .filter({ visible: true })
    .fill(date);
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
  await page
    .getByRole("main")
    .getByLabel("Date", { exact: true })
    .filter({ visible: true })
    .fill(date);
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
  await page
    .getByRole("main")
    .getByLabel("Repayment date", { exact: true })
    .filter({ visible: true })
    .fill(date);
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
  await expect(page.locator("[data-slot=card]")).toHaveCSS("backdrop-filter", "none");
  await page.screenshot({ path: testInfo.outputPath("reduced-transparency.png"), fullPage: true });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
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
