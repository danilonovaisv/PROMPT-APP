# Supabase Egress Runbook

## Detect a Spike

1. Open Supabase usage for the affected billing cycle.
2. Compare cached and uncached egress against the previous cycle.
3. Confirm whether the project is restricted, under grace period, or actively billing overage.

## Identify the Responsible Service

1. Check usage graphs by service.
2. Review recent API, Auth, Storage, Realtime, and Edge Function logs.
3. Compare request count versus transferred bytes to distinguish chatty APIs from large file delivery.

## Investigate Storage

1. List buckets, visibility, object count, and largest objects.
2. Confirm whether the app code references Supabase Storage at all.
3. If not, treat public bucket traffic as an external access hypothesis.
4. Check for public URLs, signed URLs, repeated downloads, bots, or hotlinking.

## Investigate API

1. Search the repo for `select("*")`, broad `range()`, unbounded `list()`, and repeated sync triggers.
2. Quantify payload size for large JSON or text columns.
3. Estimate egress using request frequency times average payload size.
4. Prioritize timer-driven and session-driven calls before one-off admin flows.

## Investigate Realtime

1. Count channels opened per session.
2. Verify cleanup on auth changes and reconnects.
3. Confirm whether polling still runs even when Realtime is healthy.

## Respond to Abuse

1. If a public bucket is being abused, confirm whether it is required to remain public.
2. If possible, move or rename exposed assets, or change delivery path after approval.
3. Preserve evidence before blocking access patterns.

## Evaluate Spend Cap

1. Determine current organization plan.
2. If Pro with Spend Cap enabled, estimate worst-case cost before disabling it.
3. Do not disable Spend Cap before reducing the app-side egress multiplier when possible.

## Restore Service

1. Choose one of:
   - upgrade plan
   - disable Spend Cap
   - wait for cycle reset
   - contact support for billing or fair-use restriction
2. Validate recovery by confirming health endpoints and application auth/session behavior.

## Validate Recovery

1. Confirm that automatic polling volume is low or absent.
2. Confirm that sync still works manually and through Realtime.
3. Watch usage after recovery for at least the first active session window.

## Escalate to Support

Open a support ticket when:

- restriction persists after billing issue is cleared
- plan state and restriction do not match documentation
- abuse indicators require provider-side insight
- historical usage breakdown is required but unavailable in current tooling
