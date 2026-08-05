# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import-flow.spec.ts >> PROMPT-APP: Import Flow & Fixed Memory >> Import prompt with fixed_variables and verify UI state
- Location: tests/e2e/import-flow.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('label').filter({ hasText: 'TEST_KEY' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('label').filter({ hasText: 'TEST_KEY' })

```

```yaml
- link "Pular para o conteúdo":
  - /url: "#main-content"
- complementary:
  - text: Prompt App
  - navigation:
    - link "Início":
      - /url: /
    - link "Categorias":
      - /url: /categorias
    - link "Menus do Template":
      - /url: /menus
    - text: Categorias
    - link "📥 Importados 1":
      - /url: /categoria/1
    - text: Ações
    - button "Nuvem indisponível" [disabled]
    - paragraph: Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
    - button "Importar Templates"
    - button "Exportar Todos"
  - text: Prompt App v3.0
- main:
  - status:
    - strong: Supabase não configurado.
    - text: Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Recursos em nuvem permanecem desativados.
  - button "Voltar"
  - heading "E2E Test Fixed Memory" [level=1]
  - text: Rascunho salvo às 01:20 PM
  - button "Foco"
  - button "Copiar"
  - button "Baixar"
  - button "Salvar"
  - button "Modo Foco"
  - button "Playground" [expanded]
  - navigation "Breadcrumb":
    - list:
      - listitem:
        - link "Início":
          - /url: /
      - listitem:
        - link "Importados":
          - /url: /categoria/1
      - listitem: E2E Test Fixed Memory
  - heading "Metadados do Template" [level=3]
  - text: Nome do template
  - textbox "Nome do template":
    - /placeholder: "Ex: Gerador de Cenas Publicitárias"
    - text: E2E Test Fixed Memory
  - text: Nome exibido nas listagens e no breadcrumb. ID do template
  - textbox "ID do template":
    - /placeholder: scene_generator_v1
    - text: e2e_test_fixed_memory
  - text: Identificador único. Gerado automaticamente se vazio. Tipo
  - textbox "Tipo":
    - /placeholder: scene_generation
    - text: generic_prompt
  - text: Categoria
  - combobox "Categoria":
    - option "Selecione uma categoria"
    - option "📥 Importados" [selected]
  - text: Categoria usada para organizar o template na biblioteca principal. Idioma
  - textbox "Idioma":
    - /placeholder: pt-BR
    - text: pt-BR
  - text: "Ex: pt-BR, en-US Schema version"
  - textbox "Schema version":
    - /placeholder: 1.1.0
    - text: 1.1.0
  - text: Status
  - combobox "Status":
    - option "draft"
    - option "active" [selected]
    - option "archived"
  - group "Definição do Prompt":
    - text: Definição do Prompt
    - heading "Núcleo do Prompt" [level=3]
    - text: System role
    - textbox "System role":
      - /placeholder: Defina o papel do modelo
    - text: Defina o papel e a especialidade que o modelo deve assumir neste template. Task
    - textbox "Task":
      - /placeholder: Descreva a tarefa principal
      - text: "Test prompt with {{TEST_KEY}} and {{ANOTHER_KEY}}"
    - text: Explique a entrega principal esperada para o template. User Scene Description
    - textbox "User Scene Description":
      - /placeholder: Descreva a cena de usuário
    - text: Descreva o cenário do usuário em que o template será usado (Campo obrigatório). Context
    - textbox "Context":
      - /placeholder: Explique o contexto do template
    - text: Registre premissas, cenário de uso e informações de apoio para a resposta.
    - heading "Guardrails & Menus" [level=3]
    - text: Constraints
    - textbox "Constraints":
      - /placeholder: Digite uma restrição e pressione Enter
    - button "Adicionar"
    - text: Liste limites, critérios e guardrails. Negative prompt
    - textbox "Negative prompt":
      - /placeholder: Digite uma proibição e pressione Enter
    - button "Adicionar"
    - text: Informe o que a resposta deve evitar.
    - group "Exemplos de Resposta (Few-shot) — preencha os campos antes de salvar":
      - text: Exemplos de Resposta (Few-shot) — preencha os campos antes de salvar
      - button "Adicionar novo exemplo de few-shot": Novo exemplo
  - group "Output Contract":
    - text: Output Contract
    - heading "Configurações de Saída" [level=3]
    - text: Format
    - combobox "Format":
      - option "text" [selected]
      - option "json"
      - option "xml"
      - option "yaml"
      - option "html"
      - option "code"
    - text: Defina o formato final esperado para a resposta compilada. Response language
    - textbox "Response language":
      - /placeholder: pt-BR
      - text: pt-BR
    - text: Idioma preferencial da resposta final gerada pelo template.
    - checkbox "Strict mode" [checked]
    - text: Strict mode Required fields
    - textbox "Required fields":
      - /placeholder: Um campo obrigatório por linha
    - text: Informe os campos que devem existir na resposta, um item por linha. Response rules
    - textbox "Response rules":
      - /placeholder: Uma regra por linha
    - text: Liste regras obrigatórias de formatação e comportamento, uma por linha.
  - button "Cancelar"
  - button "Salvar Template"
  - complementary "Painel lateral do playground":
    - heading "Playground" [level=3]
    - button "Fechar Playground"
    - heading "Inputs Livres" [level=3]
    - paragraph: Variáveis específicas para este teste.
    - text: Chave
    - textbox "user_scene_description"
    - text: Valor
    - textbox "Descreva o input livre"
    - button "Remover input livre"
    - button "Novo input livre"
    - heading "Memória Fixa" [level=4]
    - paragraph:
      - text: Estes valores ficam vinculados ao template
      - strong: E2E Test Fixed Memory
      - text: e preenchem variáveis fixas sempre que este template for usado. Eles não são globais entre templates.
    - paragraph: Nenhuma chave fixa definida para este template. Adicione apenas os campos que precisam ser preenchidos sempre neste contexto.
    - button "Adicionar Chave Fixa"
    - paragraph: Vincule menus na seção acima para testar a compilação.
    - heading "Prompt compilado" [level=4]
    - text: "## CONTEXT Task: Test prompt with {{TEST_KEY}} and {{ANOTHER_KEY}} ## OUTPUT FORMAT - Formato: markdown - Idioma: pt-BR - Modo estrito: sim 140 caracteres • 22 palavras • ~35 tokens"
  - button "Alternar Playground" [expanded]
  - button "Preview"
  - button "Copiar"
  - button "Salvar"
  - text: Prompt App • Engenharia de Prompts
  - navigation "Links informativos":
    - link "Sobre":
      - /url: /sobre
    - link "Contato":
      - /url: /contato
    - link "Privacidade":
      - /url: /privacidade
- status
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  |
  3  | test.describe("PROMPT-APP: Import Flow & Fixed Memory", () => {
  4  |   test("Import prompt with fixed_variables and verify UI state", async ({ page }) => {
  5  |     await page.goto("/");
  6  |
  7  |     // Wait for the app to load
  8  |     await expect(page.getByRole("heading", { name: "Início", exact: true }))
  9  |       .toBeVisible({ timeout: 15000 });
  10 |
  11 |     // Open Import/Export Modal
  12 |     // The button is in the Header (Layout)
  13 |     await page.getByRole("button", { name: "Importar Templates" }).click();
  14 |
  15 |     // Wait for modal
  16 |     await expect(page.getByRole("dialog")).toBeVisible();
  17 |
  18 |     const importData = {
  19 |       "title": "E2E Test Fixed Memory",
  20 |       "task": "Test prompt with {{TEST_KEY}} and {{ANOTHER_KEY}}",
  21 |       "fixed_variables": {
  22 |         "TEST_KEY": "TEST_VALUE",
  23 |         "ANOTHER_KEY": "ANOTHER_VALUE",
  24 |       },
  25 |     };
  26 |
  27 |     // Fill the textarea
  28 |     await page.locator("#json-import-input").fill(JSON.stringify(importData));
  29 |
  30 |     // Click Analyze JSON button
  31 |     await page.getByRole("button", { name: "Analisar JSON" }).click();
  32 |
  33 |     // Click Confirm Import button
  34 |     await page.getByRole("button", { name: "Confirmar Importação" }).click();
  35 |
  36 |     // Check for success toast or result message
  37 |     await expect(page.locator(".import-result--success")).toBeVisible();
  38 |     await expect(page.getByText("✓ 1 prompt(s) processado(s)")).toBeVisible();
  39 |
  40 |     // Close modal
  41 |     await page.locator(".modal-overlay > div > .modal-header > .btn-icon").click();
  42 |
  43 |     // Navigate to the newly imported prompt
  44 |     // It should be in "Importados" category
  45 |     await page.getByText("Importados", { exact: true }).click();
  46 |
  47 |     // Wait for the prompt list in category page
  48 |     await expect(page.getByText("E2E Test Fixed Memory")).toBeVisible();
  49 |
  50 |     // Click on the prompt to open editor
  51 |     await page.getByText("E2E Test Fixed Memory").click();
  52 |
  53 |     // Verify we are in the editor
  54 |     await expect(page).toHaveURL(/\/editor\//);
  55 |
  56 |     // Verify Fixed Memory section in EditorPlayground
  57 |     // Wait for the playground to load
  58 |     await expect(page.getByText("Memória Fixa")).toBeVisible();
  59 |
> 60 |     await expect(page.locator("label", { hasText: "TEST_KEY" })).toBeVisible();
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  61 |     await expect(page.getByRole("textbox", { name: "TEST_KEY" })).toHaveValue("TEST_VALUE");
  62 |     await expect(page.locator("label", { hasText: "ANOTHER_KEY" })).toBeVisible();
  63 |     await expect(page.getByRole("textbox", { name: "ANOTHER_KEY" })).toHaveValue("ANOTHER_VALUE");
  64 |
  65 |     // Test compilation
  66 |     await expect(
  67 |       page.getByText("Test prompt with TEST_VALUE and ANOTHER_VALUE"),
  68 |     ).toBeVisible();
  69 |   });
  70 | });
  71 |
```