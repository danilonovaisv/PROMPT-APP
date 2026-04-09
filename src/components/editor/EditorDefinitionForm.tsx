import type { TemplatePayload, PromptOutputContract } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';
import MultiSelect from '@/components/ui/MultiSelect';
import { Plus, Trash2 } from 'lucide-react';

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

  return (
    <>
      <div className="form-section">
        <h3 className="form-section__title">
          Definição do Prompt
        </h3>

        <div className="form-group">
          <label className="form-label" htmlFor="system-role">System role</label>
          <textarea
            id="system-role"
            value={template.prompt_definition.system_role}
            onChange={(event) => updatePromptDefinitionField('system_role', event.target.value)}
            rows={4}
            placeholder="Defina o papel do modelo"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task">Task</label>
          <textarea
            id="task"
            value={template.prompt_definition.task}
            onChange={(event) => updatePromptDefinitionField('task', event.target.value)}
            rows={4}
            placeholder="Descreva a tarefa principal"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="context">Context</label>
          <textarea
            id="context"
            value={template.prompt_definition.context}
            onChange={(event) => updatePromptDefinitionField('context', event.target.value)}
            rows={4}
            placeholder="Explique o contexto do template"
          />
        </div>


        <div className="form-group">
          <label className="form-label" htmlFor="constraints">Constraints</label>
          <textarea
            id="constraints"
            value={template.prompt_definition.constraints.join('\n')}
            onChange={(event) => updatePromptDefinitionField('constraints', event.target.value.split('\n').filter(Boolean))}
            rows={4}
            placeholder="Uma restrição por linha"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="negative-prompt">Negative prompt</label>
          <textarea
            id="negative-prompt"
            value={template.prompt_definition.negative_prompt.join('\n')}
            onChange={(event) => updatePromptDefinitionField('negative_prompt', event.target.value.split('\n').filter(Boolean))}
            rows={4}
            placeholder="Uma proibição por linha"
          />
        </div>

        {/* Menu Selection Multi-Select */}
        {availableContextMenus.length > 0 && (
          <div className="form-group">
            <label className="form-label">
              Menus do Template
            </label>
            <p className="form-label__hint">
              Selecione os menus que estarão disponíveis neste template
            </p>
            <div id="template-linked-menus">
              <MultiSelect
                options={menuOptions}
                selectedIds={selectedMenuIds}
                onChange={(ids) => onMenuSelectionChange?.(ids)}
                placeholder="Escolha os menus vinculados ao template"
                emptyMessage="Nenhum menu cadastrado no banco local."
              />
            </div>
          </div>
        )}

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
                        const next = [...template.prompt_definition.few_shot_examples];
                        next[index] = { ...next[index], input: e.target.value };
                        updatePromptDefinitionField('few_shot_examples', next);
                      }}
                      rows={2}
                      placeholder="Ex: Como faço para..."
                      aria-invalid={inputEmpty ? 'true' : 'false'}
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
                        const next = [...template.prompt_definition.few_shot_examples];
                        next[index] = { ...next[index], output: e.target.value };
                        updatePromptDefinitionField('few_shot_examples', next);
                      }}
                      rows={2}
                      placeholder="Ex: Para fazer isso, você deve..."
                      aria-invalid={outputEmpty ? 'true' : 'false'}
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
                      const next = template.prompt_definition.few_shot_examples.filter((_, i) => i !== index);
                      updatePromptDefinitionField('few_shot_examples', next);
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
      </div>

      <div className="form-section">
        <h3 className="form-section__title">
          Output Contract
        </h3>

        <div className="form-group">
          <label className="form-label" htmlFor="output-format">Format</label>
          <select
            id="output-format"
            value={template.output_contract.format}
            onChange={(event) =>
              updateOutputContractField('format', event.target.value as PromptOutputContract['format'])
            }
          >
            {PROMPT_OUTPUT_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="output-language">Response language</label>
          <input
            id="output-language"
            value={template.output_contract.language}
            onChange={(event) => updateOutputContractField('language', event.target.value)}
            placeholder="pt-BR"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={template.output_contract.strict_mode}
              onChange={(event) => updateOutputContractField('strict_mode', event.target.checked)}
            />
            {' '}Strict mode
          </label>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="required-fields">Required fields</label>
          <textarea
            id="required-fields"
            value={template.output_contract.required_fields.join('\n')}
            onChange={(event) => updateOutputContractField('required_fields', event.target.value.split('\n').filter(Boolean))}
            rows={4}
            placeholder="Um campo obrigatório por linha"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="response-rules">Response rules</label>
          <textarea
            id="response-rules"
            value={template.output_contract.response_rules.join('\n')}
            onChange={(event) => updateOutputContractField('response_rules', event.target.value.split('\n').filter(Boolean))}
            rows={4}
            placeholder="Uma regra por linha"
          />
        </div>
      </div>
    </>
  );
}
