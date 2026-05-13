/**
 * EditorContextMenuSelector.patch.tsx
 * Revisão do seletor de menus para comportamento consistente em touch.
 * Substitui onMouseDown por onClick com gerenciamento de estado explícito.
 */

// ===== SUBSTITUIR O DROPDOWN ATUAL =====
interface ContextMenuSelectorProps {
  availableMenus: ContextMenu[];
  selectedMenus: string[];
  onChange: (menuIds: string[]) => void;
  disabled?: boolean;
}

export function EditorContextMenuSelector({
  availableMenus,
  selectedMenus,
  onChange,
  disabled = false,
}: ContextMenuSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      // Foco no search ao abrir
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Filtra menus
  const filteredMenus = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableMenus;
    return availableMenus.filter(m =>
      m.name.toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query)
    );
  }, [availableMenus, searchQuery]);

  // Toggle seleção
  const toggleMenu = useCallback((menuId: string) => {
    const newSelection = selectedMenus.includes(menuId)
      ? selectedMenus.filter(id => id !== menuId)
      : [...selectedMenus, menuId];
    onChange(newSelection);
    // Não fecha automaticamente em multi-select — permite seleção contínua
    // Fecha apenas se for single-select ou após delay
  }, [selectedMenus, onChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(i => Math.min(i + 1, filteredMenus.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const menu = filteredMenus[highlightedIndex];
        if (menu) toggleMenu(menu.id);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, filteredMenus, highlightedIndex, toggleMenu]);

  // Scroll para item destacado
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(o => !o)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2.5
          border rounded-lg text-sm transition-colors
          min-h-[44px] /* Hit target para touch */
          ${disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Selecionar menus de contexto"
      >
        <span className="truncate">
          {selectedMenus.length === 0
            ? 'Selecionar menus...'
            : `${selectedMenus.length} menu${selectedMenus.length > 1 ? 's' : ''} selecionado${selectedMenus.length > 1 ? 's' : ''}`
          }
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          role="listbox"
          aria-multiselectable="true"
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Buscar menus..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                aria-label="Buscar menus"
              />
            </div>
          </div>

          {/* Lista */}
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            {filteredMenus.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-400 text-center">
                Nenhum menu encontrado
              </li>
            ) : (
              filteredMenus.map((menu, idx) => {
                const isSelected = selectedMenus.includes(menu.id);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={menu.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleMenu(menu.id)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm
                      transition-colors select-none
                      min-h-[44px] /* Hit target */
                      ${isHighlighted ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      ${isSelected ? 'text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    {/* Checkbox visual */}
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                      ${isSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 bg-white'
                      }
                    `}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>

                    {/* Info do menu */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{menu.name}</p>
                      {menu.description && (
                        <p className="text-xs text-gray-400 truncate">{menu.description}</p>
                      )}
                    </div>

                    {/* Indicador de seleção */}
                    {isSelected && (
                      <span className="text-xs text-blue-500 font-medium shrink-0">
                        Selecionado
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer com ações */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {selectedMenus.length} selecionado{selectedMenus.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
