import { expect, test } from "@playwright/test";

test("configures forecast assumptions and shows explained safe-to-spend", async ({ page }) => {
  const unique = Date.now();
  const today = new Date();
  const year = today.getFullYear();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const accountName = `Forecast cash ${unique}`;
  await page.goto("/accounts/new");
  await page.getByLabel("Account name").fill(accountName);
  await page.getByLabel("Current balance").fill("5000.00");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Account created.")).toBeVisible();

  await page.goto("/forecast");
  const goalSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Annual savings goal" }) }).last();
  await goalSection.getByLabel("Goal name").fill(`Goal ${unique}`);
  await goalSection.getByLabel("Start date").fill(`${year}-01-01`);
  await goalSection.getByLabel("Target date").fill(`${year}-12-31`);
  await goalSection.getByLabel("Annual target").fill("12000.00");
  await goalSection.getByLabel("Already saved at start").fill("1000.00");
  await goalSection.getByLabel("Minimum cash buffer").fill("500.00");
  await goalSection.getByRole("button", { name: /Create goal|Save goal/ }).click();
  await expect(page.getByText("Savings goal and cash buffer saved.")).toBeVisible();

  const incomeName = `Expected bonus ${unique}`;
  const incomeSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Expected income" }) }).last();
  await incomeSection.getByLabel("Name").fill(incomeName);
  await incomeSection.getByLabel("Date").fill(tomorrowString);
  await incomeSection.getByLabel("Amount").fill("500.00");
  await incomeSection.getByRole("button", { name: "Add expected income" }).click();
  await expect(page.getByText("Expected income added.")).toBeVisible();

  const recurringName = `Recurring rent ${unique}`;
  const recurringSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Recurring items" }) }).last();
  await recurringSection.getByLabel("Name").fill(recurringName);
  await recurringSection.getByLabel("Amount").fill("100.00");
  await recurringSection.getByLabel("Next date").fill(tomorrowString);
  await recurringSection.getByRole("button", { name: "Add recurring item" }).click();
  await expect(page.getByText("Recurring item added.")).toBeVisible();

  await recurringSection.getByRole("link", { name: `Edit ${recurringName}` }).click();
  const updatedRecurringName = `Updated recurring rent ${unique}`;
  await page.getByLabel("Name").fill(updatedRecurringName);
  await page.getByLabel("Amount").fill("125.00");
  await page.getByRole("button", { name: "Save recurring item" }).click();
  await expect(page.getByText("Recurring item updated.")).toBeVisible();
  await expect(page.getByText(updatedRecurringName)).toBeVisible();

  await page.getByRole("link", { name: "Monthly" }).click();
  await expect(page.getByRole("link", { name: "Monthly" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(updatedRecurringName)).toBeVisible();
  await page.getByRole("link", { name: "Yearly" }).click();
  await expect(page.getByRole("link", { name: "Yearly" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(updatedRecurringName)).not.toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Safe to spend for the rest of this month")).toBeVisible();
  await expect(page.getByText("How safe-to-spend was calculated")).toBeVisible();
  await expect(page.getByText(updatedRecurringName)).toBeVisible();
  await expect(page.getByText("Forecasted target-date savings")).toBeVisible();
});
