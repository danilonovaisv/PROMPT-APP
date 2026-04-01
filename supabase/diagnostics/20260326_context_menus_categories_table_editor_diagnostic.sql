-- ============================================================
-- PROMPT-APP | Diagnóstico de "sumiço"/não atualização no Table Editor
-- Escopo: public.categories + public.context_menus
-- Segurança: blocos de inspeção são read-only; teste controlado usa transação com ROLLBACK
-- ============================================================

-- [BLOCO 1] Tabela real x view/materialized view + definição de colunas
SELECT
  c.table_schema,
  c.table_name,
  t.table_type
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema
 AND t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.table_name IN ('categories', 'context_menus')
GROUP BY c.table_schema, c.table_name, t.table_type
ORDER BY c.table_name;

SELECT
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('categories', 'context_menus')
ORDER BY table_name, ordinal_position;

-- [BLOCO 2] RLS status + policies efetivas por role/comando
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('categories', 'context_menus')
  AND c.relkind = 'r'
ORDER BY c.relname;

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('categories', 'context_menus')
ORDER BY tablename, policyname;

-- [BLOCO 3] Triggers/funções que podem alterar visibilidade/estado
SELECT
  event_object_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('categories', 'context_menus')
ORDER BY event_object_table, trigger_name;

SELECT
  n.nspname AS function_schema,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('set_updated_at')
ORDER BY function_schema, function_name;

-- [BLOCO 4] Realtime publication + replica identity
SELECT
  p.pubname,
  n.nspname AS schema_name,
  c.relname AS table_name
FROM pg_publication p
JOIN pg_publication_rel pr ON pr.prpubid = p.oid
JOIN pg_class c ON c.oid = pr.prrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE p.pubname = 'supabase_realtime'
  AND n.nspname = 'public'
  AND c.relname IN ('categories', 'context_menus')
ORDER BY c.relname;

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
    ELSE c.relreplident::text
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('categories', 'context_menus')
  AND c.relkind = 'r'
ORDER BY c.relname;

-- [BLOCO 5] Soft delete, colunas de filtro e ordenação
SELECT
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('categories', 'context_menus')
  AND column_name IN (
    'deleted_at', 'is_deleted', 'is_active',
    'user_id', 'created_at', 'updated_at',
    'name', 'menu_name', 'menu_id'
  )
ORDER BY table_name, column_name;

-- [BLOCO 6] Últimas linhas (visibilidade pós-update)
SELECT *
FROM public.categories
ORDER BY updated_at DESC NULLS LAST, id DESC
LIMIT 20;

SELECT *
FROM public.context_menus
ORDER BY updated_at DESC NULLS LAST, id DESC
LIMIT 20;

-- [BLOCO 7] Integridade básica / duplicatas lógicas
SELECT
  user_id,
  menu_id,
  COUNT(*) AS total
FROM public.context_menus
GROUP BY user_id, menu_id
HAVING COUNT(*) > 1
ORDER BY total DESC, user_id, menu_id;

-- [BLOCO 8] Teste controlado de UPDATE (sem persistir mudança)
-- Objetivo: provar se UPDATE funciona e se linha permanece selecionável
BEGIN;

WITH chosen AS (
  SELECT id, menu_name
  FROM public.context_menus
  ORDER BY updated_at DESC NULLS LAST, id DESC
  LIMIT 1
)
UPDATE public.context_menus cm
SET menu_name = CONCAT(chosen.menu_name, ' [diag]')
FROM chosen
WHERE cm.id = chosen.id
RETURNING cm.id, cm.user_id, cm.menu_name, cm.updated_at;

WITH chosen AS (
  SELECT id, name
  FROM public.categories
  ORDER BY updated_at DESC NULLS LAST, id DESC
  LIMIT 1
)
UPDATE public.categories c
SET name = CONCAT(chosen.name, ' [diag]')
FROM chosen
WHERE c.id = chosen.id
RETURNING c.id, c.user_id, c.name, c.updated_at;

-- Confirma leitura imediatamente após UPDATE
SELECT id, user_id, name, updated_at
FROM public.categories
ORDER BY updated_at DESC NULLS LAST, id DESC
LIMIT 5;

SELECT id, user_id, menu_name, updated_at
FROM public.context_menus
ORDER BY updated_at DESC NULLS LAST, id DESC
LIMIT 5;

ROLLBACK;

-- [BLOCO 9] Histórico de migrations relevante no ambiente remoto
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
WHERE name ILIKE '%categories%'
   OR name ILIKE '%context_menus%'
   OR name ILIKE '%realtime%'
   OR name ILIKE '%rls%'
ORDER BY inserted_at DESC;

-- [BLOCO 10] Checklist de causa-raiz orientado por saída SQL
-- 1) Se table_type != BASE TABLE -> há view no caminho.
-- 2) Se policies roles/cmd divergirem do esperado -> possível bloqueio select/update.
-- 3) Se replica_identity != FULL -> payload parcial em UPDATE/DELETE no realtime.
-- 4) Se tabela fora de supabase_realtime publication -> app não recebe eventos.
-- 5) Se UPDATE do bloco 8 funcionar e persistência for confirmada fora do Table Editor,
--    forte evidência de inconsistência visual/filtro/ordenação no Studio.
