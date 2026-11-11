import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/login", "/register"]) {
  test(`${route} reference layout keeps Frosted Glass despite an old saved dark preference`, async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem("smart-expense-theme", "dark"));
    const response = await page.request.get(route);
    expect(await response.text()).toContain('data-theme="frosted"');
    await page.goto(route);
    const photo = page.locator("[data-auth-photo]");
    const formPanel = page.getByRole("region", { name: route === "/login" ? "Sign in" : "Create your account", exact: true });
    await expect(formPanel).toBeVisible();
    await expect(page.locator("main [data-slot='card']")).toHaveCount(0);
    const illustration = photo.locator("img");
    await expect(illustration).toHaveAttribute("alt", "");
    await expect(illustration).toHaveAttribute("src", /account-market-photo\.webp/);
    const wide = (page.viewportSize()?.width ?? 0) >= 1024;
    if (wide) {
      await expect(photo).toBeVisible();
      await expect(illustration).toBeVisible();
      await expect.poll(() => illustration.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(illustration).toHaveCSS("object-fit", "cover");
      const left = await photo.boundingBox();
      const right = await formPanel.boundingBox();
      expect(left && right && left.x + left.width <= right.x).toBeTruthy();
      expect(left && right && Math.abs(left.width - right.width) < 1).toBeTruthy();
      expect(left && right && Math.abs(left.x + left.width - right.x) < 1).toBeTruthy();
      expect(left && right && Math.abs(left.width + right.width - Math.min(972, (page.viewportSize()?.width ?? 0) - 64)) < 1).toBeTruthy();
      expect(left && right && Math.abs(right.height - 655.2) < 1 && Math.abs(left.height - right.height) < 1).toBeTruthy();
    } else await expect(photo).toBeHidden();
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("autocomplete", "email");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
    for (const label of route === "/register" ? ["Name", "Email", "Password"] : ["Email", "Password"]) {
      const field = page.getByLabel(label, { exact: true });
      const idleBorder = await field.evaluate((element) => getComputedStyle(element).borderBottomColor);
      await field.hover();
      await expect(field).toHaveCSS("border-top-width", "0px");
      await expect(field).toHaveCSS("border-left-width", "0px");
      await expect(field).toHaveCSS("border-right-width", "0px");
      await expect(field).toHaveCSS("border-bottom-width", "1px");
      await expect(field).toHaveCSS("border-bottom-color", idleBorder);
      await field.focus();
      await expect(field).toHaveCSS("border-bottom-width", "2px");
      await expect.poll(() => field.evaluate((element) => getComputedStyle(element).borderBottomColor)).not.toBe(idleBorder);
      expect(await field.evaluate((element) => (getComputedStyle(element).boxShadow.match(/-?[\d.]+px/g) ?? []).every((length) => parseFloat(length) === 0))).toBe(true);
      await field.blur();
    }
    await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
    await expect(page.getByLabel("Appearance", { exact: true })).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("auth-frosted.png"), fullPage: true });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("autocomplete", route === "/login" ? "current-password" : "new-password");
  });
}

test("Frosted Glass loads when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage unavailable", "SecurityError"); } }));
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "frosted");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByLabel("Appearance", { exact: true })).toHaveCount(0);
});
