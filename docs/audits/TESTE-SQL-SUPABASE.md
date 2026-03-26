# Audit SQL Supabase — PROMPT-APP
**Data:** 2026-03-26 | **Projeto:** `dpejskjpghoozbpfxkpf.supabase.co`

---

## Resultados dos Blocos SQL

### BLOCO 1: Estrutura real das tabelas

| table_name    | column_name     | data_type                | is_nullable | column_default |
| ------------- | --------------- | ------------------------ | ----------- | -------------- |
| categories    | id              | bigint                   | NO          | null           |
| categories    | user_id         | uuid                     | NO          | auth.uid()     |
| categories    | name            | text                     | NO          | null           |
| categories    | icon            | text                     | YES         | null           |
| categories    | color           | text                     | YES         | null           |
| categories    | created_at      | timestamp with time zone | YES         | now()          |
| categories    | updated_at      | timestamp with time zone | YES         | now()          |
| context_menus | id              | bigint                   | NO          | null           |
| context_menus | user_id         | uuid                     | NO          | auth.uid()     |
| context_menus | menu_id         | text                     | NO          | null           |
| context_menus | menu_name       | text                     | NO          | null           |
| context_menus | description     | text                     | YES         | null           |
| context_menus | options         | jsonb                    | NO          | '[]'::jsonb    |
| context_menus | created_at      | timestamp with time zone | YES         | now()          |
| context_menus | updated_at      | timestamp with time zone | YES         | now()          |
| context_menus | modo_de_selecao | ARRAY                    | YES         | null           |

> ⚠️ **ANOMALIA:** `context_menus.modo_de_selecao` (ARRAY) é coluna residual de migration incorreta. Não é usada pelo código. **→ REMOVIDA na migration 000004.**

---

### BLOCO 2: Políticas RLS atuais

| tablename     | policyname           | roles                                                                                                               | cmd    | qual                                    | with_check                              |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------- | --------------------------------------- |
| categories    | categories_delete    | {authenticated}                                                                                                     | DELETE | (user_id = ( SELECT auth.uid() AS uid)) | null                                    |
| categories    | categories_insert    | {authenticated}                                                                                                     | INSERT | null                                    | (user_id = ( SELECT auth.uid() AS uid)) |
| categories    | categories_select    | {authenticated}                                                                                                     | SELECT | (user_id = ( SELECT auth.uid() AS uid)) | null                                    |
| categories    | categories_update    | {authenticated}                                                                                                     | UPDATE | (user_id = ( SELECT auth.uid() AS uid)) | (user_id = ( SELECT auth.uid() AS uid)) |
| context_menus | context_menus_delete | {authenticated,postgres,supabase_realtime_admin}                                                                    | DELETE | (user_id = ( SELECT auth.uid() AS uid)) | null                                    |
| context_menus | context_menus_insert | {authenticated,postgres,supabase_realtime_admin}                                                                    | INSERT | null                                    | (user_id = ( SELECT auth.uid() AS uid)) |
| context_menus | context_menus_select | {authenticated,dashboard_user,postgres,supabase_realtime_admin}                                                     | SELECT | (user_id = ( SELECT auth.uid() AS uid)) | null                                    |
| context_menus | context_menus_update | {authenticated,cli_login_postgres,dashboard_user,postgres,service_role,supabase_auth_admin,supabase_realtime_admin} | UPDATE | (user_id = ( SELECT auth.uid() AS uid)) | (user_id = ( SELECT auth.uid() AS uid)) |

> ❌ **CRÍTICO - `context_menus`:** Roles `postgres`, `service_role`, `dashboard_user`, `supabase_realtime_admin`, `supabase_auth_admin`, `cli_login_postgres` são superusers que **bypassam RLS automaticamente**. Incluí-los nas policies é redundante e amplia superfície de ataque. **→ CORRIGIDO na migration 000004 (apenas `authenticated`).**
>
> ✅ **`categories`:** RLS correta — apenas `{authenticated}`.

---

### BLOCO 3: REPLICA IDENTITY

| tabela        | replica_identity        |
| ------------- | ----------------------- |
| categories    | FULL (todas as colunas) |
| context_menus | FULL (todas as colunas) |
| prompts       | FULL (todas as colunas) |

> ✅ **OK** — REPLICA IDENTITY FULL ativo. Filtros row-level no Realtime funcionarão corretamente para eventos UPDATE e DELETE.

---

### BLOCO 4: Publicação Realtime

| pubname           | schemaname | tablename     |
| ----------------- | ---------- | ------------- |
| supabase_realtime | public     | categories    |
| supabase_realtime | public     | context_menus |
| supabase_realtime | public     | prompts       |

> ✅ **OK** — Todas as 3 tabelas publicadas no `supabase_realtime`.

---

### BLOCO 5: Triggers

| trigger_name                 | event_object_table | event_manipulation | action_timing | action_statement                  |
| ---------------------------- | ------------------ | ------------------ | ------------- | --------------------------------- |
| categories_set_updated_at    | categories         | UPDATE             | BEFORE        | EXECUTE FUNCTION set_updated_at() |
| context_menus_set_updated_at | context_menus      | UPDATE             | BEFORE        | EXECUTE FUNCTION set_updated_at() |

> ✅ **OK** — Ambos os triggers existem e funcionam. `updated_at` será atualizado automaticamente em qualquer UPDATE.

---

### BLOCO 6: Teste de UPDATE controlado

| id | menu_name              | updated_at                    |
| -- | ---------------------- | ----------------------------- |
| 37 | DIREÇÃO DE ARTE [test] | 2026-03-26 21:06:39.614572+00 |

> ✅ **OK** — UPDATE funcionou e `updated_at` foi atualizado pelo trigger. Persistência confirmada.

---

### BLOCO 7: Duplicatas (user_id + menu_id)

> ✅ **sucesso** — Sem duplicatas.

---

### BLOCO 8: `categories.updated_at`

| column_name |
| ----------- |
| updated_at  |

> ✅ **OK** — Coluna existe. Migration 000003 aplicada com sucesso.

---

### BLOCO 9: Migration history — Query incorreta

> ℹ️ A query usou `executed_at` que não existe no schema `supabase_migrations.schema_migrations`.
> A coluna correta é `inserted_at`. Cosmético — não afeta o sistema.
> Query correta: `SELECT version, name, inserted_at FROM supabase_migrations.schema_migrations ORDER BY inserted_at DESC;`

---

## Resumo de Ações Tomadas

| # | Problema Encontrado | Severidade | Ação | Migration |
|---|---|---|---|---|
| 1 | `categories.updated_at` ausente | Crítico | Restaurada via migration 000003 | ✅ Aplicado |
| 2 | `context_menus` RLS com roles excessivos | Alto | DROP + CREATE com apenas `authenticated` | 📦 000004 criada |
| 3 | `context_menus.modo_de_selecao` (ARRAY) — coluna residual | Médio | DROP COLUMN | 📦 000004 criada |
| 4 | REPLICA IDENTITY não era FULL | Alto | `ALTER TABLE ... REPLICA IDENTITY FULL` | ✅ Aplicado (000003) |
| 5 | Query Bloco 9 com coluna errada (`executed_at`) | Baixo | Documentado — não requer action | — |

---

## Próximo Passo

```bash
# Aplicar a migration 000004 ao banco remoto
supabase db push --linked
```

**Após o push, verificar:**
```sql
-- Confirmar remoção de modo_de_selecao
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'context_menus' AND column_name = 'modo_de_selecao';
-- Esperado: 0 linhas

-- Confirmar roles das políticas de context_menus
SELECT policyname, roles FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'context_menus';
-- Esperado: todas as roles = {authenticated}
```
