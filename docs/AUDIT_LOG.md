# audit_log

## Supabase plugin
- `list_projects` executado: projetos `portfolio-danilo` e `prompt-app`.
- `execute_sql` executado para:
  - estado RLS em tabelas publicas principais
  - policies por tabela
  - publication `supabase_realtime`

## Netlify plugin
- `get-projects` com `prompt-app`: site encontrado `prompt-app-dan`.
- `get-user`: conta ativa e associada ao time correto.

## Code inspection
- Inspecionados auth/sync/import/realtime/menu/fixed-memory components e models.
- Divergencias README x implementacao registradas.

## Verification commands
- `pnpm run lint` -> PASS
- `pnpm run build` -> PASS
- `pnpm test` -> PASS (`37/37`, `151` testes)
- `squirrel audit ... -C surface --format llm` -> score `97`
- `squirrel audit ... -C full --format llm` -> score `97`
