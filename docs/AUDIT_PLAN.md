# PROMPT-APP Audit & Remediation Plan (squirrelscan)

## Summary of Audit Findings
- **Site URL Audited**: `https://prompt-app-dan.netlify.app/`
- **Audit Tool**: `squirrelscan v0.0.78`
- **Initial Health Score**: 62/100 (SEO/Crawlability errors due to broken domain references in sitemap/robots.txt and missing AI agent discovery specs).

---

## Mapped Issues & Target Files

### 1. Crawlability & Domain Mismatch (HIGH / Error)
- **Original Error**: `crawl/sitemap-exists` and `crawl/robots-txt` failing/misconfigured. `robots.txt` and `sitemap.xml` contained legacy domain `https://project-vwlgp.vercel.app/` instead of `https://prompt-app-dan.netlify.app/`.
- **Target Files**:
  - `public/robots.txt`
  - `public/sitemap.xml`
- **Refactoring Strategy**:
  - Update `robots.txt` to point `Sitemap:` to `https://prompt-app-dan.netlify.app/sitemap.xml`.
  - Update all `<loc>` entries in `sitemap.xml` to `https://prompt-app-dan.netlify.app/`.

### 2. AI Agent Experience & Discovery (MEDIUM / Warning)
- **Original Error**: `ax/llms-txt` — No `/llms.txt` found.
- **Target Files**:
  - `public/llms.txt` [NEW]
- **Refactoring Strategy**:
  - Create a structured `/llms.txt` detailing the application capabilities, local-first offline storage, JSON schema formats, and navigation routes for AI agents.

### 3. Netlify SPA Routing & Headers (MEDIUM / Warning)
- **Original Error**: Potential SPA route redirection overriding static files on Netlify.
- **Target Files**:
  - `public/_redirects` [NEW]
  - `public/_headers`
- **Refactoring Strategy**:
  - Add explicit `public/_redirects` rule `/*  /index.html  200` to support client-side React Router while maintaining raw file serving for `sitemap.xml`, `robots.txt`, `llms.txt`, and templates.

### 4. SEO Fallback Metadata (MEDIUM / Warning)
- **Original Error**: Outdated static dates in fallback HTML header and missing link rels.
- **Target Files**:
  - `index.html`
- **Refactoring Strategy**:
  - Update date published/modified in JSON-LD and fallback content. Ensure semantic tags and accessibility links are intact.

---

## Validation Strategy
1. **TypeScript Type Check**: `pnpm type-check`
2. **Unit Tests**: `pnpm test`
3. **Production Build**: `pnpm build`
4. **Local Re-audit**: Run `squirrel audit` locally or verify asset generation.
