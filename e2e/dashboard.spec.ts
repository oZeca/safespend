import { expect, test } from "@playwright/test";

test("shows actual dashboard metrics and drills into matching transactions", async ({ page }) => {
  const unique = Date.now();
  const accountName = `Dashboard account ${unique}`;
  const description = `Dashboard income ${unique}`;
  await page.goto("/accounts/new");
  await page.getByLabel("Account name").fill(accountName);
  await page.getByLabel("Current balance").fill("1234.56");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Account created.")).toBeVisible();

  await page.goto("/transactions/new");
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName });
  await page.getByLabel("Description").fill(description);
  await page.getByLabel("Amount").fill("123.45");
  await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("income");
  await page.getByRole("combobox", { name: "Category", exact: true }).selectOption({ label: "Salary" });
  await page.getByRole("button", { name: "Create transaction" }).click();
  await expect(page.getByText("Transaction created.")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your financial overview" })).toBeVisible();
  await expect(page.getByText(/Safe to spend (this month|for the rest of this month)/)).toBeVisible();
  await expect(page.getByText("Available cash")).toBeVisible();
  await expect(page.getByRole("img", { name: "Monthly income, expenses, and savings chart" })).toBeVisible();

  const incomeCard = page.getByRole("link").filter({ hasText: /income/i }).filter({ hasText: "View transactions" }).first();
  await incomeCard.click();
  await expect(page).toHaveURL(/type=income/);
  await expect(page.getByRole("article").filter({ hasText: description })).toBeVisible();
});
