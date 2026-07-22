import { expect, test } from "@playwright/test";

test("creates, edits, and archives an account", async ({ page }) => {
  const name = `E2E account ${Date.now()}`;
  await page.goto("/accounts");
  await page.getByRole("link", { name: /add account/i }).first().click();
  await page.getByLabel("Account name").fill(name);
  await page.getByLabel("Institution").fill("Test Bank");
  await page.getByLabel("Current balance").fill("1234.56");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Account created.")).toBeVisible();
  const card = page.getByRole("article").filter({ hasText: name });
  await expect(card.getByText("€1,234.56")).toBeVisible();

  await card.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Account name").fill(`${name} updated`);
  await page.getByLabel("Current balance").fill("1500.00");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Account updated.")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("article").filter({ hasText: `${name} updated` }).getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Account archived.")).toBeVisible();
  await page.getByText(/Archived accounts/).click();
  await expect(page.getByRole("article").filter({ hasText: `${name} updated` })).toBeVisible();
});
