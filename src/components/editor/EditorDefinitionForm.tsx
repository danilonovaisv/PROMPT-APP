import type { TemplatePayload, PromptOutputContract } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';
import MultiSelect from '@/components/ui/MultiSelect';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import { useEffect, useRef, useId, useState } from 'react';

type ArrayChipInputProps = {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  hint: string;
  hintId: string;
};

function ArrayChipInput({
  id,
  label,
  values = [],
  onChange,
  placeholder,
  hint,
  hintId
}: ArrayChipInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addItems = (text: string) => {
    const newItems = text
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (newItems.length > 0) {
      onChange([...values, ...newItems]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addItems(inputValue);
        setInputValue('');
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addItems(inputValue);
      setInputValue('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    addItems(pastedText);
    setInputValue('');
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group array-chip-input">
      <label className="form-label" htmlFor={id}>{label}</label>
      
      {values.length > 0 && (
        <div className="chip-container" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
          {values.map((val, idx) => (
            <span key={idx} className="chip-item" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: '2px 8px', backgroundColor: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              <span className="chip-text">{val}</span>
              <button
                type="button"
                className="chip-delete-btn"
                onClick={() => removeItem(idx)}
                aria-label={`Remover ${val}`}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'inline-flex', color: 'var(--color-text-muted)' }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="chip-input-wrapper" style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={placeholder}
          aria-describedby={hintId}
          className="form-input chip-input-field"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => {
            if (inputValue.trim()) {
              addItems(inputValue);
              setInputValue('');
            }
          }}
          style={{ padding: '0 var(--space-3)' }}
        >
          Adicionar
        </button>
      </div>
      <span id={hintId} className="form-label__hint">{hint}</span>
    </div>
  );
}

type EditorDefinitionFormProps = {
  template: TemplatePayload;
  updatePromptDefinitionField: <K extends keyof TemplatePayload['prompt_definition']>(
    field: K,
    value: TemplatePayload['prompt_definition'][K]
  ) => void;
  updateOutputContractField: <K extends keyof PromptOutputContract>(
    field: K,
    value: PromptOutputContract[K]
  ) => void;
  selectedMenuIds?: number[];
  onMenuSelectionChange?: (menuIds: number[]) => void;
  availableContextMenus?: ContextMenu[];
};

const PROMPT_OUTPUT_FORMATS = ['text', 'json', 'xml', 'yaml', 'html', 'code'] as const;

export function EditorDefinitionForm({ 
  template, 
  updatePromptDefinitionField, 
  updateOutputContractField,
  selectedMenuIds = [],
  onMenuSelectionChange,
  availableContextMenus = []
}: EditorDefinitionFormProps) {
  const menuOptions = availableContextMenus
    .filter((menu): menu is ContextMenu & { id: number } => typeof menu.id === 'number')
    .map((menu) => ({
      id: menu.id,
      label: menu.menuName || menu.menuId,
      description: menu.menuId,
    }));
  
  const lastItemRef = useRef<HTMLTextAreaElement>(null);
  const prevExamplesLength = useRef(template.prompt_definition.few_shot_examples.length);
  const formId = useId();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const list = [...template.prompt_definition.few_shot_examples];
    const draggedItem = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(index, 0, draggedItem);

    updatePromptDefinitionField('few_shot_examples', list);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  useEffect(() => {
    if (template.prompt_definition.few_shot_examples.length > prevExamplesLength.current) {
      lastItemRef.current?.focus();
    }
    prevExamplesLength.current = template.prompt_definition.few_shot_examples.length;
  }, [template.prompt_definition.few_shot_examples.length]);

  const fieldHints = {
    systemRole: `${formId}-system-role-hint`,
    task: `${formId}-task-hint`,
    context: `${formId}-context-hint`,
    userSceneDescription: `${formId}-user-scene-description-hint`,
    constraints: `${formId}-constraints-hint`,
    negativePrompt: `${formId}-negative-prompt-hint`,
    outputFormat: `${formId}-output-format-hint`,
    outputLanguage: `${formId}-output-language-hint`,
    requiredFields: `${formId}-required-fields-hint`,
    responseRules: `${formId}-response-rules-hint`,
  } as const;

  return (
    <>
      <fieldset className="form-section">
        <legend className="form-section__title">
          Definição do Prompt
        </legend>

        <div className="form-section--grouped">
          <h3 className="form-label--sub">Núcleo do Prompt</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="system-role">System role</label>
            <textarea
              id="system-role"
              value={template.prompt_definition.system_role}
              onChange={(event) => updatePromptDefinitionField('system_role', event.target.value)}
              rows={4}
              placeholder="Defina o papel do modelo"
              aria-describedby={fieldHints.systemRole}
              aria-required="true"
            />
            <span id={fieldHints.systemRole} className="form-label__hint">
              Defina o papel e a especialidade que o modelo deve assumir neste template.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task">Task</label>
            <textarea
              id="task"
              value={template.prompt_definition.task}
              onChange={(event) => updatePromptDefinitionField('task', event.target.value)}
              rows={4}
              placeholder="Descreva a tarefa principal"
              aria-describedby={fieldHints.task}
              aria-required="true"
            />
            <span id={fieldHints.task} className="form-label__hint">
              Explique a entrega principal esperada para o template.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-scene-description">
              User Scene Description <span className="required-badge" aria-hidden="true">*</span>
            </label>
            <textarea
              id="user-scene-description"
              value={template.prompt_definition.user_scene_description}
              onChange={(event) => updatePromptDefinitionField('user_scene_description', event.target.value)}
              rows={4}
              placeholder="Descreva a cena de usuário"
              aria-describedby={fieldHints.userSceneDescription}
              aria-required="true"
            />
            <span id={fieldHints.userSceneDescription} className="form-label__hint">
              Descreva o cenário do usuário em que o template será usado (Campo obrigatório).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-context`}>Context</label>
            <textarea
              id={`${formId}-context`}
              value={template.prompt_definition.context}
              onChange={(event) => updatePromptDefinitionField('context', event.target.value)}
              rows={4}
              placeholder="Explique o contexto do template"
              aria-describedby={fieldHints.context}
            />
            <span id={fieldHints.context} className="form-label__hint">
              Registre premissas, cenário de uso e informações de apoio para a resposta.
            </span>
          </div>


        </div>

        <div className="form-section--grouped">
          <h3 className="form-label--sub">Guardrails & Menus</h3>
          <div className="form-group-grid">
            <ArrayChipInput
              id="template-constraints"
              label="Constraints"
              values={template.prompt_definition.constraints}
              onChange={(values) => updatePromptDefinitionField('constraints', values)}
              placeholder="Digite uma restrição e pressione Enter"
              hint="Liste limites, critérios e guardrails."
              hintId={fieldHints.constraints}
            />

            <ArrayChipInput
              id="template-negative-prompt"
              label="Negative prompt"
              values={template.prompt_definition.negative_prompt}
              onChange={(values) => updatePromptDefinitionField('negative_prompt', values)}
              placeholder="Digite uma proibição e pressione Enter"
              hint="Informe o que a resposta deve evitar."
              hintId={fieldHints.negativePrompt}
            />
          </div>

          {availableContextMenus.length > 0 && (
            <div className="form-group">
              <div className="form-label" id={`${formId}-menus-label`}>
                Menus do Template
              </div>
              <p className="form-label__hint" id={`${formId}-menus-hint`}>
                Selecione os menus que estarão disponíveis neste template
              </p>
              <div id="template-linked-menus">
                <MultiSelect
                  options={menuOptions}
                  selectedIds={selectedMenuIds}
                  onChange={(ids) => onMenuSelectionChange?.(ids)}
                  placeholder="Escolha os menus vinculados ao template"
                  emptyMessage="Nenhum menu cadastrado no banco local."
                  ariaLabelledBy={`${formId}-menus-label`}
                  ariaDescribedBy={`${formId}-menus-hint`}
                />
              </div>
            </div>
          )}
        </div>


        <fieldset className="form-group fieldset-group">
          <legend className="form-label">
            Exemplos de Resposta (Few-shot)
            <span className="form-label__hint"> — preencha os campos antes de salvar</span>
          </legend>
          <div className="dynamic-list">
            {template.prompt_definition.few_shot_examples.map((example, index) => {
              const inputEmpty = example.input.trim() === '';
              const outputEmpty = example.output.trim() === '';
              return (
                <div
                  key={`few-shot-${index}`}
                  className={`few-shot-item card ${inputEmpty || outputEmpty ? 'few-shot-item--invalid' : ''} ${draggedIndex === index ? 'few-shot-item--dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    position: 'relative',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: draggedIndex === index ? 'var(--color-surface-3)' : 'var(--color-surface-1)',
                    opacity: draggedIndex === index ? 0.6 : 1,
                    transition: 'opacity 0.2s, background-color 0.2s',
                  }}
                >
                  <div className="few-shot-item__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'grab' }} title="Arraste para reordenar">
                      <GripVertical size={16} color="var(--color-text-muted)" />
                      <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Exemplo {index + 1}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon btn--sm"
                      onClick={() => {
                        const next = template.prompt_definition.few_shot_examples.filter((_, i) => i !== index);
                        updatePromptDefinitionField('few_shot_examples', next);
                      }}
                      title="Remover exemplo"
                      aria-label={`Remover exemplo ${index + 1}`}
                      style={{ color: 'var(--color-error)', padding: '4px' }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                    <label className="form-label--sub" htmlFor={`${formId}-few-shot-input-${index}`}>
                      Input do usuário <span className="required-badge" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id={`${formId}-few-shot-input-${index}`}
                      ref={index === template.prompt_definition.few_shot_examples.length - 1 ? lastItemRef : null}
                      value={example.input}
                      onChange={(e) => {
                        const next = [...template.prompt_definition.few_shot_examples];
                        next[index] = { ...next[index], input: e.target.value };
                        updatePromptDefinitionField('few_shot_examples', next);
                      }}
                      rows={2}
                      placeholder="Ex: Como faço para..."
                      className="form-input"
                      aria-invalid={inputEmpty ? 'true' : 'false'}
                      aria-required="true"
                      aria-describedby={inputEmpty ? `${formId}-few-shot-input-error-${index}` : undefined}
                    />
                    {inputEmpty && (
                      <span id={`${formId}-few-shot-input-error-${index}`} className="form-field-error" role="alert">
                        Campo obrigatório — preencha o input do exemplo antes de salvar.
                      </span>
                    )}
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label--sub" htmlFor={`${formId}-few-shot-output-${index}`}>
                      Resposta esperada <span className="required-badge" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id={`${formId}-few-shot-output-${index}`}
                      value={example.output}
                      onChange={(e) => {
                        const next = [...template.prompt_definition.few_shot_examples];
                        next[index] = { ...next[index], output: e.target.value };
                        updatePromptDefinitionField('few_shot_examples', next);
                      }}
                      rows={2}
                      placeholder="Ex: Para fazer isso, você deve..."
                      className="form-input"
                      aria-invalid={outputEmpty ? 'true' : 'false'}
                      aria-required="true"
                      aria-describedby={outputEmpty ? `${formId}-few-shot-output-error-${index}` : undefined}
                    />
                    {outputEmpty && (
                      <span id={`${formId}-few-shot-output-error-${index}`} className="form-field-error" role="alert">
                        Campo obrigatório — preencha a resposta esperada antes de salvar.
                      </span>
                    )}
                  </div>
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
              aria-label="Adicionar novo exemplo de few-shot"
            >
              <Plus size={14} aria-hidden="true" /> Novo exemplo
            </button>
          </div>
        </fieldset>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section__title">
          Output Contract
        </legend>

        <div className="form-section--grouped">
          <h3 className="form-label--sub">Configurações de Saída</h3>
          
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-output-format`}>Format</label>
            <select
              id={`${formId}-output-format`}
              value={template.output_contract.format}
              onChange={(event) =>
                updateOutputContractField('format', event.target.value as PromptOutputContract['format'])
              }
              aria-describedby={fieldHints.outputFormat}
            >
              {PROMPT_OUTPUT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
            <span id={fieldHints.outputFormat} className="form-label__hint">
              Defina o formato final esperado para a resposta compilada.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-output-language`}>Response language</label>
            <input
              id={`${formId}-output-language`}
              value={template.output_contract.language}
              onChange={(event) => updateOutputContractField('language', event.target.value)}
              placeholder="pt-BR"
              aria-describedby={fieldHints.outputLanguage}
            />
            <span id={fieldHints.outputLanguage} className="form-label__hint">
              Idioma preferencial da resposta final gerada pelo template.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-strict-mode`}>
              <input
                id={`${formId}-strict-mode`}
                type="checkbox"
                checked={template.output_contract.strict_mode}
                onChange={(event) => updateOutputContractField('strict_mode', event.target.checked)}
              />
              {' '}Strict mode
            </label>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-required-fields`}>Required fields</label>
            <textarea
              id={`${formId}-required-fields`}
              value={template.output_contract.required_fields.join('\n')}
              onChange={(event) => updateOutputContractField('required_fields', event.target.value.split('\n').filter(Boolean))}
              rows={4}
              placeholder="Um campo obrigatório por linha"
              aria-describedby={fieldHints.requiredFields}
            />
            <span id={fieldHints.requiredFields} className="form-label__hint">
              Informe os campos que devem existir na resposta, um item por linha.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-response-rules`}>Response rules</label>
            <textarea
              id={`${formId}-response-rules`}
              value={template.output_contract.response_rules.join('\n')}
              onChange={(event) => updateOutputContractField('response_rules', event.target.value.split('\n').filter(Boolean))}
              rows={4}
              placeholder="Uma regra por linha"
              aria-describedby={fieldHints.responseRules}
            />
            <span id={fieldHints.responseRules} className="form-label__hint">
              Liste regras obrigatórias de formatação e comportamento, uma por linha.
            </span>
          </div>
        </div>
      </fieldset>
    </>
  );
}
