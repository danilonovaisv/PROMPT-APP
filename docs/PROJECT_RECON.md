# resumo_executivo
Saude geral: **boa com riscos pontuais P0/P1**. Stack real confirmada: Vite + React 19 + TypeScript + Dexie/IndexedDB + Supabase + Netlify. Build/lint/test passaram localmente. Problemas criticos encontrados: fluxo de sync dependente de `refreshSession()` (podia bloquear sync com sessao valida), risco operacional por segredos reais em `.env.local`, e sinalizacao de possivel desalinhamento em policy `memory_select` (role `public`, ainda com filtro por `auth.uid()`).

# escopo_e_premissas
- Escopo auditado: auth, realtime, local-first sync, import JSON, memoria fixa, menus vinculados, RLS/Supabase, Netlify, UX/performance/a11y.
- Premissa: auditoria completa com evidencia de codigo + verificacao de comandos + consulta ao projeto Supabase e Netlify conectados.
- Fato verificado vs hipotese: bugs P0 tratados como hipoteses obrigatorias e rastreados ate evidencias.

# project_reconnaissance
- Repo: `/Users/PROJETOS-DEV/PROMPT-APP`
- Stack real (`package.json`): Vite 8, React 19, TS 6, Dexie 4.4, Supabase JS 2.105, `@supabase/ssr` instalado, Netlify plugin.
- Arquivos-chave auditados:
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/services/syncService.ts` (auth/sync orchestration)
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/services/autoSync.ts` (hooks Dexie + debounce)
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/services/realtimeService.ts` (listeners Supabase)
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/services/importService.ts` (import template bulk/single)
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/utils/importMenusJson.ts` (import menus e conflitos)
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/components/editor/EditorPlayground.tsx` (Memoria Fixa UI)
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/components/editor/EditorContextMenuSelector.tsx` (menus vinculados)
  - `/Users/PROJETOS-DEV/PROMPT-APP/src/lib/supabase.ts` e `supabaseConfig.ts` (env/frontend key safety)
- Divergencias docs x implementacao:
  - README mostra versoes desatualizadas em varios pontos vs `package.json`.
  - README sugere paradigma, mas codigo atual tem sync cloud ativo e complexo (nao apenas local-first puro).
