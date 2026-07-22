import { expect, test } from "@playwright/test";

test("shows the dashboard foundation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your safe-to-spend overview" })).toBeVisible();
});
