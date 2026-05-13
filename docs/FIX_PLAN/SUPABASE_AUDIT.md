# SUPABASE_AUDIT

## Evidências verificadas
- Frontend usa variáveis públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (com fallback publishable), aderente a Vite `import.meta.env`.
- Não houve evidência de `SERVICE_ROLE_KEY` no frontend analisado.
- `syncService` exige sessão autenticada para upload/download.

## Limites da auditoria
- Não foi possível validar políticas RLS reais no banco remoto sem acesso ao projeto Supabase e SQL migrations/policies completas.

## Riscos
- Sem validação direta de RLS por tabela, persiste risco P1 de isolamento incompleto por usuário.

## Recomendação objetiva
Executar checklist de RLS por tabela exposta (`categories`, `context_menus`, `prompts`, `prompt_memory`) com teste de usuário A tentando ler/escrever dados de usuário B.
