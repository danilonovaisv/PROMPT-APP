import type { TemplatePayload, PromptOutputContract } from '@/models/promptSchema';

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
};

const PROMPT_OUTPUT_FORMATS = ['markdown', 'json', 'xml', 'yaml', 'html', 'text'] as const;

export function EditorDefinitionForm({ template, updatePromptDefinitionField, updateOutputContractField }: EditorDefinitionFormProps) {
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
