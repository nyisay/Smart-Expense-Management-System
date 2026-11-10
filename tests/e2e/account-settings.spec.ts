import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { removeTestAccount } from "./database";

async function login(page: Page, origin: string, email: string, password: string) {
  await page.goto(`${origin}/login`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("account profile, preferences and password changes preserve ownership and revoke every old session", async ({ page, browser }, testInfo) => {
  const email = `e2e-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const newPassword = randomUUID();
  const otherContext = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    await page.goto("/register");
    const origin = new URL(page.url()).origin;
    await page.getByLabel("Name", { exact: true }).fill("Profile owner");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText("If registration can be completed");
    await login(page, origin, email, password);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/app");
    const otherPage = await otherContext.newPage();
    await login(otherPage, origin, email, password);
    await expect(otherPage).toHaveURL(/\/dashboard$/);
    await otherPage.goto(`${origin}/app`);

    await expect(page.getByRole("heading", { name: "Account settings", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email address", { exact: true })).toHaveAttribute("readonly", "");
    await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(email);
    await expect(page.getByRole("main").getByText("MMK (Ks) · Whole kyat", { exact: true })).toBeVisible();
    const name = page.getByLabel("Display name", { exact: true });
    await expect(page.getByRole("button", { name: "Save profile", exact: true })).toBeDisabled();
    await name.fill("Unsaved name");
    await page.getByRole("button", { name: "Reset changes", exact: true }).click();
    await expect(name).toHaveValue("Profile owner");
    await name.fill("Updated profile");
    const captured = page.waitForRequest((request) => request.method() === "POST" && new URL(request.url()).pathname === "/app");
    await page.getByRole("button", { name: "Save profile", exact: true }).click();
    const profileRequest = await captured;
    const body = profileRequest.postDataBuffer();
    expect(body).not.toBeNull();
    const originalHeaders = profileRequest.headers();
    const replayHeaders: Record<string, string> = { origin };
    for (const key of ["content-type", "next-action", "next-router-state-tree"]) if (originalHeaders[key]) replayHeaders[key] = originalHeaders[key];
    await expect(page.getByRole("heading", { name: "Updated profile", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open profile menu" })).toContainText("Updated profile");
    await otherPage.getByLabel("Display name", { exact: true }).fill("Stale profile");
    await otherPage.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(otherPage.getByRole("main")).toContainText("Your profile changed in another tab");
    await expect(otherPage.getByLabel("Display name", { exact: true })).toHaveValue("Stale profile");
    await otherPage.reload();
    await expect(otherPage.getByLabel("Display name", { exact: true })).toHaveValue("Updated profile");

    for (const theme of ["dark", "frosted"]) {
      await page.getByRole("main").getByLabel("Appearance", { exact: true }).selectOption(theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`account-${theme}.png`), fullPage: true });
    }
    await page.reload();
    await expect(page.getByRole("main").getByLabel("Appearance", { exact: true })).toHaveValue("frosted");
    await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("Updated profile");

    await page.getByLabel("Current password", { exact: true }).fill("Incorrect-current-password");
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Update password and sign out", exact: true }).click();
    await expect(page.getByRole("main")).toContainText("Current password is incorrect.");
    await expect(page.getByLabel("New password", { exact: true })).toHaveValue(newPassword);
    await page.getByLabel("Current password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Update password and sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Replay a real action with the other device's old cookie, not only a page navigation.
    const revoked = await otherContext.request.post(`${origin}/app`, { data: body, headers: replayHeaders, maxRedirects: 0 });
    expect(revoked.headers()["x-action-redirect"] ?? revoked.headers().location ?? "").toContain("/login");
    await otherPage.goto(`${origin}/app`);
    await expect(otherPage).toHaveURL(/\/login$/);
    await login(page, origin, email, password);
    await expect(page.getByRole("main")).toContainText("Unable to sign in");
    await login(page, origin, email, newPassword);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/app");
    await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("Updated profile");
  } finally {
    await otherContext.close();
    await removeTestAccount(email);
  }
});
