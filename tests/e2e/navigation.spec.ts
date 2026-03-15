import { expect, test } from "@playwright/test";

test("should load the homepage", async ({ page }) => {
  await page.goto("/");

  // Verify page loads successfully
  await expect(page).toHaveTitle(/Prompt/);

  // Verify main content is visible
  const mainHeading = page.locator("h1").first();
  await expect(mainHeading).toBeVisible();
});

test("should navigate to editor page", async ({ page }) => {
  await page.goto("/");

  // Find and click on editor link/button
  const editorLink = page.locator('button:has-text("Novo Template")').first();
  await expect(editorLink).toBeVisible();
  await editorLink.click();

  // Verify navigation to editor page
  await expect(page).toHaveURL(/.*\/editor\/novo/);
});

test("should navigate to category manager page", async ({ page }) => {
  await page.goto("/");

  // Find and click on categories link
  const categoriesLink = page.locator('.app-sidebar a[href="/categorias"]').first();
  await expect(categoriesLink).toBeVisible();
  await categoriesLink.click();

  // Verify navigation to categories page
  await expect(page).toHaveURL(/.*\/categorias/);
});

test("should navigate to menu manager page", async ({ page }) => {
  await page.goto("/");

  // Find and click on menus link
  const menusLink = page.locator('.app-sidebar a[href="/menus"]').first();
  await expect(menusLink).toBeVisible();
  await menusLink.click();

  // Verify navigation to menus page
  await expect(page).toHaveURL(/.*\/menus/);
});

test("should display responsive layout on mobile", async ({ page }) => {
  // Set viewport to mobile size
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/");

  // Verify page is responsive and visible
  const mainContent = page.locator("main.app-main").first();
  await expect(mainContent).toBeVisible();
});
