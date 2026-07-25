# Output Format Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand PROMPT-APP output formats (texto/json/markdown/imagem/code), add optional URL field, and remove Few-Shot from the base template with strong validation and tests.

**Architecture:** Centralize output format enum + Zod schema in `src/models/outputSchema.ts`, reuse it across UI, persistence, and import/export. Map legacy formats to default `markdown` without breaking existing data. URL is stored as `referenceUrl` inside prompts and forwarded to `input_data.reference_url` in exports.

**Tech Stack:** React 19 + VITE, Dexie, Jest, Zod, TypeScript.

---

### Task 1: Introduzir enum/schema único para formatos e URL sanitization

**Files:**

- Create: `src/models/outputSchema.ts`
- Modify: `src/models/types.ts`, `src/models/types.d.ts`, `src/utils/exportJson.ts`
- Tests: `tests/outputSchema.test.ts`

**Steps:**

1) Escrever Zod schema `OutputFormatSchema` (texto/json/markdown/imagem/code) + `DEFAULT_OUTPUT_FORMAT = 'markdown'`.
2) Implementar helpers `normalizeOutputSchema` e `sanitizeUrlField` (trim, URL constructor, max length, return undefined se vazio/ inválido).
3) Exportar types derivados para uso global (OutputFormat, OutputSchemaDTO).
4) Adicionar teste RED para `normalizeOutputSchema` (unknown → markdown, imagem/code aceitos) e `sanitizeUrlField` (trim + rejeita inválido).

### Task 2: Atualizar modelo de dados e payloads

**Files:**

- Modify: `src/models/types.ts`, `src/models/types.d.ts`, `src/db/database.ts`
- Modify: `src/services/importService.ts`, `src/services/supabasePrompts.ts`, `src/services/realtimeService.ts`, `src/services/assetManager.ts`, `src/services/syncService.ts`
- Tests: extend `tests/outputSchema.test.ts`

**Steps:**

1) Incluir `referenceUrl?: string` em `Prompt` e `PromptExportFormat` (`input_data.reference_url`).
2) Substituir unions de formato hardcoded pelo `OutputFormat` derivado do schema.
3) Aplicar `normalizeOutputSchema` + `sanitizeUrlField` ao carregar/salvar (import/export/sync) garantindo fallback markdown.
4) Ajustar tipos e defaults em serviços (realtime/asset/sync) para aceitar novos campos sem quebrar legacy.
5) RED test para garantir export inclui `reference_url` e novo formato.

### Task 3: UI - seletor de formato + campo URL + remoção Few-Shot

**Files:**

- Modify: `src/pages/EditorPage.tsx`, `src/index.css`
- Modify: `src/utils/exportJson.ts` (preview consistency)

**Steps:**

1) Substituir select por opções derivadas de `OUTPUT_FORMATS` (5 itens) com helper text contextual.
2) Adicionar input opcional `URL de referência` com validação onBlur/submit (usa `sanitizeUrlField`; exibir erro acessível).
3) Remover bloco “Exemplos (Few-Shot)” da UI e `EMPTY_PROMPT` passa a iniciar com `fewShotExamples: []` (mas preserva dados existentes ao carregar).
4) Garantir preview JSON/clipboard usa schema normalizado.
5) Ajustar estilos se necessário após remover seção.

### Task 4: Template/Export - formato por formato

**Files:**

- Modify: `src/utils/exportJson.ts`, `src/components/ImportExportModal.tsx`, `src/utils/exportJson.d.ts`
- Modify: `src/services/importService.ts` (parsing)
- Modify: `src/pages/CategoryPage.tsx` (copy flow stays consistent)

**Steps:**

1) Incluir `reference_url` em `toExportFormat` e `getTemplateFile` (default vazio), mantendo compatibilidade.
2) Definir regras de estrutura por formato (texto/markdown/json/imagem/code) na descrição/estrutura exportada quando vazia (helper `getFormatHint`).
3) Mapear formatos legacy (`texto/json/markdown`) via `normalizeOutputSchema`.
4) Atualizar import para aceitar novos formatos e ignorar `few_shot_examples` sem crash.

### Task 5: Documentação + Context7 MCP entry

**Files:**

- Modify: `README.md`
- Create: `.agents/MCPs-uteis.curated-config.json` (adicionar context7 entry, não remover futuros existentes)
- Modify: `docs/PLAN.md` if references? (only if needed)

**Steps:**

1) Atualizar tabela de campos e seção de formatos/URL/remover Few-Shot.
2) Documentar regra de saída por formato + URL (sem fetch automático).
3) Adicionar entrada Context7 MCP (stub) com comentário explicando uso para templates.

### Task 6: Testes (unit + e2e-lite) e verificação

**Files:**

- Create: `tests/outputSchema.test.ts`
- Modify: `tests/normalizeFewShot.test.ts`? (ensure still passes post removal defaults)
- Possibly update `tsconfig.spec.json` if paths needed

**Steps:**

1) RED: testes para `normalizeOutputSchema`, `sanitizeUrlField`, e `toExportFormat` gerando payload com reference_url e cada formato.
2) GREEN: implementar código até testes passarem.
3) Rodar `pnpm test` e capturar saída.

---
