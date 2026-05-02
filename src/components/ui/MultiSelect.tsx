import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const triggerId = useId();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedIds.includes(option.id)),
    [options, selectedIds],
  );

  const availableOptions = useMemo(
    () => options.filter((option) => !selectedIds.includes(option.id)),
    [options, selectedIds],
  );

  const toggleOption = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }

    onChange([...selectedIds, id]);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          toggleOption(options[activeIndex].id);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // removed useEffect to prevent React state update during render loop warning if it was an issue, 
  // but wait it was an effect, however it's better to update together with setIsOpen.

  return (
    <div className="multi-select" ref={containerRef}>
      <button
        id={triggerId}
        role="combobox"
        type="button"
        className={`multi-select__trigger ${isOpen ? 'multi-select__trigger--open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={listboxId}
        aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${triggerId}` : undefined}
        aria-describedby={ariaDescribedBy}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${options[activeIndex].id}` : undefined}
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="multi-select__trigger-label">
          {selectedOptions.length > 0
            ? `${selectedOptions.length} menu(s) selecionado(s)`
            : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`multi-select__chevron ${isOpen ? 'multi-select__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div className="multi-select__chips" aria-live="polite">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <span key={option.id} className="multi-select__chip">
              <span className="multi-select__chip-label">{option.label}</span>
              <button
                type="button"
                className="multi-select__chip-remove"
                onClick={() => toggleOption(option.id)}
                aria-label={`Remover ${option.label}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))
        ) : (
          <span className="multi-select__hint">
            Nenhum menu selecionado. Escolha quais menus estarão disponíveis no template.
          </span>
        )}
      </div>

      {isOpen && (
        <div className="multi-select__dropdown">
          <div
            id={listboxId}
            className="multi-select__options"
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={ariaLabelledBy || triggerId}
          >
            {options.length === 0 ? (
              <div className="multi-select__empty">{emptyMessage}</div>
            ) : (
              options.map((option, index) => {
                const isSelected = selectedIds.includes(option.id);

                return (
                  <div
                    key={option.id}
                    id={`${listboxId}-option-${option.id}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`multi-select__option ${isSelected ? 'multi-select__option--selected' : ''} ${
                      index === activeIndex ? 'multi-select__option--active' : ''
                    }`}
                    onClick={() => {
                      toggleOption(option.id);
                      setActiveIndex(index);
                    }}
                  >
                    <div className="multi-select__option-copy">
                      <span className="multi-select__option-label">{option.label}</span>
                      {option.description ? (
                        <span className="multi-select__option-description">{option.description}</span>
                      ) : null}
                    </div>
                    <span className="multi-select__option-state">
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {availableOptions.length === 0 && options.length > 0 ? (
            <div className="multi-select__footer">Todos os menus disponíveis já foram vinculados.</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
