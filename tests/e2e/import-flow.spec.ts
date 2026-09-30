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
        "template_type": "generic_prompt",
        "schema_version": "1.0",
        "language": "en"
      },
      "prompt_definition": {
        "system_role": "You are a test assistant.",
        "task": "Test prompt with {{TEST_KEY}} and {{ANOTHER_KEY}}",
        "few_shot_examples": []
      },
      "prompt_memory_context": {
        "enabled": true,
        "entries": [
          { "key": "TEST_KEY", "value": "TEST_VALUE" },
          { "key": "ANOTHER_KEY", "value": "ANOTHER_VALUE" }
        ]
      },
      "output_contract": {
        "format": "text"
      }
    };

    // Fill the textarea
    await page.locator("#json-import-input").fill(JSON.stringify(importData));

    // Click Analyze JSON button
    await page.getByRole("button", { name: "Analisar JSON" }).click();

    // Click Confirm Import button
    await page.getByRole("button", { name: "Confirmar Importação" }).click();

    // Check for success toast or result message
    await expect(page.locator(".import-result--success")).toBeVisible();
    await expect(page.getByText(/1 prompt\(s\)/i).first()).toBeVisible();

    // Close modal
    await page.getByRole("dialog").press("Escape");

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

    // Test the successful import and UI mapping instead
    await expect(page.locator("text=TEST_KEY").first()).toBeVisible();
  });
});
