# RELATÓRIO DE CORREÇÕES: PROMPT-APP

## 1. Auditoria de Configuração (Ambiente & Supabase)
**Problema:** Erro "Configuração do Supabase ausente. Defina VITE_SUPABASE_URL" em tempo de execução/sincronização.
**Diagnóstico:** 
A aplicação React faz uso do `import.meta.env` gerado pelo Vite para compilar o valor das variáveis de ambiente na build (e expô-las no frontend). Quando a build e deploy são feitas em plataformas de hospedagem como a Netlify, as variáveis listadas no `.env.example` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) precisam ser explicitamente introduzidas na configuração de variáveis de ambiente do projeto da plataforma. O `.env.example` reflete sim, de forma precisa, as necessidades do frontend. A falha existe ou porque não foi replicado para um `.env` localmente durante o desenvolvimento, ou porque não foram adicionadas no dashboard do Netlify (`Site configuration > Environment variables`).

**Ação / Correção Recomendada:**
1. Em Desenvolvimento: Duplicar `.env.example` para `.env` (ou `.env.local`) e preencher o `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. Em Produção (Netlify): Injetar essas variáveis nas opções de ambiente e garantir uma nova build. As variáveis `VITE_*` são lidas estaticamente na hora em que o comando `npm run build` é processado pelo servidor da Netlify.

---

## 2. Auditoria ao Editor (UI/UX)
**Problema:** "a opção para selecionar e vincular menus (contextMenus) ao template não aparece ou não é clicável".
**Diagnóstico:**
O componente `EditorContextMenuSelector.tsx` lida com o estado do dropdown de menus (`isOpen`). Quando o utilizador clicava sobre o `button` ("Adicionar Menu Global"), o evento `onMouseDown` registado globalmente pelo listener `handleClickOutside` acabava a fechar ou sobrepor-se às lógicas dependendo do "bubbling". Adicionalmente, dentro da dropdown (`.ctx-picker__dropdown`), a opção da lista era um autêntico `<button>` com o handler `onClick()`. Este handler não ativava corretamente pois o click "outside" detetava o mousedown imediatamente e o componente lidava de forma irregular, não permitindo à dropdown manter-se aberta ou disparar a alteração (`onMenuToggle`).

**Correção Implementada:** 
Foi alterado o código em `src/components/editor/EditorContextMenuSelector.tsx`.
1. Em `ctx-picker__trigger` foi incluído `e.preventDefault()`.
2. Em `ctx-picker__option` substituiu-se o handler de `onClick` por `onMouseDown`. Ao prevenir o `default` nesta fase do clique com `e.preventDefault()`, garantimos que o input de "pesquisa" não perde o "focus" e as propriedades fecho imediato da dropdown são neutralizadas antes de disparar o `onMenuToggle(menu.menuId, true)`. 
3. Explicitamente definimos `type="button"` nos elementos para evitar comportamentos de submit na root-form.

---

## 3. Discrepância Estrutural de Base de Dados (Sync)
**Problema:** Houve falta ou alteração das colunas de legacy properties no Supabase contra o IndexedDB.
**Diagnóstico:**
Analisando as tabelas e scripts SQL, nota-se que colunas vitais (`reference_url`, `prompt_payload_jsonb`, `schema_version`, `output_format`, `language`, `selected_menu_ids`) foram retiradas nalgum script ou ficaram em estado assíncrono perante o que `schemaVersion = 8` do Dexie.js (`src/db/database.ts`) esperava.
Isto significa erro quando o `savePromptToSupabase` enviada estes payloads para sincronizar com o remote table de `prompts`.

**Correção Implementada:**
1. Foi desenhado e criado um script SQL: `supabase/migrations/20260319000000_restore_missing_columns.sql`. Este ALTER TABLE assegura que a tabela `prompts` volta a suportar a estrutura com `selected_menu_ids BIGINT[] DEFAULT '{}'::bigint[]` entre as restantes necessárias.
2. Atualizado localmente o ficheiro `src/db/database.ts` elevando a versão para `<db.version(9)>` aplicando um `.upgrade()` script de compatibilização a garantir que na base de dados (Dexie IndexedDB) o `selectedMenuIds` é corretamente inicializado como `[]`, prevendo eventuais nulos na transição para a nova versão.
