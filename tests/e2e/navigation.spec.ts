import { expect, test } from "@playwright/test";

test("should load the homepage", async ({ page }) => {
  await page.goto("/");

  // Verify page loads successfully
  await expect(page).toHaveTitle(/Prompt/);

  // Verify main content is visible (targeting the React app main)
  const mainHeading = page.locator(".app-main h1").first();
  await expect(mainHeading).toBeVisible();
});

test("should navigate to editor page", async ({ page }) => {
  await page.goto("/");

  // Find and click on 'Novo Template' button
  const editorBtn = page.getByRole('button', { name: /Novo Template/i });
  await expect(editorBtn).toBeVisible();
  await editorBtn.click();

  // Verify navigation to editor page (using Portuguese route)
  await expect(page).toHaveURL(/.*\/editor\/novo/);
});

test("should navigate to category manager page", async ({ page }) => {
  await page.goto("/");

  // Find and click on categories link in sidebar
  const categoriesLink = page.locator('.app-sidebar a[href="/categorias"]').first();
  await expect(categoriesLink).toBeVisible();
  await categoriesLink.click();

  // Verify navigation to categories page
  await expect(page).toHaveURL(/.*\/categorias/);
});

test("should navigate to menu manager page", async ({ page }) => {
  await page.goto("/");

  // Find and click on menus link in sidebar
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

  // Verify React app main content is visible on mobile
  const mainContent = page.locator(".app-main").first();
  await expect(mainContent).toBeVisible();
});
