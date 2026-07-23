import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("downloads exports and restores a guarded database backup", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Data and recovery" })).toBeVisible();

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export transactions" }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/^safespend-transactions-\d{4}-\d{2}-\d{2}\.csv$/);

  const backupDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download backup" }).click();
  const backupDownload = await backupDownloadPromise;
  expect(backupDownload.suggestedFilename()).toMatch(/^safespend-\d{4}-\d{2}-\d{2}-backup\.db$/);
  const backupPath = await backupDownload.path();
  expect(backupPath).toBeTruthy();

  const marker = `Restore marker ${Date.now()}`;
  await page.goto("/accounts/new");
  await page.getByLabel("Account name").fill(marker);
  await page.getByLabel("Current balance").fill("1.00");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Account created.")).toBeVisible();

  await page.goto("/settings");
  await page.getByLabel("SafeSpend database backup").setInputFiles({ name: backupDownload.suggestedFilename(), mimeType: "application/vnd.sqlite3", buffer: readFileSync(backupPath!) });
  await page.getByLabel("Type RESTORE to confirm").fill("RESTORE");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Restore database" }).click();
  await expect(page.getByText("Database restored successfully.")).toBeVisible();

  await page.goto("/accounts");
  await expect(page.getByText(marker)).toHaveCount(0);
});
