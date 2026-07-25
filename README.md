# Prompt App

Prompt App e uma SPA em React + VITE para criar, organizar, testar, importar, exportar e sincronizar templates de prompt. O projeto segue um modelo local-first: o estado principal vive no navegador via IndexedDB com Dexie, e a sincronizacao com Supabase e opcional.

## Stack real do projeto

- React 19
- VITE 8
- TypeScript
- React Router 7
- Dexie + dexie-react-hooks
- Supabase JS 2
- Supabase Realtime
- Jest + Testing Library
- Playwright
- ESLint
- Vercel rewrite para SPA em `vercel.json`

## O que o app faz hoje

- Gerencia categorias de templates.
- Gerencia menus de contexto customizaveis.
- Cria templates estruturados com payload tipado.
- Compila template + selecao do usuario em prompt final.
- Mantem memoria fixa por template.
- Importa e exporta JSON individual e em lote.
- Funciona offline com IndexedDB.
- Sincroniza categorias, menus, prompts e memoria com Supabase quando configurado.
- Usa Realtime para refletir mudancas entre abas e dispositivos.

## Arquitetura

### Frontend

- A aplicacao e uma SPA com `BrowserRouter`.
- As telas principais estao em `src/pages/`.
- Os formularios do editor ficam em `src/components/editor/`.
- O estado de cloud sync fica em `src/context/CloudSyncContext.tsx`.

### Persistencia local

- O banco local usa Dexie em `src/db/database.ts`.
- As colecoes principais sao:
  - `categories`
  - `prompts`
  - `contextMenus`
  - `promptMemory`
- O schema Dexie possui historico de migracoes versionadas dentro do proprio arquivo.

### Supabase

- O cliente do browser fica em `src/lib/supabase.ts`.
- A resolucao das variaveis de ambiente fica em `src/lib/supabaseConfig.ts`.
- O sync principal fica em `src/services/syncService.ts`.
- Os handlers de sync por entidade ficam em `src/services/sync/`.
- O Realtime fica em `src/services/realtimeService.ts`.

Tabelas publicas encontradas no projeto Supabase conectado:

- `categories`
- `client_errors`
- `context_menus`
- `media_assets`
- `prompt_memory_context`
- `prompts`

Observacao: nem toda tabela remota e necessariamente usada pela UI atual. O nucleo funcional do app gira em torno de `categories`, `context_menus`, `prompts` e `prompt_memory_context`.

### Deploy

- O projeto esta configurado como SPA em Vercel via rewrite para `index.html`.
- O arquivo atual e [vercel.json](/Users/PROJETOS-DEV/PROMPT-APP/vercel.json).
- O padrao configurado bate com a documentacao da Vercel para fallback de SPA.

## Estrutura relevante

```text
src/
  components/
    editor/
    layout/
    menu-manager/
    ui/
  context/
  db/
  hooks/
  lib/
  models/
  pages/
  services/
    storage/
    sync/
  styles/
  utils/

supabase/
  config.toml
  functions/
  migrations/
  seed.sql

tests/
  unit/
  integration/
  e2e/
  mocks/
```

## Fluxo de dados

### Modo local

1. O usuario cria ou edita um template.
2. O estado e salvo no Dexie.
3. O app continua funcional sem Supabase.

### Modo cloud sync

1. O usuario autentica via Supabase Auth.
2. O app inicializa Realtime para as tabelas principais.
3. Alteracoes locais entram no pipeline de sync.
4. O app faz upload ou download por fases:
   - Categorias
   - Menus
   - Prompts
   - Memoria fixa

## Requisitos

- Node.js 18 ou superior
- pnpm

Opcional, mas recomendado para deploy e operacao em Vercel:

- `npm i -g vercel`

## Instalacao

```bash
pnpm install
```

## Desenvolvimento local

```bash
pnpm dev
```

App em desenvolvimento:

- `http://localhost:5173`

## Variaveis de ambiente

O projeto funciona sem Supabase, mas recursos de autenticacao e sync exigem configuracao.

Crie o template:

```bash
pnpm run setup:cloud-env
```

Isso gera um `.env.local` com o formato:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Optional legacy fallback
# VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_LEGACY_PUBLISHABLE_KEY

# Optional observability
# VITE_SENTRY_DSN=YOUR_SENTRY_DSN
```

Variaveis reconhecidas pelo app:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `VITE_SENTRY_DSN`

Importante:

- Nao exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Nao versione `.env`, `.env.local` ou qualquer credencial.

## Supabase local

O repositorio inclui configuracao de Supabase CLI em `supabase/config.toml`.

Pontos relevantes:

- API local na porta `54321`
- Studio local na porta `54323`
- Inbucket na porta `54324`
- Realtime habilitado
- Storage habilitado
- Seed configurado com `supabase/seed.sql`

Se voce usa Supabase CLI no fluxo local, os arquivos principais sao:

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/seed.sql`

## Scripts

### App

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm type-check
pnpm test
pnpm test:coverage
pnpm test:watch
```

### E2E

```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:debug
```

### Banco e ambiente

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm setup:cloud-env
```

### Limpeza

```bash
pnpm clean
pnpm clean:build
pnpm clean:cache
pnpm clean:reports
pnpm clean:modules
pnpm clean:reset
```

## Testes e verificacao

Fluxo minimo recomendado antes de merge:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

O projeto tambem possui:

- testes unitarios em `tests/unit/`
- testes de integracao em `tests/integration/`
- testes E2E em `tests/e2e/`

## Deploy em Vercel

O deploy esperado hoje e de SPA estatica.

Build command:

```bash
pnpm build
```

Output directory:

```text
dist
```

Configuracao atual:

- rewrite de rotas para `index.html`
- adequada para `BrowserRouter`

Comandos uteis, se voce usa Vercel CLI:

```bash
vercel link
vercel env pull
vercel deploy
```

## Observabilidade

O projeto inclui instrumentacao cliente via Sentry:

- `src/instrument.ts`
- `@sentry/browser`
- `@sentry/react`
- `@sentry/VITE-plugin`

Se `VITE_SENTRY_DSN` nao estiver configurada, a observabilidade externa continua opcional.

## Notas importantes de manutencao

- O projeto nao e VITE.js. E uma SPA em VITE.
- O estado principal e local-first, nao server-first.
- O fluxo de sync com Supabase foi recentemente endurecido para reduzir egress desnecessario.
- O README antigo estava desatualizado em stack, deploy e estrutura de pastas; este arquivo foi alinhado ao estado real do repositorio em 2026-07-24.

## Arquivos chave

- [package.json](/Users/PROJETOS-DEV/PROMPT-APP/package.json)
- [vercel.json](/Users/PROJETOS-DEV/PROMPT-APP/vercel.json)
- [src/App.tsx](/Users/PROJETOS-DEV/PROMPT-APP/src/App.tsx)
- [src/db/database.ts](/Users/PROJETOS-DEV/PROMPT-APP/src/db/database.ts)
- [src/lib/supabase.ts](/Users/PROJETOS-DEV/PROMPT-APP/src/lib/supabase.ts)
- [src/lib/supabaseConfig.ts](/Users/PROJETOS-DEV/PROMPT-APP/src/lib/supabaseConfig.ts)
- [src/services/syncService.ts](/Users/PROJETOS-DEV/PROMPT-APP/src/services/syncService.ts)
- [src/services/realtimeService.ts](/Users/PROJETOS-DEV/PROMPT-APP/src/services/realtimeService.ts)
- [scripts/setup-cloud-env.sh](/Users/PROJETOS-DEV/PROMPT-APP/scripts/setup-cloud-env.sh)

## Licenca

Uso interno, salvo definicao diferente do proprietario do repositorio.
