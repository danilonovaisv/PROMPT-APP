# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Ghost System PROMPT-APP: Critical Flows & A11y >> Flow 2 & 3: Prompt Creation and Editor Form A11y
- Location: tests/e2e/critical-flows.spec.ts:19:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Novo Template' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Novo Template' }).first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - link "Pular para o conteúdo" [ref=e4]:
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
    - main [active] [ref=e45]:
      - generic [ref=e47]:
        - generic [ref=e48]: Prompt App • Engenharia de Prompts
        - navigation "Links informativos" [ref=e49]:
          - link "Sobre" [ref=e50]:
            - /url: /sobre
          - link "Contato" [ref=e51]:
            - /url: /contato
          - link "Privacidade" [ref=e52]:
            - /url: /privacidade
          - link "GitHub" [ref=e53]:
            - /url: https://github.com/danilonovaisv/PROMPT-APP
  - status
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import AxeBuilder from '@axe-core/playwright';
  3  | 
  4  | test.describe('Ghost System PROMPT-APP: Critical Flows & A11y', () => {
  5  | 
  6  |   test('Flow 1: Auth / Initial Load Accessibility', async ({ page }) => {
  7  |     await page.goto('/');
  8  |     await expect(page.getByRole('heading', { name: 'Início', exact: true })).toBeVisible({ timeout: 10000 });
  9  |     
  10 |     // Verificar acessibilidade na página inicial (Dashboard)
  11 |     await new AxeBuilder({ page }).analyze();
  12 |     // expect(accessibilityScanResults.violations).toEqual([]);
  13 |     
  14 |     // Assegurar que os elementos críticos renderizaram com base em HomePage.tsx
  15 |     await expect(page.getByRole('heading', { name: 'Início', exact: true })).toBeVisible();
  16 |     await expect(page.locator(".hero__title")).toBeVisible();
  17 |   });
  18 | 
  19 |   test('Flow 2 & 3: Prompt Creation and Editor Form A11y', async ({ page }) => {
  20 |     await page.goto('/');
  21 |     
  22 |     // Clicar no botão "Novo Template" a partir da Home
  23 |     await page.getByRole('button', { name: 'Novo Template' }).click();
  24 |     
  25 |     // Aguardar navegação para o editor
  26 |     await expect(page).toHaveURL(/\/editor\/novo/);
  27 |     
  28 |     // Esperar um elemento do formulário para garantir que ele renderizou
> 29 |     await expect(page.getByRole("heading", { name: "Novo Template" }).first()).toBeVisible({ timeout: 10000 });
     |                                                                                ^ Error: expect(locator).toBeVisible() failed
  30 | 
  31 |     // Auditar acessibilidade no formulário do editor
  32 |     await new AxeBuilder({ page }).analyze();
  33 |     // expect(results.violations).toEqual([]);
  34 |     
  35 |     // Checar se as labels geradas têm o aria-describedby corretamente acoplado
  36 |     // Em EditorDefinitionForm, os textareas/inputs recebem ID dinâmico e o aria-describedby aponta para o ID de hint
  37 |     const systemRole = page.locator('textarea[name="systemRole"]');
  38 |     if (await systemRole.count() > 0) {
  39 |       await expect(systemRole).toHaveAttribute('aria-describedby');
  40 |     }
  41 |   });
  42 | 
  43 |   test('Flow 4: Offline Mode & Sync Behavior', async ({ page }) => {
  44 |     await page.goto('/');
  45 |     await expect(page.getByRole('heading', { name: 'Início', exact: true })).toBeVisible();
  46 |     
  47 |     // Navegar para editor e interagir; a UI não deve quebrar
  48 |     await page.goto('/editor/novo');
  49 |     // Simulando modo offline
  50 |     await page.context().setOffline(true);
  51 |     
  52 |     // Apenas validamos que um crash branco não ocorre e os componentes são exibidos
  53 |     await expect(page.locator("body")).toBeVisible();
  54 |     
  55 |     // Voltar online
  56 |     await page.context().setOffline(false);
  57 |   });
  58 | 
  59 |   test('Flow 5: Security Runtime / RLS Fallback', async ({ page }) => {
  60 |     await page.goto('/');
  61 |     
  62 |     // Simulando injeção de token corrompido para testar RLS no client (via fallback)
  63 |     await page.evaluate(() => {
  64 |       // supabase-js defaults to local storage keys based on project ref
  65 |       // we inject a dummy malformed item
  66 |       window.localStorage.setItem('sb-dummy-auth-token', 'invalid_token');
  67 |     });
  68 |     
  69 |     await page.reload();
  70 |     
  71 |     // A UI deve ser resiliente e lidar com isso, seja redirecionando
  72 |     // ou mantendo a camada offline/Dexie operante sem travar.
  73 |     await expect(page.locator('body')).toBeVisible();
  74 |   });
  75 | 
  76 | });
  77 | 
```