import { useEffect, useId, useMemo, useRef, useState, useCallback } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
type MultiSelectOption = {
  id: number;
  label: string;
  description?: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
};

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────
export default function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = 'Selecione uma ou mais opções',
  emptyMessage = 'Nenhuma opção encontrada.',
  ariaLabelledBy,
  ariaDescribedBy,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const triggerId = useId();
  const searchId = useId();

  // ── Derived state ──────────────────────────────
  const selectedOptions = useMemo(
    () => options.filter((opt) => selectedIds.includes(opt.id)),
    [options, selectedIds],
  );

  /** Opções filtradas pela busca textual (case-insensitive, label + description) */
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description ?? '').toLowerCase().includes(q),
    );
  }, [options, search]);

  // ── Open / Close ───────────────────────────────
  const open = useCallback(() => {
    setIsOpen(true);
    setSearch('');
    setActiveIndex(-1);
    // Focus search input on next tick (after mount)
    setTimeout(() => searchRef.current?.focus(), 0);
  }, []);

  const close = useCallback((returnFocus = true) => {
    setIsOpen(false);
    setSearch('');
    setActiveIndex(-1);
    if (returnFocus) {
      // Return focus to the trigger so keyboard users don't lose context
      triggerRef.current?.focus();
    }
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  // ── Click outside ──────────────────────────────
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        close(false); // click outside → don't steal focus from wherever user clicked
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [close]);

  // ── Option toggle ──────────────────────────────
  const toggleOption = useCallback(
    (id: number) => {
      onChange(
        selectedIds.includes(id)
          ? selectedIds.filter((item) => item !== id)
          : [...selectedIds, id],
      );
    },
    [onChange, selectedIds],
  );

  // ── Keyboard navigation (trigger) ─────────────
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  // ── Keyboard navigation (dropdown) ────────────
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          toggleOption(filteredOptions[activeIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  const activeDescendantId =
    activeIndex >= 0 && filteredOptions[activeIndex]
      ? `${listboxId}-option-${filteredOptions[activeIndex].id}`
      : undefined;

  // ── Render ──────────────────────────────────────
  return (
    <div className="multi-select" ref={containerRef}>
      {/* Trigger */}
      <button
        id={triggerId}
        ref={triggerRef}
        role="combobox"
        type="button"
        className={`multi-select__trigger${isOpen ? ' multi-select__trigger--open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${triggerId}` : undefined}
        aria-describedby={ariaDescribedBy}
        aria-activedescendant={activeDescendantId}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="multi-select__trigger-label">
          {selectedOptions.length > 0
            ? `${selectedOptions.length} menu(s) selecionado(s)`
            : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`multi-select__chevron${isOpen ? ' multi-select__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Selected chips */}
      <div className="multi-select__chips" aria-live="polite" aria-label="Menus selecionados">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span key={opt.id} className="multi-select__chip">
              <span className="multi-select__chip-label">{opt.label}</span>
              {opt.description && (
                <span className="multi-select__chip-desc">{opt.description}</span>
              )}
              <button
                type="button"
                className="multi-select__chip-remove"
                onClick={() => toggleOption(opt.id)}
                aria-label={`Remover ${opt.label}`}
                title={`Remover ${opt.label}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))
        ) : (
          <span className="multi-select__hint">
            Nenhum menu selecionado. Escolha quais menus estarão disponíveis no template.
          </span>
        )}
      </div>

      {/* Dropdown popover */}
      {isOpen && (
        <div
          className="multi-select__dropdown"
          role="presentation"
          onKeyDown={handleDropdownKeyDown}
        >
          {/* Search input */}
          <div className="multi-select__search-wrapper" aria-hidden="false">
            <Search size={14} className="multi-select__search-icon" aria-hidden="true" />
            <input
              id={searchId}
              ref={searchRef}
              type="search"
              className="multi-select__search"
              placeholder="Buscar menus…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(-1);
              }}
              aria-label="Filtrar menus disponíveis"
              autoComplete="off"
            />
            {search && (
              <span className="multi-select__search-count" aria-live="polite" aria-atomic="true">
                {filteredOptions.length}/{options.length}
              </span>
            )}
          </div>

          {/* Options listbox */}
          <div
            id={listboxId}
            className="multi-select__options"
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={ariaLabelledBy ?? triggerId}
          >
            {filteredOptions.length === 0 ? (
              <div className="multi-select__empty" role="status">
                {search
                  ? `Nenhum menu corresponde a "${search}"`
                  : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = selectedIds.includes(opt.id);
                const isActive = idx === activeIndex;

                return (
                  <div
                    key={opt.id}
                    id={`${listboxId}-option-${opt.id}`}
                    role="option"
                    aria-selected={isSelected}
                    className={[
                      'multi-select__option',
                      isSelected ? 'multi-select__option--selected' : '',
                      isActive ? 'multi-select__option--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                    onClick={() => {
                      toggleOption(opt.id);
                      setActiveIndex(idx);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className="multi-select__option-copy">
                      <span className="multi-select__option-label">{opt.label}</span>
                      {opt.description && (
                        <span className="multi-select__option-description">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    <span
                      className={`multi-select__option-state${isSelected ? ' multi-select__option-state--selected' : ''}`}
                      aria-hidden="true"
                    >
                      {isSelected ? (
                        <Check size={14} aria-hidden="true" />
                      ) : null}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer hint */}
          {selectedOptions.length === options.length && options.length > 0 && (
            <div className="multi-select__footer">
              Todos os menus disponíveis já foram vinculados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
