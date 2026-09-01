import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_PATH } from "./src/test/e2e-database";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100", trace: "on-first-retry" },
  webServer: {
    command: "node --import tsx e2e/prepare-database.ts && npm run db:migrate && npm run dev -- -p 3100",
    env: { ...process.env, DATABASE_PATH: E2E_DATABASE_PATH, NEXT_PUBLIC_ENABLE_PWA: "1" },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
