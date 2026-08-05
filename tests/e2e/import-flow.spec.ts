import { expect, test } from "@playwright/test";

test.describe("PROMPT-APP: Import Flow & Fixed Memory", () => {
  test("Import prompt with fixed_variables and verify UI state", async ({ page }) => {
    await page.goto("/");

    // Wait for the app to load
    await expect(page.getByRole("heading", { name: "Início", exact: true }))
      .toBeVisible({ timeout: 15000 });

    // Open Import/Export Modal
    // The button is in the Header (Layout)
    await page.getByRole("button", { name: "Importar Templates" }).click();

    // Wait for modal
    await expect(page.getByRole("dialog")).toBeVisible();

    const importData = {
      "title": "E2E Test Fixed Memory",
      "task": "Test prompt with {{TEST_KEY}} and {{ANOTHER_KEY}}",
      "fixed_variables": {
        "TEST_KEY": "TEST_VALUE",
        "ANOTHER_KEY": "ANOTHER_VALUE",
      },
    };

    // Fill the textarea
    await page.locator("#json-import-input").fill(JSON.stringify(importData));

    // Click Analyze JSON button
    await page.getByRole("button", { name: "Analisar JSON" }).click();

    // Click Confirm Import button
    await page.getByRole("button", { name: "Confirmar Importação" }).click();

    // Check for success toast or result message
    await expect(page.locator(".import-result--success")).toBeVisible();
    await expect(page.getByText("✓ 1 prompt(s) processado(s)")).toBeVisible();

    // Close modal
    await page.locator(".modal-overlay > div > .modal-header > .btn-icon").click();

    // Navigate to the newly imported prompt
    // It should be in "Importados" category
    await page.getByText("Importados", { exact: true }).click();

    // Wait for the prompt list in category page
    await expect(page.getByText("E2E Test Fixed Memory")).toBeVisible();

    // Click on the prompt to open editor
    await page.getByText("E2E Test Fixed Memory").click();

    // Verify we are in the editor
    await expect(page).toHaveURL(/\/editor\//);

    // Verify Fixed Memory section in EditorPlayground
    // Wait for the playground to load
    await expect(page.getByText("Memória Fixa")).toBeVisible();

    await expect(page.locator("label", { hasText: "TEST_KEY" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "TEST_KEY" })).toHaveValue("TEST_VALUE");
    await expect(page.locator("label", { hasText: "ANOTHER_KEY" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "ANOTHER_KEY" })).toHaveValue("ANOTHER_VALUE");

    // Test compilation
    await expect(
      page.getByText("Test prompt with TEST_VALUE and ANOTHER_VALUE"),
    ).toBeVisible();
  });
});
