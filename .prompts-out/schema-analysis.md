# Análise Técnica de Schemas — `promptSchema.ts`

**Origem:** `src/models/promptSchema.ts`  
**Data da Auditoria:** 2026-07-25  
**Autor:** Arquiteto Sênior de Templates PromptPP  

---

## 1. Visão Geral e Constantes do Sistema

As seguintes constantes fundamentais definem os valores padrão e enums do ecossistema PromptPP:

* **`DEFAULT_SCHEMA_VERSION`** (`line 3`): `"1.1.0"`
* **`DEFAULT_LANGUAGE`** (`line 4`): `"pt-BR"`
* **`DEFAULT_IMPORT_FORMAT`** (`line 5`): `"prompt-app-import"`
* **`DEFAULT_APP_NAME`** (`line 6`): `"Prompt App"`

### Enums Exportados

1. **`MENU_SELECTION_MODES`** (`line 8`): `["single", "multiple"]`
2. **`PROMPT_OUTPUT_FORMATS`** (`lines 9-15`): `["text", "markdown", "json", "image", "code"]`
3. **`TEMPLATE_STATUS`** (`line 16`): `["draft", "active", "archived"]`
4. **`MEMORY_ENTRY_TYPES`** (`line 17`): `["text"]`
5. **`MEMORY_ENTRY_SCOPES`** (`line 18`): `["user"]`
6. **`MEMORY_MERGE_STRATEGIES`** (`lines 19-24`): `["preserve_existing", "overwrite", "fill_empty", "skip"]`

---

## 2. Funções Auxiliares e Refinamentos (Refinements)

### `slugify(value: string)` (`lines 33-41`)
* Converte texto para minúsculas.
* Remove diacríticos/acentos via `.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`.
* Substitui caracteres não alfanuméricos por `_`.
* Remove underlines no início e fim, e colapsa múltiplos underlines.

### `uniqueArrayBy<T>(getKey: (item: T) => string, label: string)` (`lines 80-95`)
* Refinamento customizado (`ctx.addIssue`) executado via `.superRefine()`.
* Adiciona issue com `code: "custom"` e mensagem `${label} deve ser único` caso haja duplicidade de chave no array.

### `normalizeMemoryKey(value: string)` (`lines 59-61`)
* Executa `slugify(value.trim())` para garantir chaves de memória em formato slug canônico.

---

## 3. Especificação Detalhada dos Schemas Zod

### 3.1. `FewShotExampleSchema` (`lines 97-102`)
* **Tipo TS Derivado:** `FewShotExample` (`src/models/types.ts:80-83`)
* **Modo:** `.strict()`
* **Campos:**
  * `input` (`string`, `.trim()`, default: `""`) — Entrada de exemplo.
  * `output` (`string`, `.trim()`, default: `""`) — Saída esperada de exemplo.

### 3.2. `MenuSubOptionSchema` (`lines 104-110`)
* **Tipo TS Derivado:** `ContextMenuSubOption` (`src/models/types.ts:23-27`)
* **Modo:** `.strict()`
* **Campos:**
  * `label` (`string`, `.trim()`, default: `""`) — Rótulo de exibição da sub-opção.
  * `value` (`string`, `.trim()`, default: `""`) — Valor identificador da sub-opção.
  * `description` (`string`, `.trim()`, default: `""`) — Descrição detalhada da sub-opção.

### 3.3. `MenuOptionSchema` (`lines 112-122`)
* **Tipo TS Derivado:** `ContextMenuOption` (`src/models/types.ts:29-34`)
* **Modo:** `.strict()`
* **Campos:**
  * `label` (`string`, `.trim()`, default: `""`) — Rótulo da opção principal.
  * `value` (`string`, `.trim()`, default: `""`) — Valor identificador da opção principal.
  * `description` (`string`, `.trim()`, default: `""`) — Descrição da opção.
  * `sub_options` (`array(MenuSubOptionSchema)`, default: `[]`) — Lista de sub-opções.
  * **Refinement:** `.superRefine(uniqueArrayBy((item) => item.value, "Sub-option value"))` (`lines 119-120`).

### 3.4. `MenuDefinitionSchema` (`lines 124-136`)
* **Tipo TS Derivado:** `MenuDefinition` (`line 212`) / `ContextMenu` (`src/models/types.ts:36-48`)
* **Modo:** `.strict()`
* **Campos:**
  * `menu_id` (`string`, `.trim()`, `.min(1)`) — **Obrigatório**. Identificador único do menu.
  * `menu_name` (`string`, `.trim()`, `.min(1)`) — **Obrigatório**. Nome exibido do menu.
  * `description` (`string`, `.trim()`, default: `""`) — Descrição funcional do menu.
  * `selection_mode` (`z.enum(["single", "multiple"])`, default: `"single"`) — Modo de seleção do menu.
  * `required` (`boolean`, default: `false`) — Indica se a seleção neste menu é obrigatória.
  * `options` (`array(MenuOptionSchema)`, default: `[]`) — Lista de opções suportadas.
  * **Refinement:** `.superRefine(uniqueArrayBy((item) => item.value, "Option value"))` (`line 134`).

### 3.5. `TemplateMetaSchema` (`lines 138-147`)
* **Modo:** `.strict()`
* **Campos:**
  * `template_id` (`string`, `.trim()`, `.min(1)`) — **Obrigatório**. Identificador único do template.
  * `template_name` (`string`, `.trim()`, `.min(1)`) — **Obrigatório**. Nome do template.
  * `template_type` (`string`, `.trim()`, `.min(1)`) — **Obrigatório**. Tipo do template (ex: `"generic_prompt"`).
  * `schema_version` (`string`, `.trim()`, `.min(1)`, default: `"1.1.0"`) — Versão do contrato do schema.
  * `language` (`string`, `.trim()`, `.min(2)`, default: `"pt-BR"`) — Idioma do template.
  * `status` (`z.enum(["draft", "active", "archived"])`, default: `"draft"`) — Estado do template.

### 3.6. `PromptDefinitionSchema` (`lines 149-159`)
* **Modo:** `.strict()`
* **Campos:**
  * `system_role` (`string`, `.trim()`, default: `""`) — Papel/instrução de sistema (System Prompt).
  * `task` (`string`, `.trim()`, default: `""`) — Tarefa/Objetivo principal do prompt.
  * `context` (`string`, `.trim()`, default: `""`) — Contexto ou background de execução.
  * `user_scene_description` (`string`, `.trim()`, default: `""`) — Guia de instrução/cenário para o usuário final.
  * `constraints` (`array(string, .trim(), .min(1))`, default: `[]`) — Regras obrigatórias de comportamento.
  * `negative_prompt` (`array(string, .trim(), .min(1))`, default: `[]`) — Restrições/O que NÃO fazer.
  * `few_shot_examples` (`array(FewShotExampleSchema)`, default: `[]`) — Exemplos de entrada e saída.

### 3.7. `PromptOutputContractSchema` (`lines 161-171`)
* **Tipo TS Derivado:** `PromptOutputContract` (`line 300`)
* **Modo:** `.strict()`
* **Campos:**
  * `format` (`z.enum(["text", "markdown", "json", "image", "code"])`, default: `"markdown"`) — Formato esperado da resposta da IA.
  * `language` (`string`, `.trim()`, `.min(2)`, default: `"pt-BR"`) — Idioma da resposta.
  * `strict_mode` (`boolean`, default: `true`) — Força adesão estrita ao contrato.
  * `required_fields` (`array(string, .trim(), .min(1))`, default: `[]`) — Campos que devem constar na saída.
  * `response_rules` (`array(string, .trim(), .min(1))`, default: `[]`) — Regras de formatação da resposta.
  * `optional_enums` (`record(string, array(string, .trim(), .min(1)))`, opcional) — Enums opcionais de chave-valor de arrays de opções.

### 3.8. `PromptMemoryEntrySchema` (`lines 173-184`)
* **Tipo TS Derivado:** `PromptMemoryEntry` (`line 214`)
* **Modo:** `.strict()`
* **Campos:**
  * `key` (`string`, `.trim()`, `.min(1)`, `.transform(normalizeMemoryKey)`) — **Obrigatório**. Chave de memória normalizada como slug (ex: `"nome_empresa"`).
  * `label` (`string`, `.trim()`, `.min(1)`) — **Obrigatório**. Rótulo exibido na UI.
  * `value` (`string`, default: `""`) — Valor padrão ou pré-definido da memória.
  * `type` (`z.enum(["text"])`, default: `"text"`) — Tipo de dado da memória.
  * `scope` (`z.enum(["user"])`, default: `"user"`) — Escopo de armazenamento.
  * `required` (`boolean`, default: `false`) — Indica se o preenchimento é obrigatório antes da compilação.
  * `editable` (`boolean`, default: `true`) — Permite edição pelo usuário.
  * `description` (`string`, default: `""`) — Descrição de auxílio.

### 3.9. `PromptMemoryContextSchema` (`lines 186-195`)
* **Tipo TS Derivado:** `PromptMemoryContext` (`line 213`)
* **Modo:** `.strict()`
* **Campos:**
  * `enabled` (`boolean`, default: `true`) — Ativa/desativa suporte a variáveis de memória.
  * `merge_strategy` (`z.enum(["preserve_existing", "overwrite", "fill_empty", "skip"])`, default: `"preserve_existing"`) — Estratégia de mesclagem durante atualização.
  * `entries` (`array(PromptMemoryEntrySchema)`, default: `[]`) — Lista de entradas de memória.
  * **Refinement:** `.superRefine(uniqueArrayBy((item) => item.key, "Memory key"))` (`line 193`).

### 3.10. `TemplatePayloadSchema` / `PromptContractSchema` (`lines 197-209`, `line 305`)
* **Tipo TS Derivado:** `TemplatePayload` (`line 211`) / `PromptContract` (`line 299`)
* **Modo:** `.strict()`
* **Campos:**
  * `meta` (`TemplateMetaSchema`) — **Obrigatório**. Metadados do template.
  * `prompt_definition` (`PromptDefinitionSchema`) — **Obrigatório**. Definição do prompt.
  * `menu_definitions` (`array(MenuDefinitionSchema)`, default: `[]`) — Definições completas de menus incorporadas.
    * **Refinement:** `.superRefine(uniqueArrayBy((item) => item.menu_id, "Menu id"))` (`line 204`).
  * `menu_ids` (`array(string)`, default: `[]`) — Lista de IDs de menus associados.
  * `prompt_memory_context` (`PromptMemoryContextSchema`, opcional) — Contexto de memórias associadas.
  * `output_contract` (`PromptOutputContractSchema`) — **Obrigatório**. Contrato de formato de saída.

### 3.11. `ImportEnvelopeSchema` (`lines 359-368`)
* **Tipo TS Derivado:** `ImportEnvelope` (`line 370`)
* **Modo:** `.strict()`
* **Campos:**
  * `app` (`z.literal("Prompt App")`, default: `"Prompt App"`) — Nome do aplicativo emissor.
  * `version` (`string`, `.trim()`, `.min(1)`, default: `"3.0.0"`) — Versão da aplicação.
  * `format` (`z.literal("prompt-app-import")`, default: `"prompt-app-import"`) — Identificador canônico do formato.
  * `schemaVersion` (`string`, `.trim()`, `.min(1)`, default: `"1.1.0"`) — Versão do schema do arquivo.
  * `exportedAt` (`string`, `.trim()`, `.min(1)`) — **Obrigatório**. Timestamp ISO 8601 da exportação.
  * `context_menus` (`array(MenuDefinitionSchema)`, default: `[]`) — Coleção de menus de contexto exportados no envelope.
  * `prompts` (`array(TemplatePayloadSchema)`, default: `[]`) — Coleção de templates de prompt exportados no envelope.

---

## 4. Schemas Auxiliares de Execução e Compilação

### `UserSelectionSchema` (`lines 231-241`)
* **Tipo TS Derivado:** `UserSelection` (`line 243`)
* **Campos:** `template_id` (string), `selected_menus` (`array(SelectedMenuSchema)`), `free_inputs` (`record(string, string)`), `fixed_variables` (`record(string, string)`).

### `CompiledPromptPayloadSchema` (`lines 262-296`)
* **Tipo TS Derivado:** `CompiledPromptPayload` (`line 303`)
* **Campos:** `template_id`, `meta`, `compiled_context` (`menu_interpretation`, `free_inputs`, `fixed_variables`), `prompt_definition`, `output_contract`.

---

## 5. Resumo de Regras de Validação Estrita e Refinamentos

1. **`strict()`:** Todos os objetos do contrato utilizam `.strict()`. Qualquer propriedade extra/desconhecida não listada no schema provocará uma exceção de validação Zod.
2. **Unicidade de Elementos (`uniqueArrayBy`):**
   * Sub-opções: `item.value` único dentro da opção.
   * Opções: `item.value` único dentro do menu.
   * Menus: `item.menu_id` único no array de `menu_definitions`.
   * Memórias: `item.key` único no array de `entries`.
3. **Transformação Automática:**
   * `key` em `PromptMemoryEntrySchema` é automaticamente slugificado e limpo via `normalizeMemoryKey`.
