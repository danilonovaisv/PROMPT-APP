# Grafo de Conhecimento - PROMPT-APP v2.0.0

## 1. Nós do Sistema (System Nodes)

### 1.1. Núcleo & Banco de Dados (Core & Database)
- **Dexie DB (`src/db/database.ts`)**: Persistência local IndexedDB para Prompts, Categories e ContextMenus.
- **Default Prompts (`src/db/defaultPrompts.ts`)**: Carga inicial de prompts pré-configurados.
- **Seed Helpers (`src/db/seedHelpers.ts`)**: Utilitários para semeadura e migração inicial do banco de dados local.

### 1.2. Modelos & Schemas Zod (Models & Validation)
- **Types (`src/models/types.ts`)**: Interfaces TypeScript globais (`Prompt`, `Category`, `ContextMenu`, `MenuOption`).
- **Prompt Schema (`src/models/promptSchema.ts`)**: Schemas Zod para validação rigorosa de prompts e metadados.
- **Output Schema (`src/models/outputSchema.ts`)**: Estruturas Zod para contrato de saída.
- **Memory Models (`src/models/memory.ts`)**: Modelos de dados para memória e cache.

### 1.3. Sincronização & Serviços (Sync & Services)
- **Sync Service (`src/services/syncService.ts`)**: Coordenador principal da sincronização local-first.
- **Auto Sync (`src/services/autoSync.ts`)**: Serviço de sincronização em segundo plano.
- **Realtime Service (`src/services/realtimeService.ts`)**: Inscrições em canais WebSocket do Supabase.
- **Entity Sync (`src/services/sync/*`)**: Sincronizadores especializados (`categorySync`, `promptSync`, `menuSync`, `memorySync`).
- **Import Service (`src/services/importService.ts`)**: Processamento e sanitização de dados importados em lote.
- **Asset Manager (`src/services/assetManager.ts`)**: Gestão de recursos de mídia e assets.
- **Supabase Clients (`src/lib/supabase.ts`, `src/services/supabasePrompts.ts`, etc.)**: Clientes de comunicação cloud.

### 1.4. Contextos de Aplicação (Application Contexts)
- **CloudSyncContext (`src/context/CloudSyncContext.tsx`)**: Provê estado de sincronização e triggers cloud.
- **ToastContext (`src/context/ToastContext.tsx`)**: Sistema de alertas e notificações para o usuário.
- **ConfirmContext (`src/context/ConfirmContext.tsx`)**: Provê diálogos modais de confirmação assíncrona.

### 1.5. Hooks Customizados (Custom Hooks)
- `useCloudSync`: Acesso direto ao estado e métodos de sincronização cloud.
- `useConfirm`: Hook para acionamento de diálogos de confirmação.
- `useSearchFilter`: Filtragem e busca performática com debounce.
- `useDebounce`: Retardamento de atualizações para busca e digitação.
- `useAccessibleModal`: Gestão de acessibilidade e foco em modais.

### 1.6. Páginas (Pages)
- **HomePage (`src/pages/HomePage.tsx`)**: Painel principal com categorias, estatísticas e listagem rápida.
- **CategoryPage (`src/pages/CategoryPage.tsx`)**: Exibição de prompts filtrados por categoria.
- **EditorPage (`src/pages/EditorPage.tsx`)**: Editor de prompts completo com suporte a rascunho em tempo real.
- **MenuManagerPage (`src/pages/MenuManagerPage.tsx`)**: Administração de menus de contexto e opções.
- **CategoryManagerPage (`src/pages/CategoryManagerPage.tsx`)**: CRUD de categorias e visual tokens.
- **AboutPage / PrivacyPage / ContactPage / NotFoundPage**: Páginas de suporte, sobre, privacidade e 404.

### 1.7. Componentes (Components)
- **Editor Form Stack (`src/components/editor/*`)**: `EditorMetaForm`, `EditorDefinitionForm`, `EditorPlayground`, `EditorPreviewModal`.
- **Menu Manager Stack (`src/components/menu-manager/*`)**: `MenuCard`, `MenuForm`, `MenuOptionEditor`.
- **UI Primitives (`src/components/ui/*`)**: `MultiSelect`, `checkbox`, `SkeletonLoader`.
- **Layout & Shell (`src/components/Layout.tsx`, `Header.tsx`, `Breadcrumb.tsx`)**: Estrutura base da aplicação.
- **Modais Globais (`src/components/ImportExportModal.tsx`, `ImportMenusModal.tsx`, `AuthModal.tsx`)**: Modais de autenticação e importação/exportação.
- **Cards & Visuals (`src/components/PromptCard.tsx`, `CategoryCard.tsx`, `CloudSyncItem.tsx`)**: Componentes de exibição de grade e lista.
- **SEO & Telemetria (`src/components/SEO.tsx`, `ErrorBoundary.tsx`, `src/instrument.ts`)**: Metadados SEO, captura de exceções e telemetria Sentry.

### 1.8. Utilitários (Utils)
- `exportJson.ts` & `importJson.ts`: Utilitários de manipulação de JSON e exportação de templates.
- `backupManager.ts`: Rotinas de criação e restauração de backups locais.
- `menuValidation.ts` & `schemaValidation.ts`: Validações de esquemas de menus e prompts.
- `promptArtifacts.ts`: Extração e renderização de artefatos de prompts.
- `crypto.ts` & `logger.ts`: Utilitários de criptografia leve e logging formatado.

---

## 2. Relações e Fluxos de Dados (Relationships)

```
[Pages] ───────────────► [Dexie DB] (Leitura instantânea local)
   │                        ▲
   ▼                        │ (Bi-dir Sync via syncService)
[Components]                ▼
   │                 [Supabase Cloud]
   ▼                        ▲
[Services / Utils] ─────────┘
```

1. **Pages** consomem dados reativos do **Dexie DB** via hooks de reatividade.
2. **EditorPage** utiliza a pilha `EditorMetaForm`, `EditorDefinitionForm` e `EditorPlayground` para validação via Zod antes do envio ao **Dexie DB**.
3. **syncService** monitora alterações no **Dexie DB** e atualiza a nuvem **Supabase**, enquanto **realtimeService** reflete alterações da nuvem no banco local.
4. **ExportJson** garante a consistência estrutural dos prompts exportados ao formato JSON padrão.
