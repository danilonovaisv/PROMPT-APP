# ROADMAP DE CORREÇÃO (FIX PLAN)

### 1. Bloqueadores (P0)
- **Memória Fixa**:
  - Ajustar lógica em `EditorPlayground.tsx` e `EditorPage.tsx` para popular os campos corretamente e evitar conflitos no debounced save.
- **Importação Vazia**:
  - Verificar a renderização reativa após `db.prompts.bulkAdd` em `importService.ts`. O problema provável é a falta de categorias corretas, ou o status 'pending' não sendo lido nas queries da UI.

### 2. Estabilidade (P1)
- **Supabase/Sync**:
  - Resolver problemas de N+1 residuais no `syncService.ts` / `promptSync.ts` que possam travar grandes carregamentos.
  - Verificar tratamento do estado "Dirty" quando offline, garantindo que "pending" retry happens seamlessly.

### 3. UX/DX (P2)
- **Seletor de Menus**:
  - Consertar falha ao vincular menus a templates existentes (rever compatibilidade de tipos ID vs Number).
- Limpeza geral de código não utilizado, se houver.
