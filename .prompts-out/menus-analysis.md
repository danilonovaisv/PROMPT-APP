# Análise de Menus e Normalização — `menuValidation.ts`

**Origem:** `src/utils/menuValidation.ts`, `src/models/promptSchema.ts`, `src/models/types.ts`  
**Data da Auditoria:** 2026-07-25  
**Autor:** Arquiteto Sênior de Templates PromptPP  

---

## 1. Visão Geral

O módulo `menuValidation.ts` implementa a camada de compatibilidade e tolerância a pseudônimos (aliases) para menus de contexto no ecossistema PromptPP. Ele garante que menus definidos com nomenclaturas legadas, em português ou no padrão camelCase sejam convertidos transparentemente para o schema canônico em snake_case estrito (`MenuDefinitionSchema`).

---

## 2. Tabela Completa de Aliases Aceitos

A função `normalizeRawMenu` (`lines 75-93`) intercepta e converte os seguintes mapeamentos de chaves:

### 2.1. Nível do Menu (`MenuDefinition`)

| Nome Canônico (`MenuDefinitionSchema`) | Aliases Suportados no JSON | Tipo Esperado | Valor Default se Ausente |
| :--- | :--- | :--- | :--- |
| `menu_id` | `menu_id`, `menuId` | `string` (`min(1)`) | Sem default (Obrigatório) |
| `menu_name` | `menu_name`, `menuName` | `string` (`min(1)`) | Sem default (Obrigatório) |
| `description` | `description` | `string` | `""` |
| `selection_mode` | `selection_mode`, `selectionMode` | `"single" \| "multiple"` | `"single"` |
| `required` | `required`, `obrigatorio` | `boolean` | `false` |
| `options` | `options`, `menu_options` | `Array<MenuOption>` | `[]` |

### 2.2. Nível de Opções (`MenuOption`)

| Nome Canônico (`MenuOptionSchema`) | Aliases Suportados no JSON | Tipo Esperado | Valor Default se Ausente |
| :--- | :--- | :--- | :--- |
| `value` | `value`, `valor` | `string` | `""` |
| `label` | `label`, `rotulo` | `string` | `""` |
| `description` | `description` | `string` | `""` |
| `sub_options` | `sub_options`, `subOptions` | `Array<MenuSubOption>` | `[]` |

### 2.3. Nível de Sub-opções (`MenuSubOption`)

| Nome Canônico (`MenuSubOptionSchema`) | Aliases Suportados no JSON | Tipo Esperado | Valor Default se Ausente |
| :--- | :--- | :--- | :--- |
| `value` | `value`, `valor` | `string` | `""` |
| `label` | `label`, `rotulo` | `string` | `""` |
| `description` | `description` | `string` | `""` |

### 2.4. Nível do Envelope de Importação / Template

| Nome Canônico Canônico | Aliases Suportados | Origem do Mapeamento |
| :--- | :--- | :--- |
| `menu_definitions` | `context_menus`, `contextMenus`, `menuDefinitions` | `promptSchema.ts:430-434` / `importService.ts:259-266` |
| `menu_ids` | `menu_ids`, `menuIds` | `promptSchema.ts:435-439` |
| `prompt_memory_context` | `memory_context`, `memory_entries` | `promptSchema.ts:448-449` |

---

## 3. Menus Nativos / Legados Suportados pelo Sistema

Embora o ecossistema PromptPP permita menus dinâmicos customizados com qualquer `menu_id` único, o sistema possui definições nativas mapeadas no modelo legado (`types.ts:59-78`):

* **`tom`** — Label: `"Tom"` (Ex: formal, informal, persuasivo, técnico)
* **`publico`** — Label: `"Público"` (Ex: executivos, desenvolvedores, público geral)
* **`idioma`** — Label: `"Idioma"` (Ex: português, inglês, espanhol)
* **`estilo`** — Label: `"Estilo"` (Ex: conciso, detalhado, acadêmico)

---

## 4. Algoritmo de Normalização e Validação

```typescript
// Exemplo conceitual do fluxo interno em menuValidation.ts
normalizeRawMenu(raw)
  │
  ├── 1. Extrai menu_id (de raw.menu_id ou raw.menuId)
  ├── 2. Extrai menu_name (de raw.menu_name ou raw.menuName)
  ├── 3. Converte selection_mode (default: 'single')
  ├── 4. Converte required (de raw.required ou raw.obrigatorio, default: false)
  ├── 5. Mapeia opções e sub-opções resolvendo value/valor e label/rotulo
  └── 6. Submete o objeto normalizado para MenuDefinitionSchema.parse()
```

### Regras de Validação Estrita Aplicadas:
1. **Unicidade de Sub-Opções:** Dentro de uma mesma opção, todos os `value` das sub-opções devem ser únicos (`uniqueArrayBy`, `promptSchema.ts:120`).
2. **Unicidade de Opções:** Dentro de um mesmo menu, todos os `value` das opções principais devem ser únicos (`uniqueArrayBy`, `promptSchema.ts:134`).
3. **Imutabilidade de Schema:** Opções ou propriedades desconhecidas são rejeitadas pelo operador `.strict()` após a etapa de normalização.
