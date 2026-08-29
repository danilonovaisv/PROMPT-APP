# STEP 2 — NETLIFY / DEPLOYMENT AUDIT

## 1. Build & Deploy Configuration
- **`netlify.toml`**: This file is conspicuously missing, despite the README claiming deployment via Netlify.
- **`vercel.json`**: Exists and contains a `rewrites` rule (`/((?!.*\\.xml$|.*\\.txt$).*) -> /index.html`), which handles the Single Page Application (SPA) routing for React Router correctly if deployed on Vercel. This confirms SPA routing is handled, albeit via Vercel configurations.

## 2. Environment Variables & Build Pipeline (`vite.config.ts`)
- **Bundle Analysis**: Controlled via the `ANALYZE=true` environment variable, adding `rollup-plugin-visualizer` dynamically.
- **Sentry**: Integrated via `@sentry/vite-plugin`, controlled by `CI=true` or `SENTRY_BUILD_PLUGIN=true`.
- **Chunking**: Implements manual chunking in Rollup config (`vendor-react`, `vendor-db`, `vendor-supabase`, `vendor-icons`, `vendor`) to optimize bundle sizes and caching.
- **Source Maps**: Configured to `hidden`.

## 3. Edge Functions / Route Handling
- No explicit Edge Functions were found in the root directory. Routing is exclusively handled client-side (React Router) with standard rewrite rules defined in `vercel.json` (fallback to `index.html`). If deployed to Netlify without a `_redirects` file or `netlify.toml`, refreshing routes other than `/` may result in 404s unless handled externally.
