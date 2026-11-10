import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/login", "/register"]) {
  test(`${route} password visibility preserves input and never submits the form`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.getByLabel("Email", { exact: true }).fill("visibility@example.invalid");
    if (route === "/register") await page.getByLabel("Name", { exact: true }).fill("Visibility test");
    const password = page.getByLabel("Password", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveAttribute("autocomplete", route === "/register" ? "new-password" : "current-password");
    await password.fill("Synthetic-password-only");
    let submissions = 0;
    page.on("request", (request) => {
      if (request.method() === "POST") submissions++;
    });

    const show = page.getByRole("button", { name: "Show password", exact: true });
    await expect(show).toHaveAttribute("type", "button");
    await expect(show).toHaveAttribute("aria-controls", "auth-password");
    const bounds = await show.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await password.focus();
    await page.keyboard.press("Tab");
    await expect(show).toBeFocused();
    await show.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("Synthetic-password-only");
    await expect(password).toHaveAttribute("minlength", "12");
    await expect(password).toHaveAttribute("maxlength", "128");
    await expect(password).toHaveAttribute("required", "");

    const hide = page.getByRole("button", { name: "Hide password", exact: true });
    await hide.focus();
    await page.keyboard.press("Space");
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("Synthetic-password-only");
    await expect(page.getByRole("button", { name: "Show password", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password", exact: true }).click();

    expect(submissions).toBe(0);
    expect(new URL(page.url()).pathname).toBe(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    await password.fill("");
    await page.screenshot({ path: testInfo.outputPath("password-toggle.png"), fullPage: true });
  });
}
