-- Migration to fix security and performance issues identified by Supabase Linter

BEGIN;

-- 1. FIX SECURITY: Function Search Path Mutable
-- Adding SET search_path TO '' explicitly to prevent role mutable search_path vulnerabilities
ALTER FUNCTION public.handle_updated_at() SET search_path TO '';
ALTER FUNCTION public.set_updated_at() SET search_path TO '';

-- 2. FIX SECURITY: Public Can Execute SECURITY DEFINER Function
-- Revoking EXECUTE from anon and authenticated for rls_auto_enable as it's an event trigger function
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 3. FIX PERFORMANCE: Multiple Permissive Policies
-- Dropping redundant permissive policies for the same role and action on core tables
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

COMMIT;
