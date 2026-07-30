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
  const inlineBalance = card.getByRole("textbox", { name: `Current balance for ${name}` });
  await expect(inlineBalance).toHaveValue("1234.56");
  await inlineBalance.fill("1400.00");
  await inlineBalance.press("Enter");
  await expect(card.getByText("Saved")).toBeVisible();
  await expect(inlineBalance).toHaveValue("1400.00");

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

test("calculates an account balance from its opening balance and transactions", async ({ page }) => {
  const unique = Date.now(); const name = `Calculated account ${unique}`;
  await page.goto("/accounts/new");
  await page.getByLabel("Account name").fill(name);
  await page.getByLabel("Balance mode").selectOption("calculated");
  await page.getByLabel("Opening balance", { exact: true }).fill("1000.00");
  await page.getByLabel("Opening date").fill("2026-01-01");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.goto("/transactions/new");
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: name });
  await page.getByLabel("Description").fill(`Calculated expense ${unique}`);
  await page.getByLabel("Amount").fill("-100.00");
  await page.getByRole("button", { name: "Create transaction" }).click();

  await page.goto("/transactions/new");
  await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: name });
  await page.getByLabel("Description").fill(`Internal fund movement ${unique}`);
  await page.getByLabel("Amount").fill("-500.00");
  await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("transfer");
  await page.getByLabel("Internal movement within this account").check();
  await page.getByRole("button", { name: "Create transaction" }).click();
  await page.goto("/accounts");

  const card = page.getByRole("article").filter({ hasText: name });
  await expect(card.getByText("€900.00", { exact: true })).toBeVisible();
  await expect(card.getByText(/€1,000.00 opening \+ -€100.00 transactions/)).toBeVisible();
  await expect(card.getByRole("textbox", { name: `Current balance for ${name}` })).toHaveCount(0);
});
