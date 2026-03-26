# Diagnóstico — `context_menus` e `categories` não atualizam / somem no Table Editor

## Escopo
Investigação baseada em evidências de código/migrations do repositório, com foco em:
- Realtime publication
- RLS/policies
- replica identity
- triggers
- divergências de schema
- fluxo app (Dexie ↔ Supabase)

## Evidências consolidadas (repositório)
1. Houve drift de schema após sync remoto (`20260317213609_remote_schema.sql`):
   - `categories.updated_at` foi removida.
   - `context_menus.selection_mode` foi removida.
2. Migração corretiva posterior já existe para restaurar `categories.updated_at` e `REPLICA IDENTITY FULL`:
   - `20260326000003_restore_categories_timestamps.sql`.
3. Migração corretiva de RLS em `context_menus` e limpeza de coluna residual também já existe:
   - `20260326000004_fix_context_menus_rls_and_schema.sql`.
4. Diagnóstico interno documentado em `docs/audits/TESTE-SQL-SUPABASE.md` indica que persistência de UPDATE funciona em SQL e anomalias remanescentes estavam concentradas em policy roles de `context_menus` e coluna residual.

## Causa-raiz provável
Causa principal provável no ambiente remoto: **estado parcialmente migrado** (migrations corretivas presentes no repo, mas possivelmente não aplicadas integralmente no projeto Supabase alvo). Isso explica sintomas como:
- comportamento inconsistente no Table Editor;
- divergência entre estado esperado pela aplicação e schema/policies efetivos no banco.

## Ação mínima viável
1. Garantir aplicação de migrations pendentes no remoto (`supabase db push --linked`).
2. Executar pacote de diagnóstico SQL:
   - `supabase/diagnostics/20260326_context_menus_categories_table_editor_diagnostic.sql`.
3. Validar se o problema persiste no Studio sem filtros ativos e com ordenação previsível (`updated_at DESC`).

## Hardening adicional no app
Foi aplicado ajuste defensivo no listener Realtime para evitar subscriptions duplicadas (cenário comum de mount + auth state + reconnect):
- `setupRealtimeListeners()` agora chama `cleanupRealtimeListeners()` no início.

Esse ajuste não altera a persistência no banco, mas elimina risco de duplicidade de eventos no cliente.
