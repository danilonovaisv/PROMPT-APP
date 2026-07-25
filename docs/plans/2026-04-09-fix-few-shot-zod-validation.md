# Fix: Zod Validation Error on `few_shot_examples.input` / `.output` — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminar o erro Zod `too_small` (minimum: 1) nos campos `input` e `output` de `few_shot_examples` ao salvar um prompt com exemplos em branco, sem alterar o schema Zod nem quebrar migrações Dexie existentes.

**Architecture:** Correção em duas camadas: (1) validação preventiva no formulário React com mensagens inline; (2) filtragem defensiva de exemplos completamente vazios antes do parse Zod em `buildPersistedArtifacts`. O schema permanece com `min(1)` — essa é a intenção correta do domínio.

**Tech Stack:** React 19, TypeScript Strict, Zod 3.x, VITE, Dexie.js 4.x, pnpm

---

## Diagnóstico

### Arquivos Identificados

| Arquivo | Papel no bug |
|---|---|
| `src/models/promptSchema.ts:61-66` | `FewShotExampleSchema` com `input/output: z.string().trim().min(1)` — CORRETO, não alterar |
| `src/components/editor/EditorDefinitionForm.tsx:166-176` | Botão insere `{ input: '', output: '' }` sem validação preventiva |
| `src/pages/EditorPage.tsx:166-184` | `buildPersistedArtifacts` chama `TemplatePayloadSchema.parse()` sem filtrar exemplos vazios |
| `src/utils/normalizeFewShot.ts` | Utilitário adequado existe mas **não é usado em** `buildPersistedArtifacts` |

### Decisão de Domínio: OBRIGATÓRIOS (min 1)

Few-shot examples sem input ou output não têm valor semântico para LLMs. O schema está correto. A falha é na UI que não impede o save.

### Versão Dexie: 10 — sem alteração necessária

### Branch: criar `fix/few-shot-zod-validation` a partir de `main`

---

## Task 1: Criar branch de feature

```bash
cd "/Users/PROJETOS DEV/PROMPT-APP"
git checkout -b fix/few-shot-zod-validation
```

---

## Task 2: Validação preventiva no `EditorDefinitionForm.tsx`

**Modify:** `src/components/editor/EditorDefinitionForm.tsx`

Substituir o bloco das linhas 123-178 pelo seguinte (renderização dos exemplos few-shot com validação inline):

```tsx
<div className="form-group">
  <label className="form-label">
    Exemplos de Resposta (Few-shot)
    <span className="form-label__hint"> — preencha os campos antes de salvar</span>
  </label>
  <div className="dynamic-list">
    {template.prompt_definition.few_shot_examples.map((example, index) => {
      const inputEmpty = example.input.trim() === '';
      const outputEmpty = example.output.trim() === '';
      return (
        <div key={`few-shot-${index}`} className={`few-shot-item card${inputEmpty || outputEmpty ? ' few-shot-item--invalid' : ''}`}>
          <div className="form-group">
            <label className="form-label">
              Input do usuário <span className="form-label__required" aria-hidden="true">*</span>
            </label>
            <textarea
              value={example.input}
              onChange={(e) => {
                const VITE = [...template.prompt_definition.few_shot_examples];
                VITE[index] = { ...VITE[index], input: e.target.value };
                updatePromptDefinitionField('few_shot_examples', VITE);
              }}
              rows={2}
              placeholder="Ex: Como faço para..."
              aria-invalid={inputEmpty}
              aria-describedby={inputEmpty ? `few-shot-input-error-${index}` : undefined}
            />
            {inputEmpty && (
              <span id={`few-shot-input-error-${index}`} className="form-field-error" role="alert">
                Campo obrigatório — preencha o input do exemplo antes de salvar.
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              Resposta esperada <span className="form-label__required" aria-hidden="true">*</span>
            </label>
            <textarea
              value={example.output}
              onChange={(e) => {
                const VITE = [...template.prompt_definition.few_shot_examples];
                VITE[index] = { ...VITE[index], output: e.target.value };
                updatePromptDefinitionField('few_shot_examples', VITE);
              }}
              rows={2}
              placeholder="Ex: Para fazer isso, você deve..."
              aria-invalid={outputEmpty}
              aria-describedby={outputEmpty ? `few-shot-output-error-${index}` : undefined}
            />
            {outputEmpty && (
              <span id={`few-shot-output-error-${index}`} className="form-field-error" role="alert">
                Campo obrigatório — preencha a resposta esperada antes de salvar.
              </span>
            )}
          </div>
          <button
            className="btn btn--ghost btn--icon few-shot-delete"
            onClick={() => {
              const VITE = template.prompt_definition.few_shot_examples.filter((_, i) => i !== index);
              updatePromptDefinitionField('few_shot_examples', VITE);
            }}
            title="Remover exemplo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      );
    })}
    <button
      className="btn btn--ghost btn--sm dynamic-list__add"
      onClick={() => {
        updatePromptDefinitionField('few_shot_examples', [
          ...template.prompt_definition.few_shot_examples,
          { input: '', output: '' },
        ]);
      }}
    >
      <Plus size={14} /> Novo exemplo
    </button>
  </div>
</div>
```

```bash
pnpm run type-check 2>&1 | head -40
git add src/components/editor/EditorDefinitionForm.tsx
git commit -m "feat(few-shot): add inline validation feedback on input/output fields

- Renders form-field-error messages when input or output are empty
- Applies few-shot-item--invalid CSS class to highlight invalid cards
- aria-invalid + aria-describedby for accessible error announcements
- No schema changes — validation is preventive UI-layer only"
```

---

## Task 3: CSS para estados de erro de few-shot

**Modify:** arquivo CSS principal (localizar com `find src -name "*.css"`)

Adicionar ao final:

```css
/* --- Few-shot validation states --- */
.few-shot-item--invalid {
  border-color: var(--color-error, #e53e3e);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-error, #e53e3e) 20%, transparent);
}

.form-field-error {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
  color: var(--color-error, #e53e3e);
  font-weight: 500;
}

.form-label__required {
  color: var(--color-error, #e53e3e);
  margin-left: 2px;
}
```

```bash
git add src/*.css
git commit -m "style(few-shot): add error state styles for invalid few-shot items"
```

---

## Task 4: Filtragem defensiva em `buildPersistedArtifacts` (`EditorPage.tsx`)

**Modify:** `src/pages/EditorPage.tsx` (função `buildPersistedArtifacts`, linhas 160-202)

Adicionar imediatamente antes de `const normalizedTemplate = TemplatePayloadSchema.parse(...)`:

```typescript
// Filtra exemplos few-shot onde AMBOS os campos estão vazios.
// Exemplos com apenas um campo vazio chegam ao Zod propositalmente.
const sanitizedFewShotExamples = form.template.prompt_definition.few_shot_examples.filter(
  (ex) => ex.input.trim() !== '' || ex.output.trim() !== '',
);
```

E dentro do `prompt_definition` do `TemplatePayloadSchema.parse(...)`, adicionar:

```typescript
prompt_definition: {
  ...form.template.prompt_definition,
  constraints: splitLines(joinLines(form.template.prompt_definition.constraints)),
  negative_prompt: splitLines(joinLines(form.template.prompt_definition.negative_prompt)),
  few_shot_examples: sanitizedFewShotExamples,  // <-- ADICIONAR
},
```

```bash
pnpm run type-check 2>&1
git add src/pages/EditorPage.tsx
git commit -m "fix(few-shot): filter fully-empty examples before Zod parse in buildPersistedArtifacts

- Silently discards { input: '', output: '' } before Zod validates
- Partially-filled examples still reach Zod (correct behavior)
- Preserves FewShotExampleSchema.min(1) intent — no schema changes"
```

---

## Task 5: Mensagem de toast amigável no `handleSave`

**Modify:** `src/pages/EditorPage.tsx`

**Step 1:** Adicionar helper antes de `const EMPTY_MENUS: never[] = [];` (linha 211):

```typescript
// Detecta se um ZodError contém erros específicos de few_shot_examples
function getFewShotZodErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  if (
    error.message.includes('few_shot_examples') ||
    (error.message.includes('too_small') && error.message.includes('input')) ||
    (error.message.includes('too_small') && error.message.includes('output'))
  ) {
    return 'Preencha o Input e a Resposta de todos os exemplos few-shot antes de salvar.';
  }
  return null;
}
```

**Step 2:** No `handleSave`, bloco catch de `buildPersistedArtifacts` (linhas 470-474), substituir:

```typescript
// ANTES
    } catch (e: unknown) {
        const error = e as Error;
      showToast(error.message || 'Template inválido', 'error');
      return;
    }

// DEPOIS
    } catch (e: unknown) {
      const error = e as Error;
      const fewShotMessage = getFewShotZodErrorMessage(error);
      showToast(fewShotMessage || error.message || 'Template inválido', 'error');
      return;
    }
```

```bash
pnpm run type-check 2>&1
git add src/pages/EditorPage.tsx
git commit -m "fix(few-shot): improve Zod error toast message for few_shot_examples

- Detects too_small on input/output by message inspection
- Replaces technical Zod message with user-friendly pt-BR text"
```

---

## Task 6: Verificação final

```bash
# Type-check: deve retornar VAZIO (zero erros)
pnpm run type-check 2>&1

# Build: deve concluir com sucesso
pnpm run build 2>&1

# Push e PR
git push origin fix/few-shot-zod-validation
```

**Título do PR:** `fix(few-shot): prevent Zod too_small crash on empty few_shot_examples fields`

---

## Resumo das Mudanças

| Arquivo | O que mudou |
|---|---|
| `src/components/editor/EditorDefinitionForm.tsx` | Validação visual inline, `aria-invalid`, `few-shot-item--invalid` |
| `src/*.css` | `.few-shot-item--invalid`, `.form-field-error`, `.form-label__required` |
| `src/pages/EditorPage.tsx` | Filtro em `buildPersistedArtifacts` + toast amigável via `getFewShotZodErrorMessage` |

**Não alterado:** `promptSchema.ts` · `database.ts` (Dexie v10) · `normalizeFewShot.ts` · nomes de campos
