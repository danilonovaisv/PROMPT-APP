-- ============================================================
-- RLS POLICY CONSOLIDATION + SCHEMA INTEGRITY MIGRATION
-- Advisor Fixes: multiple_permissive_policies + no_primary_key
-- ============================================================
-- Generated: 2026-03-26
-- Advisor Warnings Addressed:
--   [PERFORMANCE] multiple_permissive_policies → categories (4), context_menus (4), prompts (4+)
--   [PERFORMANCE] no_primary_key              → context_menus PK validated/ensured
--   [PERFORMANCE] unused_index                → drop confirmed-unused indexes
-- ============================================================
--
-- STRATEGY:
--   The remote_schema sync (20260317213609) re-created all legacy policies
--   on top of the optimized ones (20260319050000). This migration performs
--   a clean wipe of EVERY known policy name, then creates exactly ONE
--   canonical policy per (table, action, role) combination.
--
--   Policy logic preserved: user_id = (select auth.uid())
--   Pattern: (select auth.uid()) avoids auth_rls_initplan warning
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: CATEGORIES TABLE — Remove all duplicate policies
-- ============================================================

-- Batch drop of every policy name ever used on this table
-- (both legacy names and optimized names)
DROP POLICY IF EXISTS "Controle Total Categorias"               ON public.categories;
DROP POLICY IF EXISTS "Individual access"                       ON public.categories;
DROP POLICY IF EXISTS "Categories - delete for owner"          ON public.categories;
DROP POLICY IF EXISTS "Categories - insert for authenticated"  ON public.categories;
DROP POLICY IF EXISTS "Categories - select for authenticated"  ON public.categories;
DROP POLICY IF EXISTS "Categories - update for owner"          ON public.categories;
DROP POLICY IF EXISTS "categories_delete_authenticated"        ON public.categories;
DROP POLICY IF EXISTS "categories_insert_authenticated"        ON public.categories;
DROP POLICY IF EXISTS "categories_owner_delete"                ON public.categories;
DROP POLICY IF EXISTS "categories_owner_insert"                ON public.categories;
DROP POLICY IF EXISTS "categories_owner_read"                  ON public.categories;
DROP POLICY IF EXISTS "categories_owner_update"                ON public.categories;
DROP POLICY IF EXISTS "categories_select_authenticated"        ON public.categories;
DROP POLICY IF EXISTS "categories_update_authenticated"        ON public.categories;
DROP POLICY IF EXISTS "categories_select"                      ON public.categories;
DROP POLICY IF EXISTS "categories_insert"                      ON public.categories;
DROP POLICY IF EXISTS "categories_update"                      ON public.categories;
DROP POLICY IF EXISTS "categories_delete"                      ON public.categories;

-- Canonical policies — one per action, role = authenticated
-- Uses (select auth.uid()) to avoid auth_rls_initplan overhead
-- IMPORTANTE: Filtra is_deleted = false para SELECT para evitar retorno de dados excluídos
CREATE POLICY "categories_select" ON public.categories
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (is_deleted = FALSE));

CREATE POLICY "categories_insert" ON public.categories
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "categories_update" ON public.categories
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "categories_delete" ON public.categories
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- ============================================================
-- SECTION 2: CONTEXT_MENUS TABLE — Remove all duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "Controle Total Menus"                      ON public.context_menus;
DROP POLICY IF EXISTS "Individual access"                         ON public.context_menus;
DROP POLICY IF EXISTS "ContextMenus - delete for owner"          ON public.context_menus;
DROP POLICY IF EXISTS "ContextMenus - insert for authenticated"  ON public.context_menus;
DROP POLICY IF EXISTS "ContextMenus - select for authenticated"  ON public.context_menus;
DROP POLICY IF EXISTS "ContextMenus - update for owner"          ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_delete_authenticated"       ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_insert_authenticated"       ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_delete"               ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_insert"               ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_read"                 ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_update"               ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_select_authenticated"       ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_update_authenticated"       ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_select"                     ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_insert"                     ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_update"                     ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_delete"                     ON public.context_menus;

-- Canonical policies — one per action
CREATE POLICY "context_menus_select" ON public.context_menus
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (is_deleted = FALSE));

CREATE POLICY "context_menus_insert" ON public.context_menus
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "context_menus_update" ON public.context_menus
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "context_menus_delete" ON public.context_menus
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- ============================================================
-- SECTION 3: PROMPTS TABLE — Remove all duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "Controle Total Prompts"                   ON public.prompts;
DROP POLICY IF EXISTS "Individual access"                        ON public.prompts;
DROP POLICY IF EXISTS "Prompts - delete for owner"              ON public.prompts;
DROP POLICY IF EXISTS "Prompts - insert for authenticated"      ON public.prompts;
DROP POLICY IF EXISTS "Prompts - select for authenticated"      ON public.prompts;
DROP POLICY IF EXISTS "Prompts - update for owner"              ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete_authenticated"            ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete_own"                      ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert_authenticated"            ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert_own"                      ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_delete"                    ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_insert"                    ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_read"                      ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_update"                    ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_authenticated"            ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_own"                      ON public.prompts;
DROP POLICY IF EXISTS "prompts_update_authenticated"            ON public.prompts;
DROP POLICY IF EXISTS "prompts_update_own"                      ON public.prompts;
DROP POLICY IF EXISTS "prompts_select"                          ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert"                          ON public.prompts;
DROP POLICY IF EXISTS "prompts_update"                          ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete"                          ON public.prompts;

-- Canonical policies — one per action
CREATE POLICY "prompts_select" ON public.prompts
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) AND (is_deleted = FALSE));

CREATE POLICY "prompts_insert" ON public.prompts
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "prompts_update" ON public.prompts
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "prompts_delete" ON public.prompts
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- ============================================================
-- SECTION 4: CONTEXT_MENUS — Ensure Primary Key exists
-- Advisor flags no_primary_key. The remote schema shows id was
-- altered to GENERATED BY DEFAULT AS IDENTITY but the PK
-- constraint may not exist if it was dropped during sync.
-- ============================================================

DO $$
BEGIN
  -- Check if PK already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'context_menus'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    -- Add the PK on the existing identity column
    ALTER TABLE public.context_menus ADD PRIMARY KEY (id);
    RAISE NOTICE 'PRIMARY KEY added to public.context_menus(id)';
  ELSE
    RAISE NOTICE 'PRIMARY KEY already exists on public.context_menus — skipping';
  END IF;
END;
$$;


-- ============================================================
-- SECTION 5: DROP UNUSED INDEXES
-- Indexes confirmed as candidates based on advisor data.
-- Guards: DROP INDEX IF EXISTS ensures idempotency.
-- These were legacy indexes from earlier migrations and the
-- columns they reference were dropped in remote_schema sync.
-- ============================================================

-- context_menus_updated_at_idx: created in prior migration,
-- not present in remote_schema final state — safe to drop
DROP INDEX IF EXISTS public.context_menus_updated_at_idx;

-- prompts_schema_version_idx: already dropped in remote_schema (line 101)
-- Adding here for idempotency in case it still exists
DROP INDEX IF EXISTS public.prompts_schema_version_idx;

-- prompts_output_format_idx: already dropped in remote_schema (line 99)
DROP INDEX IF EXISTS public.prompts_output_format_idx;

-- context_menus_selection_mode_idx: already dropped in remote_schema (line 97)
DROP INDEX IF EXISTS public.context_menus_selection_mode_idx;


-- ============================================================
-- SECTION 6: VALIDATION QUERIES
-- These do NOT modify data — they verify the migration result.
-- ============================================================

DO $$
DECLARE
  cat_count  int;
  cm_count   int;
  pr_count   int;
  pk_exists  boolean;
BEGIN
  SELECT count(*) INTO cat_count
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories';

  SELECT count(*) INTO cm_count
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'context_menus';

  SELECT count(*) INTO pr_count
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'context_menus'
      AND constraint_type = 'PRIMARY KEY'
  ) INTO pk_exists;

  RAISE NOTICE '=== RLS Policy Validation ===';
  RAISE NOTICE 'categories:    % policies (expected: 4)', cat_count;
  RAISE NOTICE 'context_menus: % policies (expected: 4)', cm_count;
  RAISE NOTICE 'prompts:       % policies (expected: 4)', pr_count;
  RAISE NOTICE 'context_menus PK exists: %', pk_exists;

  -- Fail migration if counts are wrong
  IF cat_count <> 4 THEN
    RAISE EXCEPTION 'categories policy count mismatch: got % expected 4', cat_count;
  END IF;
  IF cm_count <> 4 THEN
    RAISE EXCEPTION 'context_menus policy count mismatch: got % expected 4', cm_count;
  END IF;
  IF pr_count <> 4 THEN
    RAISE EXCEPTION 'prompts policy count mismatch: got % expected 4', pr_count;
  END IF;
  IF NOT pk_exists THEN
    RAISE EXCEPTION 'context_menus PRIMARY KEY was not created';
  END IF;

  RAISE NOTICE '=== All validations passed ✓ ===';
END;
$$;

COMMIT;
