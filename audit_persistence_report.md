# 1. Resumo Executivo

O estado atual da persistência do PROMPT-APP é híbrido e funcional no núcleo, mas com forte deriva entre as três fontes de verdade operacionais: Dexie local, tipos TypeScript e schema remoto do Supabase. O fluxo real de produção é claramente `UI -> Dexie -> serviços Supabase -> Realtime -> Dexie`, com estratégia local-first baseada em `syncStatus` por registro, não em uma fila central de sincronização.

O núcleo efetivamente usado pela UI atual é:

- `categories`
- `prompts`
- `context_menus`
- `prompt_memory_context`

As entidades `media_assets` e `client_errors` existem no Supabase conectado, porém não têm integração observável com o runtime principal do frontend. Isso as coloca hoje como tabelas remotas órfãs do fluxo de produção da app.

Principais conclusões:

- Dexie está em uso real e é a camada primária de persistência da UI.
- Supabase está em uso real para sync, auth e realtime.
- Drizzle ORM não participa do fluxo de produção da app. Hoje ele é dependência residual, com schema de exemplo (`posts`) e migrations próprias desconectadas do modelo real.
- Há inconsistências concretas entre o schema remoto ativo e as tipagens locais, principalmente em `prompts`.
- A política de conflitos é majoritariamente timestamp based, com comportamento equivalente a Last Write Wins em partes do sistema, mas implementada de forma distribuída e inconsistente.
- O modelo multi-tenant está sólido no núcleo principal, mas `media_assets` e `client_errors` destoam estruturalmente por não exibirem `user_id`, soft delete ou timestamps completos no schema remoto verificado.

# 2. Arquitetura Atual Observada

Fluxo observado no runtime:

1. A UI lê e grava primeiro no Dexie, usando `useLiveQuery` e operações diretas em `db.categories`, `db.prompts`, `db.contextMenus` e `db.promptMemory`.
2. Após persistência local, a UI tenta sincronizar imediatamente com Supabase via:
   - `src/services/supabaseCategories.ts`
   - `src/services/supabaseMenus.ts`
   - `src/services/supabasePrompts.ts`
   - `src/services/memoryService.ts`
3. Em paralelo, `src/services/autoSync.ts` instala hooks Dexie e agenda sync automático com debounce.
4. `src/context/CloudSyncContext.tsx` inicia sessão, listeners Realtime e sync pendente ao autenticar ou reconectar.
5. `src/services/realtimeService.ts` recebe eventos remotos por tabela e aplica alterações novamente no Dexie.

Trecho representativo do boot:

```ts
// src/App.tsx
const { seedDatabase } = await import('@/db/database');
const { saveLocalBackup } = await import('@/utils/backupManager');
const { setupAutoSync } = await import('@/services/autoSync');

await seedDatabase();
setTimeout(() => {
  saveLocalBackup();
}, 2000);
setupAutoSync();
```

Trecho representativo do pipeline local-first:

```ts
// src/pages/EditorPage.tsx
localId = (await db.prompts.add({ ...promptRecord, syncStatus: 'pending' } as Prompt)) ?? null;
...
const savedRemote = await savePromptToSupabase({ ...promptRecord, remoteId: existingPrompt?.remoteId });
await db.prompts.update(localId, { remoteId: savedRemote.id, syncStatus: 'synced' });
```

Conclusão arquitetural:

- A fonte primária imediata da UI é o Dexie.
- A fonte remota de sincronização é o Supabase.
- A reconciliação entre ambas depende de timestamps, `syncStatus`, `remoteId` e listeners de Realtime.

# 3. Mapa das Entidades

## Núcleo ativo

### `categories`

- Dexie: tabela real em `src/db/database.ts`
- TypeScript: `Category` em `src/models/types.ts`
- Supabase: tabela real, confirmada por migrations e por introspecção remota
- Uso de produção: alto

### `prompts`

- Dexie: tabela real em `src/db/database.ts`
- TypeScript: `Prompt` em `src/models/types.ts`
- Supabase: tabela real, confirmada por migrations e por introspecção remota
- Uso de produção: alto

### `context_menus`

- Dexie: tabela real como `contextMenus`
- TypeScript: `ContextMenu` em `src/models/types.ts`
- Supabase: tabela real `context_menus`
- Uso de produção: alto

### `prompt_memory_context`

- Dexie: tabela real como `promptMemory`
- TypeScript: `PromptMemory` e `RemotePromptMemory`
- Supabase: tabela real `prompt_memory_context`
- Uso de produção: alto

## Legado confirmado

### `menuOptions`

- Existe apenas em versões antigas do Dexie (`db.version(1)` a `db.version(13)`)
- Foi removida do schema atual na `db.version(14)`
- Continua presente como tipo legado (`MenuOption`) e em comentários/documentação
- Não integra o fluxo principal atual

### `promptMemory` legado em `localStorage`

- Existe migração explícita de `localStorage` para Dexie em `src/services/storage/dexieMemory.ts`
- Indica dívida histórica da camada de memória fixa

## Remoto órfão ou fora do núcleo da UI

### `media_assets`

- Existe no Supabase remoto conectado
- Não aparece no código de produção do frontend
- Não aparece em migrations versionadas deste repositório
- Provável resíduo de outro fluxo, feature futura ou schema aplicado fora do repositório

### `client_errors`

- Existe no Supabase remoto conectado
- Não aparece no código de produção do frontend
- Não aparece em migrations versionadas deste repositório
- É mencionado no `README.md`, mas sem integração operacional observável

# 4. Tabela Comparativa de Schemas

## `categories`

| Campo | Dexie | Supabase | TypeScript | Observação |
|---|---|---|---|---|
| `id` | `++id` | `bigint PK` | `id?: number` | consistente |
| `remoteId` | sim | não | `remoteId?: number` | campo local de mapeamento |
| `user_id` | não | `uuid` | não no tipo local | tenant só no remoto |
| `name` | sim | `text` | `name: string` | consistente |
| `icon` | não indexado, armazenado no objeto | `text nullable` | `icon: string` | TS exige, remoto permite null |
| `color` | não indexado, armazenado no objeto | `text nullable` | `color: string` | TS exige, remoto permite null |
| `createdAt` / `created_at` | sim | `timestamptz` | `Date` / remoto string | consistente |
| `updatedAt` / `updated_at` | armazenado, não indexado | `timestamptz` | opcional local | consistente parcial |
| `isDeleted` / `is_deleted` | campo de objeto, não indexado | `boolean` | `isDeleted?: boolean` | consistente funcional |
| `deletedAt` / `deleted_at` | não modelado localmente | `timestamptz` | ausente | divergência |
| `syncStatus` | sim | não | `pending/synced/error` | controle local apenas |

Trecho local:

```ts
// src/models/types.ts
export interface Category {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

## `context_menus`

| Campo | Dexie | Supabase | TypeScript | Observação |
|---|---|---|---|---|
| `id` | `++id` | `bigint PK` | `id?: number` | consistente |
| `remoteId` | sim | não | `remoteId?: number` | mapeamento local |
| `user_id` | não | `uuid` | não no tipo local | tenant só no remoto |
| `menuId` / `menu_id` | indexado | `text` | `menuId: string` | consistente |
| `menuName` / `menu_name` | indexado | `text` | `menuName: string` | consistente |
| `description` | armazenado | `text nullable` | `description: string` | TS exige, remoto permite null |
| `selectionMode` / `selection_mode` | indexado | `text default 'single'` | `MenuSelectionMode` | consistente |
| `options` | armazenado, não indexado | `jsonb` | `ContextMenuOption[]` | consistente funcional |
| `createdAt` / `created_at` | sim | `timestamptz` | `Date` | consistente |
| `updatedAt` / `updated_at` | armazenado | `timestamptz` | `Date` | consistente |
| `isDeleted` / `is_deleted` | campo de objeto | `boolean` | `isDeleted?: boolean` | consistente |
| `deletedAt` / `deleted_at` | não modelado localmente | `timestamptz` | ausente | divergência |
| `syncStatus` | sim | não | sim | controle local apenas |

Trecho remoto confirmado:

```sql
-- introspecao remota
context_menus(
  id bigint,
  user_id uuid default auth.uid(),
  menu_id text,
  menu_name text,
  description text,
  options jsonb default '[]',
  selection_mode text default 'single',
  is_deleted boolean default false,
  deleted_at timestamptz
)
```

## `prompts`

| Campo | Dexie | Supabase | TypeScript | Observação |
|---|---|---|---|---|
| `id` | `++id` | `bigint PK` | `id?: number` | consistente |
| `remoteId` | sim | não | `remoteId?: number` | mapeamento local |
| `user_id` | não | `uuid` | não no tipo local | tenant só no remoto |
| `categoryId` / `category_id` | indexado | `bigint nullable` | `categoryId: number` | TS não aceita null |
| `title` | indexado | `text` | `title: string` | consistente |
| `promptPayload` / `prompt_payload_jsonb` | armazenado | `jsonb` | `TemplatePayload` | consistente |
| `selectionPayload` / `selection_payload_jsonb` | armazenado | `jsonb nullable` | opcional | consistente |
| `compiledPayload` / `compiled_payload_jsonb` | armazenado | `jsonb nullable` | opcional | consistente |
| `schemaVersion` / `schema_version` | indexado | `text` | `string` | consistente |
| `language` | indexado | `text` | `string` | consistente |
| `outputFormat` / `output_format` | indexado | `text` | `PromptOutputFormat` | consistente |
| `selectedMenuIds` / `selected_menu_ids` | `number[]` local IDs | `jsonb` no schema remoto ativo | `number[]` | divergência relevante |
| `selected_menu_ids_jsonb` | não existe no Dexie | existe remoto | ausente no tipo remoto local | redundância/deriva |
| `fewShotExamples` / `few_shot_examples` | array | `jsonb` | array | consistente |
| colunas legadas `system_role`, `task`, `context`, `context_menus`, `constraints`, `negative_prompt`, `output_schema` | removidas do Dexie moderno, mas ainda convertidas | ainda existem remoto | só em tipos remotos | legado ativo no remoto |
| `isDeleted` / `is_deleted` | campo de objeto | `boolean` | `isDeleted?: boolean` | consistente |
| `deletedAt` / `deleted_at` | não modelado localmente | `timestamptz` | ausente | divergência |
| `syncStatus` | sim | não | sim | controle local apenas |

Trecho crítico:

```ts
// src/models/types.ts
export interface Prompt {
  categoryId: number;
  selectedMenuIds?: number[];
  promptPayload: TemplatePayload;
  selectionPayload?: UserSelection;
  compiledPayload?: CompiledPromptPayload;
}
```

```ts
// src/services/sync/promptSync.ts
selected_menu_ids: data.selectedMenuIds || [],
```

```json
// introspecao remota
"selected_menu_ids":{"data_type":"jsonb","default_value":"'[]'::jsonb"}
```

Diagnóstico:

- O código assume array de IDs numéricos.
- O schema remoto ativo não é `bigint[]`, é `jsonb`.
- Há ainda uma coluna extra `selected_menu_ids_jsonb`.
- Isso indica deriva histórica e possível duplicidade semântica no contrato de `prompts`.

## `prompt_memory_context`

| Campo | Dexie | Supabase | TypeScript | Observação |
|---|---|---|---|---|
| `id` | `++id` local | `uuid PK` remoto | `id?: number` local, `id: string` remoto | mapeamento heterogêneo |
| `remoteId` | `string` | não | `remoteId?: string` | correto para UUID remoto |
| `user_id` | não | `uuid` | só no tipo remoto | tenant só no remoto |
| `templateId` / `template_id` | indexado + unique composto | `text` | `string` | consistente |
| `key` | indexado | `text` | `string` | consistente |
| `value` | `string` | `text` | `string` | consistente |
| `isDeleted` / `is_deleted` | sim | `boolean` | sim | consistente |
| `deletedAt` / `deleted_at` | não modelado localmente | `timestamptz` | só remoto | divergência |
| `createdAt` / `created_at` | sim | `timestamptz` | consistente |
| `updatedAt` / `updated_at` | sim | `timestamptz` | consistente |
| `syncStatus` | sim | não | sim | controle local apenas |
| unicidade | `[templateId+key]` | `UNIQUE(user_id, template_id, key)` | não expressa em TS | consistente funcional |

Trecho local:

```ts
// src/db/database.ts
promptMemory:
  "++id, key, templateId, [templateId+key], remoteId, syncStatus, isDeleted",
```

## `media_assets`

| Campo | Dexie | Supabase | TypeScript | Observação |
|---|---|---|---|---|
| tabela | não existe | existe | não existe | remoto órfão |
| `id` | n/a | `bigint` | n/a | sem tipagem local |
| `filename` | n/a | `text` | n/a | sem consumo no app |
| `storage_url` | n/a | `text` | n/a | sem consumo no app |
| `local_path` | n/a | `text` | n/a | sem consumo no app |
| `synced_at` | n/a | `timestamptz` | n/a | sem fluxo local |
| `user_id` | n/a | ausente | n/a | fragilidade multi-tenant |
| `created_at` / `updated_at` | n/a | ausentes | n/a | auditoria fraca |
| soft delete | n/a | ausente | n/a | não segue padrão do núcleo |

## `client_errors`

| Campo | Dexie | Supabase | TypeScript | Observação |
|---|---|---|---|---|
| tabela | não existe | existe | não existe | remoto órfão |
| `id` | n/a | `bigint` | n/a | sem tipagem local |
| `error_data` | n/a | `jsonb` | n/a | sem pipeline observável |
| `captured_at` | n/a | `timestamptz` | n/a | sem consumo local |
| `severity` | n/a | `varchar` | n/a | sem enum local |
| `source` | n/a | `varchar` | n/a | sem enum local |
| `user_id` | n/a | ausente | n/a | não segue multi-tenancy do núcleo |
| soft delete | n/a | ausente | n/a | fora do padrão |

# 5. Lista de Migrations

Migrations remotas confirmadas no projeto Supabase conectado:

1. `20260220000000_initial_schema`
2. `20260228160000_templates`
3. `20260309090000_prompt_contract_v3`
4. `20260310110000_template_prompt_engine`
5. `20260310123000_fix_function_search_path`
6. `20260317213609_remote_schema`
7. `20260319000000_restore_missing_columns`
8. `20260319040000_add_selected_menu_ids_to_prompts`
9. `20260319050000_optimize_rls_policies`
10. `20260326000001_security_hardening`
11. `20260326000002_consolidate_rls_policies`
12. `20260326000003_restore_categories_timestamps`
13. `20260326000004_fix_context_menus_rls_and_schema`
14. `20260327000001_soft_delete_and_missing_columns`
15. `20260327000002_add_selection_mode_to_context_menus`
16. `20260327093000_add_soft_delete_and_sync_columns`
17. `20260330000000_fix_supabase_linter_issues`
18. `20260501180000_prompt_memory_context`
19. `20260502034613_scope_prompt_memory_by_template`
20. `20260505200000_split_memory_rls_policies`
21. `20260506000000_fix_security_and_performance_issues`
22. `20260508170000_security_hardening_v2`
23. `20260511022638_remote_schema`
24. `20260511143000_remove_prompt_netlify_trigger`
25. `20260513120000_harden_prompt_memory_select_policy`
26. `20260521041043_harden_realtime_security_contract`
27. `20260621000000_fix_realtime_memory`
28. `20260629000000_add_storage_update_policy`

Observações:

- Há duas migrations chamadas `remote_schema`, em `20260317213609` e `20260511022638`, indício claro de sincronizações remotas amplas sobrepondo estrutura manual.
- O repositório também possui uma trilha Drizzle paralela, porém separada:
  - `db/schema.ts`
  - `db/index.ts`
  - `migrations/0000_nostalgic_nightshade.sql`

# 6. Inconsistências Encontradas

## Alta criticidade

1. `prompts.selected_menu_ids` está divergente entre contrato de código e schema remoto ativo.
   - Código trata como `number[]`
   - Schema remoto ativo expõe `jsonb`
   - Existe ainda `selected_menu_ids_jsonb`, reforçando deriva e duplicidade

2. Tipagens geradas de Supabase estão vazias.
   - `src/models/supabase-types.ts`: vazio
   - `src/lib/supabase.types.ts`: vazio
   - Resultado: nenhuma garantia de compilação contra o schema remoto real

3. Drizzle modela `posts`, não o domínio real da aplicação.
   - `db/schema.ts` contém apenas `posts`
   - `migrations/0000_nostalgic_nightshade.sql` cria apenas `posts`
   - Isso não representa `categories`, `prompts`, `context_menus` ou `prompt_memory_context`

4. `media_assets` e `client_errors` existem remotamente, mas não existem localmente nem nas tipagens.
   - O repositório não é fonte de verdade completa do Supabase conectado

## Média criticidade

5. `deleted_at` existe no remoto para entidades centrais, mas não é modelado localmente.

6. `Category.icon` e `Category.color` são obrigatórios no TypeScript, mas nullable no Supabase.

7. `ContextMenu.description` é obrigatória no TypeScript, mas nullable no Supabase.

8. `Prompt.categoryId` é obrigatório no TypeScript local, mas `category_id` é nullable no remoto.

9. As colunas legadas de `prompts` ainda existem no remoto e seguem sendo populadas por compatibilidade.
   - `system_role`
   - `task`
   - `context`
   - `context_menus`
   - `constraints`
   - `negative_prompt`
   - `output_schema`

## Baixa criticidade

10. Dexie mantém histórico de migrations longas no mesmo arquivo, com legados embutidos, o que aumenta custo cognitivo.

11. `menuOptions` permanece como conceito legado em tipos e histórico Dexie, mesmo fora do schema atual.

# 7. Riscos de Segurança (RLS)

## Núcleo principal

Evidência forte, mas parcialmente inferida:

- `categories`, `context_menus`, `prompts` e `prompt_memory_context` estão com `rls_enabled: true` na introspecção remota.
- As migrations mostram várias rodadas de endurecimento para:
  - consolidar políticas duplicadas
  - restringir `TO authenticated`
  - usar `user_id = (SELECT auth.uid())`
  - excluir `is_deleted = true` em `SELECT`

Trecho representativo:

```sql
CREATE POLICY "prompts_select" ON public.prompts
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (is_deleted = FALSE));
```

## Riscos observados

### Risco 1, deriva entre policy pretendida e estado real

Há muitas migrations sucessivas de RLS, inclusive `remote_schema` regenerada. Isso aumenta o risco de drift entre:

- policy esperada pelo código
- policy versionada no git
- policy realmente aplicada em produção

Isso é particularmente sensível porque não houve introspecção direta de `pg_policies` pelo conector atual, apenas:

- confirmação de `rls_enabled = true`
- leitura das migrations
- advisor atual

### Risco 2, `prompt_memory_context` teve janela histórica mais fraca

Sequência observada:

1. tabela criada com policy `FOR ALL`
2. depois `template_id` foi adicionado
3. depois políticas foram divididas
4. depois `memory_select` foi endurecida para `authenticated` e `is_deleted = false`

Conclusão:

- O estado atual parece endurecido
- O histórico mostra que essa tabela passou por mais instabilidade de política do que o núcleo principal

### Risco 3, `media_assets` e `client_errors` não seguem o padrão multi-tenant do núcleo

No schema remoto confirmado:

- `media_assets` não tem `user_id`
- `client_errors` não tem `user_id`

Implicação:

- se essas tabelas forem expostas diretamente ao cliente, o modelo multi-tenant fica estruturalmente fraco ou inexistente
- se forem apenas internas, isso deveria estar explicitado em documentação e políticas, o que não está representado no código da app

### Risco 4, Auth security com alerta ativo

Advisor remoto atual:

- `Leaked Password Protection Disabled`
- Remediação oficial: [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

Isso não é vazamento de dados entre usuários, mas é um risco de endurecimento de autenticação ainda pendente.

# 8. Riscos de Perda/Duplicação de Dados

## 1. Exclusão lógica local seguida de remoção física local

O sistema usa soft delete remoto, mas frequentemente remove fisicamente do Dexie após confirmação remota ou em handlers de realtime:

```ts
await db.prompts.delete(deletedLocal.id!);
await db.contextMenus.delete(deletedLocal.id!);
await db.categories.delete(deletedLocal.id!);
```

Risco:

- perda de trilha local para auditoria e replay
- dificuldade para investigar conflitos de exclusão concorrente

## 2. Conflito distribuído e não transacional

Cada entidade resolve conflito de maneira própria:

- `categorySync.ts` compara timestamps remotos e locais
- `promptSync.ts` idem
- `memorySync.ts` usa `updated_at`
- `assetManager.ts` aplica `remoteWins` por padrão no `smartSync`

Risco:

- decisões diferentes para o mesmo tipo de corrida
- comportamento não uniforme entre sync explícito, autosync e realtime

## 3. `remoteWins` automático no `smartSync`

```ts
await resolveConflicts(conflicts, "remoteWins");
```

Risco:

- mudança remota mais nova pode sobrescrever edição local legítima sem intervenção do usuário

## 4. Dependência de mapeamento entre IDs locais e remotos

`prompts.selectedMenuIds` depende de tradução `remoteId -> localId` no download:

```ts
const localMenuIds = (p.selected_menu_ids || [])
  .map((rid: number) => remoteToLocalMenuMap.get(rid))
  .filter((id): id is number => id !== undefined);
```

Risco:

- se o payload remoto vier em formato inesperado, ou se faltar menu local correspondente, parte da seleção pode desaparecer silenciosamente

## 5. `prompt_memory_context` tem identidade heterogênea

- Dexie usa `id` numérico local
- Supabase usa `UUID`
- relação real é por `[templateId+key]`

Risco:

- inconsistências de reconciliação se algum fluxo depender indevidamente de `id`

# 9. Análise do Sync e Offline

## O que existe

- persistência local imediata via Dexie
- `syncStatus` por registro: `pending`, `synced`, `error`
- autosync com debounce de 10s
- Realtime por tabela
- sync manual/agregado via `syncService.ts`
- backup local criptografado em `localStorage`

## O que não existe

- fila dedicada de sync com ordem, retries persistentes e causalidade explícita
- journal transacional unificado de mutações
- estratégia consistente de merge semântico
- dead letter queue

## Comportamento offline

- offline preserva gravação local
- reconexão chama `reconnectRealtime()`, depois `syncPendingChanges()`
- se Supabase não estiver configurado, cloud é desabilitada graciosamente

## Problemas observados

### 1. Sync baseado em varredura por tabela

Não há `sync_queue`. O sistema procura registros `pending` diretamente nas tabelas.

Vantagem:

- implementação simples

Desvantagem:

- sem ordenação causal explícita
- sem granularidade por operação
- sem payload de intenção

### 2. Sync parcial é considerado sucesso

`syncToCloud()` retorna `true` mesmo com falhas parciais:

```ts
if (failed.length === phases.length) {
  throw new Error(...)
}
return true; // Partial success
```

Risco:

- UI pode considerar sincronização concluída quando houve erro em uma ou mais fases

### 3. Pull e push coexistem com lógica paralela

Há dois caminhos:

- `syncService.ts`, mais linear
- `assetManager.ts`, mais “inteligente”

Risco:

- dois motores de sync competindo conceitualmente
- difícil provar qual é o contrato oficial de produção

### 4. Realtime deleta localmente em resposta a `is_deleted`

Isso mantém a UI limpa, mas elimina contexto útil para replay ou investigação.

### 5. Polling de atualização foi historicamente caro

Os relatórios em `reports/supabase-egress-findings.json` registram que o app fazia leituras amplas para detecção de diffs. O código atual já contém mitigação parcial, mas a trilha mostra que a arquitetura de sync já causou custo operacional relevante.

# 10. Dependências/Código Morto

## Drizzle ORM

Status real: **não usado no fluxo de produção da app**

Evidências:

- `package.json` possui:
  - `drizzle-orm`
  - `drizzle-kit`
  - scripts `db:generate`, `db:migrate`, `db:studio`
- `db/schema.ts` define apenas `posts`
- `migrations/0000_nostalgic_nightshade.sql` cria apenas `posts`
- `db/index.ts` configura Neon + Drizzle
- não há imports de `db/index.ts` no código da app
- não há queries Drizzle no runtime principal

Trecho:

```ts
// db/schema.ts
export const posts = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull().default('')
});
```

Diagnóstico:

- Drizzle hoje é dependência residual ou trilha abortada
- não é fonte de verdade do domínio
- manter scripts `db:*` nesse estado induz falsa percepção de governança ORM

## Tipos Supabase gerados

Status real: **código morto / placeholder vazio**

- `src/models/supabase-types.ts`
- `src/lib/supabase.types.ts`

## `menuOptions`

Status real: **legado interno removido do schema Dexie atual**

## `syncStatus.ts`

Status real: **UI helper parcial, não é o orquestrador real**

- descreve fases conceituais
- não está conectado ao fluxo principal consolidado de sync

# 11. Débitos Técnicos

## Alta

- Divergência estrutural de `prompts.selected_menu_ids`
- Drizzle presente, mas desconectado do domínio real
- Tipos Supabase vazios
- Tabelas remotas `media_assets` e `client_errors` fora do mapa de verdade do repositório
- Dois motores conceituais de sync (`syncService.ts` e `assetManager.ts`)

## Média

- Soft delete remoto com hard delete local em vários fluxos
- Política de conflitos distribuída e pouco uniforme
- Legado de colunas antigas ainda mantidas em `prompts`
- Modelagem local não inclui `deleted_at`
- Nullable remoto versus obrigatório local em múltiplas entidades

## Baixa

- Histórico Dexie muito longo dentro de um único arquivo
- Conceitos legados ainda presentes em nomenclatura e comentários
- Índices remotos com baixo uso segundo advisor

# 12. Arquivos e Comandos

## Arquivos inspecionados

- `package.json`
- `drizzle.config.ts`
- `db/index.ts`
- `db/schema.ts`
- `migrations/0000_nostalgic_nightshade.sql`
- `src/db/database.ts`
- `src/models/types.ts`
- `src/models/memory.ts`
- `src/models/promptSchema.ts` (trechos relevantes via referências indiretas)
- `src/lib/supabase.ts`
- `src/lib/supabaseConfig.ts`
- `src/services/supabaseCategories.ts`
- `src/services/supabaseMenus.ts`
- `src/services/supabasePrompts.ts`
- `src/services/syncService.ts`
- `src/services/sync/categorySync.ts`
- `src/services/sync/menuSync.ts`
- `src/services/sync/promptSync.ts`
- `src/services/sync/memorySync.ts`
- `src/services/sync/utils.ts`
- `src/services/realtimeService.ts`
- `src/services/assetManager.ts`
- `src/services/autoSync.ts`
- `src/services/storage/dexieMemory.ts`
- `src/context/CloudSyncContext.tsx`
- `src/pages/CategoryManagerPage.tsx`
- `src/pages/MenuManagerPage.tsx`
- `src/pages/EditorPage.tsx`
- `supabase/config.toml`
- `supabase/migrations/*.sql`
- `README.md`
- `reports/supabase-egress-findings.json`
- `reports/supabase-egress-validation.json`

## Comandos e inspeções executados

```bash
/opt/homebrew/bin/rg -n "dexie|supabase|drizzle|sync|categories|prompts|context_menus|prompt_memory_context|media_assets|client_errors" src supabase package.json
sed -n '1,260p' src/db/database.ts
sed -n '1,260p' src/models/types.ts
sed -n '1,320p' src/services/sync/promptSync.ts
sed -n '1,260p' src/services/realtimeService.ts
sed -n '1,260p' supabase/migrations/20260220000000_initial_schema.sql
sed -n '1,260p' supabase/migrations/20260309090000_prompt_contract_v3.sql
sed -n '1,260p' supabase/migrations/20260501180000_prompt_memory_context.sql
sed -n '1,260p' supabase/migrations/20260511022638_remote_schema.sql
```

Inspeções remotas read-only via conector Supabase:

- listagem detalhada de tabelas públicas
- listagem de migrations aplicadas
- advisors de segurança
- advisors de performance

# 13. Recomendações Priorizadas

1. Definir uma única fonte de verdade para o schema remoto, hoje ela não é nem Drizzle nem os tipos TS.
2. Corrigir imediatamente a deriva de `prompts.selected_menu_ids` versus `selected_menu_ids_jsonb`.
3. Gerar tipagens reais do Supabase e substituir os arquivos vazios.
4. Decidir explicitamente o destino de `media_assets` e `client_errors`:
   - incorporar ao modelo oficial
   - ou declarar como fora do escopo desta app e removê-las do mapa conceitual
5. Consolidar o motor de sync em um único caminho oficial.
6. Padronizar a estratégia de conflito por entidade e por operação.
7. Modelar `deleted_at` localmente, ou assumir formalmente que ele é apenas remoto e documentar isso.
8. Remover ou isolar o stack Drizzle enquanto ele não representar o domínio real.

# 14. Proposta de Roadmap

## Correções Críticas

- Normalizar o contrato de `prompts.selected_menu_ids`
- Gerar e adotar tipos reais do Supabase
- Escolher e documentar um único engine de sync
- Auditar o papel real de `media_assets` e `client_errors`

## Melhorias Estruturais

- Introduzir uma fila de sync explícita ou journal de mutações
- Centralizar resolução de conflitos em um único módulo
- Eliminar duplicidade entre colunas legadas e payload moderno de `prompts`
- Reduzir acoplamento entre handlers de Realtime e mutações destrutivas locais

## Evoluções Futuras

- Adotar reconciliação mais semântica que timestamp only
- Criar observabilidade de sync por entidade
- Implementar replay seguro de falhas e conflitos
- Separar formalmente tabelas de domínio do app e tabelas auxiliares de telemetria/media

# 15. Próximo Passo Recomendado

A primeira intervenção de baixo risco recomendada é: **gerar e versionar tipagens reais do Supabase para o schema remoto atual, sem alterar comportamento de runtime**.

Justificativa:

- não muda dados
- não executa migração
- expõe imediatamente as divergências reais entre o schema remoto e o TypeScript
- reduz risco antes de qualquer refatoração estrutural
- permite atacar com segurança o caso mais crítico, `prompts.selected_menu_ids`

Se essa intervenção for feita primeiro, a próxima etapa natural passa a ser uma refatoração orientada por tipos para alinhar `prompts`, `context_menus` e `prompt_memory_context` entre frontend, sync e banco remoto.
