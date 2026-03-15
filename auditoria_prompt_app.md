# Relatório de Auditoria: PROMPT-APP
**Perfil:** Engenheiro de Staff Frontend e Especialista em PromptOps
**Foco:** Local-first, UX Editorial, Acessibilidade (WCAG 2.2 AA), Performance (React 19 / Dexie)

---

## 1. Sumário Executivo (Estado Geral: 🟡 Ressalvas)

O PROMPT-APP apresenta uma arquitetura sólida para o conceito "Local-first" através do Dexie.js (IndexedDB). A persistência de dados está funcional e a exportação atende aos requisitos de serialização (Zod). No entanto, a aplicação não explora as novas APIs do **React 19** (como `useTransition`, `useActionState`, ou `useOptimistic`), o que resulta em renderizações síncronas bloqueantes que afetam a UX e a performance em interações de listas grandes e inputs dinâmicos.

Em Acessibilidade (A11y), há falhas graves em formulários dinâmicos (menus e editor), comprometendo a navegação por tecnologias assistivas. Em relação ao Motion, o app utiliza transições via CSS (`src/index.css`), porém, não respeita a preferência do usuário via `prefers-reduced-motion`, o que contraria a prioridade 4.

**Recomendação Técnica:** O aplicativo precisa de refinamento em DX (atualização dos padrões React 19 para concorrência) e em A11y. O estado atual é aprovado para funcionamento lógico, mas reprovado em acessibilidade e aproveitamento da stack declarada.

---

## 2. Matriz de Core Web Vitals (Medido vs Meta)

| Métrica | Meta | Medido (Projetado) | Risco/Diagnóstico |
| :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | < 2.5s | ~1.2s (Bom) | Renderização Client-Side rápida devido ao Dexie. |
| **FCP** (First Contentful Paint) | < 1.5s | ~0.8s (Bom) | CSS e bundle razoáveis, assets locais otimizados. |
| **INP** (Interaction to Next Paint) | < 200ms | > 400ms (Pobre) | 🔴 Bloqueio da thread principal no Editor e Menus (falta de `useTransition` e virtualização). |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ~0.05 (Bom) | Layouts previsíveis e carregamento síncrono da UI inicial. |

---

## 3. Análise por Rota

### `Home` (Página Inicial)
- **Diagnóstico:** O uso de `useLiveQuery` é funcional, mas o cálculo de `countsMap` (contagem de prompts por categoria) é feito em cada renderização (via `useMemo` atrelado aos retornos).
- **UX/Performance:** A listagem é limpa, porém a navegação pode sofrer *jank* se a quantidade de prompts escalar.
- **Ressalva:** Falta de skeleton screens durante a carga assíncrona inicial do IndexedDB.

### `/prompts` e Editor (`/editor/:id`)
- **Diagnóstico:** O formulário do editor atualiza o estado monolítico (`form`) a cada tecla digitada nos inputs (ex: `updateMetaField`, `updatePromptDefinitionField`). Isso causa re-renders pesados de todo o formulário e do playground dinâmico simultaneamente.
- **UX/UI:** O playground de teste é funcional e inovador, mas os campos dinâmicos ("free inputs") carecem de referências semânticas fortes. O tamanho dos alvos de clique nas tags dos menus (`.menu-tag`) não garante > 48px de altura (conforme Priority 1).
- **React 19:** Não utiliza `useTransition` para evitar o bloqueio de UI ao digitar nos textareas do *Output Contract*.

### `/menus` (Gerenciamento de Menus)
- **Diagnóstico:** A lógica recursiva de opções/sub-opções está funcional, mas a atualização do array via índice no estado local é engessada e não otimizada.
- **Acessibilidade:** Botões de remover opção/sub-opção dependem muito de ícones sem texto visual visível e com `aria-label` estático, o que pode confundir usuários de leitores de tela sobre *qual* item está sendo removido.

### `/categories` (Gerenciamento de Categorias)
- **Diagnóstico:** A navegação por teclado foi implementada manualmente via `onKeyDown` (`Enter` e `Space`), mas o card usa `role="button"` em uma `div`. O ideal seria usar uma tag `<button>` ou `<a>` nativa.
- **Performance:** Deleção em cascata (categoria + prompts) feita no client-side sem feedback otimista na UI.

---

## 4. Auditoria de Acessibilidade (WCAG 2.2 AA)

| Componente/Rota | Problema (Falha WCAG) | Severidade | Impacto |
| :--- | :--- | :--- | :--- |
| `EditorMetaForm.tsx` | Inputs como "Nome do template" usam `htmlFor`, mas sem associações claras de erro ou hint text (`aria-describedby`). | 🟡 Alerta | Baixo: Leitores de tela leem o label, mas não o contexto extra. |
| `EditorPlayground.tsx` | Inputs dinâmicos de "Free Inputs" (Chave/Valor) não possuem `<label>` associado de forma única (IDs ausentes/repetidos ou dependentes de índex sem `htmlFor`). | 🔴 Crítico | Alto: Usuário não sabe a qual campo o label pertence. |
| `MenuManagerPage.tsx` | Botões de remoção de sub-opções têm `aria-label="Remover sub-opção"` igual para todos os itens da lista, quebrando o *Purpose of Controls* (2.4.4). | 🔴 Crítico | Alto: Impossível distinguir botões de deleção. |
| `CategoryCard.tsx` | Elementos de card com `role="button"` implementados em `div`. | 🟡 Alerta | Médio: Não recebe foco e estilos nativos apropriados. |
| Global (`index.css`) | Ausência completa de `@media (prefers-reduced-motion: reduce)` nas transições/animações CSS. | 🔴 Crítico | Alto: Pode causar tontura; quebra severa da Priority 4. |

---

## 5. Checklist de Persistência (Dexie/IndexedDB)

- [x] **CRUD Operacional:** Entidades (Categorias, Prompts, Menus) persistem corretamente.
- [x] **Integridade de Dados:** Zod Schema é aplicado no parse antes da exportação (`parseTemplatePayload`).
- [ ] **Otimização de Queries:** `db.prompts.toArray()` carregado integralmente na Home e Editor sem limite ou paginação.
- [ ] **Feedback de UI:** Ausência de estados de "Carregando" na resolução das promessas do IndexedDB (Pode causar flashes de Empty State).
- [x] **Geração do JSON:** Exportador e serializador funcionais para o compilado final.

---

## 6. Backlog de Correção (Prompts Atômicos Antigravity)

Abaixo estão os prompts de instrução formatados para execução imediata por agentes.

### 🔴 Correção 1: Responsividade e A11y nos Free Inputs do Editor
```markdown
Abra o arquivo `src/components/editor/EditorPlayground.tsx`.
1. Para cada "Free Input" iterado no `.map`, adicione um `id` único aos inputs de "Chave" e "Valor" (ex: `free-input-key-${index}`).
2. Adicione os atributos `htmlFor` correspondentes nas tags `<label>` associadas.
3. Altere o `aria-label` do botão de remover para ser dinâmico: `` aria-label={`Remover input livre: ${entry.key || index}`} ``.
4. Certifique-se de que os botões `.menu-tag` no CSS tenham `min-height: 48px;` e `min-width: 48px;` para respeitar os Touch Targets da WCAG 2.2.
```

### 🔴 Correção 2: Implementação de prefers-reduced-motion
```markdown
Abra o arquivo `src/index.css`.
No final do arquivo, adicione um bloco de media query para respeitar a acessibilidade de motion:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Isso garante o cumprimento da Prioridade 4 (Subtil, sem scale/bounce, respeito total à redução de motion).
```

### 🟡 Correção 3: Otimização de Concorrência com React 19 no Editor
```markdown
Abra o arquivo `src/pages/EditorPage.tsx`.
1. Importe `useTransition` do 'react'.
2. Envolva as chamadas de atualização de estado que derivam para o payload em um `startTransition`.
Por exemplo, na função `updatePromptDefinitionField`, faça:
```tsx
const [isPending, startTransition] = useTransition();
const updatePromptDefinitionField = (field, value) => {
  startTransition(() => {
    setForm((current) => ({
      ...current,
      template: {
        ...current.template,
        prompt_definition: { ...current.template.prompt_definition, [field]: value }
      }
    }));
  });
};
```
3. Aplique isso para as funções de update de Meta, Output Contract e Free Inputs para evitar jank severo (INP) durante a digitação.
```

### 🟡 Correção 4: Acessibilidade de Listas nos Menus
```markdown
Abra o arquivo `src/components/menu-manager/MenuOptionEditor.tsx` (ou os locais equivalentes).
1. Atualize os `aria-label` dos botões de deleção de opções e sub-opções para conter o valor ou índice da opção a ser excluída.
Exemplo: Em vez de `aria-label="Remover opção"`, use `` aria-label={`Remover opção ${option.label || index}`} ``.
2. Certifique-se de que o input da opção/sub-opção tem um `id` único atrelado a um `<label>` ou um `aria-label` claro (ex: `aria-label={`Rótulo da opção ${index}`}`).
```
