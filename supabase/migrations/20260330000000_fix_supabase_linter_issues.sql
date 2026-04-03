-- Migração para corrigir problemas detectados pelo Linter do Supabase
-- 1. Remoção de múltiplas políticas permissivas
-- 2. Remoção de índices não utilizados

BEGIN;

-- ==============================================================================
-- 1. CORREÇÃO DE POLÍTICAS MÚLTIPLAS PERMISSIVAS
-- ==============================================================================

-- Tabela: categories
DROP POLICY IF EXISTS "categories_owner_delete" ON public.categories;
DROP POLICY IF EXISTS "categories_owner_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_owner_read" ON public.categories;
DROP POLICY IF EXISTS "categories_owner_update" ON public.categories;

-- Tabela: context_menus
DROP POLICY IF EXISTS "context_menus_owner_delete" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_insert" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_read" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_update" ON public.context_menus;

-- Tabela: prompts
DROP POLICY IF EXISTS "prompts_owner_delete" ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_insert" ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_read" ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_update" ON public.prompts;

-- Manteremos apenas:
-- categories: categories_delete, categories_insert, categories_select, categories_update
-- context_menus: context_menus_delete, context_menus_insert, context_menus_select, context_menus_update
-- prompts: prompts_delete, prompts_insert, prompts_select, prompts_update


-- ==============================================================================
-- 2. REMOÇÃO DE ÍNDICES NÃO UTILIZADOS
-- ==============================================================================

-- Tabela: context_menus
DROP INDEX IF EXISTS context_menus_created_at_idx;
DROP INDEX IF EXISTS context_menus_description_idx;
DROP INDEX IF EXISTS context_menus_menu_name_idx;
DROP INDEX IF EXISTS idx_context_menus_active;
DROP INDEX IF EXISTS context_menus_is_deleted_idx;
DROP INDEX IF EXISTS context_menus_selection_mode_idx;
DROP INDEX IF EXISTS context_menus_updated_at_idx;

-- Tabela: categories
DROP INDEX IF EXISTS idx_categories_active;

COMMIT;
