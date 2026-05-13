# NETLIFY_AUDIT

## Achados
- `netlify.toml` inclui headers essenciais: CSP, X-Frame-Options, nosniff, Referrer-Policy.
- Há SPA fallback correto (`/* -> /index.html`).
- Build command usa `pnpm install && pnpm run build`.

## Riscos
- CSP permite `'unsafe-inline'` em style, risco moderado aceitável para CSS inline legado, mas deve ser reduzido no roadmap.
- Regra de ignore de build é agressiva, pode ocultar deploys necessários quando mudança em docs afeta instruções operacionais críticas.

## Conclusão
Configuração de produção está funcional e defensiva, com oportunidade de endurecimento de CSP e revisão da regra de `ignore`.
