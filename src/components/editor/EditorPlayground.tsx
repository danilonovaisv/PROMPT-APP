import type { TemplatePayload, UserSelection } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';

type EditorPlaygroundProps = {
  template: TemplatePayload;
  selection: UserSelection;
  contextMenus: ContextMenu[];
  onAddFreeInput: () => void;
  onRemoveFreeInput: (index: number) => void;
  onUpdateFreeInput: (index: number, entry: { key: string; value: string }) => void;
  onToggleOption: (menuId: string, selectionMode: string, optionValue: string) => void;
  onToggleSubOption: (menuId: string, optionValue: string, subOptionValue: string) => void;
};

export function EditorPlayground({
  template,
  selection,
  contextMenus,
  onAddFreeInput,
  onRemoveFreeInput,
  onUpdateFreeInput,
  onToggleOption,
  onToggleSubOption,
}: EditorPlaygroundProps) {
  const freeInputs = Object.entries(selection.free_inputs || {}).map(([key, value]) => ({ key, value }));

  return (
    <div className="form-section">
      <div className="page-header">
        <div>
          <h3 className="form-section__title">
            Playground de Uso
          </h3>
          <p className="page-header__subtitle">
            Essas seleções alimentam o prompt final copiável e o payload técnico.
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

      {(!template.menu_ids || template.menu_ids.length === 0) ? (
        <p className="ctx-empty-hint">Vincule menus na seção acima para testar a compilação.</p>
      ) : (
        <div className="ctx-editor-grid">
          {contextMenus
            .filter((menu) => template.menu_ids?.includes(menu.menuId))
            .map((menu) => (
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
    </div>
  );
}
