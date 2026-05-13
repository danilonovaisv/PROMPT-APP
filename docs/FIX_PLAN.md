# fix_plan_p0_p1_p2

## P0 (integridade de dados e fluxo principal)
1. Sync auth resiliente (feito): manter `getSession` como caminho primario e refresh como fallback.
2. Higiene de segredos: remover `SUPABASE_SERVICE_ROLE_KEY` de `.env.local` em ambiente de frontend local compartilhado e garantir `.gitignore`/processo de secrets.
3. Repro forense de import vazio com fixture real do usuario (arquivo que falhou) e snapshot local antes/depois do import.

## P1 (sync/supabase/rls)
1. Realtime de memoria fixa: adicionar listener para `prompt_memory_context` no `realtimeService.ts`.
2. Policy hardening: trocar role de `memory_select` de `public` para `authenticated` (com aprovacao explicita, por envolver policy).
3. Garantir playbook offline/conflict: teste de reconexao e reconciliacao com falha de rede simulada.

## P2 (menus/ux/dx/perf)
1. Otimizar insert de fixed memory no import (acumular tudo e `bulkAdd` unico).
2. Melhorar UX mobile-first em selector/modais com testes de teclado e foco.
3. Corrigir warnings do audit web (titulos/descricoes duplicadas, sitemap e conteudo minimo).
