# STEP 1 — PROJECT RECONNAISSANCE

## 1. Stack Tecnológica
- **React**: Confirmado React 19 (`react@19.2.8`).
- **TypeScript**: TypeScript 5.8.2 e config strict.
- **Vite**: Vite 8 configurado (SPA puro com vite plugin react).
- **Dexie.js**: Dexie 4.4.4 e `dexie-react-hooks`.
- **Supabase**: `@supabase/supabase-js` 2.112.2 com auth e Realtime.
- **Gerenciador de Pacotes**: `pnpm` (`pnpm@11.21.0`).
- **Testes**: `jest`, `playwright`.
- **Estilização**: CSS Puro (Custom Properties).

## 2. Estrutura de Diretórios e Core Services
A estrutura segue o padrão do `README.md`. Os serviços principais localizados em `src/services/` são:
- `assetManager.ts`: Gerenciamento unificado de assets/entidades.
- `auditResourceContent.ts`: Auditoria de integridade e schema.
- `autoSync.ts`: Gatilhos automáticos de sincronização.
- `contextMenuSync.ts`: Sincronização de Menus (Descontinuado/Movido).
- `importService.ts`: Serviço massivo de importação/validação de JSON.
- `memoryService.ts`: Gestão da "Memória Fixa" (Variáveis Locais vs Remoto).
- `realtimeService.ts`: Assinaturas via Supabase Realtime para multiplayer.
- `syncService.ts`: Sincronização principal orquestrando downloads/uploads (local-first e atomic phases).
- Subdiretórios `sync/` para orquestração por tabela (`categorySync.ts`, `menuSync.ts`, `promptSync.ts`, `memorySync.ts`).
- Subdiretório `storage/` contendo `dexieMemory.ts` para persistência local isolada.

## 3. Validação do README.md
O `README.md` reflete fielmente o estado atual do projeto (Atualizado em 2026-07-24):
- Confirma deploy via Vercel como SPA (`vercel.json`).
- Menciona estrutura e tabelas remotas.
- Detalha o modelo *Local-First* usando Dexie e Cloud Sync (Supabase).
- Comandos listados (`pnpm dev`, `pnpm test`) são compatíveis com `package.json`.
