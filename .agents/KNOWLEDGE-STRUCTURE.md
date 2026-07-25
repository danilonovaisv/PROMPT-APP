# PROMPT-APP — Knowledge Structure Map
>
> Gerado em: 2026-04-07 | Versão do projeto: 1.0.0

---

## 1. VISÃO GERAL

**PROMPT-APP** é um web app **local-first** para armazenamento e organização de templates de prompts profissionais para uso recorrente com LLMs (Claude, GPT-4o, Midjourney, etc.).

| Atributo | Valor |
|---|---|
| Stack principal | React 19 + TypeScript + NEXT 8 |
| Banco local | IndexedDB (Dexie.js v4) |
| Banco na nuvem | Supabase (PostgreSQL) |
| Deploy | Netlify |
| Auth | Supabase Auth |
| Roteamento | React Router v7 |
| Validação | Zod v4 |
| Testes | Jest 30 + Playwright |
| Package manager | pnpm 10 |

---

## 2. ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────┐
│                   PROMPT-APP (PWA)                   │
│                                                     │
│  ┌──────────┐    ┌──────────────┐   ┌───────────┐  │
│  │  NEXT +  │    │  React 19    │   │  Dexie.js │  │
│  │ React 19 │───▶│  Components  │──▶│ IndexedDB │  │
│  └──────────┘    └──────────────┘   └─────┬─────┘  │
│                                           │         │
│                                     Sync  │         │
│                                           ▼         │
│                                   ┌──────────────┐  │
│                                   │   Supabase   │  │
│                                   │  PostgreSQL  │  │
│                                   │  + Realtime  │  │
│                                   └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Padrão de Sincronização**: Local-first com sync bidirecional para Supabase.
Cada entidade possui `syncStatus: 'pending' | 'synced' | 'error'` e `isDeleted` (soft delete).

---

## 3. ROTAS DA APLICAÇÃO

| Rota | Página | Descrição |
|---|---|---|
| `/` | `HomePage` | Lista categorias e prompts recentes |
| `/categoria/:id` | `CategoryPage` | Prompts de uma categoria |
| `/categorias` | `CategoryManagerPage` | CRUD de categorias |
| `/editor/:id` | `EditorPage` | Criação/edição de prompt |
| `/menus` | `MenuManagerPage` | Gerenciador de menus de contexto |
| `/sobre` | `AboutPage` | Página sobre o app |
| `/contato` | `ContactPage` | Formulário de contato |
| `/privacidade` | `PrivacyPage` | Política de privacidade |

---

## 4. ENTIDADES DE DADOS

### 4.1 Category

```typescript
interface Category {
  id?: number;           // Local IndexedDB ID
  remoteId?: number;     // Supabase ID
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  name: string;
  icon: string;          // Emoji ou slug de ícone
  color: string;         // Cor hex
  createdAt: Date;
  updatedAt?: Date;
}
```

### 4.2 Prompt (Entidade principal)

```typescript
interface Prompt {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  categoryId: number;
  title: string;
  selectedMenuIds?: number[];
  promptPayload: TemplatePayload;   // Schema principal (Zod)
  selectionPayload?: UserSelection; // Seleções de menus pelo usuário
  compiledPayload?: CompiledPromptPayload; // Prompt compilado final
  schemaVersion: string;
  language: string;
  outputFormat: PromptOutputFormat; // 'text' | 'markdown' | 'json' | 'image' | 'code'
  referenceUrl?: string;
  fewShotExamples: FewShotExample[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 ContextMenu (Menus Dinâmicos)

```typescript
interface ContextMenu {
  id?: number;
  remoteId?: number;
  menuId: string;           // Slug único do menu
  menuName: string;
  description: string;
  selectionMode: 'single' | 'multiple';
  options: ContextMenuOption[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.4 MenuSelections (Menus de Contexto Hierárquicos)

Os 4 menus fixos de indexação (herdados do sistema):

```typescript
type MenuKey = 'tom' | 'publico' | 'idioma' | 'estilo';
```

---

## 5. SCHEMA DO PROMPT (Core — TemplatePayload)

Estrutura canônica validada por Zod:

```
TemplatePayload
├── meta
│   ├── template_id       (slug único)
│   ├── template_name
│   ├── template_type
│   ├── schema_version    (default: '1.0.0')
│   ├── language          (default: 'pt-BR')
│   └── status            ('draft' | 'active' | 'archived')
│
├── prompt_definition
│   ├── system_role       (/// IDENTIDADE)
│   ├── task              (/// OBJETIVO)
│   ├── context           (/// CONTEXTO)
│   ├── constraints[]     (/// MECÂNICA / regras positivas)
│   ├── negative_prompt[] (/// REGRAS GERAIS / negative prompt)
│   └── few_shot_examples[]
│
├── menu_definitions[]
│   ├── menu_id
│   ├── menu_name
│   ├── description
│   ├── selection_mode    ('single' | 'multiple')
│   ├── required
│   └── options[]
│       ├── label / value / description
│       └── sub_options[]
│
├── menu_ids[]            (IDs de context_menus externos vinculados)
│
└── output_contract
    ├── format            ('text' | 'markdown' | 'json' | 'image' | 'code')
    ├── language
    ├── strict_mode
    ├── required_fields[]
    ├── response_rules[]
    └── optional_enums{}
```

---

## 6. COMPONENTES DA UI

### Componentes Principais

| Componente | Localização | Função |
|---|---|---|
| `Layout` | `components/Layout.tsx` | Shell principal com nav e footer |
| `PromptCard` | `components/PromptCard.tsx` | Card de listagem de prompt |
| `CategoryCard` | `components/CategoryCard.tsx` | Card de categoria |
| `AuthModal` | `components/AuthModal.tsx` | Login/Signup Supabase |
| `ImportExportModal` | `components/ImportExportModal.tsx` | Import/Export JSON bulk |
| `ImportMenusModal` | `components/ImportMenusModal.tsx` | Import de menus JSON |
| `CloudSyncItem` | `components/CloudSyncItem.tsx` | Status de sync individual |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | Loading states contextuais |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Captura erros React |
| `Breadcrumb` | `components/Breadcrumb.tsx` | Navegação hierárquica |
| `SEO` | `components/SEO.tsx` | Meta tags dinâmicas |

### Componentes do Editor (`components/editor/`)

| Componente | Função |
|---|---|
| `EditorDefinitionForm` | Formulário do prompt_definition (system_role, task, etc.) |
| `EditorMetaForm` | Formulário dos metadados (template_name, tipo, status) |
| `EditorContextMenuSelector` | Seletor de menus de contexto externos |
| `EditorPlayground` | Playground para testar o prompt compilado |
| `EditorPreviewModal` | Preview modal do prompt completo |

### Componentes do Menu Manager (`components/menu-manager/`)

| Componente | Função |
|---|---|
| `MenuCard` | Card de exibição de um menu |
| `MenuForm` | Formulário de criação/edição de menu |
| `MenuOptionEditor` | Editor de opções e sub-opções do menu |

### UI Genérica (`components/ui/`)

| Componente | Função |
|---|---|
| `MultiSelect` | Select múltiplo customizado |

---

## 7. CAMADA DE SERVIÇOS (`src/services/`)

| Serviço | Função |
|---|---|
| `supabasePrompts.ts` | CRUD de prompts no Supabase |
| `supabaseCategories.ts` | CRUD de categories no Supabase |
| `supabaseMenus.ts` | CRUD de context_menus no Supabase |
| `syncService.ts` | Orquestração do sync local → nuvem |
| `autoSync.ts` | Auto-sync periódico (debounced) |
| `realtimeService.ts` | Listeners Supabase Realtime para sync bidirecional |
| `contextMenuSync.ts` | Sync específico de menus de contexto |
| `importService.ts` | Importação de prompts/menus via JSON |
| `assetManager.ts` | Gerenciamento de assets públicos |
| `auditResourceContent.ts` | Auditoria de conteúdo de prompts |

---

## 8. UTILITÁRIOS (`src/utils/`)

| Utilitário | Função |
|---|---|
| `backupManager.ts` | Backup local automático (localStorage) |
| `exportJson.ts` | Exportação de prompts/menus para JSON |
| `importJson.ts` | Importação de prompts desde JSON |
| `importMenusJson.ts` | Importação de menus desde JSON |
| `normalizeFewShot.ts` | Normalização de exemplos few-shot |
| `schemaCompatibility.ts` | Compatibilidade entre versões do schema |
| `templateMigration.ts` | Migração de templates legados |
| `promptArtifacts.ts` | Geração de artefatos de prompt |
| `contextMenuOptions.ts` | Opções padrão de menus de contexto |
| `constants.ts` | Constantes globais do app |
| `logger.ts` | Logger com níveis (info, warn, error) |

---

## 9. BANCO DE DADOS LOCAL (IndexedDB via Dexie.js)

**Database Name**: `PromptAppDB`

| Tabela | Índices | Versão |
|---|---|---|
| `categories` | `++id, name, createdAt, remoteId` | v4 |
| `prompts` | `++id, categoryId, title, createdAt, updatedAt, remoteId` | v4 |
| `menuOptions` | `++id, menuKey, value` | v4 |
| `contextMenus` | `++id, menuId, menuName, createdAt, remoteId` | v4 |

**Migrações**: v1 → v2 (add contextMenus) → v3 (add enabledMenuIds) → v4 (add remoteId, syncStatus)

---

## 10. BANCO DE DADOS REMOTO (Supabase)

**Project URL**: `https://dpejskjpghoozbpfxkpf.supabase.co`

### Tabelas Principais

| Tabela | Descrição |
|---|---|
| `public.categories` | Categorias com user_id (RLS) |
| `public.prompts` | Prompts completos com colunas JSONB |
| `public.context_menus` | Menus de contexto dinâmicos |
| `auth.users` | Usuários (gerenciado pelo Supabase) |

### Colunas JSONB em `prompts`

- `context_menus` — seleções de menus (legacy)
- `enabled_menu_ids[]` — IDs de menus ativos
- `constraints[]` — array de restrições
- `negative_prompt[]` — regras negativas
- `output_schema{}` — schema de saída legacy
- `selection_payload_jsonb` — UserSelection
- `compiled_payload_jsonb` — CompiledPromptPayload

### Segurança (RLS)

- Row Level Security ativa em todas as tabelas
- Políticas: usuários só acessam seus próprios dados
- Soft delete via coluna `is_deleted`

---

## 11. CONTEXTOS REACT (`src/context/`)

| Contexto | Função |
|---|---|
| `ToastContext` | Notificações toast globais |
| `ConfirmContext` + `ConfirmProvider` | Diálogos de confirmação globais |

---

## 12. HOOKS CUSTOMIZADOS (`src/hooks/`)

| Hook | Função |
|---|---|
| `useDebounce` | Debounce de valores reativos |
| `useSearchFilter` | Filtro de busca com debounce |
| `useConfirm` | Acesso ao ConfirmContext |
| `useAccessibleModal` | Gestão de foco/a11y em modais |

---

## 13. FLUXO DE CICLO DE VIDA DO PROMPT

```
1. CRIAÇÃO
   EditorPage → EditorDefinitionForm + EditorMetaForm
   ↓ Salva como TemplatePayload (Zod validated)
   ↓ IndexedDB (syncStatus: 'pending')

2. COMPILAÇÃO
   EditorPlayground → compilePromptPayload()
   ↓ TemplatePayload + UserSelection → CompiledPromptPayload
   ↓ Pronto para uso no LLM

3. SYNC
   autoSync.ts (debounced) → syncService.ts
   ↓ pending items → Supabase upsert
   ↓ syncStatus: 'synced' | 'error'

4. REALTIME
   realtimeService.ts → Supabase Realtime subscriptions
   ↓ Mudanças remotas → IndexedDB update
```

---

## 14. FLUXO DE IMPORT/EXPORT

### Export (JSON Bulk)

```
BulkExport {
  app: "prompt-app"
  version: "1.0.0"
  exportedAt: ISO date
  menuDefinitions?: MenuDefinition[]
  prompts: [{ title, category, schemaVersion, prompt: TemplatePayload }]
}
```

### Import

- Suporte a formatos legados (v1, v2) + formato atual (v3)
- `parseTemplatePayload()` normaliza qualquer versão para `TemplatePayload`
- Menus importados via `ImportMenusModal`

---

## 15. CONFIGURAÇÃO DO PROJETO

### Variáveis de Ambiente (`.env.local`)

```
NEXT_SUPABASE_URL=...
NEXT_SUPABASE_ANON_KEY=...
NEXT_SENTRY_DSN=...
```

### Build & Deploy

```bash
# Dev
pnpm dev

# Build
pnpm build   # tsc + NEXT build

# Deploy (Netlify CI/CD)
# Push para main → build automático
```

### Arquivos de Configuração

| Arquivo | Função |
|---|---|
| `NEXT.config.ts` | Build NEXT + aliases `@/` |
| `netlify.toml` | Configuração de deploy Netlify |
| `tsconfig.app.json` | TypeScript strict para src/ |
| `jest.config.cjs` | Configuração Jest com ts-jest |
| `playwright.config.ts` | Testes E2E |
| `drizzle.config.ts` | ORM para migrations Netlify/Neon |

---

## 16. PADRÕES E CONVENÇÕES

1. **Imports**: Alias `@/` mapeado para `src/`
2. **Validação**: Sempre via Zod na camada de models
3. **Tipos**: `types.ts` para interfaces de entidades, `promptSchema.ts` para tipos inferidos do Zod
4. **Sync**: Toda escrita local → `syncStatus: 'pending'` → auto-sync
5. **Prompts**: Estrutura canônica com tags: `/// IDENTIDADE`, `/// OBJETIVO`, `/// CONTEXTO`, etc.
6. **Menus de Contexto Hierárquicos**: Tom / Público / Idioma / Estilo (os 4 menus fixos)
7. **Output Schema**: Sempre definido via `output_contract` no `TemplatePayload`

---

## 17. PONTOS DE ATENÇÃO / DÍVIDA TÉCNICA

Ver `BUGS.md` e `docs/audits/` para histórico de correções.

- Migrações de schema legado (v1→v3) são complexas — `schemaCompatibility.ts`
- Múltiplos arquivos `.orig` e patches diff na raiz (limpeza pendente)
- Arquivos de teste na pasta raiz (`patch_jest*.diff`) — mover para `/scripts`
- `.env` e `.env.local` expostos no workspace — validar `.gitignore`

---

## 18. AGENT PROTOCOL (Antigravity Prompt Architect)

A partir da diretriz definida em `AGENT.md`, as seguintes regras são rigorosamente seguidas na orquestração e engenharia de prompts no ecossistema:

### 18.1 Arquitetura de 3 Camadas

- **Camada 1 (Directive/O quê):** Interpretação da intenção, tradução em objetivos claros, definição de restrições, entradas e saídas.
- **Camada 2 (Orchestration/Como):** Decisão de skills/agentes, definição de ordem de execução e dependências, validação intermediária de outputs.
- **Camada 3 (Execution/Fazer):** Delegação de tarefas determinísticas a ferramentas/scripts/sub-agentes. Nenhuma improvisação de regra de negócio é permitida nesta camada.

### 18.2 Estrutura Canônica de Prompt (Mandatory)

Todo prompt gerado deve seguir o formato obrigatório:
`/// IDENTIDADE`
`/// OBJETIVO`
`/// CONTEXTO`
`/// MECÂNICA`
`/// FORMATO`
`/// LINGUAGEM`
`/// REFERÊNCIAS`
`/// REGRAS GERAIS`

### 18.3 Cognitive Prompt Model (LLM)

Ao criar prompts para execução de LLM, o modelo explícito de cognição exige a definição de:
`prompt_definition` -> `system_role`, `task`, `context`, `constraints`, `negative_prompt`, `required_fields`, `response_rules`, `user_input`.
*Nenhum output de prompt é válido sem um output schema claramente definido.*

### 18.4 Regras Operacionais e de Conduta

- **Mentor Direto:** Respostas sem filtros, sem "flattery" (elogios desnecessários). Questionamento direto de falhas lógicas e ideias frágeis.
- **Sistematização do Repetível:** Soluções específicas devem ser acompanhadas de propostas de padronização (templates/checklists).
- **Checklist de Qualidade (Quality Gates):** O objetivo deve ser explícito, formato determinístico, zero linguagem vaga ("alguns", "legal", "otimizar"), sem uso de placeholders.

---

*Este documento foi atualizado para refletir as diretrizes de AGENT.md e análise do código-fonte.*
