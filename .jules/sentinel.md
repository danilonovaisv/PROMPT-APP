## 2026-03-27 - Unnecessary target=_blank changes\n**Vulnerability:** None originally. Added `target="_blank"` simply to add `rel="noopener noreferrer"`.\n**Learning:** Don't introduce arbitrary UX changes to force a security enhancement. If a link doesn't open in a new tab, it's not vulnerable to reverse tabnabbing, so modifying its UX just to add `noopener noreferrer` is unnecessary.\n**Prevention:** Carefully review if a given element actually requires the security enhancement before modifying it.

## 2025-02-12 - Insecure Deserialization in LocalStorage
**Vulnerability:** Application blindly trusted data parsed from `localStorage` (`JSON.parse` cast directly with `as AppSnapshot`).
**Learning:** `localStorage` is susceptible to tampering by users or malicious scripts. Accessing nested properties on unvalidated deserialized data can cause unhandled `TypeError` crashes or potentially expose logic flaws.
**Prevention:** Always implement runtime type validation (e.g., a type guard like `isValidSnapshot` or Zod schemas) immediately after `JSON.parse` before asserting types or accessing deeply nested properties.
## 2026-05-06 - Supabase Linter Security Fixes
**Vulnerability:** Role mutable search_path in functions (`handle_updated_at`, `set_updated_at`), public execution of `SECURITY DEFINER` function (`rls_auto_enable`), disabled leaked password protection, and duplicate permissive RLS policies.
**Learning:** Default generated triggers and functions may leave search paths unspecified, making them vulnerable to malicious overriding. Functions intended as internal triggers (like `rls_auto_enable`) should not be publicly executable. Duplicate policies created dynamically or by accident compound performance issues.
**Prevention:** Always explicitly set `SET search_path = ''` in PostgreSQL function definitions. Use `REVOKE EXECUTE ON FUNCTION... FROM PUBLIC` for internal trigger functions. Regularly audit and configure `password_hibp_enabled` in `config.toml` to improve authentication security.
## 2026-05-07 - CI Pipeline Fixes for config.toml
**Vulnerability:** N/A (CI Build Fix)
**Learning:** Adding unsupported keys (like `password_hibp_enabled` under `[auth]`) to `supabase/config.toml` causes the Supabase CLI parsing to fail, breaking CI builds. Certain advanced security settings are exclusively managed via the Supabase dashboard rather than the standard CLI config files.
**Prevention:** Verify if a configuration option exists in the Supabase CLI docs before adding it to `config.toml` to prevent pipeline parse errors.
