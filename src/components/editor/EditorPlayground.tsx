import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import type { TemplatePayload, UserSelection } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';

type FreeInputEntry = { key: string; value: string };

type EditorPlaygroundProps = {
  template: TemplatePayload;
  selection: UserSelection;
  freeInputs: FreeInputEntry[];
  renderedPrompt?: string;
  outputError?: string | null;
  contextMenus: ContextMenu[];
  selectedMenuIds?: number[];
  fixedMemory?: Record<string, string>;
  isMemoryLoading?: boolean;
  isSavingMemory?: boolean;
  onAddFreeInput: () => void;
  onRemoveFreeInput: (index: number) => void;
  onUpdateFreeInput: (index: number, entry: { key: string; value: string }) => void;
  onSaveMemory?: (key: string, value: string) => void;
  onDeleteMemory?: (key: string) => void;
  onAddMemoryKey?: (key: string) => void;
  onToggleOption: (menuId: string, selectionMode: string, optionValue: string) => void;
  onToggleSubOption: (menuId: string, optionValue: string, subOptionValue: string) => void;
};

export function EditorPlayground({
  template,
  selection,
  freeInputs,
  fixedMemory = {},
  isMemoryLoading = false,
  isSavingMemory = false,
  onSaveMemory,
  onDeleteMemory,
  onAddMemoryKey,
  renderedPrompt,
  outputError,
  contextMenus,
  selectedMenuIds,
  onAddFreeInput,
  onRemoveFreeInput,
  onUpdateFreeInput,
  onToggleOption,
  onToggleSubOption,
}: EditorPlaygroundProps) {
  const displayContextMenus =
    selectedMenuIds && selectedMenuIds.length > 0
      ? contextMenus.filter(
          (menu) => typeof menu.id === 'number' && selectedMenuIds.includes(menu.id),
        )
      : [];

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isAddingKey, setIsAddingKey] = useState(false);
  const memoryKeys = Object.keys(fixedMemory);
  const memoryHelpId = 'fixed-memory-help';
  const templateLabel = template.meta.template_name.trim() || 'este template';

  const handleConfirmAddKey = () => {
    const trimmedKey = newKeyName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (trimmedKey && onAddMemoryKey) {
      onAddMemoryKey(trimmedKey);
      onSaveMemory?.(trimmedKey, newKeyValue);
      setNewKeyName('');
      setNewKeyValue('');
      setIsAddingKey(false);
    }
  };

  return (
    <div className="form-section">
      <div className="page-header">
        <div>
          <h3 className="form-section__title">
            Inputs Livres
          </h3>
          <p className="page-header__subtitle">
            Variáveis específicas para este teste.
          </p>
        </div>
      </div>

      <div className="dynamic-list">
        {freeInputs.map((entry, index) => (
          <div key={`free-input-${index}`} className="card">
            <div className="form-group">
              <label className="form-label">Chave</label>
              <input
                value={entry.key}
                onChange={(event) => onUpdateFreeInput(index, { ...entry, key: event.target.value })}
                placeholder="user_scene_description"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor</label>
              <textarea
                value={entry.value}
                onChange={(event) => onUpdateFreeInput(index, { ...entry, value: event.target.value })}
                rows={3}
                placeholder="Descreva o input livre"
                className="form-input"
              />
            </div>

            <button
              className="btn btn--ghost btn--icon"
              type="button"
              onClick={() => onRemoveFreeInput(index)}
              aria-label="Remover input livre"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button className="btn btn--ghost btn--sm dynamic-list__add" type="button" onClick={onAddFreeInput}>
          <Plus size={14} /> Novo input livre
        </button>
      </div>

      <div className="form-section memory-section-container">
        <div className="flex-row-center memory-section-header">
          <h4 className="form-section__title memory-section-title">Memória Fixa</h4>
          {isSavingMemory && (
            <div className="memory-status memory-status--saving" role="status" aria-live="polite">
              <div className="loading-spinner loading-spinner--xs" />
              Salvando...
            </div>
          )}
          {!isSavingMemory && memoryKeys.length > 0 && (
            <div className="memory-status memory-status--saved" role="status" aria-live="polite">
              <Check size={12} /> Salvo
            </div>
          )}
        </div>
        
        <p id={memoryHelpId} className="form-label__hint memory-section-hint">
          Estes valores ficam vinculados ao template <strong>{templateLabel}</strong> e preenchem variáveis fixas sempre que este template for usado. Eles não são globais entre templates.
        </p>
        
        {isMemoryLoading ? (
          <div className="skeleton-block memory-skeleton" />
        ) : (
          <>
            {memoryKeys.length === 0 && !isAddingKey && (
              <div className="empty-state-hint memory-empty-state">
                <p className="memory-empty-text">
                  Nenhuma chave fixa definida para este template. Adicione apenas os campos que precisam ser preenchidos sempre neste contexto.
                </p>
              </div>
            )}
            <div className="memory-grid">
              {memoryKeys.map((key) => {
                const value = fixedMemory[key] || '';
                const fieldId = `fixed-memory-${key.toLowerCase()}`;
                return (
                  <div key={key} className="card memory-card">
                    <div className="flex-row-center memory-card-header">
                      <label htmlFor={fieldId} className="form-label memory-card-label">
                        {key}
                      </label>
                      <button 
                        className="btn btn--ghost btn--icon btn--xs" 
                        type="button"
                        onClick={() => onDeleteMemory?.(key)}
                        aria-label={`Remover chave fixa ${key}`}
                        title="Remover chave fixa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="form-group">
                      <textarea
                        id={fieldId}
                        value={value}
                        onChange={(e) => onSaveMemory?.(key, e.target.value)}
                        rows={2}
                        placeholder={`Valor para ${key}...`}
                        className="form-input memory-input-sm"
                        aria-describedby={memoryHelpId}
                      />
                    </div>
                  </div>
                );
              })}

              {isAddingKey || memoryKeys.length === 0 ? (
                <div className="card memory-card memory-card--add animate-fade-in">
                  <div className="form-group memory-add-group">
                    <label className="form-label memory-add-label">
                      Nova Chave Fixa do Template
                    </label>
                    <div className="memory-card__actions">
                      <input
                        autoFocus
                        className="form-input memory-input-upper"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddKey()}
                        onBlur={(e) => !e.target.value && setIsAddingKey(false)}
                        aria-label="Nome da nova chave fixa"
                        placeholder="EX: BRAND_VOICE"
                      />
                      <textarea
                        className="form-input"
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        rows={2}
                        aria-label="Valor da nova chave fixa"
                        placeholder="Valor inicial da chave..."
                      />
                      <div className="flex-row-center">
                        <button className="btn btn--primary btn--sm" type="button" onClick={handleConfirmAddKey} aria-label="Confirmar nova chave fixa">
                          <Check size={14} />
                        </button>
                        <button className="btn btn--ghost btn--sm" type="button" onClick={() => { setIsAddingKey(false); setNewKeyName(''); setNewKeyValue(''); }} aria-label="Cancelar criação da chave fixa">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn--ghost btn--sm memory-grid__add" 
                  type="button"
                  aria-describedby={memoryHelpId}
                  onClick={() => setIsAddingKey(true)}
                >
                  <Plus size={14} /> Adicionar Chave Fixa
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {displayContextMenus.length === 0 ? (
        <p className="ctx-empty-hint">Vincule menus na seção acima para testar a compilação.</p>
      ) : (
        <div className="ctx-editor-grid">
          {displayContextMenus.map((menu) => (
            <div key={menu.menuId} className="ctx-editor-menu">
              <div className="ctx-editor-menu__header">
                <span className="ctx-editor-menu__name">{menu.menuName || menu.menuId}</span>
                <span className="ctx-editor-menu__selection">
                  {menu.selectionMode === 'multiple' ? 'Múltipla' : 'Única'}
                </span>
              </div>
              {menu.description && <p className="form-label__hint">{menu.description}</p>}
              <div className="menu-selector">
                {(menu.options || []).map((option) => {
                  const menuSelection = selection.selected_menus.find((item) => item.menu_id === menu.menuId);
                  const optionSelection = menuSelection?.selected_options.find(
                    (item) => item.option_value === option.value
                  );

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`menu-tag ${optionSelection ? 'menu-tag--selected' : ''}`}
                      aria-pressed={!!optionSelection}
                      onClick={() => onToggleOption(menu.menuId, menu.selectionMode, option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {(selection.selected_menus.find((item) => item.menu_id === menu.menuId)?.selected_options || []).map(
                (selectedOption) => {
                  const optionDefinition = (menu.options || []).find(
                    (option) => option.value === selectedOption.option_value
                  );
                  if (!optionDefinition || !optionDefinition.subOptions || optionDefinition.subOptions.length === 0) {
                    return null;
                  }

                  return (
                    <div key={`${menu.menuId}-${selectedOption.option_value}`} className="ctx-editor-suboptions">
                      <span className="ctx-editor-suboptions__label">
                        Sub-opções de "{optionDefinition.label}"
                      </span>
                      <div className="menu-selector menu-selector--sub">
                        {optionDefinition.subOptions.map((subOption) => {
                          const isSelected = selectedOption.selected_sub_options.includes(subOption.value);
                          return (
                            <button
                              key={subOption.value}
                              type="button"
                              className={`menu-tag menu-tag--sub ${isSelected ? 'menu-tag--selected' : ''}`}
                              aria-pressed={isSelected}
                              onClick={() => onToggleSubOption(menu.menuId, optionDefinition.value, subOption.value)}
                            >
                              {subOption.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ))}
        </div>
      )}

      <div className="form-section">
        <h4 className="form-section__title">Prompt compilado</h4>
        {outputError ? (
          <div className="form-error" role="alert">{outputError}</div>
        ) : (
          <pre className="json-preview json-preview--prompt">
            {renderedPrompt || '— preencha os campos acima para compilar o prompt —'}
          </pre>
        )}
      </div>
    </div>
  );
}
