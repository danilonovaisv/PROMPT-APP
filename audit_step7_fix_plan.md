# STEP 7 — FIX PLAN (ROADMAP)

### Bloqueadores (P0)
1. **Memória Fixa no Playground**:
   - **Ação**: Corrigir o lifecycle no `EditorPage.tsx` na função `handleAddMemoryKey` para atualizar o template core (se necessário) além do state visual. E garantir que os inputs da Memória Fixa no `EditorPlayground.tsx` atualizem devidamente o Dexie local imediatamente com tratamento debounced apenas visual.
2. **Importação Vazia na UI**:
   - **Ação**: Atualizar `buildPromptRecord` no `src/services/importService.ts`. O campo `syncStatus` já é `'pending'`, mas precisamos checar se campos vitais para o Zod Schema (`isDeleted`, `categoryId`, referências) estão preenchendo adequadamente os novos Ids auto-gerados.

### Estabilidade (P1)
1. **Sync / Supabase N+1 Queries**:
   - **Ação**: Para `src/services/sync/categorySync.ts` e afins, encadear filtragens no query level antes de instanciar `.toArray()`, ou trocar consultas inteiras para iteradores baseados em chaves ou cursores nativos Dexie. Para queries no `CategoryManagerPage.tsx`, substituir `.filter().toArray()` por `db.categories.where('isDeleted').equals(false).toArray()` (se o index existir, precisaria adicionar no schema) ou pelo menos aplicar paginação.

### UX/DX (P2)
1. **Limpeza de código morto e Menus**:
   - **Ação**: Impedir a quebra de renderização de Menus (Issue 4) em `EditorPlayground.tsx`. Quando `optionSelection` ou a opção base for deletada do schema global, o componente deve lidar graciosamente ao invés de lançar TypeError. Limpar `contextMenuSync.ts` (arquivos não referenciados se houver).
