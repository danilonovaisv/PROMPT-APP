-- ==========================================
-- SUPABASE RLS POLICY OPTIMIZATION MIGRATION
-- ==========================================
-- This migration drops redundant permissive policies
-- and creates standardized ones using (select auth.uid())
-- to prevent the auth_rls_initplan performance warning.

-- --------------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- --------------------------------------------------------------------------------

-- Drop existing redundant policies
DROP POLICY IF EXISTS "Controle Total Categorias" ON public.categories;
DROP POLICY IF EXISTS "Individual access" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_owner_delete" ON public.categories;
DROP POLICY IF EXISTS "categories_owner_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_owner_read" ON public.categories;
DROP POLICY IF EXISTS "categories_owner_update" ON public.categories;
DROP POLICY IF EXISTS "categories_select_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_update_authenticated" ON public.categories;

-- Extra policies that might have been dynamically generated
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;


-- Create optimized standard policies
CREATE POLICY "categories_select" ON public.categories 
  FOR SELECT TO authenticated 
  USING (user_id = (select auth.uid()));

CREATE POLICY "categories_insert" ON public.categories 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "categories_update" ON public.categories 
  FOR UPDATE TO authenticated 
  USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "categories_delete" ON public.categories 
  FOR DELETE TO authenticated 
  USING (user_id = (select auth.uid()));


-- --------------------------------------------------------------------------------
-- 2. CONTEXT MENUS TABLE
-- --------------------------------------------------------------------------------

-- Drop existing redundant policies
DROP POLICY IF EXISTS "Controle Total Menus" ON public.context_menus;
DROP POLICY IF EXISTS "Individual access" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_delete_authenticated" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_insert_authenticated" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_delete" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_insert" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_read" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_owner_update" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_select_authenticated" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_update_authenticated" ON public.context_menus;

-- Extra policies that might have been dynamically generated
DROP POLICY IF EXISTS "context_menus_select" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_insert" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_update" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_delete" ON public.context_menus;


-- Create optimized standard policies
CREATE POLICY "context_menus_select" ON public.context_menus 
  FOR SELECT TO authenticated 
  USING (user_id = (select auth.uid()));

CREATE POLICY "context_menus_insert" ON public.context_menus 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "context_menus_update" ON public.context_menus 
  FOR UPDATE TO authenticated 
  USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "context_menus_delete" ON public.context_menus 
  FOR DELETE TO authenticated 
  USING (user_id = (select auth.uid()));


-- --------------------------------------------------------------------------------
-- 3. PROMPTS TABLE
-- --------------------------------------------------------------------------------

-- Drop existing redundant policies
DROP POLICY IF EXISTS "Controle Total Prompts" ON public.prompts;
DROP POLICY IF EXISTS "Individual access" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete_authenticated" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete_own" ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert_authenticated" ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert_own" ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_delete" ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_insert" ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_read" ON public.prompts;
DROP POLICY IF EXISTS "prompts_owner_update" ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_authenticated" ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_own" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update_authenticated" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update_own" ON public.prompts;

-- Extra policies that might have been dynamically generated
DROP POLICY IF EXISTS "prompts_select" ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete" ON public.prompts;


-- Create optimized standard policies
CREATE POLICY "prompts_select" ON public.prompts 
  FOR SELECT TO authenticated 
  USING (user_id = (select auth.uid()));

CREATE POLICY "prompts_insert" ON public.prompts 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "prompts_update" ON public.prompts 
  FOR UPDATE TO authenticated 
  USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "prompts_delete" ON public.prompts 
  FOR DELETE TO authenticated 
  USING (user_id = (select auth.uid()));
