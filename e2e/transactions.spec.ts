import { expect, test } from "@playwright/test";

test("creates, edits, filters, and deletes a transaction", async ({ page }) => {
  const unique = Date.now(); const accountName = `Transaction account ${unique}`; const description = `Market purchase ${unique}`;
  await page.goto("/accounts/new");
  await page.getByLabel("Account name").fill(accountName);
  await page.getByLabel("Current balance").fill("2000.00");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.goto("/transactions/new");
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName });
  await page.getByLabel("Description").fill(description);
  await page.getByLabel("Merchant").fill("E2E Market");
  await page.getByLabel("Amount").fill("-45.20");
  await page.getByRole("combobox", { name: "Category", exact: true }).selectOption({ label: "Groceries" });
  await page.getByLabel("Notes").fill("Created by Playwright");
  await page.getByRole("button", { name: "Create transaction" }).click();
  await expect(page.getByText("Transaction created.")).toBeVisible();
  const row = page.getByRole("article").filter({ hasText: description });
  await expect(row.getByText("-€45.20")).toBeVisible();

  await row.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Description").fill(`${description} updated`);
  await page.getByLabel("Amount").fill("-50.00");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Transaction updated.")).toBeVisible();
  await page.getByPlaceholder("Search description or merchant").fill(String(unique));
  await page.getByRole("button", { name: "Apply filters" }).click();
  const updated = page.getByRole("article").filter({ hasText: `${description} updated` });
  await expect(updated).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await updated.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Transaction deleted.")).toBeVisible();
  await expect(page.getByText(`${description} updated`)).toHaveCount(0);
});
