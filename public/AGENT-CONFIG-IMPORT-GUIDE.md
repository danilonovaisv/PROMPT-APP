# 📋 Guia do Agente de Configuração — Sistema de Importação do PROMPT-APP

> **Versão do Schema:** `1.0.0`  
> **Arquivos de referência:** `src/models/promptSchema.ts`, `src/services/importService.ts`, `src/utils/menuValidation.ts`

---

## 🎯 Objetivo

Este guia capacita o agente de configuração a criar, validar e importar corretamente templates de **prompts** e **menus contextuais** no Prompt App.

---

## 📐 Arquitetura do Sistema de Importação

```
JSON Input (arquivo ou clipboard)
    │
    ▼
importService.ts → parseImportData()     ← Preview (não persiste)
    │
    ▼
normalizeMenuBatch()                     ← Validação e normalização de menus (menuValidation.ts)
    │
    ▼
parsePromptPayload() → Zod parse         ← Validação rigorosa (promptSchema.ts)
    │
    ▼
migrateTemplateToCurrentSchema()         ← Migração de schemas legados
    │
    ▼
db.prompts.bulkAdd() + db.contextMenus.bulkPut()  ← Dexie/IndexedDB (local-first)
    │
    ▼
syncStatus: 'pending' → Supabase sync    ← Background sync
```

---

## 📄 PROMPT-TEMPLATE.json — Especificação Completa

**Localização do template:** `/public/PROMPT-TEMPLATE.json`

### Estrutura Raiz (todos os campos são obrigatórios)

```json
{
  "meta": { ... },
  "prompt_definition": { ... },
  "menu_definitions": [ ... ],
  "menu_ids": [ ... ],
  "output_contract": { ... }
}
```

---

### 1. Bloco `meta` (obrigatório)

| Campo | Tipo | Obrigatório | Regras | Exemplo |
|---|---|---|---|---|
| `template_id` | string | ✅ | Slug único. Gerado via slugify(template_name). Sem espaços, acentos ou caracteres especiais. | `"analise_competitiva"` |
| `template_name` | string | ✅ | Nome legível. Min 1 char. | `"Análise Competitiva"` |
| `template_type` | string | ✅ | Categoria funcional do template. | `"generic_prompt"` |
| `schema_version` | string | ✅ | Sempre `"1.0.0"` para templates novos. | `"1.0.0"` |
| `language` | string | ✅ | BCP 47. Min 2 chars. | `"pt-BR"` |
| `status` | enum | ✅ | `"draft"`, `"active"`, ou `"archived"` | `"active"` |

> **⚠️ CRÍTICO:** `template_id` deve ser **globalmente único** na base de dados. Se importar um template com `template_id` já existente, o sistema NÃO irá sobrescrever — criará um duplicado com novo `id` local.

---

### 2. Bloco `prompt_definition` (obrigatório)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `system_role` | string | ✅ (pode ser vazio) | Papel/persona atribuído ao modelo de IA |
| `task` | string | ✅ (pode ser vazio) | Instrução principal. Descreva o que o modelo deve fazer |
| `context` | string | ✅ (pode ser vazio) | Contexto situacional, dados de fundo |
| `user_scene_description` | string | ✅ (pode ser vazio) | Cenário do usuário final |
| `constraints` | string[] | ✅ (pode ser `[]`) | Regras que DEVEM ser seguidas (positivo) |
| `negative_prompt` | string[] | ✅ (pode ser `[]`) | Instruções do que NÃO deve ser feito |
| `few_shot_examples` | `{input, output}[]` | ✅ (pode ser `[]`) | Exemplos de entrada/saída para calibrar o modelo |

---

### 3. Bloco `menu_definitions` (obrigatório, pode ser `[]`)

Cada item da lista segue o **MenuDefinitionSchema**:

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `menu_id` | string | ✅ | Slug único por template. Ex: `"tom_comunicacao"` |
| `menu_name` | string | ✅ | Nome exibido na UI. Ex: `"Tom de Comunicação"` |
| `description` | string | ✅ (pode ser vazio) | Texto de ajuda exibido ao usuário |
| `selection_mode` | enum | ✅ | `"single"` (radio) ou `"multiple"` (checkbox) |
| `required` | boolean | ✅ | Se `true`, o usuário é obrigado a selecionar antes de gerar |
| `options` | MenuOption[] | ✅ | Lista de opções disponíveis |

**Estrutura de `options`:**

```json
{
  "label": "Rótulo visível na UI",
  "value": "valor_snake_case",
  "description": "Texto auxiliar opcional",
  "sub_options": [
    {
      "label": "Sub-opção",
      "value": "sub_opcao_valor",
      "description": ""
    }
  ]
}
```

> **⚠️ UNICIDADE:** Os valores de `menu_id` e `option.value` devem ser únicos dentro do mesmo template. O Zod rejeitará duplicatas.

---

### 4. Bloco `menu_ids` (obrigatório, pode ser `[]`)

Lista de strings com os `menu_id` dos menus que estão **ativos** para este template. Deve ser um subconjunto dos IDs definidos em `menu_definitions`.

```json
"menu_ids": ["tom_comunicacao", "publico_alvo"]
```

---

### 5. Bloco `output_contract` (obrigatório)

| Campo | Tipo | Obrigatório | Valores aceitos |
|---|---|---|---|
| `format` | enum | ✅ | `"text"`, `"markdown"`, `"json"`, `"image"`, `"code"` |
| `language` | string | ✅ | BCP 47. Ex: `"pt-BR"`, `"en-US"` |
| `strict_mode` | boolean | ✅ | `true` reforça as regras de saída |
| `required_fields` | string[] | ✅ (pode ser `[]`) | Seções que devem constar na resposta |
| `response_rules` | string[] | ✅ (pode ser `[]`) | Regras estruturais de formato de resposta |
| `optional_enums` | Record<string, string[]> | ❌ | Enumerações opcionais para parsing estruturado |

---

## 📄 MENU-TEMPLATE.json — Especificação Completa

**Localização do template:** `/public/MENU-TEMPLATE.json`

Este formato permite importar **apenas menus** (sem prompts), útil para criar uma biblioteca de menus reutilizáveis.

### Estrutura Raiz

```json
{
  "app": "Prompt App",
  "version": "1.0.0",
  "format": "menu-import",
  "exportedAt": "ISO 8601 timestamp",
  "menuDefinitions": [ ... ]
}
```

> O importService detecta automaticamente o formato via `isBulkExport()`: se o JSON tiver a chave `prompts` (array), trata como bulk export. Se tiver `menuDefinitions` sem `prompts`, importará apenas os menus.

### Compatibilidade de Campos — Aliases Aceitos

O `menuValidation.ts` aceita nomenclatura camelCase e snake_case. O agente pode receber JSONs externos com qualquer dos aliases:

| Campo canônico | Alias aceito |
|---|---|
| `menu_id` | `menuId` |
| `menu_name` | `menuName` |
| `selection_mode` | `selectionMode` |
| `required` | `obrigatorio` |
| `options.value` | `options.valor` |
| `options.label` | `options.rotulo` |
| `sub_options` | `subOptions` |

---

## 🔄 Formato de Bulk Export (Backup Completo)

Quando o usuário exporta tudo via "Exportar Tudo", o JSON tem a estrutura `BulkExport`:

```json
{
  "app": "Prompt App",
  "version": "2.0.0",
  "format": "prompt-app-bulk-export",
  "schemaVersion": "1.0.0",
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "menuDefinitions": [ ... ],
  "prompts": [
    {
      "title": "Nome do Prompt",
      "category": "Categoria",
      "schemaVersion": "1.0.0",
      "prompt": { /* TemplatePayloadSchema completo */ }
    }
  ]
}
```

---

## ✅ Checklist de Validação para o Agente

Antes de criar ou enviar um template para importação, verificar:

### Para PROMPT-TEMPLATE.json
- [ ] `template_id` é slug único (sem espaços, acentos)
- [ ] `template_name` está preenchido
- [ ] `schema_version` é `"1.0.0"`
- [ ] `status` é um dos valores: `"draft"`, `"active"`, `"archived"`
- [ ] `system_role` e `task` têm conteúdo relevante
- [ ] Todos os `menu_id` em `menu_definitions` são únicos entre si
- [ ] Todos os `option.value` dentro de cada menu são únicos
- [ ] `menu_ids` contém apenas IDs listados em `menu_definitions`
- [ ] `output_contract.format` é um dos valores: `"text"`, `"markdown"`, `"json"`, `"image"`, `"code"`
- [ ] Campos `_comment` e `_docs` foram removidos antes do import

### Para MENU-TEMPLATE.json
- [ ] `menuDefinitions` é um array (mesmo que com 1 item)
- [ ] Cada menu tem `menu_id` e `menu_name`
- [ ] `selection_mode` é `"single"` ou `"multiple"`
- [ ] Nenhum `menu_id` duplicado dentro da lista
- [ ] Campos `_comment_*` foram removidos antes do import

---

## 🚨 Erros Comuns e Como Evitar

| Erro | Causa | Solução |
|---|---|---|
| `"Formato de prompt inválido"` | Campo obrigatório ausente ou tipo errado | Verificar `meta.template_id`, `meta.template_name`, `output_contract.format` |
| `"Menu id deve ser único"` | `menu_id` repetido em `menu_definitions` | Usar slugs distintos para cada menu |
| `"Option value deve ser único"` | `option.value` repetido dentro de um menu | Usar valores distintos nas opções |
| `"Apenas arquivos .json são aceitos"` | Extensão incorreta ou arquivo de outro tipo | Salvar/exportar com extensão `.json` |
| `status inválido` | Valor de `status` não reconhecido | Usar apenas: `"draft"`, `"active"`, `"archived"` |
| `format inválido` | Valor de `output_contract.format` errado | Usar apenas: `"text"`, `"markdown"`, `"json"`, `"image"`, `"code"` |
| `"Menu obrigatório precisa de seleção"` | Menu com `required: true` sem seleção ao gerar prompt | Garantir que o usuário selecione antes de usar |

---

## 🛠️ Serviços e Arquivos-Chave

| Arquivo | Responsabilidade |
|---|---|
| [`src/models/promptSchema.ts`](file:///Users/PROJETOS-DEV/PROMPT-APP/src/models/promptSchema.ts) | Definição Zod de todos os schemas (fonte da verdade) |
| [`src/services/importService.ts`](file:///Users/PROJETOS-DEV/PROMPT-APP/src/services/importService.ts) | Orquestração do pipeline de importação |
| [`src/utils/menuValidation.ts`](file:///Users/PROJETOS-DEV/PROMPT-APP/src/utils/menuValidation.ts) | Normalização e validação de menus (aliases camelCase/snake_case) |
| [`src/utils/exportJson.ts`](file:///Users/PROJETOS-DEV/PROMPT-APP/src/utils/exportJson.ts) | Exportação e geração do template via `getTemplateFile()` |
| [`src/utils/templateMigration.ts`](file:///Users/PROJETOS-DEV/PROMPT-APP/src/utils/templateMigration.ts) | Migração de schemas legados para o schema atual |
| [`src/components/ImportExportModal.tsx`](file:///Users/PROJETOS-DEV/PROMPT-APP/src/components/ImportExportModal.tsx) | UI do modal de importação/exportação |
| [`public/PROMPT-TEMPLATE.json`](file:///Users/PROJETOS-DEV/PROMPT-APP/public/PROMPT-TEMPLATE.json) | Template canônico para prompts |
| [`public/MENU-TEMPLATE.json`](file:///Users/PROJETOS-DEV/PROMPT-APP/public/MENU-TEMPLATE.json) | Template canônico para menus |

---

## 📦 Como Disponibilizar os Templates na UI

O botão **"Baixar Template"** no `ImportExportModal` chama `getTemplateFile()` de `exportJson.ts`, que usa o `PromptContractSchema` interno. Para que o template disponibilizado seja este arquivo canônico, atualizar `getTemplateFile()` para servir o `PROMPT-TEMPLATE.json` via `fetch('/PROMPT-TEMPLATE.json')`.

> **Nota:** Os arquivos em `/public` são servidos estaticamente pela Vite na raiz do domínio. O template fica acessível em `{baseURL}/PROMPT-TEMPLATE.json`.

---

*Gerado pelo Orchestrator Agent — PROMPT-APP v1.0.0*
