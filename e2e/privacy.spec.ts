import { expect, test } from "@playwright/test";

test("hides sensitive amounts and remembers the privacy preference", async ({ page }) => {
  await page.goto("/dashboard");

  const privacyRoot = page.locator("[data-privacy]");
  await expect(privacyRoot).toHaveAttribute("data-privacy", "visible");

  await page.getByRole("button", { name: "Hide sensitive amounts" }).click();
  await expect(privacyRoot).toHaveAttribute("data-privacy", "hidden");
  await expect(page.locator("main .tabular-nums").first()).toHaveCSS("filter", /blur/);

  await page.reload();
  await expect(privacyRoot).toHaveAttribute("data-privacy", "hidden");
  await page.getByRole("button", { name: "Show sensitive amounts" }).click();
  await expect(privacyRoot).toHaveAttribute("data-privacy", "visible");
});
