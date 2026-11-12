import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { removeTestAccount } from "./database";

async function fillRegistration(page: Page, email: string, password: string) {
  await page.getByLabel("Name", { exact: true }).fill("Registration test");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
}

test("successful registration redirects to login with generic feedback; invalid submissions stay on sign-up", async ({ page }) => {
  const email = `e2e-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  try {
    await page.goto("/register");
    await fillRegistration(page, email, password);
    await page.getByLabel("Name", { exact: true }).fill(" ");
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText("Use a valid email");
    await expect(page).toHaveURL(/\/register$/);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) await page.goto("/register");
      await fillRegistration(page, email, password);
      await page.getByRole("button", { name: "Register", exact: true }).click();
      await expect(page).toHaveURL((url) => url.pathname === "/login");
      await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
      await expect(page.locator('[data-slot="toast"][data-kind="success"]')).toContainText("If registration can be completed");
      await expect(page).toHaveURL(/\/login$/);
      expect(page.url()).not.toContain(email);
      expect((await page.context().cookies()).some((cookie) => cookie.name.endsWith("authjs.session-token"))).toBe(false);
    }
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  } finally { await removeTestAccount(email); }
});

test("registration redirects without JavaScript and never places credentials in the destination", async ({ browser, baseURL }, testInfo) => {
  const email = `e2e-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const context = await browser.newContext({ javaScriptEnabled: false, ignoreHTTPSErrors: true, viewport: testInfo.project.use.viewport, isMobile: testInfo.project.use.isMobile, hasTouch: testInfo.project.use.hasTouch });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/register`);
    await fillRegistration(page, email, password);
    const response = page.waitForResponse((item) => item.request().method() === "POST" && new URL(item.url()).pathname === "/register");
    await page.getByRole("button", { name: "Register", exact: true }).click();
    expect((await response).status()).toBe(303);
    await expect(page).toHaveURL((url) => url.pathname === "/login" && url.searchParams.get("registered") === "1");
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    expect(page.url()).not.toContain(email);
    expect(page.url()).not.toContain(password);
    expect((await context.cookies()).some((cookie) => cookie.name.endsWith("authjs.session-token"))).toBe(false);
  } finally {
    await context.close();
    await removeTestAccount(email);
  }
});
