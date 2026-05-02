import type { TemplatePayload, PromptOutputContract } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';
import MultiSelect from '@/components/ui/MultiSelect';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useId } from 'react';

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

        <div className="form-group">
          <label className="form-label" htmlFor={`${formId}-system-role`}>System role</label>
          <textarea
            id={`${formId}-system-role`}
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
          <label className="form-label" htmlFor={`${formId}-task`}>Task</label>
          <textarea
            id={`${formId}-task`}
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


        <div className="form-group">
          <label className="form-label" htmlFor={`${formId}-constraints`}>Constraints</label>
          <textarea
            id={`${formId}-constraints`}
            value={template.prompt_definition.constraints.join('\n')}
            onChange={(event) => updatePromptDefinitionField('constraints', event.target.value.split('\n').filter(Boolean))}
            rows={4}
            placeholder="Uma restrição por linha"
            aria-describedby={fieldHints.constraints}
          />
          <span id={fieldHints.constraints} className="form-label__hint">
            Liste limites, critérios e guardrails, uma instrução por linha.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor={`${formId}-negative-prompt`}>Negative prompt</label>
          <textarea
            id={`${formId}-negative-prompt`}
            value={template.prompt_definition.negative_prompt.join('\n')}
            onChange={(event) => updatePromptDefinitionField('negative_prompt', event.target.value.split('\n').filter(Boolean))}
            rows={4}
            placeholder="Uma proibição por linha"
            aria-describedby={fieldHints.negativePrompt}
          />
          <span id={fieldHints.negativePrompt} className="form-label__hint">
            Informe o que a resposta deve evitar, uma proibição por linha.
          </span>
        </div>

        {/* Menu Selection Multi-Select */}
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
                <div key={`few-shot-${index}`} className={`few-shot-item card${inputEmpty || outputEmpty ? ' few-shot-item--invalid' : ''}`}>
                  <div className="form-group">
                    <label className="form-label" htmlFor={`${formId}-few-shot-input-${index}`}>
                      Input do usuário <span className="form-label__required" aria-hidden="true">*</span>
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
                  <div className="form-group">
                    <label className="form-label" htmlFor={`${formId}-few-shot-output-${index}`}>
                      Resposta esperada <span className="form-label__required" aria-hidden="true">*</span>
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
                  <button
                    className="btn btn--ghost btn--icon few-shot-delete"
                    onClick={() => {
                      const next = template.prompt_definition.few_shot_examples.filter((_, i) => i !== index);
                      updatePromptDefinitionField('few_shot_examples', next);
                    }}
                    title="Remover exemplo"
                    aria-label={`Remover exemplo ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
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
      </fieldset>
    </>
  );
}
