# Árvore Completa da Estrutura JSON (PromptPP)

**Origem:** `src/models/promptSchema.ts`  
**Data da Auditoria:** 2026-07-25  
**Autor:** Arquiteto Sênior de Templates PromptPP  

---

## 1. Visão Geral

Abaixo é apresentada a árvore estrutural completa do modelo de dados JSON do PromptPP.

Ela aborda duas estruturas principais:
1. **`ImportEnvelope`** (Estrutura do arquivo de importação/exportação).
2. **`TemplatePayload`** (Estrutura interna de um Prompt Template).

Nenhum campo foi omitido.

---

## 2. Árvore do Envelope Canônico de Importação (`ImportEnvelope`)

```
root (ImportEnvelopeSchema)
 ├── app (string, literal: "Prompt App", default: "Prompt App")
 ├── version (string, default: "3.0.0")
 ├── format (string, literal: "prompt-app-import", default: "prompt-app-import")
 ├── schemaVersion (string, default: "1.1.0")
 ├── exportedAt (string, formato ISO 8601, OBRIGATÓRIO)
 ├── context_menus (array de MenuDefinitionSchema, default: [])
 │    └── [index] (MenuDefinitionSchema)
 │         ├── menu_id (string, min: 1, OBRIGATÓRIO)
 │         ├── menu_name (string, min: 1, OBRIGATÓRIO)
 │         ├── description (string, default: "")
 │         ├── selection_mode (enum: "single" | "multiple", default: "single")
 │         ├── required (boolean, default: false)
 │         └── options (array de MenuOptionSchema, default: [])
 │              └── [index] (MenuOptionSchema)
 │                   ├── label (string, default: "")
 │                   ├── value (string, default: "")
 │                   ├── description (string, default: "")
 │                   └── sub_options (array de MenuSubOptionSchema, default: [])
 │                        └── [index] (MenuSubOptionSchema)
 │                             ├── label (string, default: "")
 │                             ├── value (string, default: "")
 │                             └── description (string, default: "")
 └── prompts (array de TemplatePayloadSchema, default: [])
      └── [index] (TemplatePayloadSchema - Estrutura detalhada abaixo)
```

---

## 3. Árvore do Template Payload (`TemplatePayload` / `PromptContract`)

```
TemplatePayload (TemplatePayloadSchema)
 ├── meta (TemplateMetaSchema, OBRIGATÓRIO)
 │    ├── template_id (string, min: 1, OBRIGATÓRIO)
 │    ├── template_name (string, min: 1, OBRIGATÓRIO)
 │    ├── template_type (string, min: 1, OBRIGATÓRIO, ex: "generic_prompt")
 │    ├── schema_version (string, min: 1, default: "1.1.0")
 │    ├── language (string, min: 2, default: "pt-BR")
 │    └── status (enum: "draft" | "active" | "archived", default: "draft")
 ├── prompt_definition (PromptDefinitionSchema, OBRIGATÓRIO)
 │    ├── system_role (string, default: "")
 │    ├── task (string, default: "")
 │    ├── context (string, default: "")
 │    ├── user_scene_description (string, default: "")
 │    ├── constraints (array de strings, default: [])
 │    │    └── [index] (string, min: 1)
 │    ├── negative_prompt (array de strings, default: [])
 │    │    └── [index] (string, min: 1)
 │    └── few_shot_examples (array de FewShotExampleSchema, default: [])
 │         └── [index] (FewShotExampleSchema)
 │              ├── input (string, default: "")
 │              └── output (string, default: "")
 ├── menu_definitions (array de MenuDefinitionSchema, default: [])
 │    └── [index] (MenuDefinitionSchema)
 │         ├── menu_id (string, min: 1, OBRIGATÓRIO)
 │         ├── menu_name (string, min: 1, OBRIGATÓRIO)
 │         ├── description (string, default: "")
 │         ├── selection_mode (enum: "single" | "multiple", default: "single")
 │         ├── required (boolean, default: false)
 │         └── options (array de MenuOptionSchema, default: [])
 │              └── [index] (MenuOptionSchema)
 │                   ├── label (string, default: "")
 │                   ├── value (string, default: "")
 │                   ├── description (string, default: "")
 │                   └── sub_options (array de MenuSubOptionSchema, default: [])
 │                        └── [index] (MenuSubOptionSchema)
 │                             ├── label (string, default: "")
 │                             ├── value (string, default: "")
 │                             └── description (string, default: "")
 ├── menu_ids (array de strings, default: [])
 │    └── [index] (string)
 ├── prompt_memory_context (PromptMemoryContextSchema, OPCIONAL)
 │    ├── enabled (boolean, default: true)
 │    ├── merge_strategy (enum: "preserve_existing" | "overwrite" | "fill_empty" | "skip", default: "preserve_existing")
 │    └── entries (array de PromptMemoryEntrySchema, default: [])
 │         └── [index] (PromptMemoryEntrySchema)
 │              ├── key (string, min: 1, transform: slugify, OBRIGATÓRIO)
 │              ├── label (string, min: 1, OBRIGATÓRIO)
 │              ├── value (string, default: "")
 │              ├── type (enum: "text", default: "text")
 │              ├── scope (enum: "user", default: "user")
 │              ├── required (boolean, default: false)
 │              ├── editable (boolean, default: true)
 │              └── description (string, default: "")
 └── output_contract (PromptOutputContractSchema, OBRIGATÓRIO)
      ├── format (enum: "text" | "markdown" | "json" | "image" | "code", default: "markdown")
      ├── language (string, min: 2, default: "pt-BR")
      ├── strict_mode (boolean, default: true)
      ├── required_fields (array de strings, default: [])
      │    └── [index] (string, min: 1)
      ├── response_rules (array de strings, default: [])
      │    └── [index] (string, min: 1)
      └── optional_enums (record de arrays de strings, OPCIONAL)
           └── [key: string] (array de strings)
                └── [index] (string, min: 1)
```
