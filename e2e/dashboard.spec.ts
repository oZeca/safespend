import { expect, test } from "@playwright/test";

test("shows actual dashboard metrics and drills into matching transactions", async ({ page }) => {
  const unique = Date.now();
  const accountName = `Dashboard account ${unique}`;
  const description = `Dashboard income ${unique}`;
  const expenseDescription = `Dashboard groceries ${unique}`;
  await page.goto("/accounts/new");
  await page.getByLabel("Account name").fill(accountName);
  await page.getByLabel("Current balance").fill("1234.56");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Account created.")).toBeVisible();

  await page.goto("/transactions/new");
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName });
  await page.getByLabel("Description").fill(description);
  await page.getByRole("textbox", { name: /^Amount/ }).fill("123.45");
  await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("income");
  await page.getByRole("combobox", { name: "Category", exact: true }).selectOption({ label: "Salary" });
  await page.getByRole("button", { name: "Create transaction" }).click();
  await expect(page.getByText("Transaction created.")).toBeVisible();

  await page.goto("/transactions/new");
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: accountName });
  await page.getByLabel("Description").fill(expenseDescription);
  await page.getByRole("textbox", { name: /^Amount/ }).fill("-45.67");
  await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("expense");
  await page.getByRole("combobox", { name: "Category", exact: true }).selectOption({ label: "Groceries" });
  await page.getByRole("button", { name: "Create transaction" }).click();
  await expect(page.getByText("Transaction created.")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Dashboard views" })).toBeVisible();
  await expect(page.getByText(/Safe to spend (this month|for the rest of this month)/)).toBeVisible();
  const availableCashLink = page.getByRole("link", { name: /Available cash/ }).last();
  await expect(availableCashLink).toBeVisible();

  await availableCashLink.locator("..").getByRole("button", { name: "Show calculation" }).click();
  await expect(page.getByRole("tooltip").filter({ hasText: "included in available cash" })).toBeVisible();

  await page.getByRole("link", { name: "Spending" }).click();
  await expect(page).toHaveURL(/view=spending/);
  await expect(page.getByRole("heading", { name: "Spending", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Monthly income, expenses, and savings chart" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Category spending for \d{4}/ })).toBeVisible();
  const groceriesRow = page.getByRole("row").filter({ has: page.getByRole("link", { name: "Groceries", exact: true }) });
  await expect(groceriesRow.getByRole("rowheader", { name: "Groceries" })).toBeVisible();
  await expect(groceriesRow.getByRole("link", { name: /Groceries spending in \d{4}-\d{2}/ }).last()).toBeVisible();

  const incomeCard = page.getByRole("link").filter({ hasText: /income/i }).filter({ hasText: "View transactions" }).first();
  await incomeCard.click();
  await expect(page).toHaveURL(/type=income/);
  await expect(page.getByRole("article").filter({ hasText: description })).toBeVisible();
});
