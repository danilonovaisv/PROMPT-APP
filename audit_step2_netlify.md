# STEP 2 — DEPLOYMENT AUDIT (VERCEL / NETLIFY)

## 1. Configurações de Build (Vercel)
O projeto menciona Netlify no prompt original, mas as configurações no repositório apontam exclusivamente para **Vercel** através do arquivo `vercel.json` na raiz do projeto.
O arquivo `netlify.toml` **não existe** no projeto atual. Existe a dependência `@netlify/vite-plugin` no `package.json`, mas o orquestrador atual de deploy via CLI/doc é Vercel.

Conteúdo de `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/((?!.*\\.xml$|.*\\.txt$).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Análise**: Este arquivo configura a infraestrutura da Vercel para rotear as chamadas que não são estáticas (.xml, .txt) para o `index.html`. Isso é necessário para que o React Router consiga gerenciar o roteamento *Client-Side* de uma Single Page Application (SPA).

## 2. Pipeline de Deployment e Variáveis
O deploy é um fluxo estático:
- `pnpm build`: Executa validação de tipos `tsc -p tsconfig.app.json` seguido pelo build principal `vite build`. O output gerado é para a pasta `dist/`.
- **Variáveis de Ambiente**: As credenciais para o Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) e monitoramento (`VITE_SENTRY_DSN`) são injetadas no momento do build (Vite substitui `import.meta.env`).

## 3. Edge Functions / Redirects
Não há Edge Functions do Supabase invocadas pelo middleware local do Vercel/Netlify. Não foram detectadas functions da Vercel (`api/`) na raiz. O rewrite básico para `index.html` atende totalmente as necessidades de fallback.
