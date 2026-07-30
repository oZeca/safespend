import { expect, test } from "@playwright/test";

test("creates, edits, filters, and deletes a transaction", async ({ page }) => {
  const unique = Date.now(); const accountName = `Transaction account ${unique}`; const description = `Market purchase ${unique}`;
  await page.goto("/accounts/new");
  await page.getByLabel("Account name").fill(accountName);
  await page.getByLabel("Current balance").fill("2000.00");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Account created.")).toBeVisible();

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
  const inlineCategory = row.getByRole("combobox", { name: `Category for ${description}` });
  await inlineCategory.selectOption({ label: "Shopping" });
  await expect(row.getByText("Saved")).toBeVisible();
  await expect(inlineCategory).toHaveValue("category-shopping");

  await row.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Description").fill(`${description} updated`);
  await page.locator('input[name="amount"]').fill("-50.00");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Transaction updated.")).toBeVisible();
  await page.getByPlaceholder("Search description or merchant").fill(String(unique));
  await page.getByRole("button", { name: "Apply filters" }).click();
  const updated = page.getByRole("article").filter({ hasText: `${description} updated` });
  await expect(updated).toBeVisible();

  await page.getByLabel("Amount comparison").selectOption("equal");
  await page.getByLabel("Transaction amount").fill("-50.00");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(updated).toBeVisible();
  await page.getByLabel("Amount comparison").selectOption("less");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText(`${description} updated`)).toHaveCount(0);

  await page.getByLabel("Amount comparison").selectOption("equal");
  await page.getByLabel("Transaction amount").fill("-50.00");
  await page.getByRole("button", { name: "Apply filters" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await updated.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Transaction deleted.")).toBeVisible();
  await expect(page.getByText(`${description} updated`)).toHaveCount(0);
});

test("splits a transaction and links a transfer", async ({ page }) => {
  const unique = Date.now();
  const currentAccount = `Current transfer ${unique}`;
  const cardAccount = `Card transfer ${unique}`;
  for (const [name, type] of [[currentAccount, "current"], [cardAccount, "credit"]] as const) {
    await page.goto("/accounts/new");
    await page.getByLabel("Account name").fill(name);
    await page.getByRole("combobox", { name: "Type", exact: true }).selectOption(type);
    await page.getByLabel("Current balance").fill("0.00");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Account created.")).toBeVisible();
  }

  const createTransaction = async (account: string, description: string, amount: string, type: string) => {
    await page.goto("/transactions/new");
    await page.getByRole("combobox", { name: "Account", exact: true }).selectOption({ label: account });
    await page.getByLabel("Description").fill(description);
    await page.getByLabel("Amount").fill(amount);
    await page.getByRole("combobox", { name: "Type", exact: true }).selectOption(type);
    await page.getByRole("button", { name: "Create transaction" }).click();
  };

  const purchase = `Split purchase ${unique}`;
  await createTransaction(currentAccount, purchase, "-100.00", "expense");
  await page.getByRole("article").filter({ hasText: purchase }).getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Split 1 category").selectOption({ label: "Groceries" });
  await page.getByLabel("Split 1 amount").fill("-60.00");
  await page.getByLabel("Split 2 category").selectOption({ label: "Shopping" });
  await page.getByLabel("Split 2 amount").fill("-40.00");
  await page.getByRole("button", { name: "Save splits" }).click();
  await expect(page.getByText("Splits saved.")).toBeVisible();
  await page.getByText("← Transactions").click();
  await expect(page.getByRole("article").filter({ hasText: purchase }).getByText("Split across 2 categories", { exact: false })).toBeVisible();

  const outgoing = `Card payment ${unique}`;
  const incoming = `Card credit ${unique}`;
  await createTransaction(currentAccount, outgoing, "-50.00", "expense");
  await createTransaction(cardAccount, incoming, "50.00", "income");
  await page.getByRole("article").filter({ hasText: outgoing }).getByRole("link", { name: "Edit" }).click();
  const destinationValue = await page.getByLabel("Destination transaction").locator("option").filter({ hasText: incoming }).getAttribute("value");
  expect(destinationValue).toBeTruthy();
  await page.getByLabel("Destination transaction").selectOption(destinationValue!);
  await page.getByRole("button", { name: "Mark as transfer" }).click();
  await expect(page.getByText("Transfer marked and linked.")).toBeVisible();
  await expect(page.getByText(`Linked to ${incoming}`, { exact: false })).toBeVisible();
});
