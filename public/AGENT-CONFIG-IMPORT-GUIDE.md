# Guia do Agente de Configuração, Importação do PROMPT-APP

> **Schema atual:** `1.1.0`
> **Formato canônico:** `prompt-app-import`
> **Arquivos de referência:** `src/models/promptSchema.ts`, `src/services/importService.ts`, `src/utils/exportJson.ts`, `src/utils/templateMigration.ts`

## Objetivo

Este guia documenta o fluxo canônico de importação do Prompt App após a refatoração de **Saturday, July 25, 2026**.

O sistema agora separa explicitamente:

1. detecção do formato,
2. normalização de aliases,
3. validação com Zod,
4. planejamento da importação,
5. persistência local-first com Dexie,
6. sincronização posterior com Supabase.

## Pipeline real

```text
raw JSON
  -> detectImportFormat
  -> normalizeToCanonicalPayload
  -> parse menus/prompts/memory
  -> build import plan
  -> preview in UI
  -> Dexie transaction
  -> syncStatus=pending
```

## Formato canônico externo

```json
{
  "app": "Prompt App",
  "version": "3.0.0",
  "format": "prompt-app-import",
  "schemaVersion": "1.1.0",
  "exportedAt": "2026-07-25T00:00:00.000Z",
  "context_menus": [],
  "prompts": []
}
```

## Formatos aceitos

| Entrada | Importa? | Normalização |
|---|---|---|
| `prompt-app-import` | Sim | Sem mudança estrutural |
| `prompt-app-bulk-export` | Sim | Envelope legado -> canônico |
| arquivo legado com `menuDefinitions` | Sim | `menuDefinitions -> context_menus` |
| prompt legado com `menu_definitions` | Sim | `menu_definitions -> context_menus` |
| prompt único na raiz | Sim | Vira `prompts[0]` |
| array raiz de prompts | Sim | Vira `prompts[]` |

## Aliases aceitos antes da validação

| Conceito | Aliases |
|---|---|
| menus do envelope | `context_menus`, `contextMenus`, `menuDefinitions`, `menu_definitions` |
| menus do prompt | `context_menus`, `menu_definitions` |
| ids de menu | `menu_ids`, `menuIds` |
| memória | `prompt_memory_context`, `memory_context`, `memory_entries` |
| schema version | `schemaVersion`, `schema_version` |

## Estrutura de prompt

```json
{
  "meta": {
    "template_id": "analise_estrategica",
    "template_name": "Análise Estratégica",
    "template_type": "generic_prompt",
    "schema_version": "1.1.0",
    "language": "pt-BR",
    "status": "active"
  },
  "prompt_definition": {
    "system_role": "Você é um consultor estratégico.",
    "task": "Analise {{memory.nome_empresa}}.",
    "context": "Considere o segmento {{memory.segmento_empresa}}.",
    "user_scene_description": "Informe os dados da empresa e o objetivo específico da análise.",
    "constraints": [],
    "negative_prompt": [],
    "few_shot_examples": []
  },
  "context_menus": [],
  "menu_ids": [],
  "prompt_memory_context": {
    "enabled": true,
    "merge_strategy": "preserve_existing",
    "entries": [
      {
        "key": "nome_empresa",
        "label": "Nome da empresa",
        "value": "",
        "type": "text",
        "scope": "user",
        "required": true,
        "editable": true,
        "description": ""
      }
    ]
  },
  "output_contract": {
    "format": "markdown",
    "language": "pt-BR",
    "strict_mode": true,
    "required_fields": [],
    "response_rules": []
  }
}
```

## Regras de memória

- A identidade efetiva continua sendo `templateId + key`.
- `key` é normalizada para `snake_case`.
- Estratégias aceitas:
  - `preserve_existing`
  - `overwrite`
  - `fill_empty`
  - `skip`
- `preserve_existing` é o default mais seguro.
- `skip` mantém a definição no template, mas não grava valor em `promptMemory`.
- Em templates executáveis, referências canônicas usam o namespace `memory` e uma `key` declarada.
- Em documentação abstrata, represente a sintaxe como `memory.<key>` para não criar um placeholder executável acidental.
- Placeholders legados `{{key}}` continuam aceitos em modo compatível.
- Se uma memória obrigatória estiver ausente, a compilação do prompt falha.

## Preview do modal

O preview agora expõe:

- formato detectado,
- versão do schema,
- prompts novos vs atualizados,
- menus novos vs atualizados,
- memórias com ação `create`, `update`, `preserve` ou `ignore`,
- resumo do plano de importação,
- erros com caminho de campo.

## Observações operacionais

- A persistência é local-first em Dexie.
- O sync continua pendente para Supabase quando existir sessão.
- Templates antigos continuam importáveis.
- O export padrão agora usa `prompt-app-import`.
- Em novos artefatos, `exportedAt` deve ser recalculado com a data real da geração em ISO 8601 e UTC.
- Supabase e Context7 devem ser consultados quando estiverem disponíveis e forem relevantes, mas essas verificações externas não substituem a validação local do schema.
- A indisponibilidade de um MCP não impede a geração de um JSON válido quando a estrutura e o conteúdo puderem ser validados localmente; nesse caso, o estado operacional é `partial`.
- O envelope importável e o relatório operacional são independentes. Status, falhas, riscos e diagnósticos nunca devem ser adicionados ao `prompt-app-import`.
- Quando o contrato exigir somente JSON, entregue o envelope válido e mantenha qualquer diagnóstico exclusivamente fora do artefato.
- Para conflitos sobre execução de ferramentas e tratamento de falhas, prevalece `POLÍTICA DE EXECUÇÃO, VERIFICAÇÃO E FALHAS DE FERRAMENTAS.md`; para o schema, prevalecem este guia e os templates canônicos.
