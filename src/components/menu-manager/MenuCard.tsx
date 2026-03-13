import type { ContextMenu } from '@/models/types';
import { Edit3, Trash2 } from 'lucide-react';

type MenuCardProps = {
  menu: ContextMenu;
  onEdit: () => void;
  onDelete: () => void;
};

export function MenuCard({ menu, onEdit, onDelete }: MenuCardProps) {
  return (
    <div className="card ctx-menu-card">
      <div className="ctx-menu-card__header">
        <div>
          <div className="ctx-menu-card__name">{menu.menuName}</div>
          <div className="ctx-menu-card__slug">
            {menu.menuId} • {menu.selectionMode === 'multiple' ? 'múltipla' : 'única'}
          </div>
        </div>
        <div className="flex-row-center">
          <button
            className="btn btn--ghost btn--icon"
            onClick={onEdit}
            aria-label="Editar menu"
            title="Editar"
          >
            <Edit3 size={16} />
          </button>
          <button
            className="btn btn--ghost btn--icon"
            onClick={onDelete}
            aria-label="Excluir menu"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {menu.description && (
        <p className="ctx-menu-card__description">{menu.description}</p>
      )}

      <div className="ctx-menu-card__tree">
        {(menu.options || []).map((opt, i) => (
          <div key={i} className="ctx-tree-node">
            <div className="ctx-tree-node__option">
              <span className="ctx-tree-node__dot" />
              {opt.label}
            </div>
            {(opt.subOptions || []).length > 0 && (
              <div className="ctx-tree-node__children">
                {(opt.subOptions || []).map((sub, j) => (
                  <div key={j} className="ctx-tree-node__sub">
                    <span className="ctx-tree-node__line" />
                    {sub.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
