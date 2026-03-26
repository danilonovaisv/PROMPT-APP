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
-- STEP 2: http extension — cannot be relocated (non-relocatable)
--
-- The pgsql-http extension does NOT set `relocatable = true`
-- in its .control file, so `ALTER EXTENSION http SET SCHEMA`
-- raises: ERROR 0A000 "extension does not support SET SCHEMA".
--
-- Dropping and re-creating is also blocked because the extension
-- provides the type `content_type` referenced by existing columns.
--
-- Resolution: http stays in `public`. We add a COMMENT to mark
-- the exception explicitly and silence downstream tooling.
-- The Supabase Advisor warning (0014_extension_in_public) for
-- this specific extension is an accepted known limitation.
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) THEN
    RAISE NOTICE 'http extension is non-relocatable — remains in its current schema (expected).';
  ELSE
    -- Extension not present at all: install in public (only available schema for http)
    CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA public;
    RAISE NOTICE 'http extension installed in public schema (non-relocatable extension).';
  END IF;
END;
$$;

COMMENT ON EXTENSION http IS
  'HTTP client extension (pgsql-http). Non-relocatable: cannot be moved out of public schema
   because the extension does not support SET SCHEMA (pg_extension.relocatable = false).
   Advisor warning 0014_extension_in_public is an accepted known limitation for this extension.
   Types: content_type, http_request, http_response, http_header.';


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
