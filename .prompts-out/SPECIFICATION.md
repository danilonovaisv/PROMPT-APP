# ESPECIFICAÇÃO TÉCNICA OFICIAL DO PROMPT TEMPLATE (PromptPP)

**Versão da Especificação:** 1.1.0  
**Data da Auditoria:** 2026-07-25  
**Autor:** Arquiteto Sênior de Templates PromptPP  
**Status:** Especificação Oficial Definitiva baseada na Implementação Existente  

---

## 1. INTRODUÇÃO E ESCOPO

Este documento estabelece o contrato técnico verdadeiro e exaustivo para **Prompt Templates** e **Envelopes de Importação** no ecossistema **PromptPP**.

A especificação foi extraída diretamente do código-fonte da aplicação (`src/models/promptSchema.ts`, `src/services/importService.ts`, `src/utils/menuValidation.ts` e `public/PROMPT-TEMPLATE.json`). Ela serve como fonte única de verdade técnica para qualquer agente, ferramenta ou desenvolvedor que necessite produzir ou consumir templates compatíveis com o PromptPP.

---

## 2. ESTRUTURA DO ENVELOPE DE IMPORTAÇÃO (`ImportEnvelope`)

Todo arquivo ou payload de importação pode ser empacotado sob o envelope canônico `ImportEnvelopeSchema` (`src/models/promptSchema.ts:359-368`).

```json
{
  "app": "Prompt App",
  "version": "3.0.0",
  "format": "prompt-app-import",
  "schemaVersion": "1.1.0",
  "exportedAt": "2026-07-25T20:15:19.000Z",
  "context_menus": [],
  "prompts": []
}
```

### 2.1. Campos do Envelope

1. **`app`** (`string`, Literal: `"Prompt App"`, Default: `"Prompt App"`)
   * **Descrição:** Nome da aplicação de origem.
   * **Origem:** `promptSchema.ts:360`
2. **`version`** (`string`, Min length: 1, Default: `"3.0.0"`)
   * **Descrição:** Versão do software que gerou o export.
   * **Origem:** `promptSchema.ts:361`
3. **`format`** (`string`, Literal: `"prompt-app-import"`, Default: `"prompt-app-import"`)
   * **Descrição:** Identificador canônico do formato de importação.
   * **Origem:** `promptSchema.ts:362`
4. **`schemaVersion`** (`string`, Min length: 1, Default: `"1.1.0"`)
   * **Descrição:** Versão do schema de metadados.
   * **Origem:** `promptSchema.ts:363`
5. **`exportedAt`** (`string`, Min length: 1, **OBRIGATÓRIO**)
   * **Descrição:** Data/hora de exportação no formato ISO 8601 UTC.
   * **Origem:** `promptSchema.ts:364`
6. **`context_menus`** (`Array<MenuDefinition>`, Default: `[]`)
   * **Descrição:** Coleção de menus de contexto compartilhados entre os prompts do envelope.
   * **Origem:** `promptSchema.ts:365`
7. **`prompts`** (`Array<TemplatePayload>`, Default: `[]`)
   * **Descrição:** Coleção de Prompt Templates contidos no envelope.
   * **Origem:** `promptSchema.ts:366`

---

## 3. ESPECIFICAÇÃO DO PROMPT TEMPLATE (`TemplatePayload` / `PromptContract`)

O payload de um Prompt Template é o objeto principal contido na chave `prompts` (ou importado individualmente). O schema é estrito (`.strict()`) e composto por 6 seções primárias:

---

### 3.1. Seção `meta` (`TemplateMetaSchema`)

Contém os metadados de identificação do template.

| Campo | Tipo | Obrigatoriedade | Default | Descrição / Validação | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `template_id` | `string` | **Obrigatório** | — | Min: 1. Identificador único do template (slug). | `promptSchema.ts:140` |
| `template_name` | `string` | **Obrigatório** | — | Min: 1. Nome legível do template exibido na UI. | `promptSchema.ts:141` |
| `template_type` | `string` | **Obrigatório** | — | Min: 1. Categoria/Tipo (ex: `"generic_prompt"`). | `promptSchema.ts:142` |
| `schema_version` | `string` | Opcional | `"1.1.0"` | Min: 1. Versão do schema do template. | `promptSchema.ts:143` |
| `language` | `string` | Opcional | `"pt-BR"` | Min: 2. Idioma base do template. | `promptSchema.ts:144` |
| `status` | `enum` | Opcional | `"draft"` | Valores permitidos: `"draft"`, `"active"`, `"archived"`. | `promptSchema.ts:145` |

---

### 3.2. Seção `prompt_definition` (`PromptDefinitionSchema`)

Define a estrutura de prompt estruturado e instrução de sistema.

| Campo | Tipo | Obrigatoriedade | Default | Descrição / Validação | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `system_role` | `string` | Opcional | `""` | Instrução de sistema (System Prompt / Persona). | `promptSchema.ts:151` |
| `task` | `string` | Opcional | `""` | Instrução de tarefa/objetivo principal. | `promptSchema.ts:152` |
| `context` | `string` | Opcional | `""` | Background ou contexto do problema. | `promptSchema.ts:153` |
| `user_scene_description` | `string` | Opcional | `""` | Guia de instruções exibido para o usuário final. | `promptSchema.ts:154` |
| `constraints` | `Array<string>` | Opcional | `[]` | Lista de diretrizes obrigatórias (`min(1)` por item). | `promptSchema.ts:155` |
| `negative_prompt` | `Array<string>` | Opcional | `[]` | Lista de restrições ("O que NÃO fazer"). | `promptSchema.ts:156` |
| `few_shot_examples` | `Array<FewShot>` | Opcional | `[]` | Lista de objetos `{ input: string, output: string }`. | `promptSchema.ts:157` |

---

### 3.3. Seção `menu_definitions` (`Array<MenuDefinitionSchema>`)

Coleção de menus de contexto dinâmicos incorporados diretamente ao template.

#### Estrutura de Cada `MenuDefinition`:
* **`menu_id`** (`string`, **Obrigatório**, Min: 1): Identificador único do menu.
* **`menu_name`** (`string`, **Obrigatório**, Min: 1): Nome do menu exibido na UI.
* **`description`** (`string`, Default: `""`): Descrição funcional.
* **`selection_mode`** (`enum`, Default: `"single"`): Modo de seleção (`"single"` ou `"multiple"`).
* **`required`** (`boolean`, Default: `false`): Torna a seleção obrigatória antes da compilação.
* **`options`** (`Array<MenuOption>`, Default: `[]`): Lista de opções.
  * **`value`** (`string`, Default: `""`): Identificador único da opção no menu (Refinement: único por menu).
  * **`label`** (`string`, Default: `""`): Rótulo da opção.
  * **`description`** (`string`, Default: `""`): Descrição.
  * **`sub_options`** (`Array<MenuSubOption>`, Default: `[]`): Sub-opções vinculadas.
    * **`value`** (`string`): Identificador da sub-opção (Refinement: único por opção).
    * **`label`** (`string`): Rótulo da sub-opção.
    * **`description`** (`string`): Descrição.

---

### 3.4. Seção `menu_ids` (`Array<string>`)

Array de IDs de menus associados a este template (pode referenciar menus de `menu_definitions` ou do envelope global `context_menus`). Default: `[]`.

---

### 3.5. Seção `prompt_memory_context` (`PromptMemoryContextSchema`)

Gerencia o suporte a memórias/variáveis de substituição automática (`{{memory.key}}`).

| Campo | Tipo | Obrigatoriedade | Default | Descrição / Validação | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | Opcional | `true` | Habilita substituição de memórias. | `promptSchema.ts:188` |
| `merge_strategy` | `enum` | Opcional | `"preserve_existing"` | Valores: `"preserve_existing"`, `"overwrite"`, `"fill_empty"`, `"skip"`. | `promptSchema.ts:189` |
| `entries` | `Array<Entry>` | Opcional | `[]` | Lista de entradas de memória. | `promptSchema.ts:190` |

#### Estrutura de Cada `PromptMemoryEntry`:
* **`key`** (`string`, **Obrigatório**, Min: 1, Transform: `slugify`): Chave identificadora (ex: `"nome_empresa"`).
* **`label`** (`string`, **Obrigatório**, Min: 1): Rótulo legível na UI.
* **`value`** (`string`, Default: `""`): Valor padrão.
* **`type`** (`enum`, Default: `"text"`): Apenas `"text"` suportado na v1.1.0.
* **`scope`** (`enum`, Default: `"user"`): Apenas `"user"` suportado na v1.1.0.
* **`required`** (`boolean`, Default: `false`): Indica se o valor precisa estar preenchido.
* **`editable`** (`boolean`, Default: `true`): Permite alteração no painel de memória.
* **`description`** (`string`, Default: `""`): Ajuda contextual.

---

### 3.6. Seção `output_contract` (`PromptOutputContractSchema`)

Contrato que define o formato final esperado da resposta do modelo de IA.

| Campo | Tipo | Obrigatoriedade | Default | Descrição / Validação | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `format` | `enum` | Opcional | `"markdown"` | Formato: `"text"`, `"markdown"`, `"json"`, `"image"`, `"code"`. | `promptSchema.ts:163` |
| `language` | `string` | Opcional | `"pt-BR"` | Min: 2. Idioma da saída. | `promptSchema.ts:164` |
| `strict_mode` | `boolean` | Opcional | `true` | Força a IA a seguir estritamente o formato. | `promptSchema.ts:165` |
| `required_fields` | `Array<string>` | Opcional | `[]` | Títulos de seções ou chaves JSON obrigatórias na saída. | `promptSchema.ts:166` |
| `response_rules` | `Array<string>` | Opcional | `[]` | Instruções específicas de estilo/formatação da saída. | `promptSchema.ts:167` |
| `optional_enums` | `Record<string, Array<string>>` | Opcional | `undefined` | Mapa de enums válidos para validação de saídas estruturadas. | `promptSchema.ts:168` |

---

## 4. REGRAS DE NEGÓCIO E COMPORTAMENTO NO RUNTIME

### 4.1. Resolução e Sanitização de Pseudônimos (Aliases)
O `importService.ts` e o `menuValidation.ts` tratam variações de nomenclatura antes de invocar o Zod:
1. `context_menus` ou `contextMenus` ou `menuDefinitions` dentro do prompt são mapeados para `menu_definitions`.
2. `menuIds` é mapeado para `menu_ids`.
3. `memory_context` ou `memory_entries` é mapeado para `prompt_memory_context`.
4. `valor` ──► `value`, `rotulo` ──► `label`, `obrigatorio` ──► `required`, `selectionMode` ──► `selection_mode`.

### 4.2. Integridade de Placeholders de Memória
Qualquer ocorrência da sintaxe `{{memory.chave}}` encontrada nos campos de texto do prompt exige a existência de uma entrada correspondente em `prompt_memory_context.entries`. Se ausente, o pipeline interrompe a importação com o erro:
`"Variável de memória obrigatória ausente para placeholder: {key}"`.

### 4.3. Restrições de Unicidade
* Em qualquer lista de `sub_options`, a propriedade `value` deve ser única.
* Em qualquer lista de `options`, a propriedade `value` deve ser única.
* Em qualquer lista de `menu_definitions`, a propriedade `menu_id` deve ser única.
* Em qualquer coleção de `entries` de memória, a propriedade `key` deve ser única.
* No envelope de importação, a propriedade `template_id` deve ser única por prompt.
