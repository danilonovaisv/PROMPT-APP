# supabase_audit
- Projeto Supabase auditado: `prompt-app` (`dpejskjpghoozbpfxkpf`).
- Tabelas críticas (`categories`, `prompts`, `context_menus`, `prompt_memory_context`) com `row_security = true`.
- Realtime publication `supabase_realtime` inclui: `categories`, `context_menus`, `prompt_memory_context`, `prompts`.
- Policies encontradas:
  - CRUD `authenticated` para categorias/prompts/context_menus.
  - `prompt_memory_context`: insert/update/delete `authenticated`; select em role `public` com filtro `auth.uid() = user_id and is_deleted = false`.

## Achados
1. SERVICE_ROLE no frontend:
   - Fato: frontend usa somente `VITE_*` em `/Users/PROJETOS-DEV/PROMPT-APP/src/lib/supabase.ts`.
   - Risco: arquivo local `.env.local` contem `SUPABASE_SERVICE_ROLE_KEY` real. Nao deve estar em ambiente cliente do time; risco operacional.
2. RLS:
   - Fato: RLS habilitado e policies por usuario em tabelas expostas.
   - Risco: policy `memory_select` com role `public` aumenta superficie. Mesmo com `auth.uid()` no `qual`, preferivel restringir para `authenticated` por clareza e menor exposicao.
3. SSR/Auth skill gap:
   - `@supabase/ssr` instalado, mas app atual e SPA Vite. Nao e bug por si; apenas nota de arquitetura.
