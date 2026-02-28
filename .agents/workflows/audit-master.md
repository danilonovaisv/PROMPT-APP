---
description: Master Protocol for all system audits (Code, Performance, Visual, Security). Unifies previous fragmented audit workflows.
---

# 🛡️ Master Audit Protocol

**"The Audit Sentinel"**
This protocol unifies all audit layers into a single rigorous process.

## Modes

Select the mode based on the user request:

- **FULL**: Runs all layers.
- **QUICK**: Runs only Code Quality & Lint.
- **GHOST**: Runs specific WebGL/Visual checks.

## Layer 1: Code Integrity (The Foundation)

// turbo

1. **Type Check**: `npm run type-check`
// turbo
2. **Linting**: `npm run lint`
3. **Dead Code**:
   - Check for unused imports or components.
   - Suggest removal of commented-out blocks > 10 lines.

## Layer 2: Performance & Build (The Engine)

1. **Build Test**: `npm run build` (Ensures production build passes).
2. **Bundle Analysis**:
   - Check `.next/analyze` (if enabled) or big chunks.
   - **Target**: First Load JS < 300kB.

## Layer 3: Ghost System (WebGL & Visuals)

1. **Ghost Config Audit**: Verify `src/config/ghostConfig.ts` values are sane.
2. **Performance Pass**:
   - Trigger `webgl-performance-pass.md` workflow if 3D is heavy.

## Layer 4: Security (The Gatekeeper)

1. **Supabase Checks**:
   - Verify no private keys in client code.
   - Check `supabase-realtime` RLS policies.
2. **Environment**:
   - Confirm `.env.local` is gitignored.

## Output

- Generate **Audit Report**: `docs/audits/AUDIT-[YYYY-MM-DD].md`.
- List **Critical Fixes** (Must fix now) vs **Warnings** (Backlog).
