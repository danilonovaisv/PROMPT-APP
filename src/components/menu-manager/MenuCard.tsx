import { memo, useState, useCallback, useId } from 'react';
import type { ContextMenu } from '@/models/types';
import { normalizeContextMenuOptions } from '@/utils/contextMenuOptions';
import { Edit3, Trash2, ChevronDown } from 'lucide-react';

type MenuCardProps = {
  menu: ContextMenu;
  onEdit: () => void;
  onDelete: () => void;
};

// ⚡ Bolt Optimization: React.memo() prevents re-renders during parent state changes.
// Collapse state is self-contained; cards are independent.
export const MenuCard = memo(function MenuCard({ menu, onEdit, onDelete }: MenuCardProps) {
  const options = normalizeContextMenuOptions(menu.options);
  const [isExpanded, setIsExpanded] = useState(false);
  const bodyId = useId();

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    },
    [],
  );

  const totalSubOptions = options.reduce(
    (acc, opt) => acc + (opt.subOptions?.length ?? 0),
    0,
  );

  return (
    <div className="card ctx-menu-card">
      {/* ── Header: always visible ── */}
      <div className="ctx-menu-card__header">
        <button
          className="ctx-menu-card__toggle"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={bodyId}
          title={isExpanded ? 'Recolher menu' : 'Expandir menu'}
          type="button"
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`ctx-chevron${isExpanded ? ' ctx-chevron--open' : ''}`}
          />
          <div className="ctx-menu-card__title-group">
            <span className="ctx-menu-card__name">{menu.menuName}</span>
            <span className="ctx-menu-card__slug">
              {menu.menuId}
              <span className="ctx-menu-card__mode-badge">
                {menu.selectionMode === 'multiple' ? 'múltipla' : 'única'}
              </span>
            </span>
          </div>
        </button>

        <div className="ctx-menu-card__actions" role="group" aria-label="Ações do menu">
          {/* Stats badge – always visible */}
          <span className="ctx-menu-card__stats" aria-label={`${options.length} opções, ${totalSubOptions} sub-opções`}>
            <span className="ctx-stat">{options.length} opç.</span>
            {totalSubOptions > 0 && (
              <span className="ctx-stat ctx-stat--sub">{totalSubOptions} sub</span>
            )}
          </span>
          <button
            className="btn btn--ghost btn--icon"
            onClick={onEdit}
            aria-label={`Editar menu ${menu.menuName}`}
            title="Editar"
            type="button"
          >
            <Edit3 size={16} aria-hidden="true" />
          </button>
          <button
            className="btn btn--ghost btn--icon btn--danger-hover"
            onClick={onDelete}
            aria-label={`Excluir menu ${menu.menuName}`}
            title="Excluir"
            type="button"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Collapsible body ── */}
      <div
        id={bodyId}
        className={`ctx-menu-card__body${isExpanded ? ' ctx-menu-card__body--open' : ''}`}
        aria-hidden={!isExpanded}
      >
        {/* Inner wrapper: required for grid-template-rows collapse animation */}
        <div>
          {menu.description && (
            <p className="ctx-menu-card__description">{menu.description}</p>
          )}

          <div className="ctx-menu-card__tree" role="tree" aria-label={`Estrutura de ${menu.menuName}`}>
            {options.length === 0 ? (
              <p className="ctx-tree-empty">Nenhuma opção configurada.</p>
            ) : (
              options.map((opt, i) => (
                <div key={i} className="ctx-tree-node" role="treeitem">
                  <div className="ctx-tree-node__option">
                    <span className="ctx-tree-node__dot" aria-hidden="true" />
                    <span className="ctx-tree-node__label">{opt.label}</span>
                    {opt.subOptions.length > 0 && (
                      <span className="ctx-tree-node__sub-count" aria-label={`${opt.subOptions.length} sub-opções`}>
                        {opt.subOptions.length}
                      </span>
                    )}
                  </div>
                  {opt.subOptions.length > 0 && (
                    <div className="ctx-tree-node__children" role="group">
                      {opt.subOptions.map((sub, j) => (
                        <div key={j} className="ctx-tree-node__sub" role="treeitem">
                          <span className="ctx-tree-node__line" aria-hidden="true" />
                          <span className="ctx-tree-node__sub-label">{sub.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
