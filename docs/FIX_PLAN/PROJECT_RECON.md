# PROJECT_RECON

## Resumo executivo
Estado geral: **saudável com riscos P0 funcionais**. Build e testes passam, porém há inconsistências entre importação, vínculo de menus e UX mobile no Playground que explicam sintomas de templates vazios e fricção na Memória Fixa.

## Stack real verificada
- Frontend: React 19 + TypeScript + Vite.
- Persistência local-first: Dexie/IndexedDB.
- Sync cloud: Supabase JS v2.
- Deploy: Netlify (SPA fallback + headers de segurança).

## Divergências documentação vs implementação
- README referencia `src/services/supabaseClient.ts`, mas o repositório usa `src/lib/supabase.ts` e `src/lib/supabaseConfig.ts`.
- README lista versões e estrutura parcialmente desatualizadas frente ao `package.json` atual.

## Arquivos críticos analisados
- `src/services/importService.ts`: pipeline de importação, migração e persistência.
- `src/models/promptSchema.ts`: schema e defaults que podem mascarar payload inválido.
- `src/db/database.ts`: versão do schema Dexie e evolução de registros legados.
- `src/services/syncService.ts` e `src/services/sync/*`: fases de sincronização e falha parcial tolerada.
- `src/components/editor/EditorPlayground.tsx`: Memória Fixa e estados de UI.
- `src/components/editor/EditorContextMenuSelector.tsx`: vinculação de menus e busca.
