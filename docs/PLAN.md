# 📋 Implementation Plan - Netlify Deploy Recovery & Sync

**Status**: 📝 PLANNING
**Issue**: `ERR_PNPM_OUTDATED_LOCKFILE` on Netlify CI.

## 🎯 Objectives

1. Synchronize `pnpm-lock.yaml` with `package.json` locally.
2. Ensure all dependencies (`jest`, `react-hot-toast`, etc.) are correctly locked.
3. Validate the build one last time before pushing to trigger Netlify.
4. Clean up environment-specific issues causing CI friction.

---

## 🛠️ Proposed Phases

### Phase 1: Dependency Saneamento (DevOps/Test)

- Run `pnpm install` to regenerate `pnpm-lock.yaml`.
- Verify `package.json` for any redundant or missing entries.
- Ensure `@types/node` and `@types/jest` are in `devDependencies`.

### Phase 2: Build Verification (Test/Frontend)

- Run `npm run build` locally with the new lockfile to ensure zero regressions.
- Check `dist/` output integrity.

### Phase 3: Deployment Trigger (DevOps)

- Commit `pnpm-lock.yaml` and any `package.json` changes.
- Push to the main branch to trigger the Netlify build.
- Monitor the deploy status.

---

## 👥 Agents Involved

| Agent | Role |
| :--- | :--- |
| `project-planner` | Plan creation and monitoring. |
| `devops-engineer` | Lockfile management, CI/CD configuration. |
| `test-engineer` | Build verification and dependency auditing. |
| `debugger` | Analysis of Netlify log discrepancies. |

---

## 🛡️ Verification

- [ ] `pnpm-lock.yaml` timestamp updated.
- [ ] `npm run build` exit code 0.
- [ ] Netlify deploy SUCCESS.
