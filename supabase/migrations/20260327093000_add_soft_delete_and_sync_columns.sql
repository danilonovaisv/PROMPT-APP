BEGIN;

-- ============================================================
-- Schema sync + soft delete support
-- Adds columns required by frontend sync/realtime contracts.
-- ============================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.context_menus
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Speed up active-record queries used by sync/download flows
CREATE INDEX IF NOT EXISTS idx_categories_user_active
  ON public.categories (user_id, is_deleted);

CREATE INDEX IF NOT EXISTS idx_context_menus_user_active
  ON public.context_menus (user_id, is_deleted);

CREATE INDEX IF NOT EXISTS idx_prompts_user_active
  ON public.prompts (user_id, is_deleted);

COMMIT;
