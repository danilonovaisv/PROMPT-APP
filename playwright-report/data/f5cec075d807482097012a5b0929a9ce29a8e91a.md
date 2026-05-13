# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import-flow.spec.ts >> PROMPT-APP: Import Flow & Fixed Memory >> Import prompt with fixed_variables and verify UI state
- Location: tests/e2e/import-flow.spec.ts:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Dados e Backup' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - link "Pular para o conteúdo" [ref=e4] [cursor=pointer]:
      - /url: "#main-content"
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e7]
        - generic [ref=e10]: Prompt App
      - navigation [ref=e11]:
        - link "Início" [ref=e12] [cursor=pointer]:
          - /url: /
          - img [ref=e13]
          - text: Início
        - link "Categorias" [ref=e16] [cursor=pointer]:
          - /url: /categorias
          - img [ref=e17]
          - text: Categorias
        - link "Menus do Template" [ref=e19] [cursor=pointer]:
          - /url: /menus
          - img [ref=e20]
          - text: Menus do Template
        - generic [ref=e24]: Categorias
        - generic [ref=e25]: Ações
        - button "Nuvem Desconectada" [ref=e26] [cursor=pointer]:
          - img [ref=e27]
          - generic [ref=e31]: Nuvem Desconectada
          - img [ref=e32]
        - button "Importar Templates" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
          - text: Importar Templates
        - button "Exportar Todos" [ref=e39] [cursor=pointer]:
          - img [ref=e40]
          - text: Exportar Todos
      - generic [ref=e44]: Prompt App v3.0
    - main [ref=e45]:
      - generic [ref=e46]:
        - generic [ref=e47]:
          - heading "Início" [level=1] [ref=e48]
          - button "Novo Template" [ref=e50] [cursor=pointer]:
            - img [ref=e51]
            - text: Novo Template
        - generic [ref=e52]:
          - generic [ref=e53]:
            - img [ref=e55]
            - heading "Engenharia de Prompts" [level=1] [ref=e58]
            - paragraph [ref=e59]: Crie, organize e exporte templates estruturados para LLMs com menus e payload compilado.
          - generic [ref=e60]:
            - generic [ref=e61]:
              - generic [ref=e62]: "0"
              - generic [ref=e63]: Categorias
            - generic [ref=e64]:
              - generic [ref=e65]: "0"
              - generic [ref=e66]: Templates
          - generic [ref=e67]:
            - generic [ref=e68]:
              - heading "Categorias" [level=2] [ref=e69]
              - paragraph [ref=e70]: Clique em uma categoria para ver seus templates
            - button "Gerenciar" [ref=e71] [cursor=pointer]:
              - img [ref=e72]
              - text: Gerenciar
          - generic [ref=e74]:
            - generic [ref=e75]: 📂
            - heading "Nenhuma categoria" [level=3] [ref=e76]
            - paragraph [ref=e77]: Crie sua primeira categoria para começar a organizar seus templates.
            - button "Criar Categoria" [ref=e78] [cursor=pointer]
      - generic [ref=e79]:
        - generic [ref=e80]: Prompt App • Engenharia de Prompts
        - navigation "Links informativos" [ref=e81]:
          - link "Sobre" [ref=e82] [cursor=pointer]:
            - /url: /sobre
          - link "Contato" [ref=e83] [cursor=pointer]:
            - /url: /contato
          - link "Privacidade" [ref=e84] [cursor=pointer]:
            - /url: /privacidade
  - status
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('PROMPT-APP: Import Flow & Fixed Memory', () => {
  4  |   
  5  |   test('Import prompt with fixed_variables and verify UI state', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Wait for the app to load
  9  |     await expect(page.getByRole('heading', { name: 'Início', exact: true })).toBeVisible({ timeout: 15000 });
  10 | 
  11 |     // Open Import/Export Modal
  12 |     // The button is in the Header (Layout)
> 13 |     await page.getByRole('button', { name: 'Dados e Backup' }).click();
     |                                                                ^ Error: locator.click: Test timeout of 30000ms exceeded.
  14 |     
  15 |     // Wait for modal
  16 |     await expect(page.getByRole('dialog')).toBeVisible();
  17 |     
  18 |     const importData = {
  19 |       "meta": {
  20 |         "template_id": "e2e_test_fixed_memory",
  21 |         "template_name": "E2E Test Fixed Memory",
  22 |         "template_type": "test",
  23 |         "status": "active"
  24 |       },
  25 |       "fixed_variables": {
  26 |         "TEST_KEY": "TEST_VALUE",
  27 |         "ANOTHER_KEY": "ANOTHER_VALUE"
  28 |       },
  29 |       "prompt_definition": {
  30 |         "task": "Test prompt with {{TEST_KEY}} and {{ANOTHER_KEY}}"
  31 |       }
  32 |     };
  33 | 
  34 |     // Fill the textarea
  35 |     await page.locator('#json-import-input').fill(JSON.stringify(importData));
  36 |     
  37 |     // Click import button
  38 |     await page.getByRole('button', { name: 'Importar JSON colado' }).click();
  39 |     
  40 |     // Check for success toast or result message
  41 |     await expect(page.locator('.import-result--success')).toBeVisible();
  42 |     await expect(page.getByText('1 prompts importados')).toBeVisible();
  43 | 
  44 |     // Close modal
  45 |     await page.getByRole('button', { name: 'Fechar' }).click();
  46 |     
  47 |     // Navigate to the newly imported prompt
  48 |     // It should be in "Importados" category
  49 |     await page.getByText('Importados').click();
  50 |     
  51 |     // Wait for the prompt list in category page
  52 |     await expect(page.getByText('E2E Test Fixed Memory')).toBeVisible();
  53 |     
  54 |     // Click on the prompt to open editor
  55 |     await page.getByText('E2E Test Fixed Memory').click();
  56 |     
  57 |     // Verify we are in the editor
  58 |     await expect(page).toHaveURL(/\/editor\//);
  59 |     
  60 |     // Verify Fixed Memory section in EditorPlayground
  61 |     // Wait for the playground to load
  62 |     await expect(page.getByText('Memória Fixa')).toBeVisible();
  63 |     
  64 |     // Verify values exist in the Fixed Memory UI
  65 |     await expect(page.locator('input[value="TEST_KEY"]')).toBeVisible();
  66 |     await expect(page.locator('input[value="TEST_VALUE"]')).toBeVisible();
  67 |     await expect(page.locator('input[value="ANOTHER_KEY"]')).toBeVisible();
  68 |     await expect(page.locator('input[value="ANOTHER_VALUE"]')).toBeVisible();
  69 |     
  70 |     // Test compilation
  71 |     await expect(page.getByText('Test prompt with TEST_VALUE and ANOTHER_VALUE')).toBeVisible();
  72 |   });
  73 | });
  74 | 
```