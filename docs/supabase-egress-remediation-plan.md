# Supabase Egress Remediation Plan

## Alternatives Evaluated

1. Restore billing first, leave code unchanged.
   - Rejected as unsafe because the existing browser sync pattern can immediately resume overage.
2. Disable cloud sync entirely.
   - Rejected as too disruptive for normal product behavior.
3. Keep sync features, but replace full-table polling with metadata-first checks and selective hydration.
   - Selected because it directly targets the highest uncached egress multiplier with low product disruption.
4. Migrate all public assets out of Supabase immediately.
   - Deferred. It may be warranted, but cached egress attribution is not fully proven yet.

## Prioritized Corrections

### P0

- Stop periodic full-table polling for authenticated sessions.
- Use metadata-only remote summaries for conflict checks.
- Hydrate full rows only for confirmed diffs.
- Keep Realtime as the primary sync trigger.

### P1

- Refactor sync flows to pull explicit columns instead of `*` where full payloads are not required.
- Revisit prompt memory autosync granularity in the editor.
- Add rate-aware telemetry for sync flows.
- Audit Storage bucket visibility and external access patterns.

### P2

- Separate public media and application data into different projects or delivery paths if operationally justified.
- Add usage alerting and monthly egress budget thresholds.
- Create support-ready dashboards and canned SQL for future incidents.

## Estimated Reduction

- Session-driven uncached egress from automatic update checks should fall from repeated multi-megabyte reads to small metadata fetches only when Realtime is unavailable.
- Under normal Realtime healthy sessions, periodic update polling should drop to zero.
- Manual sync still fetches real payloads when needed, but that becomes user-initiated rather than timer-driven.

## Risks

- Metadata-only checks depend on `updated_at` staying reliable across writes.
- Manual sync still transfers large prompt payloads when real updates exist.
- If cached egress was dominated by external hotlinking, code changes alone will not resolve that portion.

## Owners

- Product owner: billing decision and Storage exposure decision.
- Engineering: sync-flow remediation and validation.
- Operations: post-unblock monitoring.

## Acceptance Criteria

- No automatic full-table polling while Realtime is active.
- Update checks use metadata-only queries.
- Sync regression tests pass.
- Lint, typecheck, targeted tests, and production build pass.
- Post-unblock usage shows materially lower uncached egress per active session.

## Rollback

- Revert the mitigation commit on `fix/supabase-egress-incident`.
- Restore the prior polling behavior only if a production blocker is found, and only temporarily.
- Do not roll back billing actions in code. Billing rollback remains an owner decision in Supabase.
