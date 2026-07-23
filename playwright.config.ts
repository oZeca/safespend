import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100", trace: "on-first-retry" },
  webServer: { command: "npm run db:migrate && npm run dev -- -p 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 120000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
