import type { TemplatePayload, PromptOutputContract } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';
import { useState } from 'react';
import { ChevronDown, Plus, X, Search } from 'lucide-react';

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
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  const filteredAvailableMenus = availableContextMenus.filter(menu => 
    !selectedMenuIds.includes(menu.id!) &&
    (menu.menuName.toLowerCase().includes(menuSearch.toLowerCase()) || 
     menu.menuId.toLowerCase().includes(menuSearch.toLowerCase()))
  );

  const selectedMenus = availableContextMenus.filter(menu => 
    selectedMenuIds.includes(menu.id!)
  );

  const handleAddMenu = (menuId: number) => {
    if (onMenuSelectionChange) {
      onMenuSelectionChange([...selectedMenuIds, menuId]);
    }
    setMenuSearch('');
  };

  const handleRemoveMenu = (menuId: number) => {
    if (onMenuSelectionChange) {
      onMenuSelectionChange(selectedMenuIds.filter(id => id !== menuId));
    }
  };

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
            <p className="form-label__hint" style={{ marginBottom: '0.5rem' }}>
              Selecione os menus que estarão disponíveis neste template
            </p>
            
            <div className="ctx-picker" style={{ position: 'relative' }}>
              <div className="ctx-picker__row">
                <div className="ctx-picker__wrapper">
                  <button 
                    type="button"
                    className={`btn btn--secondary ctx-picker__trigger ${isMenuDropdownOpen ? 'btn--active' : ''}`}
                    onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                  >
                    <Plus size={16} />
                    <span>Adicionar Menu</span>
                    <ChevronDown size={14} className={`ctx-chevron ${isMenuDropdownOpen ? 'ctx-chevron--open' : ''}`} />
                  </button>

                  {isMenuDropdownOpen && (
                    <div className="ctx-picker__dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100 }}>
                      <div className="ctx-picker__search">
                        <Search size={14} />
                        <input 
                          type="text" 
                          placeholder="Pesquisar menus..." 
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      
                      <div className="ctx-picker__options-list">
                        {filteredAvailableMenus.length === 0 ? (
                          <div className="ctx-picker__empty">
                            {menuSearch ? 'Nenhum menu corresponde à pesquisa' : 'Todos os menus já foram selecionados'}
                          </div>
                        ) : (
                          filteredAvailableMenus.map((menu) => (
                            <button
                              key={menu.id}
                              type="button"
                              className="ctx-picker__option"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddMenu(menu.id!);
                                setIsMenuDropdownOpen(false);
                              }}
                            >
                              <div className="ctx-picker__option-info">
                                <span className="ctx-picker__option-name">{menu.menuName}</span>
                                <span className="ctx-picker__option-id">{menu.menuId}</span>
                              </div>
                              <Plus size={14} />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ctx-picker__summary">
                  {selectedMenus.length} selecionado(s)
                </div>
              </div>

              <div className="ctx-tag-cloud" style={{ marginTop: '0.75rem' }}>
                {selectedMenus.length === 0 ? (
                  <div className="ctx-empty-hint">
                    <span className="opacity-50 italic">Nenhum menu selecionado. Clique no botão acima para adicionar.</span>
                  </div>
                ) : (
                  selectedMenus.map((menu) => (
                    <div key={menu.id} className="ctx-tag">
                      <span className="ctx-tag__name">{menu.menuName}</span>
                      <button
                        type="button"
                        className="ctx-tag__remove"
                        onClick={() => handleRemoveMenu(menu.id!)}
                        title={`Remover ${menu.menuName}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
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
