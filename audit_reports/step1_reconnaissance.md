# STEP 1 — PROJECT RECONNAISSANCE

## 1. Tech Stack Validation
- **React**: Verified as `^19.2.7` in `package.json`
- **TypeScript**: Verified as `~6.0.3` in `package.json`
- **Build Tool**: Verified as `vite ^8.1.0` in `package.json`
- **Database**: Verified as `dexie ^4.4.4` in `package.json`
- **Backend/Sync**: Verified as `@supabase/supabase-js ^2.108.2` and `@supabase/ssr ^0.12.0` in `package.json`

## 2. Core Services Analysis (`src/services/`)
- **`syncService.ts`**: Orchestrates Supabase syncing (up and down), executing in explicit phases (Categories -> Menus -> Prompts -> Memory) and handles atomic downloads.
- **`sync/` folder**: Contains specific entities' sync logic (`categorySync.ts`, `memorySync.ts`, `menuSync.ts`, `promptSync.ts`).
- **`importService.ts`**: Manages importing functionality (suspected area for the empty prompt bug).
- **`memoryService.ts`**: Handles logic for the "Memória Fixa" feature.
- **`realtimeService.ts`**: Likely handles Supabase realtime subscriptions.
- **`autoSync.ts`**: Automated synchronization handlers.
- **`supabaseCategories.ts`, `supabaseMenus.ts`, `supabasePrompts.ts`**: Specific Supabase API interactions for these entities.
- **`storage/` folder**: Contains implementations related to local/cloud storage.

## 3. README.md Validation
- The `README.md` correctly lists the exact tech stack versions found in `package.json` and details the architectural choices like "Local-First" and "Offline First".
- Confirmed that there is no Tailwind CSS usage mentioned ("Vanilla CSS (sem Tailwind)"), consistent with the standard setup.
- Mentions deployment on Netlify, but no `netlify.toml` was found in the root directory. Instead, a `vercel.json` and `vite.config.ts` are present. This represents a minor mismatch where deployment specifics might be slightly outdated or managed differently.
