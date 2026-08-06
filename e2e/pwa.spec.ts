import { expect, test } from "@playwright/test";

test("exposes an installable manifest and a private offline fallback", async ({ context, page, request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({ name: "SafeSpend", start_url: "/dashboard", display: "standalone" });
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);

  await page.goto("/dashboard");
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await context.setOffline(true);
  await page.goto("/transactions");
  await expect(page).toHaveTitle("SafeSpend is offline");
  await expect(page.getByRole("heading", { name: "You’re offline" })).toBeVisible();
  await expect(page.getByText("Safe to spend for the rest of this month")).toHaveCount(0);

  await context.setOffline(false);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page).toHaveURL(/\/transactions/);
  await expect(page.getByRole("heading", { name: "Money in and out" })).toBeVisible();
});

test("provides accessible installed-app navigation on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(navigation).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }))).toEqual({ documentWidth: 390, viewportWidth: 390 });
  await expect(navigation.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

  await navigation.getByRole("button", { name: "More" }).click();
  const more = page.getByRole("menu", { name: "More navigation" });
  await expect(more).toBeVisible();
  await more.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings/);
  await expect(page.getByRole("heading", { name: "Install SafeSpend" })).toBeVisible();
  await expect(navigation.getByRole("button", { name: "More" })).toHaveClass(/text-primary/);
});

test("closes the mobile More menu with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const moreButton = page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "More" });
  await moreButton.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "More navigation" })).toHaveCount(0);
  await expect(moreButton).toBeFocused();
});
