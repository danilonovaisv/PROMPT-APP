# 1. Causa Raiz

O diagnóstico principal é duplo:

1. **Causa raiz de código, uncached egress:** o app executou leituras repetidas e amplas do Supabase para detecção de conflitos, sync inteligente e downloads completos, especialmente sobre `prompts`, `prompt_memory_context` e `context_menus`. O principal vetor foi a combinação de:
   - polling de verificação de updates
   - hidratação de payloads completos com `select("*")`
   - downloads paginados de tabelas inteiras
   - uso de `smartSync()` e `detectConflicts()` como mecanismo de reconciliação no cliente

2. **Causa raiz administrativa, bloqueio atual:** a organização do projeto está em **plano Free** no Supabase, com cotas de **5 GB uncached egress** e **5 GB cached egress**. Mesmo que o código tenha sido parcialmente mitigado, o bloqueio atual **não será removido apenas com otimização de código** enquanto a organização continuar restrita por quota já excedida no ciclo corrente.

Diagnóstico final:

- O erro `exceed_egress_quota` foi fortemente causado por **anomalia de implementação** no fluxo de sync e detecção de conflito.
- O erro `exceed_cached_egress_quota` **não tem evidência forte no código do frontend atual**, porque a app não usa Supabase Storage SDK no runtime principal. A hipótese mais forte é consumo em bucket público externo ao fluxo principal da app, provavelmente o bucket `HIGGSFIELD`.
- O problema atual exige **duas frentes ao mesmo tempo**:
  - contenção técnica no código
  - ação administrativa do Project Owner no Billing

# 2. Evidências Técnicas

## 2.1 Polling e verificação de updates no cliente

Arquivo: `src/context/CloudSyncContext.tsx`

Trecho:

```ts
const refreshUpdates = useCallback(async () => {
  if (!isSupabaseConfigured) {
    setHasUpdates(false);
    return;
  }

  try {
    setHasUpdates(await checkForUpdates());
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
  }
}, []);
```

Trecho:

```ts
useEffect(() => {
  if (!session) return;

  if (realtimeActive) {
    return;
  }

  const interval = setInterval(() => {
    void refreshUpdates();
  }, 300000);

  return () => clearInterval(interval);
}, [refreshUpdates, realtimeActive, session]);
```

Impacto:

- O polling hoje está mitigado para rodar apenas quando `realtimeActive === false`.
- Isso é melhor do que polling contínuo, mas ainda significa chamadas periódicas à API em toda sessão degradada de realtime.
- O custo real da chamada depende do que `checkForUpdates()` faz, e esse é o ponto crítico.

## 2.2 `checkForUpdates()` ainda depende de `detectConflicts()`

Arquivo: `src/services/assetManager.ts`

Trecho:

```ts
export async function checkForUpdates(): Promise<boolean> {
  const conflicts = await detectConflicts();
  return conflicts.length > 0;
}
```

Impacto:

- O simples ato de “checar se há updates” ainda dispara o pipeline de detecção de conflitos.
- Embora a versão atual use metadados em vez de `select("*")` nessa primeira fase, continua sendo uma consulta multi-tabela por sessão e por polling fallback.

## 2.3 Detecção de conflitos consulta todas as entidades remotas por usuário

Arquivo: `src/services/assetManager.ts`

Trecho:

```ts
const [catRes, promptRes, menuRes, memoryRes] = await Promise.all([
  supabase.from("categories").select(REMOTE_METADATA_SELECT).eq("user_id", userId),
  supabase.from("prompts").select(REMOTE_METADATA_SELECT).eq("user_id", userId),
  supabase.from("context_menus").select(REMOTE_METADATA_SELECT).eq("user_id", userId),
  supabase.from("prompt_memory_context").select(REMOTE_MEMORY_METADATA_SELECT).eq("user_id", userId),
]);
```

Impacto:

- Houve melhoria importante: o código atual usa seleção de metadados, não mais `select("*")` nessa etapa.
- Mesmo assim, o modelo continua sendo **full scan lógico por entidade do usuário**, não um mecanismo incremental por cursor, watermark ou changelog.
- Isso escala mal em volume de linhas e em número de sessões.

## 2.4 Hidratação completa de registros alterados ainda usa `select("*")`

Arquivo: `src/services/assetManager.ts`

Trecho:

```ts
const [catRes, promptRes, menuRes, memoryRes] = await Promise.all([
  categoryIds.length > 0
    ? supabase.from("categories").select("*").eq("user_id", userId).in("id", categoryIds)
    : Promise.resolve({ data: [] as RemoteCategory[], error: null }),
  promptIds.length > 0
    ? supabase.from("prompts").select("*").eq("user_id", userId).in("id", promptIds)
    : Promise.resolve({ data: [] as RemotePrompt[], error: null }),
  menuIds.length > 0
    ? supabase.from("context_menus").select("*").eq("user_id", userId).in("id", menuIds)
    : Promise.resolve({ data: [] as RemoteContextMenu[], error: null }),
  memoryIds.length > 0
    ? supabase.from("prompt_memory_context").select("*").eq("user_id", userId).in("id", memoryIds)
    : Promise.resolve({ data: [] as RemotePromptMemory[], error: null }),
]);
```

Impacto:

- Esse é um hotspot direto de egress.
- `prompts` contém payloads JSON grandes, incluindo:
  - `prompt_payload_jsonb`
  - `selection_payload_jsonb`
  - `compiled_payload_jsonb`
  - `few_shot_examples`
- Mesmo quando a app precisa apenas reconciliar um delta pequeno, ela ainda hidrata linhas inteiras.

## 2.5 Download completo de tabelas inteiras

Arquivos:

- `src/services/sync/categorySync.ts`
- `src/services/sync/menuSync.ts`
- `src/services/sync/promptSync.ts`
- `src/services/sync/memorySync.ts`

Trechos:

```ts
supabase.from("categories").select("*").eq("is_deleted", false).range(r[0], r[1])
```

```ts
supabase.from("context_menus").select("*").eq("is_deleted", false).range(r[0], r[1])
```

```ts
supabase.from("prompts").select("*").eq("is_deleted", false).range(r[0], r[1])
```

```ts
supabase.from("prompt_memory_context").select("*").range(r[0], r[1])
```

Impacto:

- Há paginação por `range`, o que é melhor do que um único fetch gigante.
- Mas continua sendo **download completo de tabela**, não sincronização incremental.
- Em `prompts`, isso é particularmente caro.

## 2.6 Peso real dos payloads já medido no próprio repositório

Arquivo: `reports/supabase-egress-baseline.json`

Evidência:

```json
"payload_sizes": {
  "prompts": {
    "avg_prompt_payload_chars": 25529.06,
    "max_prompt_payload_chars": 172309,
    "avg_compiled_payload_chars": 12477.32,
    "max_compiled_payload_chars": 58943,
    "avg_selection_payload_chars": 3446.92,
    "max_selection_payload_chars": 46983
  },
  "approx_total_chars": {
    "prompts": 3525921,
    "prompt_memory_context": 355293,
    "context_menus": 219201,
    "categories": 308
  }
}
```

Impacto:

- O maior vilão é `prompts`.
- Só a leitura de `prompts` já representa volume de saída suficiente para pressionar fortemente a cota em múltiplas sessões, múltiplos reloads ou loops de sync.

## 2.7 `smartSync()` ainda encadeia conflito, pull e push

Arquivo: `src/services/assetManager.ts`

Trecho:

```ts
const conflicts = await detectConflicts();
...
const pullResult = await pullLatestChanges();
...
const pushResult = await pushPendingChanges();
```

Impacto:

- `smartSync()` é funcionalmente agressivo.
- Em uma única ação de usuário ele pode:
  - ler metadados remotos de todas as entidades
  - hidratar registros completos
  - puxar atualizações
  - subir pendências

## 2.8 Autosync de memória fixa sincroniza o mapa inteiro do template

Arquivo: `src/pages/EditorPage.tsx`

Trecho:

```ts
useEffect(() => {
  if (!loaded || !form.template.meta.template_id) return;

  const saveChanges = async () => {
    setIsSavingMemory(true);
    try {
      await syncMemory(form.template.meta.template_id, debouncedFixedMemory);
    } catch (error) {
      ...
    } finally {
      setTimeout(() => setIsSavingMemory(false), 800);
    }
  };

  saveChanges();
}, [debouncedFixedMemory, loaded, form.template.meta.template_id, showToast]);
```

Arquivo: `src/services/memoryService.ts`

Trecho:

```ts
const allLocalRecords = await db.promptMemory
  .where('templateId')
  .equals(templateId)
  .toArray();

const upsertPayload = allLocalRecords.map(record => ({
  user_id: user.id,
  template_id: templateId,
  key: record.key,
  value: record.value,
  is_deleted: !!record.isDeleted,
  deleted_at: record.isDeleted ? record.updatedAt.toISOString() : null,
  updated_at: record.updatedAt.toISOString()
}));

await supabase
  .from('prompt_memory_context')
  .upsert(upsertPayload, { onConflict: 'user_id,template_id,key' });
```

Impacto:

- Não é o maior vetor do incidente, mas é um amplificador.
- Cada alteração relevante em memória fixa do template pode levar ao reenvio do conjunto inteiro daquele template.

## 2.9 Realtime: montagem e desmontagem estão corretas

Arquivo: `src/services/realtimeService.ts`

Trechos:

```ts
cleanupRealtimeListeners();
```

```ts
channel.subscribe((status, error) => { ... })
```

```ts
categoriesChannel.unsubscribe();
void supabase.removeChannel(categoriesChannel).catch(...)
```

Impacto:

- Não há evidência atual de conexões zumbis ou subscriptions duplicadas permanentes.
- O Realtime não é o principal suspeito do incidente de uncached egress.
- Há oportunidade de reduzir payload do Realtime com `select` por coluna, mas isso é otimização secundária, não causa raiz principal.

## 2.10 Storage: o app principal não usa o SDK de Storage

Varredura de código:

- não foram encontrados usos relevantes de `storage.from(...)`
- não foram encontrados usos de `getPublicUrl`, `createSignedUrl`, `download`, `upload` no runtime principal do app

Evidência documental:

Arquivo: `reports/supabase-egress-findings.json`

```json
"summary": "A public Storage bucket exists in the same project, but the current app code does not reference Supabase Storage."
```

Impacto:

- O `exceed_cached_egress_quota` não aponta, por evidência atual, para bug direto do frontend desta app.
- O suspeito mais forte é tráfego no bucket público `HIGGSFIELD`, possivelmente por acesso externo, outro app, links públicos ou consumo manual.

# 3. Impacto e Prioridade

## Prioridade Alta

- Leituras amplas de `prompts` e hidratação com `select("*")`
- Download completo de tabelas no fluxo de sync
- `smartSync()` concentrando muitas operações de leitura/escrita
- Restrição ativa por quota já estourada

## Prioridade Média

- Autosync de memória fixa com upsert do mapa inteiro
- Polling fallback quando Realtime falha
- Ausência de mecanismo incremental por `updated_at > watermark`

## Prioridade Baixa

- Otimização de payload de Realtime via `select`
- Ajustes finos de RLS e índices, úteis para CPU/latência, mas não causa primária de egress

## Avaliação do dano

- **Dano operacional:** alto, porque o projeto já está restrito.
- **Dano econômico:** alto em plano pago, moderado a alto em Free, porque leva a bloqueio e indisponibilidade.
- **Risco de recorrência:** alto, se o sync continuar baseado em tabela inteira e hidratação completa de payloads.

# 4. Plano de Correção

## Soluções de código

1. Transformar `checkForUpdates()` em verificação incremental por watermark, sem varrer todas as linhas por usuário.
2. Eliminar `select("*")` dos fluxos de reconciliação e baixar apenas colunas estritamente necessárias.
3. Substituir downloads completos por sync incremental baseado em:
   - `updated_at`
   - `id`
   - paginação determinística
4. Reduzir o papel de `smartSync()` como mecanismo padrão de operação.
5. Reduzir o custo do sync de memória fixa, enviando apenas keys alteradas.
6. Adicionar observabilidade explícita de volume por endpoint e por operação de sync.

## Soluções administrativas

1. O **Project Owner** deve abrir o Billing do Supabase e decidir entre:
   - **upgrade para Pro**, se a organização ainda estiver no Free
   - ou, se já estivesse em Pro, **desligar o Spend Cap**
2. Como a organização atual está em **Free**, a ação correta é:
   - **fazer upgrade para Pro**, ou
   - aguardar o reset do ciclo de billing depois de conter o uso
3. Para `cached egress`, o Project Owner também deve auditar o bucket público `HIGGSFIELD` no dashboard.

## Conclusão operacional

- **As falhas de código explicam fortemente o estouro de uncached egress.**
- **Elas não garantem, sozinhas, o desbloqueio imediato do projeto atual.**
- **O desbloqueio imediato depende de ação administrativa no Billing ou do reset do ciclo.**

# 5. Alterações Recomendadas no Código

## 5.1 Verificação incremental, não varredura global

Substituir:

- `fetchRemoteSummaries()` lendo tudo do usuário

Por:

- uma tabela de controle local com `lastSeenUpdatedAt` por entidade
- consultas do tipo:
  - `updated_at > watermark`
  - `order(updated_at, id)`
  - `range(...)`

## 5.2 Remover `select("*")` de reconciliação

Substituir em `assetManager.ts`:

```ts
supabase.from("prompts").select("*")
```

Por seleção explícita, por exemplo:

- `id`
- `updated_at`
- `is_deleted`
- `title`
- apenas os campos realmente necessários para reconciliação

Só buscar `prompt_payload_jsonb`, `compiled_payload_jsonb` e `selection_payload_jsonb` quando houver efetiva necessidade de abrir ou materializar o prompt.

## 5.3 Baixar prompts por modo resumido e modo detalhado

Separar fluxos:

- **modo resumo** para sync
- **modo detalhado** apenas ao abrir editor ou restaurar item específico

Hoje o sync trata `prompts` como se todo delta exigisse o documento inteiro. Isso está errado para um payload dessa ordem de grandeza.

## 5.4 Tornar `downloadFromCloud()` incremental

Os handlers atuais paginam, mas baixam tudo:

- `downloadCategories()`
- `downloadMenus()`
- `downloadPrompts()`
- `downloadMemoryFromCloud()`

Refatorar para:

- sync por janela de atualização
- paginação estável por `updated_at asc, id asc`
- checkpoint persistido localmente

## 5.5 Rebaixar `smartSync()` de default para ferramenta de reparo

`smartSync()` hoje faz demais para um comando normal de UI. Recomenda-se:

- fluxo normal: sync incremental leve
- fluxo avançado/manual: `smartSync()` ou “rebuild sync state”

## 5.6 Reduzir egress de memória fixa

Trocar `syncMemory(templateId, memoryMap)` por:

- diff por chave
- envio apenas das chaves alteradas
- exclusões explícitas por chave

## 5.7 Realtime com payload reduzido

Segundo documentação oficial do Supabase Realtime, é possível limitar colunas no `postgres_changes` usando `select`.

Aplicação:

- usar `select` mínimo em canais onde o payload completo não é necessário
- reduzir bytes empurrados por evento

## 5.8 Storage, se o bucket público continuar em uso

Se `HIGGSFIELD` fizer parte do ecossistema do projeto:

- revisar exposição pública
- aplicar `cache-control` alto para assets estáticos
- usar Smart CDN
- auditar objetos mais acessados em Logs Explorer

# 6. Validação das Correções

## Passo 1, validar comportamento de código

1. Instrumentar logs locais para contar:
   - chamadas de `checkForUpdates()`
   - execuções de `detectConflicts()`
   - execuções de `smartSync()`
   - número de linhas e bytes aproximados por operação
2. Confirmar que o polling só roda quando `realtimeActive === false`.
3. Confirmar que nenhuma reconciliação usa `select("*")` nas rotas quentes.

## Passo 2, validar no Supabase

1. Abrir:
   - Usage page da organização
   - Billing page
   - Observability custom reports
   - Logs Explorer com Top Paths
2. Comparar antes e depois em:
   - Database Egress
   - Realtime Egress
   - Cached Egress
3. Verificar redução de:
   - frequência de `/rest/v1/prompts`
   - frequência de downloads completos
   - payload médio por request

## Passo 3, validar o bucket público

1. Rodar o template “Storage Egress Requests” no Logs Explorer.
2. Identificar objetos com maior número de `GET`.
3. Confirmar se o consumo vem:
   - da app
   - de links públicos externos
   - de outro sistema

## Passo 4, validar desbloqueio administrativo

1. Se o org continuar no Free:
   - confirmar upgrade para Pro, ou
   - aguardar reset do ciclo
2. Se houver migração para Pro:
   - confirmar política de Spend Cap
3. Verificar se o erro 402 desaparece após a ação de billing.

# 7. Checklist de Prevenção

- Nunca usar `select("*")` em tabelas com payloads grandes em fluxos recorrentes de sync.
- Toda verificação de updates deve ser incremental por watermark, nunca por varredura completa do usuário.
- `smartSync()` não deve ser o caminho normal de operação.
- Realtime deve ser a primeira fonte de delta; polling deve ser apenas fallback controlado.
- Toda consulta de sync deve ter seleção explícita de colunas.
- Toda rotina de download deve usar paginação determinística e checkpoint incremental.
- Toda sincronização de mapa ou documento composto deve enviar apenas diffs.
- Buckets públicos devem ter owner claro, inventário de objetos, política de cache e revisão periódica de egress.
- O dashboard de Usage do Supabase deve ser revisado por rotina após deploys que alterem sync, Realtime ou Storage.
- Se a organização estiver em Pro, o Spend Cap deve ser uma decisão consciente, não padrão esquecido.
- Nenhuma mudança grande em sync deve entrar em produção sem medir:
  - requests por sessão
  - bytes por operação
  - custo de fallback quando Realtime falha

