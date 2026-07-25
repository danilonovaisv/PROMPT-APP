# Análise Comparativa: `public/PROMPT-TEMPLATE.json` vs `promptSchema.ts`

**Origem:** `public/PROMPT-TEMPLATE.json`, `src/models/promptSchema.ts`  
**Data da Auditoria:** 2026-07-25  
**Autor:** Arquiteto Sênior de Templates PromptPP  

---

## 1. Visão Geral do Arquivo Exemplo `public/PROMPT-TEMPLATE.json`

O arquivo `public/PROMPT-TEMPLATE.json` serve como o template oficial de demonstração e referência mantido no repositório.

Ele representa uma estrutura de envelope canônico de importação (`format: "prompt-app-import"`), contendo 1 template de prompt (`prompts[0]`) intitulado `"Análise Estratégica"`.

---

## 2. Matriz Comparativa Campo a Campo

| Propriedade no JSON Exemplo | Propriedade Esperada no Schema Zod (`TemplatePayloadSchema`) | Status / Conformidade | Observação Técnica |
| :--- | :--- | :--- | :--- |
| `app` (`"Prompt App"`) | `ImportEnvelopeSchema.app` | **100% Conforme** | Literal `"Prompt App"`. |
| `version` (`"3.0.0"`) | `ImportEnvelopeSchema.version` | **100% Conforme** | Versão da aplicação. |
| `format` (`"prompt-app-import"`) | `ImportEnvelopeSchema.format` | **100% Conforme** | Identificador canônico do envelope. |
| `schemaVersion` (`"1.1.0"`) | `ImportEnvelopeSchema.schemaVersion` | **100% Conforme** | Coincide com `DEFAULT_SCHEMA_VERSION`. |
| `exportedAt` | `ImportEnvelopeSchema.exportedAt` | **100% Conforme** | Timestamp ISO 8601. |
| `context_menus` (no envelope raiz) | `ImportEnvelopeSchema.context_menus` | **100% Conforme** | Array de definições globais de menu (vazio no exemplo). |
| `prompts[0].meta` | `TemplateMetaSchema` | **100% Conforme** | Possui `template_id`, `template_name`, `template_type`, `schema_version`, `language`, `status`. |
| `prompts[0].prompt_definition` | `PromptDefinitionSchema` | **100% Conforme** | Possui `system_role`, `task`, `context`, `user_scene_description`, `constraints`, `negative_prompt`, `few_shot_examples`. |
| `prompts[0].context_menus` | **`menu_definitions`** | ⚠️ **USO DE ALIAS OBSOLETO** | O schema estrito exige `menu_definitions`. No exemplo é utilizado `context_menus: []`. Funciona devido à normalização automática em `normalizeTemplatePayloadAliases` (`promptSchema.ts:430-434`). |
| `prompts[0].menu_ids` | `menu_ids` | **100% Conforme** | Array de IDs de menu. |
| `prompts[0].prompt_memory_context` | `PromptMemoryContextSchema` | **100% Conforme** | Possui `enabled: true`, `merge_strategy: "preserve_existing"` e 2 entradas (`nome_empresa`, `segmento_empresa`). |
| `prompts[0].output_contract` | `PromptOutputContractSchema` | **100% Conforme (Parcial)** | Possui `format`, `language`, `strict_mode`, `required_fields`, `response_rules`. Omitiu o campo opcional `optional_enums`. |

---

## 3. Divergências e Incompatibilidades Encontradas

### 3.1. Uso do Alias Obsoleto `context_menus` no Prompt
* **Problema:** Em `public/PROMPT-TEMPLATE.json` (`line 34`), o objeto do prompt utiliza a chave `"context_menus": []`.
* **Especificação Estrita (`TemplatePayloadSchema`):** O schema canônico do Zod especifica o campo como `menu_definitions` (`promptSchema.ts:201`).
* **Impacto no Parser:** Se o JSON for validado diretamente no `TemplatePayloadSchema.parse()` sem passar pela função `normalizeTemplatePayloadAliases`, o Zod lançará um erro por causa da propriedade não reconhecida (devido ao `.strict()`) e pela ausência de `menu_definitions`.
* **Solução Recomendada para Documentação:** A especificação oficial deve declarar `menu_definitions` como o nome de campo canônico primário.

### 3.2. Ausência de Campos Opcionais
* `output_contract.optional_enums`: Omitido em `PROMPT-TEMPLATE.json`. Válido, pois o campo é definido como `.optional()` no schema (`promptSchema.ts:168`).

---

## 4. Análise de Substituição de Variáveis no Exemplo

No arquivo `public/PROMPT-TEMPLATE.json`:
* `prompt_definition.task`: `"Analise a empresa {{memory.nome_empresa}}."`
* `prompt_definition.context`: `"Considere o segmento {{memory.segmento_empresa}}."`

As chaves extraídas pelo regex `listMemoryPlaceholderKeys` são: `nome_empresa` e `segmento_empresa`.  
Ambas estão presentes em `prompt_memory_context.entries` com `required: true`.  
Isso confirma conformidade 100% com as regras de validação de memória de `importService.ts:567-580`.
