-- ============================================================
-- MIGRATION: Soft Delete + Colunas JSONB Faltantes
-- ============================================================
-- Resolve dois problemas:
--   1. Colunas few_shot_examples / selection_payload_jsonb /
--      compiled_payload_jsonb estão no código mas ausentes no DB,
--      causando erros silenciosos de payload na sincronização.
--   2. Hard DELETEs permitem que itens "excluídos" retornem ao
--      webapp via downloadFromCloud() ou syncToCloud().
--      O Soft Delete (is_deleted) resolve de forma definitiva.
-- ============================================================

BEGIN;

-- ══════════════════════════════════════════════════════════
-- 1. COLUNAS JSONB FALTANTES EM prompts
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS few_shot_examples       JSONB        NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selection_payload_jsonb  JSONB,
  ADD COLUMN IF NOT EXISTS compiled_payload_jsonb   JSONB;

-- ══════════════════════════════════════════════════════════
-- 2. SOFT DELETE — is_deleted nas 3 tabelas principais
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.context_menus
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- ══════════════════════════════════════════════════════════
-- 3. ÍNDICES COMPOSTOS para filtros is_deleted = false
--    (evita full-scan em tabelas com muitos registros)
-- ══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_prompts_active
  ON public.prompts (user_id, is_deleted)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_categories_active
  ON public.categories (user_id, is_deleted)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_context_menus_active
  ON public.context_menus (user_id, is_deleted)
  WHERE is_deleted = FALSE;

-- ══════════════════════════════════════════════════════════
-- 4. VALIDAÇÃO
-- ══════════════════════════════════════════════════════════

DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('prompts', 'categories', 'context_menus')
    AND column_name = 'is_deleted';

  RAISE NOTICE '=== Validação 20260327000001 ===';
  RAISE NOTICE 'Tabelas com is_deleted: % / 3', col_count;

  IF col_count < 3 THEN
    RAISE EXCEPTION 'is_deleted não foi adicionada em todas as tabelas — verificar permissões';
  END IF;

  RAISE NOTICE '=== Validação passou ✓ ===';
END;
$$;

COMMIT;
