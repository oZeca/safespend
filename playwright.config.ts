import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100", trace: "on-first-retry" },
  webServer: { command: "NEXT_PUBLIC_ENABLE_PWA=1 npm run db:migrate && NEXT_PUBLIC_ENABLE_PWA=1 npm run dev -- -p 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 120000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
