## Netlify Audit

- `netlify.toml` configures builds using `pnpm install && pnpm run build`.
- Has rules to skip builds on markdown/tests.
- Caching/Security Headers are properly configured.
- No `netlify/functions` directory exists, meaning there are no edge functions currently implemented.
- SPA fallback to `/index.html` is configured correctly for React Router.
