# Mapeamento do Pipeline de Importação — `importService.ts`

**Origem:** `src/services/importService.ts`, `src/models/promptSchema.ts`  
**Data da Auditoria:** 2026-07-25  
**Autor:** Arquiteto Sênior de Templates PromptPP  

---

## 1. Visão Geral do Fluxo de Importação

O pipeline de importação é responsável por receber uma string JSON (ou arquivo `.json`), detectar seu formato, normalizar pseudônimos (aliases), sanitizar formatações inválidas, validar o conteúdo contra o schema Zod e persistir os menus, prompts e memórias no banco de dados IndexedDB (Dexie.js).

---

## 2. Etapas Detalhadas do Pipeline

```
[Entrada: Arquivo / String JSON]
       │
       ▼
1. Sanitização do JSON (`sanitizeJsonString`)
       │
       ▼
2. Análise do Formato de Origem (`detectImportFormat`)
       │
       ▼
3. Normalização Canônica do Envelope (`normalizeToCanonicalPayload`)
       │
       ▼
4. Normalização de Aliases do Template (`normalizeTemplatePayloadAliases`)
       │
       ▼
5. Normalização e Validação de Menus (`parseMenuDefinitions` + `normalizeRawMenu`)
       │
       ▼
6. Validação e Migração de Prompts (`parseTemplatePayload` + `migrateTemplateToCurrentSchema`)
       │
       ▼
7. Verificação de Integridade e Placeholders (`listMemoryPlaceholderKeys` + `planMemoryUpserts`)
       │
       ▼
8. Transação de Banco de Dados (`db.transaction`) & Backup Local (`saveLocalBackup`)
```

---

## 3. Detalhamento Técnico das Funções do Pipeline

### 3.1. `sanitizeJsonString(jsonStr: string): string` (`lines 116-140`)
* Remove caracteres invísiveis/BOM (`\u200B-\u200D\uFEFF`).
* Localiza o primeiro caracter de abertura (`{` ou `[`).
* Localiza o último caracter de fechamento correspondente (`}` ou `]`).
* Extrai o trecho limpo para evitar erros de sintaxe por wrappers inesperados.

### 3.2. `detectImportFormat(value: unknown): ImportSourceFormat` (`lines 174-215`)
Identifica o tipo de arquivo de entrada retornando um dos seguintes enums:
* `"legacy-prompt-array"`: Se o valor raiz for um Array (`Array.isArray(value)`).
* `"canonical-envelope"`: Se `value.format === 'prompt-app-import'`.
* `"legacy-bulk-export"`: Se possuir chave `prompts` em array e não for o envelope canônico.
* `"legacy-menu-import"`: Se possuir envelope de menu (`context_menus`, `contextMenus`, `menuDefinitions`, `menu_definitions`) e NÃO possuir estrutura de prompt.
* `"legacy-prompt-template"`: Se possuir formato individual de prompt (`meta`, `prompt_definition`, `system_role`, `task`, `input_data`).
* `"invalid"`: Caso não corresponda a nenhum dos padrões acima.

### 3.3. `normalizeToCanonicalPayload(parsed: unknown): CanonicalImportPayload` (`lines 217-348`)
Converte qualquer formato detectado para a estrutura unificada `CanonicalImportPayload`:
* Mapeia aliases das chaves de menu (`context_menus`, `contextMenus`, `menuDefinitions`, `menu_definitions`).
* Preenche metadados padrão: `app: "Prompt App"`, `version: "3.0.0"`, `format: "prompt-app-import"`, `schemaVersion: "1.1.0"`.

### 3.4. `normalizeTemplatePayloadAliases(rawPayload: unknown): unknown` (`promptSchema.ts:424-466`)
Executa a normalização profunda de chaves nos templates:
* `context_menus` / `contextMenus` / `menuDefinitions` ──► `menu_definitions`
* `menuIds` ──► `menu_ids`
* `memory_context` / `memory_entries` ──► `prompt_memory_context`

### 3.5. Tratamento de Estuturas Legadas em `parseTemplatePayload` (`promptSchema.ts:863-1053`)
Suporta dois formatos legados principais:
1. **Formato Direto com `input_data`:**
   * Mapeia `system_role`, `task`, `context` (ou `input_data.context`), `constraints`, `negative_prompt`, `output_schema` (mapeando `formato` e `estrutura`).
2. **Formato Orientado a Objetos Legado (`meta` + `role` + `objective` + `project` + `policies`):**
   * Mapeia `meta.name` ──► `title`
   * Mapeia `role.description` ──► `systemRole`
   * Mapeia `objective.task` ──► `task`
   * Mapeia `project.context` ──► `context`
   * Mapeia `policies.must` ──► `constraints`
   * Mapeia `policies.must_not` ──► `negativePrompt`
   * Mapeia `output_contract.response_rules` ──► `outputSchema.estrutura`

---

## 4. Regras Obrigatórias de Validação e Integridade

Durante a execução de `buildImportState` (`lines 410-660`), as seguintes validações são aplicadas obrigatoriamente:

1. **Extensão do Arquivo:** O nome do arquivo fonte deve terminar obrigatoriamente com `.json`.
2. **Unicidade de Menu ID:** `menu_id` de cada menu importado deve ser único dentro da coleção.
3. **Existência de Menus Referenciados:** Todos os `menu_ids` referenciados em um prompt devem existir previamente no banco ou estar presentes no arquivo de importação.
4. **Unicidade de Template ID:** `meta.template_id` não pode estar duplicado no arquivo importado.
5. **Placeholders de Memória vs. Definição:**
   * A função `listMemoryPlaceholderKeys` (`promptSchema.ts:468-493`) extrai todas as ocorrências da sintaxe `{{memory.nome_chave}}` nos campos de texto (`system_role`, `task`, `context`, `user_scene_description`, `constraints`, `negative_prompt`, `required_fields`, `response_rules`, `few_shot_examples`).
   * Se um placeholder for encontrado mas a chave correspondente NÃO constar em `prompt_memory_context.entries`, o sistema lança um erro de validação: `"Variável de memória obrigatória ausente para placeholder: {key}"`.

---

## 5. Mapeamento Completo de Erros e Mensagens de Exceção

| Código / Categoria | Campo Afetado | Mensagem Exata de Exceção / Erro | Origem |
| :--- | :--- | :--- | :--- |
| `processing` | `general` | `"Apenas arquivos .json são aceitos"` | `importService.ts:420` |
| `processing` | `general` | `"Erro ao analisar JSON"` / `{mensagem_do_syntax_error}` | `importService.ts:453` |
| `validation` | `general` | `"Formato de importação inválido ou não reconhecido"` | `importService.ts:486` |
| `conflict` | `context_menus[N].menu_id` | `"Menu id deve ser único"` | `importService.ts:501` |
| `validation` | `prompts[N].menu_ids` | `"Menu inexistente referenciado: {menuId}"` | `importService.ts:542` |
| `conflict` | `prompts[N].meta.template_id` | `"template_id duplicado no arquivo importado"` | `importService.ts:561` |
| `validation` | `prompts[N].prompt_memory_context.entries` | `"Variável de memória obrigatória ausente para placeholder: {key}"` | `importService.ts:576` |
| `validation` | `context_menus[N]` | `Message gerada pelo ZodError em MenuDefinitionSchema` | `importService.ts:363` |
| `validation` | `prompts[N]` | `Message gerada pelo ZodError em TemplatePayloadSchema` | `importService.ts:598` |
| `runtime` | — | `"O menu obrigatório \"{menu_name}\" precisa de pelo menos uma seleção."` | `promptSchema.ts:754` |
| `runtime` | — | `"Memória obrigatória ausente: {keys}"` | `promptSchema.ts:1099` |
