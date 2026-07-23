import { expect, test } from "@playwright/test";

test("previews a rule and bulk categorizes a transaction", async ({ page }) => {
  const unique = Date.now(); const accountName = `Rules account ${unique}`; const description = `Coffee rule ${unique}`;
  await page.goto("/accounts/new"); await page.getByLabel("Account name").fill(accountName); await page.getByLabel("Current balance").fill("100.00"); await page.getByRole("button", { name: "Create account" }).click();
  await page.goto("/transactions/new"); await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName }); await page.getByLabel("Description").fill(description); await page.getByLabel("Amount").fill("-4.50"); await page.getByRole("button", { name: "Create transaction" }).click();
  await page.goto("/rules/new"); await page.getByLabel("Rule name").fill(`Coffee ${unique}`); await page.getByLabel("Pattern").fill(String(unique)); await page.getByLabel("Assign category").selectOption({ label: "Restaurants" }); await page.getByLabel("Assign type").selectOption("expense");
  await page.getByRole("button", { name: "Preview matches" }).click(); await expect(page.getByText("1 matching transaction")).toBeVisible(); await expect(page.getByText(description)).toBeVisible();
  await page.getByRole("button", { name: "Create rule" }).click(); await expect(page.getByText("Rule created.")).toBeVisible(); await page.getByRole("button", { name: "Apply enabled rules" }).click(); await expect(page.getByText("1 uncategorized transaction updated.")).toBeVisible();
  await page.goto(`/transactions?search=${unique}`); await expect(page.getByRole("article").filter({ hasText: description }).getByText(/Restaurants/)).toBeVisible();
});
