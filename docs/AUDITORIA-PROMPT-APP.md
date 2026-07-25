# Prompt App — Auditoria Técnica

## 1) Contexto, Escopo e Metas

### Stack real do projeto (confirmado no repositório)

- **Frontend:** React 19 + VITE + TypeScript
- **Roteamento:** React Router (`/Users/PROJETOS DEV/PROMPT-APP/src/App.tsx`)
- **Persistência local:** Dexie/IndexedDB (`/Users/PROJETOS DEV/PROMPT-APP/src/db/database.ts`)
- **Backup local:** `localStorage` (`/Users/PROJETOS DEV/PROMPT-APP/src/utils/backupManager.ts`)
- **Sincronização em nuvem:** Supabase Auth + tabelas (`/Users/PROJETOS DEV/PROMPT-APP/src/services/syncService.ts`)
- **SEO:** componente cliente que injeta `<meta>` dinamicamente (`/Users/PROJETOS DEV/PROMPT-APP/src/components/SEO.tsx`)

### Rotas mapeadas (App.tsx)

- `/` (Home)
- `/sobre`
- `/contato`
- `/privacidade`
- `/categorias`
- `/categoria/:id`
- `/editor/:id`
- `/menus`

### Metas obrigatórias

- **A11y (WCAG AA):** foco visível, labels corretos, navegação total por teclado, landmarks semânticos, 1x `h1` por tela.
- **Performance (Core Web Vitals):** peso inicial < 2 MB; FCP < 2 s; LCP < 2.5 s; TTI < 5 s (3G); CLS < 0.1.
- **Confiabilidade:** criação/edição persistem após reload; backup local e sync não perdem dados.

### Estado geral

- **Aprovado com ressalvas** (ressalvas fortes). Abaixo estão **checagens e correções prioritárias**; o status definitivo depende de evidências (Lighthouse, perf traces, testes E2E).

---

## 2) Diagnóstico por Área

### Shell / Navegação (Layout)

**Risco atual**

- Semântica incompleta (ausência de `header/nav/main/footer` ou múltiplos `h1`).
- Foco visível fraco e tab-order não intencional.
- Áreas clicáveis pequenas em mobile.

**Evidências objetivas**

- Landmarks no DOM e 1x `h1` por tela (Accessibility Tree).
- Teste de Tab completo: foco visível e acionamento por `Enter/Space`.
- 320px sem overflow horizontal; alvos >= 48x48.

**Recomendações (prioridade)**

- **P0 (A11y):** “skip to content”, landmarks e foco visível consistente.
- **P1 (Mobile):** hit-area >= 48x48 em navegação e ações.

---

### Biblioteca / Listas de Prompts (Home, Categoria, Categorias)

**Risco atual**

- Re-render e filtro custoso em listas grandes (Dexie + React).
- Cards sem estrutura semântica (lista, heading, botões nomeados).
- Empty/loading sem feedback acessível.

**Evidências objetivas**

- React Profiler: commits durante scroll/filtro.
- Estrutura `ul/li` ou `role=list` + `listitem`.
- Empty state anunciado via `role="status"`.

**Recomendações (prioridade)**

- **P0 (Performance):** `useMemo` para filtro/ordenação; `React.memo` em cards; debounce na busca.
- **P0 (A11y):** botões com nome acessível e headings por card.
- **P1 (Confiabilidade):** estados empty/loading/error consistentes e com foco gerenciado.

---

### Editor de Prompt (Criar/Editar)

**Risco atual**

- Campos sem label/descrição; validação sem `aria-describedby`.
- Persistência frágil (drafts/localStorage/Dexie) e risco de perda ao navegar.
- Latência na digitação por operações síncronas a cada tecla.

**Evidências objetivas**

- Labels conectados a inputs; erros anunciados.
- Criar/editar → salvar → reload preserva 100% do conteúdo.
- DevTools Performance: sem `localStorage.setItem` a cada tecla.

**Recomendações (prioridade)**

- **P0 (Confiabilidade):** persistência confiável + feedback acessível em sucesso/erro.
- **P0 (A11y):** labels e mensagens de erro associadas.
- **P1 (Performance):** debounce de persistência e isolamento do estado do editor.

---

### Organização (Categorias / Menus de Contexto)

**Risco atual**

- Chips/itens removíveis sem foco/teclado.
- Contraste insuficiente em pills.
- Inconsistência entre seleção e filtro.

**Evidências objetivas**

- Teclado: adicionar/remover via `Tab/Enter/Espaço`.
- Contraste AA validado em DevTools.
- Filtro por categoria/menu reflete corretamente no resultado.

**Recomendações (prioridade)**

- **P0 (A11y):** remover como `button` com `aria-label`.
- **P1 (Confiabilidade):** fonte única de verdade para categorias/menus.

---

### Importar / Exportar / Backup Local

**Risco atual**

- Feedback visual sem `aria-live`.
- JSON exportado com campos faltando ou inválidos.
- Backup local sobrescrito por estado vazio.

**Evidências objetivas**

- Exportar/importar preserva estrutura e conteúdo.
- Feedback anunciado em leitor de tela.
- Backup local não apaga dados em caso de falha de carregamento.

**Recomendações (prioridade)**

- **P0 (Confiabilidade):** validação do JSON exportado/importado.
- **P0 (A11y):** `role="status"` em sucesso e `role="alert"` em erro.

---

### Sincronização em Nuvem (Supabase)

**Risco atual**

- Conflitos entre dados locais e nuvem.
- Falhas silenciosas em auth/sync.
- RLS insuficiente (risco de acesso indevido).

**Evidências objetivas**

- Login OTP funciona e retorna sessão válida.
- Auto-sync não sobrescreve dados locais inadvertidamente.
- RLS ativo e testado nas tabelas (`categories`, `context_menus`, `prompts`).

**Recomendações (prioridade)**

- **P0 (Confiabilidade):** log e feedback para erros de sync.
- **P0 (Segurança):** garantir RLS e políticas por `user_id`.
- **P1 (UX):** indicar estado “sincronizando” e “último sync”.

---

### SEO / Discovery (SPA)

**Risco atual**

- Meta tags são injetadas no cliente; crawlers podem não executar JS.
- Canonical/OG/Twitter inconsistentes em rotas internas.

**Evidências objetivas**

- `<title>` e `<meta name="description">` atualizam em cada rota.
- OG/Twitter gerados corretamente.
- Para SEO crítico, validar renderização com crawler que executa JS.

**Recomendações (prioridade)**

- **P1 (SEO):** padronizar metadados por rota no componente `SEO`.
- **P1 (Discovery):** considerar prerender para rotas públicas se SEO for crítico.

---

## 3) Lista de Problemas (Severidade)

### 🔴 Crítico

- Perda de dados no editor (salvar/reload divergente, conflito local vs nuvem).
- Inputs sem label/descrição (quebra WCAG AA).
- Foco/teclado quebrados em modais/menus/toasts.

### 🟡 Médio/Alto

- Performance ruim em listas grandes sem memo/debounce.
- Sincronização Supabase sem feedback ou sem RLS.
- Empty/loading/error/offline sem `aria-live` e sem foco gerenciado.
- SEO inconsistente em rotas públicas.

### 🟢 Baixo

- Hierarquia de headings inconsistente.
- Pequenas oscilações de layout (CLS leve).

---

## 4) Auditoria por Rotas

### `/` (Home)

- **Status:** Aprovado com ressalvas
- **Foco:** métricas rápidas, cards de categorias, CTA, SEO básico

### `/categoria/:id` (Lista de Prompts)

- **Status:** Aprovado com ressalvas
- **Foco:** lista, ações por card, performance de scroll, empty state

### `/categorias` (Gestão de Categorias)

- **Status:** Aprovado com ressalvas
- **Foco:** CRUD, confirmação de exclusão, acessibilidade dos botões

### `/editor/:id` (Editor)

- **Status:** Reprovado até evidência contrária
- **Foco:** persistência, foco/teclado, performance de digitação, validações

### `/menus` (Gestão de Menus)

- **Status:** Aprovado com ressalvas
- **Foco:** teclado, contraste, consistência de seleção

### `/sobre`, `/contato`, `/privacidade`

- **Status:** Aprovado com ressalvas
- **Foco:** SEO/metadata, headings, links funcionais

---

## 5) Fluxos Críticos (E2E)

1. **Criar prompt → salvar → aparecer na lista**
   - Aceite: item aparece sem refresh manual; feedback acessível.
2. **Editar prompt → salvar → persistir após reload**
   - Aceite: conteúdo idêntico; sem perda parcial.
3. **Exportar → importar → integridade total**
   - Aceite: JSON válido e fiel, sem perda de campos.
4. **Backup local → restaurar → manter consistência**
   - Aceite: backup não sobrescreve dados válidos por erro de carga.
5. **Cloud Sync (Supabase) → download/upload → consistência**
   - Aceite: conflitos tratados, RLS ativa, feedback correto.

---

## 6) Prompts Técnicos para Agentes (Atômicos)

> Regras gerais: Mobile-first, WCAG AA, Performance, **não mudar texto visível do produto**.

### Prompt #01 — Mapear rotas reais e landmarks semânticos

**Objetivo:** Validar rotas e semântica base.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/App.tsx`, `/Users/PROJETOS DEV/PROMPT-APP/src/components/Layout.tsx`  
**Ações:**

1. Confirmar todas as rotas reais.
2. Garantir `header/nav/main/footer` e 1x `h1` por tela.
3. Adicionar “skip to content” focável.

**Aceite:** Lighthouse A11y sem erros de landmarks/heading.

---

### Prompt #02 — Foco visível e teclado (global)

**Objetivo:** Foco visível consistente em todos os controles.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/index.css`, componentes em `/Users/PROJETOS DEV/PROMPT-APP/src/components/**`  
**Ações:**

1. Remover `outline: none` sem alternativa.
2. Criar estilos `:focus-visible` com contraste AA.
3. Botões com ícone devem ter `aria-label`.

---

### Prompt #03 — Editor: labels, descrições e erros

**Objetivo:** Tornar o editor acessível.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/pages/EditorPage.tsx`  
**Ações:**

1. `<label htmlFor>` para todos os campos.
2. Erros com `aria-describedby` + `role="alert"`.
3. Sucesso com `role="status"` (polite).

---

### Prompt #04 — Editor: persistência confiável

**Objetivo:** Evitar perda de dados.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/pages/EditorPage.tsx`, `/Users/PROJETOS DEV/PROMPT-APP/src/db/database.ts`, `/Users/PROJETOS DEV/PROMPT-APP/src/utils/backupManager.ts`  
**Ações:**

1. Debounce na persistência local.
2. Garantir draft local e save explícito sem conflitos.
3. Tratar falha de storage com feedback acessível.

---

### Prompt #05 — Listas: performance e memoização

**Objetivo:** Reduzir re-render e custo de filtro.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/pages/CategoryPage.tsx`, `/Users/PROJETOS DEV/PROMPT-APP/src/pages/HomePage.tsx`, `/Users/PROJETOS DEV/PROMPT-APP/src/pages/CategoryManagerPage.tsx`  
**Ações:**

1. `React.memo` em cards.
2. `useMemo` para filtros e contagens.
3. Debounce na busca (se existir).

---

### Prompt #06 — Chips/itens removíveis: acessibilidade

**Objetivo:** Teclado e toque 48x48.  
**Arquivos:** componentes de categoria/menu em `/Users/PROJETOS DEV/PROMPT-APP/src/pages/**`  
**Ações:**

1. Remoção via `button` com `aria-label`.
2. Hit-area >= 48x48 em mobile.
3. Foco visível garantido.

---

### Prompt #07 — Import/Export: feedback e fallback

**Objetivo:** Feedback acessível e integridade do JSON.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/components/ImportExportModal.tsx`, `/Users/PROJETOS DEV/PROMPT-APP/src/utils/exportJson.ts`, `/Users/PROJETOS DEV/PROMPT-APP/src/utils/importJson.ts`  
**Ações:**

1. `role="status"` em sucesso, `role="alert"` em erro.
2. Validar estrutura do JSON exportado/importado.
3. Feedback não dependente apenas de cor/ícone.

---

### Prompt #08 — Cloud Sync (Supabase): confiabilidade e RLS

**Objetivo:** Garantir segurança e consistência do sync.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/services/syncService.ts`, `/Users/PROJETOS DEV/PROMPT-APP/src/components/CloudSyncItem.tsx`  
**Ações:**

1. Garantir tratamento de erro com feedback.
2. Confirmar políticas de RLS no Supabase.
3. Evitar sobrescrita silenciosa de dados locais.

---

### Prompt #09 — SEO (SPA): consistência por rota

**Objetivo:** Padronizar metadados por rota.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/src/components/SEO.tsx`, páginas em `/Users/PROJETOS DEV/PROMPT-APP/src/pages/**`  
**Ações:**

1. Definir `title/description/canonical/OG/Twitter` por rota.
2. Validar atualização dinâmica em navegação interna.

---

### Prompt #10 — Lighthouse e Core Web Vitals

**Objetivo:** Procedimento reprodutível de auditoria.  
**Arquivos:** `/Users/PROJETOS DEV/PROMPT-APP/README.md` (ou `docs/performance.md`)  
**Ações:**

1. Rodar `npm run build` e `npm run preview`.
2. Lighthouse mobile com throttling 3G.
3. Registrar baseline por rota e comparar PRs.
