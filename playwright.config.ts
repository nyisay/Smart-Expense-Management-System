import "dotenv/config";
import { defineConfig } from "@playwright/test";
import { assertLocalTestDatabase } from "./tests/e2e/database";

assertLocalTestDatabase();

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: "line",
  use: {
    baseURL: "https://127.0.0.1:3196",
    ignoreHTTPSErrors: true, // Ephemeral self-signed test certificate; no Windows trust changes.
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    trace: "off",
    video: "off",
    screenshot: "off",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { browserName: "chromium", viewport: { width: 1366, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run test:e2e:serve",
    url: "https://127.0.0.1:3196/login",
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "ignore",
  },
});
