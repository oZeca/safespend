import { expect, test } from "@playwright/test";

test("uploads, maps, previews, and confirms a CSV import", async ({ page }) => {
  const unique = Date.now(); const accountName = `Import account ${unique}`;
  await page.goto("/accounts/new"); await page.getByLabel("Account name").fill(accountName); await page.getByLabel("Current balance").fill("0.00"); await page.getByRole("button", { name: "Create account" }).click();
  await page.goto("/imports");
  await page.getByLabel("CSV file").setInputFiles({ name: `bank-${unique}.csv`, mimeType: "text/csv", buffer: Buffer.from("Date;Description;Amount;Merchant\n21/07/2026;Groceries;-45,20;Market\n22/07/2026;Salary;2000,00;Employer\n31/02/2026;Invalid;10,00;Store\n") });
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName }); await page.getByRole("button", { name: "Upload and continue" }).click();
  await expect(page.getByRole("heading", { name: "Map CSV columns" })).toBeVisible();
  await page.getByRole("combobox", { name: "Date column" }).selectOption("Date"); await page.getByRole("combobox", { name: "Description column" }).selectOption("Description");
  await page.getByRole("combobox", { name: "Amount column" }).selectOption("Amount"); await page.getByRole("combobox", { name: "Merchant column (optional)" }).selectOption("Merchant");
  await page.getByRole("combobox", { name: "Date format" }).selectOption("DD/MM/YYYY"); await page.getByRole("combobox", { name: "Number format" }).selectOption("decimal_comma");
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(page.getByRole("heading", { name: "Preview CSV import" })).toBeVisible(); await expect(page.getByText("Invalid date")).toBeVisible(); await expect(page.getByRole("button", { name: "Confirm 2 transactions" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Import row 2" }).uncheck(); await expect(page.getByRole("button", { name: "Confirm 1 transaction" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm 1 transaction" }).click();
  await expect(page.getByRole("heading", { name: "Import result" })).toBeVisible(); await expect(page.getByText(/1 imported, 0 duplicates skipped, 1 manually excluded, 1 invalid/)).toBeVisible();
});
