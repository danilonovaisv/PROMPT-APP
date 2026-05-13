# FIX_PLAN

## P0
1. Endurecer validação semântica de importação no `importService` com rejeição explícita para templates semanticamente vazios.
2. Adicionar normalização com erros padronizados por campo (proposta: `schemaValidation.ts` integrado ao fluxo de import).
3. Melhorar UX mobile de Memória Fixa, validação de chave duplicada, feedback de erro e hit targets.

## P1
1. Expor status de sync por fase na UI, não apenas no console.
2. Validar e documentar RLS por tabela no Supabase, com teste cruzado entre usuários.
3. Cobrir cenário de rede degradada, retries e reconciliação de conflito com teste automatizado.

## P2
1. Revisar seletor de menus para comportamento consistente em touch.
2. Mitigar potenciais N+1 em carregamento de categorias e prompts com batching/cache local e memoização seletiva.
3. Limpar documentação obsoleta para reduzir divergência operacional.
