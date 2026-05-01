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
  const [isAddingKey, setIsAddingKey] = useState(false);

  const handleConfirmAddKey = () => {
    const trimmedKey = newKeyName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (trimmedKey && onAddMemoryKey) {
      onAddMemoryKey(trimmedKey);
      setNewKeyName('');
      setIsAddingKey(false);
    }
  };

  return (
    <div className="form-section">
      <div className="form-section">
        <div className="flex-row-center" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <h4 className="form-section__title" style={{ margin: 0 }}>Memória Fixa</h4>
          {isSavingMemory && (
            <div className="memory-status memory-status--saving">
              <div className="loading-spinner loading-spinner--xs" />
              Salvando...
            </div>
          )}
          {!isSavingMemory && Object.keys(fixedMemory).length > 0 && (
            <div className="memory-status memory-status--saved">
              <Check size={12} /> Salvo
            </div>
          )}
        </div>
        
        <p className="form-label__hint" style={{ marginBottom: 'var(--space-4)' }}>
          Estes valores são salvos na sua conta e preenchem automaticamente variáveis globais (ex: <code>JSON_WORKFLOW_ATUAL</code>, <code>FOCO_DA_MELHORIA</code>).
        </p>
        
        {isMemoryLoading ? (
          <div className="skeleton-block" style={{ height: '100px', marginBottom: '1rem', width: '100%' }} />
        ) : (
          <>
            {Object.keys(fixedMemory).length === 0 && !isAddingKey && (
              <div className="empty-state-hint" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                  Nenhuma chave de memória definida. Adicione chaves para persistir contextos globais.
                </p>
              </div>
            )}
            <div className="memory-grid">
              {Object.keys(fixedMemory).map((key) => {
                const value = fixedMemory[key] || '';
                return (
                  <div key={key} className="card memory-card">
                    <div className="flex-row-center" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-light)' }}>
                        {key}
                      </label>
                      <button 
                        className="btn btn--ghost btn--icon btn--xs" 
                        onClick={() => onDeleteMemory?.(key)}
                        title="Remover chave permanente"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="form-group">
                      <textarea
                        value={value}
                        onChange={(e) => onSaveMemory?.(key, e.target.value)}
                        rows={2}
                        placeholder={`Valor para ${key}...`}
                        className="form-input"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      />
                    </div>
                  </div>
                );
              })}

              {isAddingKey ? (
                <div className="card memory-card memory-card--add animate-fade-in">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Nova Chave Permanente
                    </label>
                    <div className="flex-row-center" style={{ gap: 'var(--space-2)' }}>
                      <input
                        autoFocus
                        className="form-input"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddKey()}
                        onBlur={(e) => !e.target.value && setIsAddingKey(false)}
                        placeholder="EX: BRAND_VOICE"
                        style={{ textTransform: 'uppercase' }}
                      />
                      <button className="btn btn--primary btn--sm" onClick={handleConfirmAddKey}>
                        <Check size={14} />
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setIsAddingKey(false)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn--ghost btn--sm memory-grid__add" 
                  onClick={() => setIsAddingKey(true)}
                >
                  <Plus size={14} /> Adicionar Chave Permanente
                </button>
              )}
            </div>
          </>
        )}
      </div>

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
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor</label>
              <textarea
                value={entry.value}
                onChange={(event) => onUpdateFreeInput(index, { ...entry, value: event.target.value })}
                rows={3}
                placeholder="Descreva o input livre"
              />
            </div>

            <button
              className="btn btn--ghost btn--icon"
              onClick={() => onRemoveFreeInput(index)}
              aria-label="Remover input livre"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={onAddFreeInput}>
          <Plus size={14} /> Novo input livre
        </button>
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
