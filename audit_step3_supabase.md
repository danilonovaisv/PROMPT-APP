# STEP 3 — SUPABASE AUDIT

## 1. Inspeção do Supabase (`src/lib/supabase.ts` e `src/services/syncService.ts`)
O projeto utiliza um design de arquitetura "Local-First".
- `src/lib/supabase.ts`: Instancia o client global, lida com variáveis de ambiente (URL/Anon Key) e faz verificação robusta se as chaves existem, alertando quando ausentes em vez de causar *crash*. Inclui detecção de erros de Egress Exceeded (HTTP 402) mapeada em `isQuotaExceededError`.
- `src/services/syncService.ts`: Orquestra uma sincronização focada na ordem relacional, enviando entidades locais para a nuvem de maneira atômica e agrupada por fases: `Categorias → Menus → Prompts → Memória`.

## 2. Autenticação e Persistência
Usa `supabase.auth.getSession()` e um fallback para `.refreshSession()` diretamente no loop de sync para evitar quedas.

## 3. Estado "Dirty" (Dados Locais não sincronizados) e Falhas de Rede
O estado Dirty/Pending é gerenciado no Dexie. As tabelas locais (como `prompts` e `categories`) contêm a propriedade `syncStatus` (geralmente `'pending'`, `'synced'`, ou `'error'`).
No `syncService.ts` e seus sub-serviços (como `syncMemoryToCloud` e `syncPrompts`), ele busca apenas itens cujo `syncStatus` não é "synced" para minimizar uploads (Otimização).
Se a rede falhar: O erro é pego na função `runPhase` de `syncService.ts`. O status local permanecerá como "pending" (já que o "synced" só é atribuído ao sucesso da chamada da nuvem). Em re-execuções, o sincronizador capturará esse payload e tentará de novo.

## 4. Row Level Security (RLS)
A auditoria técnica (visão de repositório front-end) indica que as queries remotas nos arquivos `src/services/sync/*` não declaram ID de usuário em *todos* os selects (por padrão, confia-se no RLS para ocultar linhas de outros locatários). A inserção faz *upsert* passando o `user_id`. Se a tabela SQL remota possuir políticas RLS, esse método é seguro e as informações só retornarão se `auth.uid() = user_id`.
