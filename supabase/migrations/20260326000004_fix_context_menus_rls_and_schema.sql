-- ============================================================
-- MIGRATION: Corrigir políticas RLS de context_menus
-- 
-- PROBLEMA IDENTIFICADO (TESTE-SQL-SUPABASE.md - Bloco 2):
--   As políticas de context_menus têm roles excessivos que não são necessários
--   e representam uma superfície de ataque desnecessária:
--
--   context_menus_delete → {authenticated, postgres, supabase_realtime_admin}
--   context_menus_insert → {authenticated, postgres, supabase_realtime_admin}
--   context_menus_select → {authenticated, dashboard_user, postgres, supabase_realtime_admin}
--   context_menus_update → {authenticated, cli_login_postgres, dashboard_user, postgres,
--                            service_role, supabase_auth_admin, supabase_realtime_admin}
--
--   Apenas {authenticated} deve ter acesso via RLS para dados de usuário.
--   Roles de infraestrutura (postgres, service_role, etc) são superusers e
--   bypassam RLS automaticamente — incluí-los é redundante e abre brechas.
--
-- PROBLEMA 2 (Bloco 1):
--   context_menus tem coluna 'modo_de_selecao' (ARRAY) que é resíduo
--   de uma migration anterior. A coluna correta ('selection_mode') foi
--   removida em 20260317213609_remote_schema.sql.
--   'modo_de_selecao' é uma tradução incorreta que não é usada pelo código.
--   REMOVAL SAFE: código não a usa (verificado em supabaseMenus.ts, syncService.ts,
--   realtimeService.ts, contextMenuSync.ts).
--
-- TAMBÉM:
--   categories RLS está correto: apenas {authenticated} — manter.
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: Corrigir roles nas políticas de context_menus
-- Estratégia: DROP e recriar apenas com TO authenticated
-- ============================================================

-- 1.1 DROP políticas atuais que têm roles excessivos
DROP POLICY IF EXISTS "context_menus_delete" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_insert" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_select" ON public.context_menus;
DROP POLICY IF EXISTS "context_menus_update" ON public.context_menus;

-- 1.2 Verificar que RLS está habilitado
ALTER TABLE public.context_menus ENABLE ROW LEVEL SECURITY;

-- 1.3 Recriar políticas APENAS com authenticated
--     Usa (SELECT auth.uid()) para evitar aviso de performance auth_rls_initplan

CREATE POLICY "context_menus_select"
  ON public.context_menus
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "context_menus_insert"
  ON public.context_menus
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "context_menus_update"
  ON public.context_menus
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "context_menus_delete"
  ON public.context_menus
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- PARTE 2: Remover coluna 'modo_de_selecao' (resíduo de migration)
-- Esta coluna do tipo ARRAY não é usada pelo código e é resíduo
-- de uma migration incorreta (tradução em português de selection_mode)
-- Verificado: nenhum serviço referencia esta coluna
-- ============================================================
ALTER TABLE public.context_menus 
  DROP COLUMN IF EXISTS modo_de_selecao;

-- ============================================================
-- PARTE 3: Validação final
-- ============================================================
DO $$
DECLARE
  has_modo_selecao boolean;
  policy_count_cm  int;
  policy_count_cat int;
  roles_ok         boolean;
BEGIN
  -- Verificar remoção de modo_de_selecao
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'context_menus'
      AND column_name = 'modo_de_selecao'
  ) INTO has_modo_selecao;

  -- Contar políticas em context_menus
  SELECT COUNT(*) INTO policy_count_cm
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'context_menus';

  -- Contar políticas em categories
  SELECT COUNT(*) INTO policy_count_cat
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'categories';

  -- Verificar que políticas de context_menus são APENAS para authenticated
  SELECT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'context_menus'
      AND roles::text NOT IN ('{authenticated}', '{}')
  ) INTO roles_ok;

  RAISE NOTICE '=== Validação 000004 ===';
  RAISE NOTICE 'context_menus.modo_de_selecao removida: %', NOT has_modo_selecao;
  RAISE NOTICE 'Políticas context_menus: % (esperado: 4)', policy_count_cm;
  RAISE NOTICE 'Políticas categories: % (esperado: 4)', policy_count_cat;
  RAISE NOTICE 'Roles context_menus apenas authenticated: %', roles_ok;

  IF has_modo_selecao THEN
    RAISE WARNING 'modo_de_selecao ainda existe — verificar permissões';
  END IF;

  IF policy_count_cm != 4 THEN
    RAISE EXCEPTION 'Número inesperado de políticas em context_menus: %', policy_count_cm;
  END IF;

  IF NOT roles_ok THEN
    RAISE EXCEPTION 'Políticas context_menus ainda têm roles indevidos';
  END IF;

  RAISE NOTICE '=== Validação passou ✓ ===';
END;
$$;

COMMIT;
