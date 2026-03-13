import type { TemplatePayload } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';

type EditorContextMenuSelectorProps = {
  template: TemplatePayload;
  contextMenus: ContextMenu[];
  onMenuToggle: (menuId: string, checked: boolean) => void;
};

export function EditorContextMenuSelector({ template, contextMenus, onMenuToggle }: EditorContextMenuSelectorProps) {
  return (
    <div className="form-section">
      <div className="page-header">
        <div>
          <h3 className="form-section__title">
            Menus Vinculados
          </h3>
          <p className="page-header__subtitle">
            Vincule menus globais e gere um snapshot confiável para este template.
          </p>
        </div>
      </div>

      {contextMenus.length === 0 ? (
        <p className="ctx-empty-hint">Nenhum menu global encontrado. Crie um em "Menus do Template".</p>
      ) : (
        <div className="menu-selector-grid">
          {contextMenus.map((menu) => {
            const isSelected = template.menu_ids?.includes(menu.menuId);
            return (
              <label
                key={menu.menuId}
                className={`card menu-selector-card ${isSelected ? 'card--active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onMenuToggle(menu.menuId, e.target.checked)}
                />
                <div className="menu-selector-card__info">
                  <h4 className="menu-selector-card__title">{menu.menuName}</h4>
                  <span className="menu-selector-card__id">
                    {menu.menuId}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
