import { useState, useRef, useEffect } from 'react';
import type { TemplatePayload } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';
import { Search, Plus, X, Globe, ChevronDown } from 'lucide-react';

type EditorContextMenuSelectorProps = {
  template: TemplatePayload;
  contextMenus: ContextMenu[];
  onMenuToggle: (menuId: string, checked: boolean) => void;
};

export function EditorContextMenuSelector({ template, contextMenus, onMenuToggle }: EditorContextMenuSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter available menus (not already selected) and matching search
  const linkedMenuIds = template.menu_ids || [];
  const linkedMenus = contextMenus.filter(m => linkedMenuIds.includes(m.menuId));
  const availableMenus = contextMenus.filter(m => 
    !linkedMenuIds.includes(m.menuId) && 
    (m.menuName.toLowerCase().includes(search.toLowerCase()) || 
     m.menuId.toLowerCase().includes(search.toLowerCase()))
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="form-section">
      <div className="page-header">
        <div>
          <h3 className="form-section__title">
            <Globe size={18} />
            Menus do Template
          </h3>
          <p className="page-header__subtitle">
            Selecione menus globais que estarão disponíveis para este template.
          </p>
        </div>
      </div>

      <div className="ctx-picker">
        <div className="ctx-picker__row">
          <div className="ctx-picker__wrapper" ref={dropdownRef}>
            <button 
              type="button"
              className={`btn btn--secondary ctx-picker__trigger ${isOpen ? 'btn--active' : ''}`}
              onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            >
              <Plus size={16} />
              <span>Adicionar Menu Global</span>
              <ChevronDown size={14} className={`ctx-chevron ${isOpen ? 'ctx-chevron--open' : ''}`} />
            </button>

            {isOpen && (
              <div className="ctx-picker__dropdown">
                <div className="ctx-picker__search">
                  <Search size={14} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar menus..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="ctx-picker__options-list">
                  {availableMenus.length === 0 ? (
                    <div className="ctx-picker__empty">
                      {search ? 'Nenhum menu corresponde à pesquisa' : 'Todos os menus já foram vinculados'}
                    </div>
                  ) : (
                    availableMenus.map((menu) => (
                      <button
                        key={menu.menuId}
                        type="button"
                        className="ctx-picker__option"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Evita que o input perca o foco ou o dropdown feche
                          onMenuToggle(menu.menuId, true);
                          setSearch('');
                        }}
                      >
                        <div className="ctx-picker__option-info">
                          <span className="ctx-picker__option-name">{menu.menuName || menu.menuId}</span>
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
            {linkedMenus.length} vinculado(s)
          </div>
        </div>

        <div className="ctx-list mt-4">
          {linkedMenus.length === 0 ? (
            <div className="ctx-empty-hint">
              <span className="opacity-50 italic">Nenhum menu vinculado. Clique no botão acima para adicionar.</span>
            </div>
          ) : (
            <div className="ctx-tag-cloud">
              {linkedMenus.map((menu) => (
                <div key={menu.menuId} className="ctx-tag">
                  <span className="ctx-tag__name">{menu.menuName}</span>
                  <button
                    type="button"
                    className="ctx-tag__remove"
                    onClick={() => onMenuToggle(menu.menuId, false)}
                    title={`Remover ${menu.menuName}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
