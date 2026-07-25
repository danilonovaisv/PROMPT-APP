# Arquitetura Técnica - PROMPT-APP v2.0.0

## 1. Visão Geral da Arquitetura

O **PROMPT-APP** é construído como uma aplicação Single Page Application (SPA) orientada ao paradigma **Local-First Architecture**. A premissa fundamental da plataforma é oferecer velocidade instantânea e funcionamento offline contínuo através de armazenamento IndexedDB local (via **Dexie.js**), sincronizado de forma assíncrona e bidirecional com o backend no **Supabase**.

```
+-----------------------------------------------------------------------+
|                             USER INTERFACE                            |
|             React 19 SPA + React Router v7 + Custom CSS               |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                        CONTEXT & HOOKS LAYER                          |
|         CloudSyncContext | ToastContext | ConfirmContext              |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
+-----------------------------+             +-----------------------------+
|     LOCAL STORAGE (DEXIE)   |             |   CLOUD SYNC & SUPABASE     |
|  - Prompts Collection       | <=========> |  - Supabase Database (RLS)  |
|  - Categories Collection    |   Bi-Dir    |  - Realtime Subscriptions   |
|  - Menus & Options          |    Sync     |  - Auth & Storage           |
|  - Drafts & Local State     |             |  - Egress Quota Handler     |
+-----------------------------+             +-----------------------------+
```

---

## 2. Tecnologias Principais

- **Framework Frontend:** React 19 + React Router v7
- **Bundler & Tooling:** Vite 8.1 + TypeScript 7.0.2
- **Banco de Dados Local:** Dexie.js 4.4.4 (wrapper reativo para IndexedDB)
- **Backend & Sincronização Cloud:** Supabase Client 2.110.8 (`@supabase/supabase-js`, `@supabase/ssr`)
- **Validação de Dados:** Zod 4.4.3
- **Monitoramento & Telemetria:** Sentry React 10.68.0 (`src/instrument.ts`)
- **Testes:** Jest 30.4 (unitários), Playwright 1.62 (E2E), React Testing Library 16.3

---

## 3. Camadas do Sistema

### 3.1. Camada de Apresentação (`src/pages` & `src/components`)
- **Rotas Principais:**
  - `HomePage`: Dashboard geral com estatísticas, categorias e atalhos rápidos.
  - `CategoryPage`: Visualização e filtragem de prompts vinculados a uma categoria específica.
  - `EditorPage`: Editor avançado de prompts com formulários meta (`EditorMetaForm`), definição de variáveis (`EditorDefinitionForm`), playground interativo (`EditorPlayground`) e pré-visualização (`EditorPreviewModal`).
  - `MenuManagerPage`: Gerenciador de menus de contexto e opções personalizadas.
  - `CategoryManagerPage`: Gestão CRUD de categorias com seletor de cores e ícones.
  - `AboutPage`, `PrivacyPage`, `ContactPage`, `NotFoundPage`: Páginas institucionais e utilitárias.

- **Componentes Globais:**
  - `Layout`: Invólucro base com barra lateral de navegação responsiva e cabeçalho (`Header`).
  - `ImportExportModal` & `ImportMenusModal`: Modais de importação/exportação de dados em lote com validação de formato.
  - `AuthModal`: Interface de autenticação com login Supabase.
  - `SEO`: Gerenciamento dinâmico de metadados para motores de busca.
  - `ErrorBoundary`: Fronteira de captura de erros no Client-Side.

### 3.2. Camada de Domínio e Modelos (`src/models`)
- **Interfaces e Tipos (`types.ts`):** Definição centralizada dos modelos `Prompt`, `Category`, `ContextMenu`, `MenuOption` e metadados.
- **Validação Zod (`promptSchema.ts` & `outputSchema.ts`):** Garantia de integridade de tipo durante importação/exportação e salvamento.

### 3.3. Camada de Persistência Local (`src/db`)
- **Dexie Database (`database.ts`):** Tabelas locais IndexedDB:
  - `prompts`: Armazena os registros de prompts e rascunhos.
  - `categories`: Armazena as categorias configuradas.
  - `contextMenus`: Armazena menus e subopções de contexto.
- **Seed Helpers (`seedHelpers.ts`):** Inicialização de dados padrão (`defaultPrompts.ts`).

### 3.4. Pipeline de Sincronização Cloud (`src/services`)
- **Estratégia Local-First Assíncrona (`syncService.ts` & `autoSync.ts`):** As operações de escrita ocorrem primeiro na base local Dexie e enfileiram tarefas de sincronização.
- **Serviços Específicos por Entidade:** `promptSync.ts`, `categorySync.ts`, `menuSync.ts`, `memorySync.ts`.
- **Inscrição em Tempo Real (`realtimeService.ts`):** Escuta de eventos `INSERT`, `UPDATE` e `DELETE` no Supabase para espelhamento em Dexie.
- **Gerenciador de Erros de Quota (`supabase.ts`):** Captura proativa de limite de egress e fallback transparente para modo offline.

---

## 4. Estrutura de Estilos e Tokens Visuais

O design system do **PROMPT-APP** utiliza CSS Vanilla modularizado sem acoplamento a bibliotecas utilitárias externas.
- **Tokens Globais (`src/styles/tokens.css`):** Definição de paleta HSL, variáveis de tipografia e elevações de sombra.
- **Estilos de Base (`src/styles/base.css` & `src/index.css`):** Normalização e utilitários globais.
- **Componentes CSS (`src/styles/components/*`):** Arquivos CSS dedicados para `editor.css`, `cards.css`, `modals.css`, `forms.css`, `prompts.css` e `menus.css`.

---

## 5. Garantia de Qualidade e Segurança

1. **Validação Estrita de Input:** Todo payload importado via JSON passa por sanitização e validação Zod.
2. **Ambiente Seguro de API:** Variáveis de ambiente Supabase protegidas e gerenciadas centralizadamente.
3. **Telemetria de Erros:** Integração Sentry para captura remota de exceções críticas e crashlytics.
4. **Verificação de Tipos:** `npm run type-check` garante zero erros no compilador TypeScript.
