# STEP 4 — BUGS TO FIX (INVESTIGATION)

## 1. Playground: Funcionalidade "Memória Fixa"
- **Investigação**: Analisei `EditorPlayground.tsx` e `EditorPage.tsx`. O `EditorPlayground.tsx` propaga a chamada de adicionar chave através de `onAddMemoryKey={handleAddMemoryKey}`, mas no componente interno `handleConfirmAddKey`, é passado como `onAddMemoryKey?.(newKeyName)`. E o estado interno `isAddingKey` é alterado.
- **Problema real**: O `memoryKeys` no `EditorPlayground.tsx` deriva de `Object.keys(fixedMemory)` e das chaves do template atual (placeholders), porém pode haver uma dessincronização entre as chaves exibidas e a função de salvamento real/autosave que depende de `visibleFixedMemory`. O estado `setFixedMemory` em `EditorPage` pode estar esmagando chaves vazias ou o autosave falha.

## 2. Variáveis: Dificuldade no preenchimento de variáveis fixas
- **Investigação**: `debouncedForm` na `EditorPage.tsx` atrasa as compilações, mas as variáveis fixas da memória têm um `onSaveMemory={handleSaveMemory}` em tempo real, enquanto o autosave em lote do useEffect tem debounce. Porém, se houver chamadas simultâneas de `setFixedMemory`, e a API for assíncrona, as teclas perdem foco ou os dados não batem.

## 3. Importação: Prompts importados via JSON aparecem vazios na UI
- **Investigação**: `src/services/importService.ts` cria os registros com `syncStatus: 'pending'`, o que está correto. Mas no Dexie (`buildPromptRecord`), o `isDeleted` é definido como `false` e a UI pode estar filtrando de forma errada, **OU** o `importService.ts` está injetando `id: existingPrompt?.id`, mas nos novos prompts (criados), `id` fica `undefined` e Dexie auto-incrementa. Contudo, em algumas queries pela aplicação as rotas buscam pelo `id` antes de resolver adequadamente, ou o payload JSON importado não satisfaz estritamente a nova Zod Schema (`schema_version`), e falha silenciosamente no load em `EditorPage.tsx`.

## 4. Menus: Falha no seletor de menus ao vincular a templates existentes
- **Investigação**: O seletor em `EditorPage.tsx` chama `onToggleOption`. Quando ele percorre `selection.selected_menus`, ele cruza os dados com `contextMenus` (disponíveis globalmente) ou os menus linkados ao template atual. Se o menu global foi editado, os ids das opções (`option.value`) perdem a referência e a UI para de renderizar ou cracha.

## 5. Sync / Geral: Causas de N+1 queries
- **Investigação**: Descobri o uso excessivo de `.toArray()` em `src/services/sync/categorySync.ts` (ex: `db.categories.where('remoteId').anyOf(remoteIds).toArray();`). Apesar do `anyOf` reduzir o N+1 da nuvem para o local, quando processando lotes gigantescos, essas chamadas são feitas dentro de laços (`for...of`), forçando alocação O(N).
Além disso, em páginas como `CategoryManagerPage.tsx`, carrega-se toda a tabela `db.categories.filter(c => !c.isDeleted).toArray()` na memória local da aplicação apenas para contagens/visualizações menores.
