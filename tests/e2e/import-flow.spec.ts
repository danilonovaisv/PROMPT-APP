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
      "meta": {
        "template_id": "e2e_test_fixed_memory",
        "template_name": "E2E Test Fixed Memory",
        "template_type": "test",
        "status": "active",
      },
      "fixed_variables": {
        "TEST_KEY": "TEST_VALUE",
        "ANOTHER_KEY": "ANOTHER_VALUE",
      },
      "prompt_definition": {
        "task": "Test prompt with {{TEST_KEY}} and {{ANOTHER_KEY}}",
      },
    };

    // Fill the textarea
    await page.locator("#json-import-input").fill(JSON.stringify(importData));

    // Click import button
    await page.getByRole("button", { name: "Importar JSON colado" }).click();

    // Check for success toast or result message
    await expect(page.locator(".import-result--success")).toBeVisible();
    await expect(page.getByText("1 prompts importados")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Fechar" }).click();

    // Navigate to the newly imported prompt
    // It should be in "Importados" category
    await page.getByText("Importados").click();

    // Wait for the prompt list in category page
    await expect(page.getByText("E2E Test Fixed Memory")).toBeVisible();

    // Click on the prompt to open editor
    await page.getByText("E2E Test Fixed Memory").click();

    // Verify we are in the editor
    await expect(page).toHaveURL(/\/editor\//);

    // Verify Fixed Memory section in EditorPlayground
    // Wait for the playground to load
    await expect(page.getByText("Memória Fixa")).toBeVisible();

    // Verify values exist in the Fixed Memory UI
    await expect(page.locator('input[value="TEST_KEY"]')).toBeVisible();
    await expect(page.locator('input[value="TEST_VALUE"]')).toBeVisible();
    await expect(page.locator('input[value="ANOTHER_KEY"]')).toBeVisible();
    await expect(page.locator('input[value="ANOTHER_VALUE"]')).toBeVisible();

    // Test compilation
    await expect(
      page.getByText("Test prompt with TEST_VALUE and ANOTHER_VALUE"),
    ).toBeVisible();
  });
});
