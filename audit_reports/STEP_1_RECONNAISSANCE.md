# STEP 1: PROJECT RECONNAISSANCE
## Tech Stack
- React 19
- TypeScript
- Vite
- Dexie.js 4
- Supabase
## Core Services
- src/services/syncService.ts: Orquestra sync via 4 fases de bulk (Categories, Menus, Prompts, Memory).
- src/services/importService.ts: Processamento de JSON para templates e multi-imports.
- src/services/memoryService.ts: Interface offline-first local/nuvem.
- src/services/realtimeService.ts: Listeners websocket.
## README Validation
- O README é detalhado e coerente com a implementação (descreve Supabase auth, sync, Local-First e estrutura de components corretamente).
