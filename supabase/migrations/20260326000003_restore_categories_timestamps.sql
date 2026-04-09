-- ============================================================
-- PATCH: Restaurar updated_at em categories + REPLICA IDENTITY FULL
-- ============================================================
-- Causa: migration 20260317213609_remote_schema.sql dropou updated_at de categories,
--        mas syncService.ts ainda compara timestamps para last-write-wins.
--        REPLICA IDENTITY FULL é necessário para filtros row-level no Realtime.
-- ============================================================

BEGIN;

-- 1. Restaurar coluna updated_at em categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Preencher updated_at para registros existentes
UPDATE public.categories
SET updated_at = COALESCE(created_at, NOW())
WHERE updated_at IS NULL;

-- 3. Trigger para manter updated_at atualizado automaticamente
DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. REPLICA IDENTITY FULL para suporte a filtros row-level no Realtime
-- Necessário para que eventos UPDATE/DELETE incluam payload completo
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.context_menus REPLICA IDENTITY FULL;
ALTER TABLE public.prompts REPLICA IDENTITY FULL;

-- 5. Validação
DO $$
DECLARE
  has_updated_at boolean;
  rep_cat text;
  rep_ctx text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories'
      AND column_name = 'updated_at'
  ) INTO has_updated_at;

  SELECT CASE relreplident
    WHEN 'f' THEN 'FULL'
    ELSE 'NOT FULL'
  END INTO rep_cat
  FROM pg_class WHERE relname = 'categories' AND relkind = 'r';

  SELECT CASE relreplident
    WHEN 'f' THEN 'FULL'
    ELSE 'NOT FULL'
  END INTO rep_ctx
  FROM pg_class WHERE relname = 'context_menus' AND relkind = 'r';

  RAISE NOTICE '=== Validação 000003 ===';
  RAISE NOTICE 'categories.updated_at existe: %', has_updated_at;
  RAISE NOTICE 'categories REPLICA IDENTITY: %', rep_cat;
  RAISE NOTICE 'context_menus REPLICA IDENTITY: %', rep_ctx;

  IF NOT has_updated_at THEN
    RAISE EXCEPTION 'categories.updated_at não foi criada — verificar permissões';
  END IF;

  RAISE NOTICE '=== Validação passou ✓ ===';
END;
$$;

-- ROLLBACK MANUAL (se necessário reverter):
-- ALTER TABLE public.categories REPLICA IDENTITY DEFAULT;
-- ALTER TABLE public.context_menus REPLICA IDENTITY DEFAULT;
-- ALTER TABLE public.prompts REPLICA IDENTITY DEFAULT;
-- DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
-- ALTER TABLE public.categories DROP COLUMN IF EXISTS updated_at;

COMMIT;
