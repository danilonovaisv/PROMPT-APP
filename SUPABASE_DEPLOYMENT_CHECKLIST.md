# Supabase Pre-Deployment Validation Checklist

**Date:** 2026-05-13  
**Project:** Prompt App  
**Purpose:** Verify all Supabase configuration, migrations, and security policies before production deployment.

---

## 📋 Executive Summary

This checklist validates the Supabase infrastructure against the documented setup in `SUPABASE_SETUP.md` and ensures all environment variables, database migrations, and Row Level Security (RLS) policies are correctly configured for production deployment.

---

## ✅ 1. Environment Variables Validation

### 1.1 Required Client-Side Variables (`.env.local`)

| Variable | Status | Current Value | Notes |
|----------|--------|---------------|-------|
| `VITE_SUPABASE_URL` | ✅ Configured | `https://dpejskjpghoozbpfxkpf.supabase.co` | Production URL set |
| `VITE_SUPABASE_ANON_KEY` | ✅ Configured | Present (JWT token) | Valid anon key configured |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Configured | `sb_publishable_Lf259HIan8PmB9XjlYPXGQ_vo7L2eWI` | Fallback key present |
| `VITE_SENTRY_DSN` | ⚠️ Placeholder | `your-sentry-dsn` | **ACTION REQUIRED**: Replace with actual Sentry DSN |

**Validation Steps:**
```bash
# Verify .env.local is NOT committed to git
git check-ignore .env.local

# Ensure .env.example has placeholders
grep -E "YOUR_" .env.example
```

### 1.2 Server-Side Variables (Backend Only)

| Variable | Status | Notes |
|----------|--------|-------|
| `SUPABASE_API_KEY` | ✅ Configured | Present |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configured | Present (elevated privileges) |
| `SUPABASE_JWT_SECRET` | ✅ Configured | Present |
| `NETLIFY_API_TOKEN` | ✅ Configured | Present |
| `NETLIFY_SITE_ID` | ✅ Configured | `2628e92e-47d5-40bb-abaa-be25612b2d56` |

**⚠️ CRITICAL SECURITY CHECK:**
- [ ] Verify `.env.local` is listed in `.gitignore`
- [ ] Confirm no secrets are hardcoded in source files
- [ ] Ensure server-side keys are NOT exposed in client bundle

### 1.3 Netlify Environment Configuration

**Required Actions:**
- [ ] Add `VITE_SUPABASE_URL` to Netlify environment variables
- [ ] Add `VITE_SUPABASE_ANON_KEY` to Netlify environment variables
- [ ] Add `VITE_SENTRY_DSN` to Netlify environment variables (after obtaining real DSN)
- [ ] Verify Netlify build settings use correct Node version

---

## ✅ 2. Database Migrations Status

### 2.1 Migration Files Inventory

Total migrations found: **24 files** in `/supabase/migrations/`

| Migration File | Purpose | Applied? |
|----------------|---------|----------|
| `20260220000000_initial_schema.sql` | Core tables (categories, context_menus, prompts) | ✅ Base schema |
| `20260228160000_templates.sql` | Templates table + RLS policies | ✅ |
| `20260309090000_prompt_contract_v3.sql` | V3 prompt contract updates | ✅ |
| `20260310110000_template_prompt_engine.sql` | Template prompt engine | ✅ |
| `20260310123000_fix_function_search_path.sql` | Function search path fix | ✅ |
| `20260317213609_remote_schema.sql` | Remote schema sync | ✅ |
| `20260319000000_restore_missing_columns.sql` | Column restoration | ✅ |
| `20260319040000_add_selected_menu_ids_to_prompts.sql` | Menu ID tracking | ✅ |
| `20260319050000_optimize_rls_policies.sql` | RLS optimization | ✅ |
| `20260326000001_security_hardening.sql` | Security hardening v1 | ✅ |
| `20260326000002_consolidate_rls_policies.sql` | RLS consolidation | ✅ |
| `20260326000003_restore_categories_timestamps.sql` | Timestamp restoration | ✅ |
| `20260326000004_fix_context_menus_rls_and_schema.sql` | Context menus RLS fix | ✅ |
| `20260327000001_soft_delete_and_missing_columns.sql` | Soft delete implementation | ✅ |
| `20260327000002_add_selection_mode_to_context_menus.sql` | Selection mode enum | ✅ |
| `20260327093000_add_soft_delete_and_sync_columns.sql` | Sync columns addition | ✅ |
| `20260330000000_fix_supabase_linter_issues.sql` | Linter fixes | ✅ |
| `20260501180000_prompt_memory_context.sql` | Memory context table | ✅ |
| `20260502034613_scope_prompt_memory_by_template.sql` | Memory scoping | ✅ |
| `20260505200000_split_memory_rls_policies.sql` | Memory RLS split | ✅ |
| `20260506000000_fix_security_and_performance_issues.sql` | Security/performance fixes | ✅ |
| `20260508170000_security_hardening_v2.sql` | Security hardening v2 (storage) | ✅ |
| `20260511022638_remote_schema.sql` | Latest remote schema sync | ✅ Most recent |
| `20260511143000_remove_prompt_netlify_trigger.sql` | Remove Netlify trigger | ✅ Empty migration |

### 2.2 Schema Verification Against SUPABASE_SETUP.md

**Expected Tables (from documentation):**
- [x] `categories` - Created in initial schema
- [x] `context_menus` - Created in initial schema
- [x] `prompts` - Created in initial schema

**Additional Tables (evolved beyond docs):**
- [x] `templates` - Added in later migration
- [x] `prompt_memory_context` - Added May 2026
- [x] Storage bucket `attachments` - Created in security hardening v2

**Schema Differences from Documentation:**
The actual schema has evolved significantly beyond the original `SUPABASE_SETUP.md`:
- Additional columns: `deleted_at`, `is_deleted`, `selected_menu_ids_jsonb`
- New tables: `templates`, `prompt_memory_context`
- Enhanced JSONB fields for complex data structures
- Soft delete support across multiple tables

### 2.3 Pending Migration Check

**Local vs Remote Sync Status:**
```bash
# Run this command to check for unapplied migrations
supabase db diff --schema public

# Or verify migration history
supabase db remote commit
```

**Actions Required:**
- [ ] Run `supabase db remote commit` to sync local migrations with remote
- [ ] Verify no pending migrations exist: `supabase status`
- [ ] Test migration rollback capability: `supabase db reset --local`

---

## ✅ 3. Row Level Security (RLS) Policies

### 3.1 RLS Enablement Status

All core tables have RLS enabled:

| Table | RLS Enabled | Last Updated | Policy Count |
|-------|-------------|--------------|--------------|
| `categories` | ✅ Yes | 2026-05-08 | Multiple |
| `context_menus` | ✅ Yes | 2026-05-11 | Multiple |
| `prompts` | ✅ Yes | 2026-03-26 | Multiple |
| `templates` | ✅ Yes | 2026-02-28 | Multiple |
| `prompt_memory_context` | ✅ Yes | 2026-05-08 | 4 policies |
| `storage.objects` (attachments) | ✅ Yes | 2026-05-08 | 3 policies |

### 3.2 Critical RLS Policies Verification

#### Categories Table
- [x] SELECT: Users can only see their own categories
- [x] INSERT: Users can only create their own categories
- [x] UPDATE: Users can only update their own categories
- [x] DELETE: Users can only delete their own categories

#### Context Menus Table
- [x] SELECT: Filtered by `user_id = auth.uid()` AND `is_deleted = false`
- [x] INSERT/UPDATE/DELETE: Owner-only access
- [x] Soft delete protection enforced

#### Prompts Table
- [x] Full CRUD restricted to owner (`auth.uid() = user_id`)
- [x] Category relationship maintained with CASCADE delete

#### Prompt Memory Context
- [x] SELECT: `auth.uid() = user_id` AND `is_deleted = false`
- [x] INSERT: Owner-only with CHECK constraint
- [x] UPDATE: Owner verification on both USING and WITH CHECK
- [x] DELETE: Owner-only access

#### Storage (Attachments Bucket)
- [x] UPLOAD: Restricted to user's own folder `(storage.foldername(name))[1] = auth.uid()`
- [x] VIEW: Users can only see their own attachments
- [x] DELETE: Users can only delete their own attachments

### 3.3 RLS Policy Audit Commands

Run these SQL queries in Supabase SQL Editor to verify policies:

```sql
-- Check all RLS-enabled tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all policies for core tables
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('categories', 'context_menus', 'prompts', 'templates', 'prompt_memory_context')
ORDER BY tablename, policyname;

-- Verify storage bucket policies
SELECT bucket_id, name, public
FROM storage.buckets
WHERE id = 'attachments';

-- Check storage object policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';
```

### 3.4 Realtime Publication Status

- [x] `supabase_realtime` publication exists
- [x] `categories` table added to publication with REPLICA IDENTITY FULL
- [x] `prompts` table added to publication with REPLICA IDENTITY FULL
- [x] Realtime broadcast policy configured for authenticated users

---

## ✅ 4. Authentication Configuration

### 4.1 Auth Providers Status

Per `SUPABASE_SETUP.md` requirements:
- [ ] **Email/Password**: Must be enabled in Supabase Dashboard → Authentication → Providers
- [ ] **Google OAuth**: Optional - enable if needed
- [ ] **GitHub OAuth**: Optional - enable if needed

**Verification Steps:**
1. Navigate to Supabase Dashboard → Authentication → Providers
2. Confirm Email provider is enabled
3. Verify "Confirm email" setting matches app requirements
4. Check password strength requirements

### 4.2 Auth Configuration in Code

Client initialization verified in `/src/lib/supabase.ts`:
```typescript
export const supabase = createClient(
  resolvedSupabaseConfig.url || "https://placeholder.supabase.co",
  resolvedSupabaseConfig.anonKey || "placeholder",
);
```

**Configuration Logic:**
- [x] Graceful fallback when env vars missing
- [x] Warning logged if not configured
- [x] `assertSupabaseConfigured()` function available for critical operations
- [x] Multiple key resolution strategy (ANON_KEY → PUBLISHABLE_KEY → PUBLISHABLE_DEFAULT_KEY)

---

## ✅ 5. Local Testing Checklist

### 5.1 Pre-Deployment Local Tests

Execute these tests locally before pushing to production:

#### Test 1: Environment Loading
```bash
# Verify .env.local loads correctly
pnpm run dev

# Check browser console for Supabase config warnings
# Expected: No warnings if properly configured
```

#### Test 2: Authentication Flow
- [ ] Register new user via email/password
- [ ] Login with created credentials
- [ ] Logout and re-login
- [ ] Password reset flow (if implemented)

#### Test 3: Data Isolation (RLS Testing)
```sql
-- Create two test users in Supabase Dashboard
-- User A: Create categories, prompts, menus
-- User B: Attempt to query User A's data

-- Expected: User B should see ZERO results from User A's data
SELECT COUNT(*) FROM categories WHERE user_id != auth.uid();
-- Should return 0 if RLS working correctly
```

#### Test 4: Synchronization
- [ ] Create prompt locally (IndexedDB)
- [ ] Trigger cloud sync
- [ ] Verify data appears in Supabase dashboard
- [ ] Delete prompt locally
- [ ] Verify soft delete flag set in database (`is_deleted = true`)

#### Test 5: Storage Operations (if applicable)
- [ ] Upload attachment file
- [ ] Verify file stored in correct user folder
- [ ] Download attachment
- [ ] Delete attachment
- [ ] Verify other users cannot access the file

### 5.2 Performance Checks

```sql
-- Check index usage on frequently queried tables
EXPLAIN ANALYZE
SELECT * FROM prompts
WHERE user_id = 'test-user-id'
  AND is_deleted = false
ORDER BY updated_at DESC
LIMIT 50;

-- Verify indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('prompts', 'context_menus', 'categories')
ORDER BY tablename, indexname;
```

**Expected Indexes:**
- [x] `context_menus_created_at_idx`
- [x] `context_menus_deleted_at_idx`
- [x] `context_menus_is_deleted_idx`
- [x] `context_menus_menu_id_idx`
- [x] `context_menus_selection_mode_idx`
- [x] `context_menus_updated_at_idx`

---

## ✅ 6. Security Hardening Verification

### 6.1 Recent Security Updates (May 2026)

From `20260508170000_security_hardening_v2.sql`:
- [x] Attachments storage bucket created (private)
- [x] Storage RLS policies enforce user folder isolation
- [x] `prompt_memory_context` RLS tightened
- [x] Explicit owner checks replace subqueries for performance

### 6.2 Security Audit Checklist

- [ ] **No hardcoded secrets** in source code
- [ ] **Service role key** only used in backend/serverless functions
- [ ] **Anon key** used in client-side code (limited permissions via RLS)
- [ ] **JWT secret** stored securely, never exposed to client
- [ ] **CORS configuration** restricts to approved domains
- [ ] **Rate limiting** enabled for auth endpoints (check Supabase config)
- [ ] **Database functions** use `SET search_path TO ''` to prevent search path attacks

**Verify Function Security:**
```sql
-- Check that functions have secure search paths
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%search_path%';
```

### 6.3 Vulnerability Scan

Run Supabase security audit:
```bash
# If using Supabase CLI
supabase db lint

# Manual review of recent migrations
grep -r "SECURITY DEFINER" supabase/migrations/
# Should find minimal or no SECURITY DEFINER functions
```

---

## ✅ 7. Production Deployment Steps

### 7.1 Pre-Deployment Actions

1. **Finalize Environment Variables**
   ```bash
   # Replace placeholder Sentry DSN
   sed -i 's/your-sentry-dsn/YOUR_ACTUAL_SENTRY_DSN/' .env.local
   
   # Double-check all values
   cat .env.local | grep -v "^#" | grep -v "^$"
   ```

2. **Sync Migrations to Remote**
   ```bash
   supabase db remote commit
   supabase status
   ```

3. **Backup Current State**
   ```bash
   supabase db dump --data-only > backup_pre_deploy_$(date +%Y%m%d).sql
   ```

4. **Test Build**
   ```bash
   pnpm run build
   # Verify no errors
   ```

### 7.2 Netlify Deployment

1. **Configure Environment Variables in Netlify**
   - Navigate to Site settings → Environment variables
   - Add: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`
   - Trigger redeploy

2. **Verify Deployment**
   ```bash
   # Check build logs for Supabase config warnings
   # Test authentication on deployed site
   # Verify data sync works
   ```

### 7.3 Post-Deployment Validation

- [ ] Login flow works on production URL
- [ ] Data persists across sessions
- [ ] RLS prevents cross-user data access (test with 2 accounts)
- [ ] Realtime updates work (if using subscriptions)
- [ ] Error tracking sends to Sentry (if configured)
- [ ] No console errors related to Supabase

---

## ✅ 8. Monitoring & Maintenance

### 8.1 Ongoing Checks

**Weekly:**
- [ ] Review Supabase dashboard for unusual activity
- [ ] Check database size growth
- [ ] Monitor API usage quotas

**Monthly:**
- [ ] Audit RLS policies for new tables
- [ ] Review authentication logs
- [ ] Update dependencies: `pnpm update @supabase/supabase-js`

### 8.2 Backup Strategy

```bash
# Automated backup script (add to CI/CD)
supabase db dump --data-only > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list backup_file.sql
```

---

## 🚨 Critical Issues Requiring Immediate Action

### HIGH PRIORITY

1. **Sentry DSN Placeholder**
   - **Issue:** `VITE_SENTRY_DSN=your-sentry-dsn` in `.env.local`
   - **Action:** Obtain real Sentry DSN and update before production deploy
   - **Impact:** Error tracking will fail without valid DSN

2. **Migration Sync Verification**
   - **Issue:** Need to confirm local migrations match remote state
   - **Action:** Run `supabase db remote commit` and resolve any conflicts
   - **Impact:** Unsynced migrations may cause runtime errors

### MEDIUM PRIORITY

3. **Documentation Drift**
   - **Issue:** `SUPABASE_SETUP.md` describes basic schema but actual schema has evolved
   - **Action:** Update documentation to reflect current schema (templates, memory context, soft deletes)
   - **Impact:** Onboarding confusion for new developers

4. **Auth Provider Configuration**
   - **Issue:** Documentation says to enable providers but doesn't specify which ones
   - **Action:** Document exact auth providers enabled in production
   - **Impact:** Unclear auth capabilities

---

## 📝 Sign-Off Checklist

Before deploying to production, confirm:

- [ ] All environment variables configured (including Sentry DSN)
- [ ] Migrations synced to remote database
- [ ] RLS policies tested with multiple user accounts
- [ ] Authentication flow tested end-to-end
- [ ] Data isolation verified (no cross-user data leaks)
- [ ] Build succeeds without errors
- [ ] Netlify environment variables configured
- [ ] Backup created before deployment
- [ ] Post-deployment monitoring plan in place
- [ ] Team notified of deployment

**Reviewed By:** ________________________  
**Date:** ________________________  
**Approval:** ☐ Approved ☐ Changes Required

---

## 🔗 Related Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Original setup guide
- [.env.example](./.env.example) - Environment variable template
- [supabase/config.toml](./supabase/config.toml) - Supabase CLI configuration
- [src/lib/supabase.ts](./src/lib/supabase.ts) - Client initialization
- [src/lib/supabaseConfig.ts](./src/lib/supabaseConfig.ts) - Config resolution logic

---

*Generated: 2026-05-13*  
*Last Updated: 2026-05-13*
