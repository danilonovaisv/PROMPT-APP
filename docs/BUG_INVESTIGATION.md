# bug_investigation

## P0-1: Login/sync percebido como falho
- Sintoma: usuario relata dificuldade de login/realtime.
- Hipotese: sync forca `refreshSession()` mesmo com sessao valida, podendo falhar em rede instavel e gerar erro de autenticacao.
- Evidencia:
  - Antes: `/Users/PROJETOS-DEV/PROMPT-APP/src/services/syncService.ts` exigia `refreshSession()` no inicio.
  - Fluxo de reconexao chama sync em contexto cloud; falha aqui aparenta "sessao expirada".
- Causa raiz provavel: acoplamento indevido entre "ter sessao valida" e "conseguir refresh agora".
- Correcao aplicada:
  - `syncService.ts`: usa `getSession()` primeiro; tenta `refreshSession()` so sem sessao.
- Teste de validacao:
  - Com sessao ativa: sync inicia sem depender de refresh.
  - Em sessao ausente: comportamento antigo preservado (erro claro).

## P0-2: Templates importados vazios na UI
- Sintoma: imports aparecem vazios.
- Hipotese: perda em normalizacao/schema/persistencia/render.
- Evidencia encontrada:
  - `importService.ts` usa `parsePromptPayload` + `migrateTemplateToCurrentSchema` + `syncTemplateWithMenuDefinitions`.
  - Salva `promptPayload` completo e `selectionPayload.fixed_variables`.
  - `EditorPlayground.tsx` renderiza Fixed Memory com key+value e empty state.
- Causa raiz atual: **nao reproduzida no estado atual do codigo**. Fluxo parece corrigido.
- Risco residual: imports com formato fora schema (campos faltantes) ainda podem cair em warnings/erros.

## P0-3: Memoria Fixa sem campo input
- Evidencia atual:
  - `EditorPlayground.tsx` contem input para nova chave e textarea para valor (`newKeyName`, `newKeyValue`), inclusive estado vazio.
- Status: **nao reproduzido** no codigo atual.

## P1-1: Realtime com problema
- Evidencia:
  - Realtime listeners implementados para `categories`, `prompts`, `context_menus`.
  - Publication no Supabase inclui tambem `prompt_memory_context`.
- Gap tecnico:
  - Listener dedicado de `prompt_memory_context` nao aparece no `realtimeService.ts`.
- Impacto: memoria fixa pode ficar defasada entre abas/dispositivos ate proximo sync/download.

## P1-2: N+1 queries suspeito
- Evidencia positiva (mitigado):
  - `importService.ts` usa cache de categorias e `bulkAdd`.
  - sync services usam batches/range.
- Possivel hotspot remanescente:
  - loops de `bulkAdd` de memoria por prompt importado (otimizavel para lote unico).
