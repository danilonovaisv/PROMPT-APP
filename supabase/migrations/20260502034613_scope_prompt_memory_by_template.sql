-- Migration: Add template_id to prompt_memory_context

-- 1. Add column with a default value to avoid breaking existing data
ALTER TABLE public.prompt_memory_context
ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'global';

-- 2. Drop the old unique constraint
ALTER TABLE public.prompt_memory_context
DROP CONSTRAINT IF EXISTS prompt_memory_context_user_id_key_key;

-- 3. Add the new unique constraint
ALTER TABLE public.prompt_memory_context
ADD CONSTRAINT prompt_memory_context_user_id_template_id_key_key UNIQUE(user_id, template_id, key);
