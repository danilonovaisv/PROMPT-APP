🛡️ Relatório de Auditoria Completa — PROMPT-APP
Data da Auditoria: Março 2026
Versão Auditada: 3.0
URL de Produção: <https://prompt-app-dan.netlify.app>
Repositório: <https://github.com/danilonovaisv/PROMPT-APP>
1️⃣ Visão Geral
Resumo Técnico do Estado Atual
Eixo
Status
Observações Principais
Acessibilidade (A11y)
🟡 Parcial
Skip-link presente, mas faltam :focus-visible, labels em alguns inputs, e suporte a prefers-reduced-motion
Performance
🟢 Bom
Code-splitting com lazy-loading, IndexedDB local-first, mas sem análise de bundle atualizada
Confiabilidade Funcional
🟢 Bom
Fluxos de CRUD de prompts funcionais, draft automático, sync opcional com Supabase
Qualidade Editorial
🟢 Bom
Estrutura de template bem definida (meta, prompt_definition, output_contract)
Motion
🟡 Atenção
Uso de scale e rotate em componentes UI (violando regras de motion sutil)
Pontos Fortes:
Arquitetura local-first com Dexie (IndexedDB)
Code-splitting via lazy-loading de rotas
SEO técnico implementado (meta tags, JSON-LD, fallback no-JS)
Editor com playground em tempo real e preview modal
Sistema de menus de contexto reutilizáveis
Pontos de Atenção Críticos:
Ausência total de prefers-reduced-motion no CSS
Transformações scale e rotate em elementos de conteúdo (cards, botões, ícones)
Foco visível limitado (sem :focus-visible, apenas :focus)
Touch targets podem estar abaixo de 48x48px em alguns botões ícone
Editor não tem tratamento de erro acessível (role="alert" inconsistente)
2️⃣ Diagnóstico por Área
📍 Navegação & Estrutura Semântica
Checklist
Status
Evidência
Skip-link presente
✅
<a class="skip-link" href="#main-content"> em Layout.tsx
1x <h1> por página
⚠️
HomePage usa <h1> na hero, CategoryPage usa <h1> no título da categoria
Landmarks (header/nav/main/footer)
✅
Layout.tsx usa <aside>, <main>, <footer> corretamente
Navegação por teclado
⚠️
NavLink funciona, mas botões na sidebar não têm foco visível adequado
Breadcrumbs
❌
Ausentes em páginas aninhadas (ex: EditorPage, CategoryPage)
Severidade: 🟡 Média
Recomendação: Adicionar breadcrumbs em CategoryPage e EditorPage para orientação espacial. Implementar :focus-visible global para navegação por teclado.
📍 Library/Listas de Prompts (HomePage, CategoryPage)
Checklist
Status
Evidência
Empty state descritivo
✅
Componentes com ícone, título e CTA claro
Loading state
⚠️
Apenas fallback genérico "Carregando..." no Suspense
Card clicável com keyboard
✅
PromptCard tem tabIndex={0} e onKeyDown
Ações visíveis no hover
⚠️
opacity: 0 nas ações pode esconder funcionalidade de touch
Contagem de itens
✅
HomePage mostra estatísticas de templates/categorias
Severidade: 🟢 Baixa
Recomendação: Em mobile, mostrar ações sempre visíveis (não apenas no hover). Adicionar skeleton loading em vez de spinner genérico.
📍 Editor de Prompts (EditorPage + components/editor/)
Checklist
Status
Evidência
Labels em todos os inputs
✅
EditorMetaForm usa <label htmlFor="...">
Validação com feedback
⚠️
Toasts mostram erros, mas inputs não têm aria-invalid ou aria-describedby
Draft automático
✅
localStorage salva rascunho a cada 1.2s (debounce)
Preview em tempo real
✅
EditorPlayground compila prompt ao vivo
Modal acessível
⚠️
useAccessibleModal hook existe, mas falta role="dialog" e aria-modal no EditorPreviewModal
Playground navegável por teclado
⚠️
Botões de opção são <button>, mas grid pode ter problemas de tab order
Severidade: 🟡 Média
Recomendação:
Adicionar aria-invalid="true" e aria-describedby a inputs com erro
Incluir role="dialog", aria-modal="true" e foco trap no EditorPreviewModal
Garantir que sub-opções no playground tenham ordem de tab lógica
📍 Organização (Tags/Categorias/Menus)
Checklist
Status
Evidência
Categorias com ícones/cores
✅
CategoryCard usa category.icon e category.color
Menus de contexto vinculáveis
✅
EditorDefinitionForm permite selecionar menus
Filtros/busca
❌
Não há busca/filtro na lista de prompts
Favoritos
❌
Feature ausente
Gerenciador de categorias
✅
CategoryManagerPage permite CRUD completo
Severidade: 🟡 Média (busca é crítica para bibliotecas grandes)
Recomendação: Implementar busca por título/descrição em CategoryPage e HomePage. Considerar favoritos como melhoria futura.
📍 Export/Copy/Import
Checklist
Status
Evidência
Copiar prompt formatado
✅
formatPromptAsMarkdown gera markdown estruturado
Download JSON compilado
✅
downloadJson com nome sanitizado
Importar templates
✅
ImportExportModal e importService.ts
Backup local
✅
saveLocalBackup no utils/backupManager.ts
Confirmação antes de excluir
✅
confirm() nativo em handleDelete
Severidade: 🟢 Baixa
Recomendação: Substituir confirm() nativo por modal customizado acessível. Adicionar opção de exportar em lote com seleção múltipla.
📍 Settings/Preferências
Checklist
Status
Evidência
Tema claro/escuro
❌
Apenas tema escuro disponível
Idioma da interface
❌
Interface fixa em pt-BR
Configurações de sync
⚠️
CloudSyncItem mostra status, mas não permite configurar frequência
Sobre/Privacidade/Contato
✅
Páginas estáticas presentes
Severidade: 🟢 Baixa (fora do escopo de auditoria funcional)
Recomendação: Não alterar sem solicitação explícita.
3️⃣ Lista de Problemas (Severidade 🔴🟡🟢)
🔴 Críticos (A11y + Motion)

#

Problema
Impacto
Arquivo(s)
Correção Sugerida
1
Ausência de prefers-reduced-motion
Usuários com sensibilidade a movimento não podem desligar animações
src/index.css
Adicionar media query global para desativar transições
2
Uso de transform: scale() em conteúdo
Viola regra de motion sutil; pode causar desconforto visual
src/index.css (linhas 1033, 1064, 2098)
Substituir por translateY ou opacity
3
Uso de transform: rotate() em ícones
Viola regra de motion (rotação proibida)
src/index.css (linhas 765, 1951, 2674, 2678)
Usar swap de ícones ou opacity fade
4
Foco não visível em botões ícone
Usuários de teclado não sabem onde estão
src/index.css
Adicionar :focus-visible com outline claro
5
Touch targets < 48x48px
Botões ícone de 36x36px dificultam toque em mobile
src/index.css (.btn--icon)
Aumentar para mín. 44x44px
🟡 Altos (A11y + UX)

#

Problema
Impacto
Arquivo(s)
Correção Sugerida
6
Inputs sem aria-describedby para erros
Leitores de tela não anunciam mensagens de erro
src/components/editor/*.tsx
Adicionar aria-describedby apontando para mensagem de ajuda/erro
7
Modal sem role="dialog" e foco trap
Usuários de leitor de tela podem se perder
src/components/editor/EditorPreviewModal.tsx
Adicionar atributos ARIA e focar primeiro elemento
8
Ações apenas no hover (desktop)
Mobile não tem hover; ações ficam ocultas
src/index.css (.prompt-item__actions)
Mostrar ações sempre em telas touch ou adicionar botão "..."
9
Ausência de breadcrumbs
Usuários se perdem em navegação profunda
src/pages/CategoryPage.tsx, EditorPage.tsx
Adicionar componente Breadcrumb
10
Loading state genérico
Não dá contexto do que está carregando
src/App.tsx (LoadingFallback)
Criar skeletons específicos por página
🟢 Médios/Baixos (UX + Performance)

#

Problema
Impacto
Arquivo(s)
Correção Sugerida
11
Busca/filtro ausente
Difícil encontrar prompts em bibliotecas grandes
src/pages/CategoryPage.tsx
Adicionar campo de busca com debounce
12
confirm() nativo para exclusão
Não é customizável nem acessível
src/pages/CategoryPage.tsx
Usar modal de confirmação customizado
13
Sem análise de bundle atualizada
Risco de regressão de performance
NEXT.config.ts
Adicionar plugin de bundle analysis
14
Dead code: src/utils/supabase.ts duplicado
Confusão e manutenção desnecessária
src/utils/supabase.ts
Remover arquivo duplicado
15
Toasts sem role="status"
Leitores de tela podem não anunciar
src/context/ToastContext.tsx
Adicionar role="status" e aria-live="polite"
4️⃣ Prompts Técnicos para Agentes (Atômicos)
🛠️ Prompt #01 — Adicionar prefers-reduced-motion Global
Objetivo: Respeitar preferência do usuário por movimento reduzido, desativando transições e animações quando necessário.
Arquivos: src/index.css
Ações:
Adicionar media query @media (prefers-reduced-motion: reduce) no início do arquivo (após :root)
Dentro da media query, definir transition: none !important e animation: none !important para *,*::before, *::after
Manher apenas transições essenciais (ex.: focus states) se necessário
Regras: Mobile-first, A11y AA, Performance, Não mudar texto.
Critérios de Aceite:
Testar com DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion: reduce
Nenhuma transição ou animação deve ocorrer (exceto mudanças instantâneas de estado)
Foco visível deve permanecer funcional
🛠️ Prompt #02 — Substituir transform: scale() por Alternativas Sutis
Objetivo: Eliminar transformações de escala em elementos de conteúdo, usando apenas opacity, blur ou translateY (máx 18px).
Arquivos: src/index.css
Ações:
Localizar todas as ocorrências de transform: scale( (linhas ~1033, 1064, 2098)
Substituir por combinações de:
transform: translateY(-2px) para hover lift
opacity: 0.9 para feedback visual
box-shadow aumentado para ênfase
Remover transform: scale(1.05) do .editor-floating-toggle:hover (linha 2098)
Regras: Motion sutil apenas (opacity/blur/translateY ≤18px), respeitar reduced motion.
Critérios de Aceite:
Nenhum scale() restante no CSS
Hover states ainda fornecem feedback visual claro
Testar com prefers-reduced-motion ativo
🛠️ Prompt #03 — Substituir transform: rotate() por Swap de Ícones
Objetivo: Eliminar rotações de ícones, usando troca de ícones ou fade entre estados.
Arquivos: src/index.css
Ações:
Identificar usos de rotate (linhas ~765, 1951, 2674, 2678)
Para setas de dropdown/accordion:
Opção A: Usar dois ícones (seta para baixo / seta para cima) e alternar com opacity
Opção B: Manter rotação mas limitar a 180deg com transição suave (se essencial)
Para loading spinners: manter rotação (é funcional, não decorativa)
Regras: Priorizar swap de ícones; se rotação for essencial, limitar a 180deg e respeitar reduced motion.
Critérios de Aceite:
Nenhuma rotação decorativa restante
Dropdowns ainda indicam estado aberto/fechado claramente
Spinners de loading continuam funcionando
🛠️ Prompt #04 — Implementar :focus-visible Global
Objetivo: Garantir que foco visível apareça apenas durante navegação por teclado, não em cliques/toque.
Arquivos: src/index.css
Ações:
Adicionar estilos globais para :focus-visible:
css
12345
Remover outline: none de input:focus, textarea:focus, select:focus e substituir por :focus:not(:focus-visible) { outline: none; }
Aplicar padrão consistente a botões, links e elementos interativos customizados
Regras: WCAG AA, foco deve ser claramente visível (contraste ≥ 3:1).
Critérios de Aceite:
Navegar por teclado (Tab/Shift+Tab): foco visível em todos elementos interativos
Clicar com mouse/toque: sem outline visível
Validar com axe DevTools ou similar
🛠️ Prompt #05 — Aumentar Touch Targets para Mín. 44x44px
Objetivo: Garantir que todos os elementos interativos tenham área de toque mínima de 44x44px (WCAG AAA).
Arquivos: src/index.css
Ações:
Localizar .btn--icon (linha ~573-577) e aumentar de 36px para 44px
Ajustar padding de botões pequenos (.btn--sm) se necessário
Verificar ícones dentro de botões e centralizar corretamente
Adicionar comentário explicativo sobre requisito de acessibilidade
Regras: Mobile-first, touch target ≥ 44x44px, não alterar layout desktop significativamente.
Critérios de Aceite:
Medir botões ícone no DevTools: devem ter ≥ 44x44px
Testar em dispositivo móvel ou emulação touch
Ícones permanecem centralizados visualmente
🛠️ Prompt #06 — Adicionar ARIA Labels e Descriptions em Inputs do Editor
Objetivo: Melhorar acessibilidade de formulários com aria-invalid, aria-describedby para erros e dicas.
Arquivos: src/components/editor/EditorMetaForm.tsx, EditorDefinitionForm.tsx, EditorPlayground.tsx
Ações:
Para cada input/textarea/select:
Garantir que <label htmlFor="id"> corresponda ao id do input
Se houver mensagem de ajuda: adicionar <span id="help-id"> e aria-describedby="help-id" no input
Se houver validação: adicionar aria-invalid={hasError} e apontar para mensagem de erro
Em campos obrigatórios: adicionar aria-required="true" ou asterisco visual com aria-hidden
Em grupos de inputs relacionados: usar fieldset e legend ou role="group" com aria-labelledby
Regras: WCAG AA, não alterar textos visíveis, manter layout.
Critérios de Aceite:
Testar com leitor de tela (NVDA/VoiceOver): cada input anuncia label, dica e erro (se aplicável)
Validar com axe DevTools: zero violações de forms
Navegação por teclado funciona sem armadilhas
🛠️ Prompt #07 — Tornar EditorPreviewModal Acessível
Objetivo: Implementar modal verdadeiramente acessível com foco trap, roles ARIA e announce.
Arquivos: src/components/editor/EditorPreviewModal.tsx, src/hooks/useAccessibleModal.ts
Ações:
No container do modal:
Adicionar role="dialog", aria-modal="true", aria-labelledby (apontando para título)
Adicionar aria-describedby se houver descrição
Implementar foco trap:
Ao abrir: focar primeiro elemento focável dentro do modal
Tab loop: manter foco dentro do modal
Ao fechar: retornar foco ao elemento que abriu
Adicionar overlay com aria-hidden="true"
Permitir fechar com Escape (já deve existir, validar)
No hook useAccessibleModal: garantir que todas as funções acima sejam chamadas
Regras: WCAG AA, WAI-ARIA Authoring Practices, não quebrar funcionalidade existente.
Critérios de Aceite:
Testar com leitor de tela: modal é anunciado como "dialog", conteúdo é lido, fechamento é claro
Tab navigation não vaza do modal
Esc fecha o modal e foco retorna corretamente
Validar com axe DevTools
🛠️ Prompt #08 — Mostrar Ações de Prompt em Mobile (Sempre Visíveis)
Objetivo: Em dispositivos touch, mostrar ações (editar/copiar/baixar/excluir) sempre visíveis, não apenas no hover.
Arquivos: src/index.css, src/components/PromptCard.tsx
Ações:
No CSS, dentro de @media (max-width: 768px) ou similar:
Definir .prompt-item__actions { opacity: 1; } (sobrescrever comportamento de hover)
Alternativa: Adicionar botão "..." (kebab menu) que abre dropdown com ações em telas pequenas
Garantir que ações em mobile tenham espaçamento adequado (gap ≥ 8px)
Regras: Mobile-first, não prejudicar experiência desktop, manter consistência visual.
Critérios de Aceite:
Em mobile: ações visíveis sem necessidade de hover
Em desktop: comportamento atual mantido (hover revela ações)
Testar em emulação de dispositivo móvel
🛠️ Prompt #09 — Adicionar Breadcrumbs em Páginas Aninhadas
Objetivo: Melhorar orientação espacial do usuário com breadcrumbs em CategoryPage e EditorPage.
Arquivos: src/pages/CategoryPage.tsx, EditorPage.tsx, criar src/components/Breadcrumb.tsx
Ações:
Criar componente Breadcrumb.tsx:
Receber array de { label, href? }
Renderizar lista separada por / ou ›
Usar nav aria-label="Breadcrumb" e ol com li
Último item com aria-current="page" e sem link
Em CategoryPage:
Breadcrumb: Início › [Nome da Categoria]
Em EditorPage:
Breadcrumb: Início › [Nome da Categoria] › [Nome do Template] (ou "Novo Template")
Regras: WCAG AA, schema.org BreadcrumbList (opcional para SEO), não alterar layout significativamente.
Critérios de Aceite:
Breadcrumbs visíveis no topo da área de conteúdo
Navegação por teclado funciona
Schema.org JSON-LD adicionado (opcional para SEO)
Validar com Google Rich Results Test (se JSON-LD adicionado)
🛠️ Prompt #10 — Implementar Busca/Filtro em CategoryPage
Objetivo: Permitir busca rápida por título/descrição de prompts dentro de uma categoria.
Arquivos: src/pages/CategoryPage.tsx, criar hook src/hooks/useSearchFilter.ts
Ações:
Criar hook useSearchFilter:
Receber array de prompts e termo de busca
Filtrar por title e description (case-insensitive)
Retornar prompts filtrados
Em CategoryPage:
Adicionar input de busca acima da lista de prompts
Usar debounce de 300ms para performance
Mostrar contador "X de Y resultados"
Empty state específico para "nenhum resultado encontrado"
Persistir termo de busca em URL query param (opcional)
Regras: Performance (debounce), A11y (label no input), mobile-first.
Critérios de Aceite:
Digitar termo: lista filtra em tempo real (com debounce)
Limpar busca: lista volta ao original
Empty state mostra mensagem clara quando sem resultados
Input tem label visível ou aria-label
URL persiste termo (se implementado)
📊 Metas de Performance (Status Atual)
Métrica
Meta
Status Estimado
Observações
Peso inicial
< 2MB
🟢 Provável OK
Code-splitting ativo, assets otimizados
FCP
< 2s
🟢 Provável OK
Lazy-loading de rotas
LCP
< 2.5s
🟡 Atenção
Hero image pode impactar; validar em 3G
TTI (3G)
< 5s
🟡 Atenção
IndexedDB seed inicial pode ser pesado
CLS
< 0.1
🟢 Provável OK
Layouts com dimensões definidas
Lighthouse
> 90
🟡 Atenção
A11y pode puxar score para baixo
Recomendação: Rodar Lighthouse CI em produção para métricas reais.
