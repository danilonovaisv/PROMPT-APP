# Supabase Egress Change Log

## 2026-07-24

- Replaced automatic full-table conflict checks with metadata-only summary queries in `src/services/assetManager.ts`.
- Added selective hydration so full Supabase rows are fetched only when a real remote diff must be applied.
- Stopped periodic update polling while Realtime is active.
- Increased fallback polling interval from 30 seconds to 5 minutes when Realtime is not active.
- Added regression coverage to keep polling disabled during healthy Realtime sessions.
