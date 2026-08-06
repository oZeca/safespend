import { expect, test } from "@playwright/test";
import * as XLSX from "xlsx";

test("uploads, maps, previews, and confirms a CSV import", async ({ page }) => {
  const unique = Date.now(); const accountName = `Import account ${unique}`;
  await page.goto("/accounts/new"); await page.getByLabel("Account name").fill(accountName); await page.getByLabel("Current balance").fill("0.00"); await page.getByRole("button", { name: "Create account" }).click();
  await page.goto("/imports");
  await page.getByLabel("CSV or Excel file").setInputFiles({ name: `bank-${unique}.csv`, mimeType: "text/csv", buffer: Buffer.from("Date;Description;Amount;Merchant\n21/07/2026;Groceries;-45,20;Market\n22/07/2026;Salary;2000,00;Employer\n31/02/2026;Invalid;10,00;Store\n") });
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName }); await page.getByRole("button", { name: "Upload and continue" }).click();
  await expect(page.getByRole("heading", { name: "Map import columns" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("combobox", { name: "Date column" }).selectOption("Date"); await page.getByRole("combobox", { name: "Description column" }).selectOption("Description");
  await page.getByRole("combobox", { name: "Amount column" }).selectOption("Amount"); await page.getByRole("combobox", { name: "Merchant column (optional)" }).selectOption("Merchant");
  await page.getByRole("combobox", { name: "Date format" }).selectOption("DD/MM/YYYY"); await page.getByRole("combobox", { name: "Number format" }).selectOption("decimal_comma");
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(page.getByRole("heading", { name: "Preview import" })).toBeVisible({ timeout: 15000 }); await expect(page.getByText("Invalid date")).toBeVisible(); await expect(page.getByRole("button", { name: "Confirm 2 transactions" })).toBeVisible();
  await page.getByRole("combobox", { name: "Category for Salary" }).selectOption({ label: "Salary" });
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Import row 2" }).uncheck(); await expect(page.getByRole("button", { name: "Confirm 1 transaction" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm 1 transaction" }).click();
  await expect(page.getByRole("heading", { name: "Import result" })).toBeVisible({ timeout: 15000 }); await expect(page.getByText(/1 imported, 0 duplicates skipped, 1 manually excluded, 1 invalid/)).toBeVisible();
  await page.getByRole("link", { name: "View imported transactions" }).click();
  await expect(page.getByRole("combobox", { name: "Category for Salary" })).toHaveValue("category-salary");
});

test("uploads an Excel workbook through the existing mapping flow", async ({ page }) => {
  const unique = Date.now(); const accountName = `Excel account ${unique}`;
  await page.goto("/accounts/new"); await page.getByLabel("Account name").fill(accountName); await page.getByLabel("Current balance").fill("0.00"); await page.getByRole("button", { name: "Create account" }).click();
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ["Date", "Description", "Amount", "Merchant"],
    ["21/07/2026", "Groceries", "-45,20", "Market"],
  ]), "Transactions");
  await page.goto("/imports");
  await page.getByLabel("CSV or Excel file").setInputFiles({ name: `bank-${unique}.xlsx`, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer });
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName }); await page.getByRole("button", { name: "Upload and continue" }).click();
  await expect(page.getByRole("heading", { name: "Map import columns" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("combobox", { name: "Date column" }).selectOption("Date"); await page.getByRole("combobox", { name: "Description column" }).selectOption("Description");
  await page.getByRole("combobox", { name: "Amount column" }).selectOption("Amount"); await page.getByRole("combobox", { name: "Merchant column (optional)" }).selectOption("Merchant");
  await page.getByRole("combobox", { name: "Date format" }).selectOption("DD/MM/YYYY"); await page.getByRole("combobox", { name: "Number format" }).selectOption("decimal_comma");
  await page.getByRole("button", { name: "Preview import" }).click(); await expect(page.getByRole("button", { name: "Confirm 1 transaction" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Confirm 1 transaction" }).click(); await expect(page.getByText(/1 imported/)).toBeVisible();
});
