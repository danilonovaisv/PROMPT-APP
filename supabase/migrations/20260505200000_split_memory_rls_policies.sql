-- ============================================================
-- SPLIT prompt_memory_context RLS POLICY
-- Replaces the single FOR ALL policy with 4 granular policies,
-- matching the consolidated pattern from 20260326000002.
-- ============================================================
-- Generated: 2026-05-05
-- Advisor pattern: one permissive policy per DML operation
-- avoids multiple_permissive_policies lint and is easier to audit.
-- ============================================================

BEGIN;

-- Drop the existing catch-all policy
DROP POLICY IF EXISTS "Users can manage their own memory context" ON public.prompt_memory_context;

-- Canonical 4-policy set — uses (SELECT auth.uid()) to avoid auth_rls_initplan overhead
CREATE POLICY "memory_select" ON public.prompt_memory_context
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "memory_insert" ON public.prompt_memory_context
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "memory_update" ON public.prompt_memory_context
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "memory_delete" ON public.prompt_memory_context
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Validation
DO $$
DECLARE
  pol_count int;
BEGIN
  SELECT count(*) INTO pol_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'prompt_memory_context';

  RAISE NOTICE '=== prompt_memory_context RLS Validation ===';
  RAISE NOTICE 'Policies: % (expected: 4)', pol_count;

  IF pol_count <> 4 THEN
    RAISE EXCEPTION 'prompt_memory_context policy count mismatch: got % expected 4', pol_count;
  END IF;

  RAISE NOTICE '=== Validation passed ✓ ===';
END;
$$;

COMMIT;
