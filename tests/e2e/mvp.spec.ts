import { test as base, expect, type Page } from "@playwright/test";
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
  await expect(page.getByRole("status")).toContainText(
    "If registration can be completed",
  );
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
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        targets: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  });
}

async function createTransaction(
  page: Page,
  type: "INCOME" | "EXPENSE",
  amount: string,
  category: string,
  merchant: string,
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
    .fill(date);
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
    page.getByText("No expenses in this range", { exact: true }),
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
    page.getByRole("main").locator(".recharts-tooltip-wrapper").first(),
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
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await accessibleAndFits(page);
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
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
  const image = await sharp({
    create: { width: 80, height: 120, channels: 3, background: "white" },
  })
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
  await page.getByRole("link", { name: "Upload receipt", exact: true }).click();
  await accessibleAndFits(page);
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
    page.getByText("Choose a JPG, PNG or WebP image up to 10 MiB.", {
      exact: true,
    }),
  ).toBeVisible();
  await mockScenario("ambiguous");
  await uploadReceipt(page);
  await expect(
    page.getByText("2. Review and confirm", { exact: true }),
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
  await expect(page.getByText(/Ollama extraction failed/)).toBeVisible();
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
  await page.getByRole("link", { name: "Groups", exact: true }).click();
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
