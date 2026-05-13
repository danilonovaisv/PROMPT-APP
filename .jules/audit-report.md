# Audit Report - PROMPT-APP

## Resumo Executivo
O projeto "PROMPT-APP" é uma aplicação React 19 moderna que utiliza Vite, TypeScript, IndexedDB (via Dexie.js) e Supabase.
A estrutura de diretórios em `src/services/` gerencia corretamente as integrações de importação/exportação e o autoSync,
além de possuir `promptSync` e `categorySync` para transações. O projeto em geral possui uma arquitetura
resiliente "offline-first". O `README.md` encontra-se atualizado em relação às bibliotecas e estrutura atual.

## Netlify Audit
As configurações em `netlify.toml` utilizam `pnpm run build`, exportando o build no diretório `dist` e adicionando os redirecionamentos básicos do SPA (`/*` -> `/index.html`). Header configs parecem robustas contra cache conflicts e garantem immutable files para os chunks em produção. A gestão de env vars é mantida na plataforma Cloud de forma aderente às convenções Vite (`VITE_SUPABASE_URL`, etc.).

## Supabase Audit e RLS
A estratégia de persistência e sync para o supabase baseia-se em um pool Offline-first via Dexie.js. A sincronização envia modificações com um campo `syncStatus` e atualiza remote IDs via Upsert. O código possuia uma vulnerabilidade silenciosa onde o método de "download" re-escrevia as alterações "sujas" (locais com edição) pelos dados antigos da cloud. Isso foi resolvido via implementação de bypass quando o `syncStatus === 'pending'` ou `error`.

## Bugs to Fix (Investigation)
<<<<<<< HEAD
1. **Memória Fixa sem input no Playground**:
   - *Causa*: O campo perdia o foco imediatamente pelo evento `onBlur` de `EditorPlayground.tsx`, ocultando os inputs e matando o click confirmation.
   - *Fix*: O evento `onBlur` foi removido, permitindo o correto salvamento das "Memórias fixas".
2. **Importação via JSON vazia na UI**:
   - *Causa*: O schema estrito do Zod estava derrubando templates válidos do payload, renderizando os Fallbacks Vazios gerados pelo `importService.ts`. O parser de JSON também possuía problemas de substr se o JSON começasse em array misto com object braces.
   - *Fix*: O `parsePromptContract` de `importService.ts` foi refatorado para utilizar o parser flexível e a rotina `sanitizeJsonString` usa Regex robusto.
3. **Menu Selector Bug**:
   - *Causa*: O componente `<MultiSelect>` não interceptava a perda de foco ao selecionar opções do select customizado, causando comportamento instável com cliques externos.
   - *Fix*: Interceptação com `onMouseDown={(e) => e.preventDefault()}` sobre as rows de Option.
4. **Sync N+1 Queries**:
=======
1. **Memória Fixa sem input no Playground**:
   - *Causa*: O campo perdia o foco imediatamente pelo evento `onBlur` de `EditorPlayground.tsx`, ocultando os inputs e matando o click confirmation.
   - *Fix*: O evento `onBlur` foi removido, permitindo o correto salvamento das "Memórias fixas".
2. **Importação via JSON vazia na UI**:
   - *Causa*: O schema estrito do Zod estava derrubando templates válidos do payload, renderizando os Fallbacks Vazios gerados pelo `importService.ts`. O parser de JSON também possuía problemas de substr se o JSON começasse em array misto com object braces.
   - *Fix*: O `parsePromptContract` de `importService.ts` foi refatorado para utilizar o parser flexível e a rotina `sanitizeJsonString` usa Regex robusto.
3. **Menu Selector Bug**:
   - *Causa*: O componente `<MultiSelect>` não interceptava a perda de foco ao selecionar opções do select customizado, causando comportamento instável com cliques externos.
   - *Fix*: Interceptação com `onMouseDown={(e) => e.preventDefault()}` sobre as rows de Option.
4. **Sync N+1 Queries**:
>>>>>>> origin/main
   - *Causa*: O `promptSync.ts` enviava os dados iterando uma inserção no Supabase por prompt sem ID remoto.
   - *Fix*: Refatorado para Bulk Insert no Supabase.

## Verificação e Responsividade
Os scripts de formatação e os snapshots do Playwright/Jest correm perfeitamente na pipeline de deploy e as interfaces respondem bem à viewports variadas de UI mobile. O `index.css` cumpre o papel sem Tailwind e garante acessibilidade aceitável nos forms baseada em variáveis e contrastes de contraste semântico.
