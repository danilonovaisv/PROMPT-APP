# 🚀 Guia de Deploy — Prompt App

> **Stack:** VITE 7 + React 19 + TypeScript + Dexie.js (IndexedDB)
> **Output:** SPA estática (`dist/`) — Com variáveis de ambiente para recursos de nuvem (Supabase)

---

## 📋 Pré-requisitos

| Item    | Versão Mínima |
| ------- | :-----------: |
| Node.js |      18+      |
| pnpm    |      9+       |
| Git     |     2.20+     |

---

> [!WARNING]
> **CRÍTICO:** No Netlify, você **DEVE** adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Site Configuration > Environment variables** para que a sincronização funcione.

---

## 1️⃣ Build Local (Validação)

Antes de qualquer deploy, garanta que o build está limpo:

```bash
# Instalar dependências
pnpm install

# Type-check + build de produção
pnpm run build
```

Se finalizar com `✓ built in Xs`, está tudo certo.
A pasta `dist/` conterá os arquivos estáticos prontos para deploy.

Para testar localmente o build de produção:

```bash
pnpm run preview
# Abre em http://localhost:4173
```

---

## 2️⃣ Git — Preparando o Repositório

Se ainda não tem um repositório configurado:

```bash
# Inicializar git (caso não tenha)
git init

# Criar .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
*.tsbuildinfo
.DS_Store
.agent/
.gemini/
EOF

# Commit inicial
git add .
git commit -m "feat: prompt-app v1.0.0 — ready for deploy"
```

### Conectar ao GitHub

```bash
# Criar repositório no GitHub primeiro, depois:
git remote add origin https://github.com/SEU_USUARIO/prompt-app.git
git branch -M main
git push -u origin main
```

---

## 3️⃣ Deploy — Opções

### 🅰️ Netlify (Recomendado) ⭐

O projeto **já possui** `netlify.toml` configurado. É a opção mais simples.

#### Via Interface Web

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Clique em **"Add new site" → "Import an existing project"**
3. Conecte seu repositório GitHub
4. As configurações são auto-detectadas do `netlify.toml`:
   - **Build command:** `pnpm run build`
   - **Publish directory:** `dist`
5. Em **Site configuration → Environment variables**, configure:
   - `VITE_SUPABASE_URL` (obrigatória para nuvem)
   - `VITE_SUPABASE_ANON_KEY` (obrigatória para nuvem)
   - Sem essas duas variáveis a autenticação e a sincronização com Supabase ficam desativadas no app publicado
6. Clique em **"Deploy site"**

#### Via CLI

```bash
# Instalar Netlify CLI
pnpm install -g netlify-cli

# Login
netlify login

# Linkar ao site (primeira vez)
netlify init

# Deploy de preview (para testar)
netlify deploy

# Deploy para produção
netlify deploy --prod
```

#### Configuração Existente (`netlify.toml`)

```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> O redirect `/*` → `/index.html` é **essencial** para o React Router funcionar em rotas como `/menus`, `/editor/1`, etc.

---

### 🅱️ Vercel

1. Acesse [vercel.com](https://vercel.com) e importe o repositório
2. Configure:
   - **Framework Preset:** VITE
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist`
3. Clique em **Deploy**

Para suporte ao React Router, crie o arquivo `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Via CLI

```bash
pnpm install -g vercel
vercel login
vercel          # preview
vercel --prod   # produção
```

---

### 🅲 GitHub Pages (Gratuito)

#### Configuração

Edite `VITE.config.ts` com o `base` correto:

```ts
export default defineConfig({
  plugins: [react()],
  base: "/prompt-app/", // ← nome do repositório
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
```

#### Deploy Manual

```bash
npm run build
npx gh-pages -d dist
```

#### Deploy Automático (GitHub Actions)

Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm run build

      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - uses: actions/deploy-pages@v4
```

> ⚠️ No GitHub Pages, vá em **Settings → Pages → Source** e selecione **GitHub Actions**.

> ⚠️ Para React Router funcionar com GitHub Pages, é necessário usar `HashRouter` em vez de `BrowserRouter`, ou adicionar um script 404 personalizado.

---

### 🅳 Firebase Hosting

```bash
# Instalar Firebase CLI
pnpm install -g firebase-tools

# Login e inicializar
firebase login
firebase init hosting

# Quando perguntado:
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No

# Build + deploy
pnpm run build
firebase deploy --only hosting
```

---

### 🅴 Cloudflare Pages

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. Clique em **"Create application" → "Pages" → "Connect to Git"**
3. Selecione o repositório
4. Configure:
   - **Build command:** `pnpm run build`
   - **Build output directory:** `dist`
5. Deploy

> Para suporte ao SPA, vá em **Settings → Functions → Edit → Static Redirects** e adicione:
>
> ```
> /* /index.html 200
> ```

---

## 4️⃣ Domínio Personalizado

Todas as plataformas acima suportam domínio custom. O fluxo geral é:

1. No painel da plataforma, adicione o domínio (ex: `prompts.seusite.com`)
2. Configure DNS apontando para a plataforma:
   - **CNAME** → `seu-site.netlify.app` (ou equivalente)
3. Habilite HTTPS (geralmente automático via Let's Encrypt)

---

## 5️⃣ Checklist Pré-Deploy

- [ ] `pnpm run build` compila sem erros
- [ ] `pnpm run preview` funciona localmente
- [ ] Todas as rotas funcionam (Home, Categorias, Editor, Menus)
- [ ] Import/Export de JSON funciona corretamente
- [ ] `.gitignore` exclui `node_modules/`, `dist/`, `.agent/`
- [ ] Favicon (`/favicon.svg`) está presente em `public/`
- [ ] Meta tags de SEO estão no `index.html`

---

## 📝 Notas Importantes

### Sobre o Banco de Dados

O Prompt App usa **Dexie.js (IndexedDB)** — os dados ficam **no navegador do usuário**. Isso significa:

- ✅ **Zero configuração de backend** — não precisa de servidor ou banco na nuvem
- ✅ **Dados offline** — funciona sem internet após o primeiro acesso
- ⚠️ **Dados são locais** — cada navegador/dispositivo tem seus próprios dados
- ⚠️ **Limpar dados do browser** apaga os prompts salvos

### Sobre Performance

O bundle atual tem:

- **CSS:** ~28 KB (5 KB gzip)
- **JS:** ~397 KB (125 KB gzip)

Para produção, isso é perfeitamente aceitável. O VITE já aplica tree-shaking e minificação automaticamente.

---

## 🔄 Deploy Contínuo

Com **Netlify** ou **Vercel** conectados ao GitHub, cada `git push` na branch `main` dispara um build e deploy automático. Fluxo recomendado:

```bash
# Desenvolver
git checkout -b feature/nova-funcionalidade

# Commitar e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin feature/nova-funcionalidade

# Criar Pull Request → Merge → Deploy automático
```

---

**Recomendação final:** Para este projeto, o **Netlify** é a melhor opção — já está configurado via `netlify.toml`, tem tier gratuito generoso (100 GB/mês de banda), deploys automáticos, e preview por branch.
