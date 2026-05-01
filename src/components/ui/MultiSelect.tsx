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
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

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

  return (
    <div className="multi-select" ref={containerRef}>
      <button
        type="button"
        className={`multi-select__trigger ${isOpen ? 'multi-select__trigger--open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="multi-select__trigger-label">
          {selectedOptions.length > 0
            ? `${selectedOptions.length} menu(s) selecionado(s)`
            : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`multi-select__chevron ${isOpen ? 'multi-select__chevron--open' : ''}`}
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
                <X size={14} />
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
          >
            {options.length === 0 ? (
              <div className="multi-select__empty">{emptyMessage}</div>
            ) : (
              options.map((option) => {
                const isSelected = selectedIds.includes(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`multi-select__option ${isSelected ? 'multi-select__option--selected' : ''}`}
                    onClick={() => toggleOption(option.id)}
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
                  </button>
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
