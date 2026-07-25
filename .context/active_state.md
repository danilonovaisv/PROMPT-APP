# Active State - PROMPT-APP v2.0.0

**Última Atualização:** 25 de Julho de 2026

---

## 📌 Contexto Geral & Visão Ativa

O **PROMPT-APP** é uma aplicação web SPA de engenharia de prompts avançada, baseada no paradigma **Local-First** (Dexie.js / IndexedDB) com sincronização bidirecional em tempo real no **Supabase**.

---

## 🚀 Progresso Recente e Atualizações do Sistema

### 1. Upgrade de Infraestrutura & Compilação
- **TypeScript 7.0.2:** Atualização de dependências de tipos, compilação via `tsconfig.app.json` e integração estrita.
- **Vite 8:** Ajustes em plugins de bundling, otimização do chunking e correção de case-sensitivity em módulos importados.
- **Sentry 10:** Configuração em `src/instrument.ts` para monitoramento de exceções e telemetria client-side.

### 2. Normalização de Exportação & Importação de Prompts
- **Serviço de Exportação (`exportJson.ts`):** Tratamento rigoroso de metadados, suporte a esquemas de poucas amostras (*few-shot examples*) e validação de compatibilidade com modelos GPT e Claude.
- **Serviço de Importação (`importService.ts`):** Validação Zod estrita para pacotes JSON individuais e em lote (bulk import), prevenindo inconsistências em IndexedDB.
- **Suíte de Testes Unitários:** Cobertura expandida em `tests/unit/exportJson.test.ts` e `tests/unit/importService.bulk.test.ts`.

### 3. Configuração Canônica de Agentes GPT
- **Especificação Canônica:** Publicação de `public/GPT-AGENT-CONFIG-CANONICAL.md` e `public/AGENT-CONFIG-IMPORT-GUIDE.md`.
- **Auditoria de Prompts:** Mapeamento em `docs/GPT-AGENT-CONFIG-AUDIT.md` para auto-configuração de agentes de IA com validação de ferramentas e instruções de sistema.

### 4. Camada de Dados & Persistência
- **Dexie.js v4:** Armazenamento local das coleções de prompts, categorias, menus de contexto e rascunhos (*drafts*).
- **Supabase Realtime & AutoSync:** Estratégia offline-first com filas de sincronização, detecção de quota excedida e desacoplamento de chamadas de leitura/escrita.

---

## 🎯 Tarefas em Andamento e Status Atual

| Componente / Módulo | Status | Descrição do Estado |
| :--- | :--- | :--- |
| **`src/utils/exportJson.ts`** | ✅ Concluído | Normalização de campos extras, exportação limpa e validação de schema. |
| **`src/db/defaultPrompts.ts`** | ✅ Concluído | Sincronização dos templates padrão de prompts. |
| **`tests/unit/*`** | ✅ Concluído | Suíte de testes unitários passando em Jest e ts-jest. |
| **`scripts/update-docs.ts`** | ✅ Concluído | Script automatizado para auditoria de estrutura de código e validação de referências em markdown. |
| **`docs/` & `.context/`** | 🔄 Em Sincronização | Grafo de conhecimento, especificação de arquitetura e estado ativo alinhados ao repositório. |

---

## 🛡️ Diretrizes de Engenharia Ativas

1. **Local-First Sovereignty:** Todas as modificações em prompts ou categorias ocorrem em Dexie.js antes da propagação para o Supabase.
2. **Strict Typings & Zod Validation:** Nenhum dado externo entra na aplicação sem passar por validação Zod (`src/models/promptSchema.ts`).
3. **No Inline Styles:** Otimização de CSS centralizado em `src/index.css` e tokens visuais em `src/styles/tokens.css`.
