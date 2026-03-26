-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Advisor Fixes: extension_in_public + function_search_path_mutable
-- ============================================================
-- Generated: 2026-03-26
-- Advisor Warnings Addressed:
--   [SECURITY] extension_in_public         → http extension moved to extensions schema
--   [SECURITY] function_search_path_mutable → count_estimate declared with fixed search_path
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: Ensure dedicated extensions schema exists
-- The config.toml already sets extra_search_path = ["public", "extensions"]
-- so moving extensions here does NOT break any API queries.
-- -------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to standard roles so extension functions remain callable
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;


-- -------------------------------------------------------
-- STEP 2: Move `http` extension from public → extensions
--
-- IMPORTANT: Cannot use DROP + CREATE because the http extension
-- provides the type `content_type` which is referenced by the column
-- `context_menus.modo_de_selecao` (content_type[]). Dropping the
-- extension would destroy the type and break the column.
--
-- CORRECT APPROACH: ALTER EXTENSION ... SET SCHEMA
-- This moves the extension's namespace atomically without destroying
-- any types, functions, or objects it provides. All dependent columns
-- (content_type[], http_request, etc.) remain fully intact.
--
-- NOTE: supabase_functions.http_request (used by Netfly trigger)
--       is a SEPARATE function in a different schema — NOT affected.
-- -------------------------------------------------------
DO $$
BEGIN
  -- Only act if http is currently installed in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'http' AND n.nspname = 'public'
  ) THEN
    -- ALTER EXTENSION SET SCHEMA moves the extension and all its objects
    -- (types, functions, operators) to the target schema WITHOUT dropping
    -- anything. Columns using content_type[] remain valid.
    ALTER EXTENSION http SET SCHEMA extensions;
    RAISE NOTICE 'Moved http extension from public → extensions schema (ALTER EXTENSION SET SCHEMA)';
  ELSIF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) THEN
    RAISE NOTICE 'http extension already exists (not in public schema) — no action needed';
  ELSE
    -- Extension not installed at all — install in extensions schema
    CREATE EXTENSION http WITH SCHEMA extensions;
    RAISE NOTICE 'http extension installed in extensions schema';
  END IF;
END;
$$;

COMMENT ON EXTENSION http IS
  'HTTP client extension. Moved from public to extensions schema for security
   (Supabase Advisor lint 0014_extension_in_public).
   Types: content_type, http_request, http_response, http_header.
   Column context_menus.modo_de_selecao (content_type[]) remains valid after move.';


-- -------------------------------------------------------
-- STEP 3: Secure count_estimate function
-- Context: pg_temp_43.count_estimate is a session-scoped function
-- created by a DB Studio session and cannot be directly altered
-- (the session that created it has already ended).
--
-- Resolution: We declare the canonical count_estimate in public schema
-- WITH a fixed search_path so the Advisor no longer flags it.
-- Future sessions that call count_estimate will use this version.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_estimate(query text)
  RETURNS bigint
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
  SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  rec   record;
  rows  bigint;
BEGIN
  FOR rec IN EXECUTE 'EXPLAIN ' || query LOOP
    rows := substring(rec."QUERY PLAN" FROM ' rows=([[:digit:]]+)');
    EXIT WHEN rows IS NOT NULL;
  END LOOP;
  RETURN rows;
END;
$$;

COMMENT ON FUNCTION public.count_estimate(text) IS
  'Returns the PostgreSQL planner estimate for the number of rows a query would return.
   Uses EXPLAIN to avoid full table scan. search_path is fixed to prevent path-hijacking
   (Advisor lint 0011_function_search_path_mutable).';


-- -------------------------------------------------------
-- STEP 4: Update config.toml context note
-- The auth.leaked_password_protection cannot be enabled via SQL.
-- It MUST be enabled via Supabase Dashboard:
--   → https://supabase.com/dashboard/project/<PROJECT_ID>/auth/security
--   → Section: "Password Security"
--   → Toggle: "Enable Leaked Password Protection" → ON
--
-- For local dev only, add to supabase/config.toml under [auth]:
--   password_hibp_enabled = true
-- -------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'ACTION REQUIRED (Dashboard):';
  RAISE NOTICE 'Enable Leaked Password Protection in Supabase Auth settings.';
  RAISE NOTICE 'URL: Dashboard → Auth → Security → Password Security';
  RAISE NOTICE '==========================================================';
END;
$$;
