# Relatório Técnico de Arquitetura, PROMPT APP

## Escopo e fontes

Este relatório consolida a auditoria técnica do repositório local `PROMPT-APP` para apoiar a redação futura do Project Spec oficial. A análise foi feita em modo de documentação, sem alteração de código de aplicação.

A fonte operacional usada foi o código local em `/workspace/PROMPT-APP`. A verificação do repositório GitHub obrigatório `https://github.com/danilonovaisv/DATABASE_AGENT_NEXT` foi tentada com `git ls-remote`, mas falhou porque o repositório exige credenciais no ambiente atual. A consulta ao vector store `vs_69520b1fb834819197e445db9aab8d69` também ficou bloqueada, pois não havia recursos ou templates MCP disponíveis na sessão.

Conclusão de fonte: o relatório abaixo deve ser tratado como fiel ao estado local auditado, com bloqueio parcial explícito para GitHub remoto e vector store.

## Resumo da Infraestrutura

### Stack e scripts

O projeto está identificado como `prompt-app`, privado, versão `2.0.0`, com `pnpm@11.5.0` e módulos ESM. Os scripts operacionais principais são:

| Script | Comando | Função |
| --- | --- | --- |
| `dev` | `vite` | servidor local de desenvolvimento |
| `build` | `tsc -p tsconfig.app.json && vite build` | typecheck de aplicação e build Vite |
| `test` | `jest` | suíte unitária |
| `test:e2e` | `playwright test` | testes end to end |
| `lint` | `eslint .` | lint do repositório |
| `type-check` | `tsc --noEmit` | checagem TypeScript geral |
| `db:generate` | `drizzle-kit generate` | geração Drizzle |
| `db:migrate` | `netlify dev:exec drizzle-kit migrate` | migração via Netlify |
| `db:studio` | `netlify dev:exec drizzle-kit studio` | Drizzle Studio via Netlify |

As dependências core reais no `package.json` são React `^19.2.6`, React DOM `^19.2.6`, React Router DOM `^7.16.0`, Dexie `^4.4.3`, Dexie React Hooks `^4.4.0`, Zod `^4.4.3`, Supabase JS `^2.106.2`, Supabase SSR `^0.10.3`, Sentry `^10.55.0`, Drizzle ORM `^0.45.2`, Netlify Neon `^0.1.2` e Lucide React `^1.17.0`.

Há uma divergência importante em relação ao contexto informado antes da auditoria: o stack declarado mencionava TypeScript 5.9 e Vite 7.3, mas o código local usa TypeScript `~6.0.3` e Vite `^8.0.14`. O Project Spec oficial deve seguir o `package.json` atual ou registrar explicitamente a versão pretendida como meta futura.

### TypeScript e Vite

O `tsconfig.json` raiz ativa `strict` e `forceConsistentCasingInFileNames`, e referencia `tsconfig.app.json`, `tsconfig.node.json` e `tsconfig.jest.json`.

O `tsconfig.app.json` define `target: ES2020`, libs `ES2020`, `DOM` e `DOM.Iterable`, `module: ESNext`, `moduleResolution: bundler`, `allowImportingTsExtensions`, `isolatedModules`, `jsx: react-jsx`, `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, e paths `@/*` para `./src/*`.

O `vite.config.ts` usa `@vitejs/plugin-react`, Sentry Vite Plugin com ativação condicional por `CI=true` ou `SENTRY_BUILD_PLUGIN=true`, bundle analysis opcional por `ANALYZE=true`, alias `@` para `/src`, chunks manuais para React, Dexie, Supabase e Lucide, `chunkSizeWarningLimit: 500` e `sourcemap: hidden`.

### Inicialização e roteamento

`src/main.tsx` importa `instrument`, configura Sentry via `reactErrorHandler`, cria o root React, importa `App`, CSS global e inicializa o banco por side effect com `@/db/database`.

`src/App.tsx` usa `BrowserRouter`, `ToastProvider`, `ConfirmProvider`, `CloudSyncProvider`, `ErrorBoundary`, `Layout` e `ImportExportModal`. As páginas são lazy loaded para code splitting. Na montagem, o app importa dinamicamente `seedDatabase`, `saveLocalBackup` e `setupAutoSync`, executa seed, agenda backup local e inicializa sync automático.

As rotas atuais são:

| Rota | Página | Função |
| --- | --- | --- |
| `/` | `HomePage` | página inicial e entrada por categorias |
| `/sobre` | `AboutPage` | página institucional |
| `/contato` | `ContactPage` | página de contato |
| `/privacidade` | `PrivacyPage` | página de privacidade |
| `/categoria/:id` | `CategoryPage` | prompts por categoria |
| `/categorias` | `CategoryManagerPage` | gestão de categorias |
| `/editor/:id` | `EditorPage` | criação e edição de templates |
| `/menus` | `MenuManagerPage` | gestão de menus globais |

## Topologia de Componentes

### Páginas

`HomePage` é a entrada principal por categorias.

`CategoryPage` lista e opera prompts de uma categoria específica.

`CategoryManagerPage` gerencia categorias locais e sincronizáveis.

`EditorPage` é o núcleo funcional do app. Ele carrega categorias, menus globais, memória fixa, rascunhos em `localStorage`, estado do template, seleção do usuário, payload compilado, preview, cópia, download, persistência local e tentativa de sincronização com Supabase.

`MenuManagerPage` gerencia menus de contexto globais e aciona importação de menus.

`AboutPage`, `ContactPage` e `PrivacyPage` são páginas informativas.

### Componentes de shell

`Layout` envolve as páginas e recebe o callback para abrir importação e exportação.

`ImportExportModal` centraliza importação e exportação geral.

`ImportMenusModal` centraliza importação específica de menus de contexto.

`ErrorBoundary` protege o shell contra falhas de renderização.

`SkeletonLoader` fornece fallbacks para páginas lazy loaded.

`SEO` gerencia metadados de página.

`Breadcrumb` renderiza trilha de navegação no editor.

### Componentes do editor

`EditorMetaForm` edita metadados do template e categoria.

`EditorDefinitionForm` edita role, task, contexto, constraints, few shot examples, output contract e vínculo de menus globais.

`EditorPlayground` mostra e manipula o estado de execução: seleção de opções, subopções, inputs livres, memória fixa e prompt renderizado.

`EditorPreviewModal` apresenta preview do payload ou prompt.

`EditorContextMenuSelector` permite buscar, adicionar e remover menus globais vinculados ao template.

### Componentes de menus

`MenuForm` cria ou edita um menu de contexto.

`MenuOptionEditor` edita opções e subopções dentro de um menu.

Há um arquivo `src/components/menu-manager/MenuForm.tsx.orig`, que parece resíduo de backup ou merge e deve ser tratado como dívida técnica.

## Data Models, Dexie e TypeScript

### Entidade `Category`, `src/models/types.ts`

```ts
export interface Category {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

### Entidades de menu hierárquico, `src/models/types.ts`

```ts
export interface ContextMenuSubOption {
  label: string;
  value: string;
}

export interface ContextMenuOption {
  label: string;
  value: string;
  subOptions: ContextMenuSubOption[];
}

export interface ContextMenu {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  menuId: string;
  menuName: string;
  description: string;
  selectionMode: MenuSelectionMode;
  options: ContextMenuOption[];
  createdAt: Date;
  updatedAt: Date;
}
```

Este é o modelo interno camelCase salvo no Dexie. A árvore hierárquica atual é `ContextMenu.options[].subOptions[]`.

### Seleção legada de menu, `src/models/types.ts`

```ts
export interface ContextMenuSelection {
  option: string;
  subOptions: string[];
}

export type MenuSelectionsMap = Record<string, ContextMenuSelection>;
```

Esse formato é legado. O contrato novo usa `UserSelection.selected_menus[]`.

### Modelo antigo de opções simples, `src/models/types.ts`

```ts
export interface MenuOption {
  id?: number;
  menuKey: 'tom' | 'publico' | 'idioma' | 'estilo';
  label: string;
  value: string;
}

export interface MenuSelections {
  tom: string;
  publico: string;
  idioma: string;
  estilo: string;
}

export type MenuKey = 'tom' | 'publico' | 'idioma' | 'estilo';
```

Esse modelo convive com `contextMenus`, mas o schema Dexie indica que `menuOptions` está depreciado.

### Entidade `Prompt`, `src/models/types.ts`

```ts
export interface FewShotExample {
  input: string;
  output: string;
}

export interface Prompt {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  categoryId: number;
  title: string;
  selectedMenuIds?: number[];
  promptPayload: TemplatePayload;
  selectionPayload?: UserSelection;
  compiledPayload?: CompiledPromptPayload;
  schemaVersion: string;
  language: string;
  outputFormat: PromptOutputFormat;
  referenceUrl?: string;
  fewShotExamples: FewShotExample[];
  createdAt: Date;
  updatedAt: Date;
}
```

O prompt persiste três camadas: template base, seleção do usuário e payload compilado.

### Exportação, `src/models/types.ts`

```ts
export type PromptExportFormat = TemplatePayload;

export interface BulkExport {
  app: string;
  version: string;
  format?: string;
  schemaVersion?: string;
  exportedAt: string;
  menuDefinitions?: MenuDefinition[];
  prompts: Array<{
    title: string;
    category: string;
    schemaVersion: string;
    prompt: TemplatePayload;
  }>;
}
```

A exportação individual é exatamente `TemplatePayload`. O bulk inclui metadados do app, versão de exportação, schemaVersion, menuDefinitions e prompts.

### Entidades remotas e memória, `src/models/types.ts`

O código também define `RemoteCategory`, `RemoteContextMenu`, `RemotePrompt`, `PromptMemory` e `RemotePromptMemory`. Isso confirma que o app é local first com sincronização cloud opcional, não estritamente offline only.

### Contrato `TemplatePayload`, `src/models/promptSchema.ts`

```ts
{
  meta: {
    template_id: string;
    template_name: string;
    template_type: string;
    schema_version: string;
    language: string;
    status: "draft" | "active" | "archived";
  };
  prompt_definition: {
    system_role: string;
    task: string;
    context: string;
    user_scene_description: string;
    constraints: string[];
    negative_prompt: string[];
    few_shot_examples: Array<{ input: string; output: string }>;
  };
  menu_definitions: MenuDefinition[];
  menu_ids: string[];
  output_contract: {
    format: "text" | "markdown" | "json" | "image" | "code";
    language: string;
    strict_mode: boolean;
    required_fields: string[];
    response_rules: string[];
    optional_enums?: Record<string, string[]>;
  };
}
```

### Contrato `MenuDefinition`, `src/models/promptSchema.ts`

```ts
{
  menu_id: string;
  menu_name: string;
  description: string;
  selection_mode: "single" | "multiple";
  required: boolean;
  options: Array<{
    label: string;
    value: string;
    description: string;
    sub_options: Array<{
      label: string;
      value: string;
      description: string;
    }>;
  }>;
}
```

Esse é o formato externo em snake_case usado dentro de templates e exports.

### Contrato `UserSelection`, `src/models/promptSchema.ts`

```ts
{
  template_id: string;
  selected_menus: Array<{
    menu_id: string;
    selected_options: Array<{
      option_value: string;
      selected_sub_options: string[];
    }>;
  }>;
  free_inputs: Record<string, string>;
  fixed_variables: Record<string, string>;
}
```

### Contrato `CompiledPromptPayload`, `src/models/promptSchema.ts`

```ts
{
  template_id: string;
  meta: {
    template_name: string;
    template_type: string;
    schema_version: string;
    language: string;
  };
  compiled_context: {
    menu_interpretation: Record<string, {
      selected_options: string[];
      selected_sub_options: string[];
      selections: Array<{
        option_value: string;
        option_label: string;
        selected_sub_options: Array<{
          value: string;
          label: string;
        }>;
      }>;
    }>;
    free_inputs: Record<string, string>;
    fixed_variables: Record<string, string>;
  };
  prompt_definition: PromptDefinition;
  output_contract: PromptOutputContract;
}
```

### Schema Dexie atual, `src/db/database.ts`

O banco é `PromptAppDB`. A versão atual é `13`:

```ts
db.version(13).stores({
  categories: '++id, input, name, createdAt, remoteId, syncStatus',
  prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
  menuOptions: '++id, menuKey, value',
  contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
  promptMemory: '++id, key, templateId, [templateId+key], remoteId, syncStatus, isDeleted',
});
```

As versões anteriores mostram a evolução do modelo. A versão `6` migrou prompts legados para `promptPayload`, a versão `7` adicionou `selectionPayload` e `compiledPayload`, a versão `8` adicionou `selectedMenuIds`, as versões `9` e `10` reforçaram normalização de `selectedMenuIds`, a versão `11` adicionou `promptMemory`, a versão `12` adicionou `isDeleted` em memória e a versão `13` adicionou índice composto `[templateId+key]`.

### Seeds padrão

As categorias padrão são Copywriting, Código, Análise de Dados, Educação, Criativo e Negócios.

Os context menus padrão são `tom`, `publico`, `idioma` e `estilo`, todos com `selectionMode: 'single'`. Cada menu possui opções e subopções hierárquicas.

Exemplos:

`tom`: Formal com Corporativo, Acadêmico e Jurídico; Informal com Conversacional e Humorístico; Técnico com Conciso, Detalhado e Acadêmico; Didático, Persuasivo e Neutro sem subopções.

`publico`: Desenvolvedores com Júnior, Sênior e Full Stack; Estudantes com Ensino Médio, Graduação e Pós Graduação; Executivos, Público Geral, Especialistas e Crianças sem subopções.

`idioma`: Português BR, Inglês com Americano e Britânico, Espanhol, Francês e Alemão.

`estilo`: Conciso; Detalhado com Com exemplos e Com referências; Passo a passo; Lista; Narrativo com Storytelling e Metáforas; Comparativo.

## Contratos de Importação e Exportação

### Exportação individual, `src/utils/exportJson.ts`

`toExportFormat(prompt)` retorna `PromptContractSchema.parse(prompt.promptPayload)`. Portanto, a exportação individual não inclui categoria, ID local, remoteId, status de sync, seleção do usuário ou payload compilado. Ela exporta apenas o template.

`downloadPrompt(prompt)` gera `prompt_${safeName}.json`.

### Exportação em massa, `src/utils/exportJson.ts`

`downloadAllPrompts()` lê prompts, categorias e context menus do Dexie, converte menus para `MenuDefinition` e cria o bulk export:

```ts
{
  app: "Prompt App",
  version: CURRENT_BULK_EXPORT_VERSION,
  format: "prompt-app-bulk-export",
  schemaVersion: CURRENT_PROMPT_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  menuDefinitions: contextMenus.map(contextMenuToDefinition),
  prompts: prompts.map((prompt) => ({
    title: prompt.title,
    category: categoryMap.get(prompt.categoryId) || "Sem categoria",
    schemaVersion: prompt.schemaVersion,
    prompt: toExportFormat(prompt),
  })),
}
```

### Importação de prompts, `src/services/importService.ts`

Não existe `src/utils/importJson.ts` no repositório local auditado. O fluxo real está em `src/services/importService.ts`.

`importFromFile(file)` delega para `importFromJsonText(await file.text(), file.name)`.

A importação aceita apenas arquivos `.json`, sanitiza caracteres invisíveis, remove lixo antes e depois do JSON, faz parse e garante categoria `Importados`.

O bulk export é detectado quando o objeto possui `prompts` como array. O importador aceita `menuDefinitions` ou `contextMenus` no payload. Os menus passam por `normalizeMenuBatch`, são gravados em `db.contextMenus` se ainda não existirem e retornam definições snake_case para sincronizar os templates importados.

A importação em massa usa cache de categorias por nome para evitar consulta N mais um, gera registros de `Prompt`, faz `bulkAdd` e salva `fixed_variables` em `promptMemory`.

Também são aceitos array simples de prompts e objeto único de prompt.

### Importação de menus dedicada, `src/utils/importMenusJson.ts`

O schema dedicado para importação de menus é:

```ts
{
  version: string;
  menus: Array<{
    menu_id: string;
    menu_name: string;
    description?: string;
    selection_mode?: "single" | "multiple";
    options: Array<{
      label: string;
      value: string;
      sub_options?: Array<{
        label: string;
        value: string;
      }>;
    }>;
  }>;
}
```

O fluxo valida schema com Zod, bloqueia `menu_id` duplicado dentro do arquivo, verifica conflitos ativos no Dexie, permite reaproveitar registros soft deleted, tenta salvar no Supabase em lote e grava localmente em transação com `bulkPut`.

A exportação dedicada de menus retorna `{ version: '1.0', menus: [...] }` e converte `subOptions` internas para `sub_options` externas.

## Fluxos Estratégicos

### Menus de contexto hierárquicos

O sistema mantém dois formatos:

Formato interno camelCase no Dexie:

```ts
ContextMenu {
  menuId;
  menuName;
  description;
  selectionMode;
  options: [
    {
      label;
      value;
      subOptions: [{ label, value }];
    }
  ];
}
```

Formato externo snake_case no template:

```ts
MenuDefinition {
  menu_id;
  menu_name;
  description;
  selection_mode;
  required;
  options: [
    {
      label;
      value;
      description;
      sub_options: [{ label, value, description }];
    }
  ];
}
```

A ponte é `contextMenuToDefinition(menu)`, que normaliza opções, transforma `subOptions` em `sub_options`, injeta `required: false` e preserva identidade do menu.

No editor, os menus vinculados ao template são armazenados como `selectedMenuIds` numéricos no prompt, mas o template armazena `menu_ids` textuais. A função `syncFormMenus()` converte os IDs locais em `menuId`, sincroniza `menu_definitions` e remove seleções de menus não vinculados.

Ao carregar prompt existente, o editor usa `prompt.selectedMenuIds` quando presente. Se ausente, infere os IDs locais comparando `template.menu_ids` e snapshots de `menu_definitions` com `contextMenus[].menuId`.

### Seleção de opções e subopções

`toggleOptionSelection(menuId, selectionMode, optionValue)` implementa seleção single e multiple. Em single, selecionar uma opção substitui a anterior do menu; selecionar a mesma opção remove a seleção. Em multiple, a opção é adicionada ou removida dentro do menu.

`toggleSubOptionSelection(menuId, optionValue, subOptionValue)` alterna subopções dentro da opção já selecionada.

`sanitizeUserSelection()` valida a seleção contra as definições do template, remove menus inexistentes, remove opções inexistentes, filtra subopções inválidas, remove duplicatas e respeita `selection_mode`.

### Payload compilado

`buildPersistedArtifacts()` é a função estratégica do editor. Ela normaliza template, sincroniza menus globais, monta seleção, injeta `free_inputs` e `fixed_variables`, sanitiza seleção, compila payload e renderiza o prompt final.

`compilePromptPayload(template, rawSelection)` gera `compiled_context.menu_interpretation`, resolvendo labels de opções e subopções para cada menu selecionado.

`renderFinalPromptText()` aplica substituições `{{key}}` usando `fixed_variables` e `free_inputs`, e monta seções de role, contexto, menus selecionados, inputs livres, constraints, few shot examples e formato de saída.

O editor persiste localmente `promptPayload`, `selectionPayload`, `compiledPayload`, `selectedMenuIds`, metadados de resumo e timestamps. Depois tenta salvar no Supabase. Se a sincronização falhar, mantém o registro local pendente.

### Cópia e download

`handleCopy()` usa `formatPromptAsMarkdown()` para copiar um prompt final estruturado quando template e payload são válidos.

`handleDownload()` baixa o `compiledPayload` como `compiled_prompt_${safeName}.json`.

## Dívidas Técnicas e Inconsistências

### Stack documentado divergente

O contexto externo citava TypeScript 5.9 e Vite 7.3, mas o código local usa TypeScript 6.0.3 e Vite 8.0.14. O Project Spec deve corrigir isso.

### Local first, não offline only

O código contém Supabase, Netlify Neon, Drizzle, Sentry, cloud sync, autosync e persistência remota opcional. A formulação correta é local first com operação offline, não aplicação exclusivamente offline.

### Path de importação citado não existe

`src/utils/importJson.ts` não existe. O serviço real é `src/services/importService.ts`.

### Dois sistemas de menu coexistem

`menuOptions` ainda existe e é seeded, mas `contextMenus` é o modelo hierárquico real. Isso deve ser documentado como legado ou removido em refactor futuro.

### Possível perda de descrição em opções

`MenuDefinition` aceita `description` em opções e subopções, mas `ContextMenuOption` e `ContextMenuSubOption` internos não persistem essas descrições. O round trip pode perder metadados.

### `getPrimaryReferenceUrl()` é stub

A função retorna sempre `undefined`, apesar de `Prompt` ainda ter `referenceUrl`. Isso indica feature incompleta ou campo legado.

### Template exportado não explicita `menu_ids`

`getTemplateFile()` depende do default Zod para `menu_ids`, mas não inclui o campo no objeto base. Para interoperabilidade, o campo deveria aparecer explicitamente no template gerado.

### Arquivo `.orig` dentro de `src`

`src/components/menu-manager/MenuForm.tsx.orig` parece backup manual. Isso polui a árvore de source e deve ser removido ou movido para fora do código versionado após revisão.

### `promptMemory` não foi citado no escopo inicial

O objetivo mencionou `categories`, `prompts` e `contextMenus`, mas o schema atual inclui `promptMemory` e `menuOptions`. O Project Spec precisa cobrir todas as tabelas reais.

## Recomendações para o Project Spec

A especificação oficial deve assumir que `TemplatePayload`, `UserSelection` e `CompiledPromptPayload` são os três contratos centrais do domínio.

O termo recomendado para arquitetura é local first com sincronização cloud opcional.

A seção de persistência deve documentar Dexie versão 13, incluindo `promptMemory` e `menuOptions` como legado.

A seção de menus deve separar claramente modelo interno camelCase e contrato externo snake_case.

A seção de importação deve apontar para `src/services/importService.ts`, não para `src/utils/importJson.ts`.

A seção de dívidas técnicas deve priorizar limpeza de `menuOptions`, remoção de `MenuForm.tsx.orig`, decisão sobre `description` em opções e implementação ou remoção de `referenceUrl`.
