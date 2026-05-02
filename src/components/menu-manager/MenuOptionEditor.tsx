import type { ContextMenuOption, ContextMenuSubOption } from '@/models/types';
import { ChevronDown, ChevronRight, Trash2, Plus, X } from 'lucide-react';

type MenuOptionEditorProps = {
  option: ContextMenuOption;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: keyof ContextMenuOption, value: string) => void;
  onRemove: () => void;
  onAddSubOption: () => void;
  onUpdateSubOption: (subIndex: number, field: keyof ContextMenuSubOption, value: string) => void;
  onRemoveSubOption: (subIndex: number) => void;
};

export function MenuOptionEditor({
  option,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAddSubOption,
  onUpdateSubOption,
  onRemoveSubOption,
}: MenuOptionEditorProps) {
  return (
    <div className="ctx-option-card">
      <div className="ctx-option-card__header">
        <button
          type="button"
          className="ctx-option-card__toggle-btn"
          onClick={onToggleExpand}
          aria-expanded={isExpanded ? 'true' : 'false'}
          aria-label={`Editar opção: ${option.label || `Opção ${index + 1}`}`}
        >
          {isExpanded ? (
            <ChevronDown size={16} aria-hidden="true" />
          ) : (
            <ChevronRight size={16} aria-hidden="true" />
          )}
          <span className="ctx-option-card__title">
            {option.label || `Opção ${index + 1}`}
          </span>
          {(option.subOptions || []).length > 0 && (
            <span className="ctx-option-card__badge">
              {(option.subOptions || []).length} sub
            </span>
          )}
        </button>
        <button
          className="btn btn--ghost btn--icon btn--sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remover opção"
          title="Remover opção"
          type="button"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>

      {isExpanded && (
        <div className="ctx-option-card__body">
          <div className="ctx-option-card__fields">
            <div className="form-group form-group--tight">
              <label className="form-label" htmlFor={`opt-${index}-label`}>Label</label>
              <input
                id={`opt-${index}-label`}
                value={option.label}
                onChange={(e) => onUpdate('label', e.target.value)}
                placeholder="Ex: Formal"
              />
            </div>
            <div className="form-group form-group--tight">
              <label className="form-label" htmlFor={`opt-${index}-value`}>Valor</label>
              <input
                id={`opt-${index}-value`}
                value={option.value}
                onChange={(e) => onUpdate('value', e.target.value)}
                placeholder="Auto-gerado"
              />
            </div>
          </div>

          <div className="ctx-suboptions">
            <div className="ctx-suboptions__header">
              <span className="form-label">Sub-opções</span>
              <button
                className="btn btn--ghost btn--sm"
                onClick={onAddSubOption}
                type="button"
                aria-label="Adicionar sub-opção"
              >
                <Plus size={12} aria-hidden="true" /> Adicionar
              </button>
            </div>

            {(option.subOptions || []).length === 0 && (
              <p className="ctx-suboptions__empty">
                Nenhuma sub-opção. Opcional.
              </p>
            )}

            {(option.subOptions || []).map((sub, subIdx) => (
              <div key={subIdx} className="ctx-suboption-row">
                <input
                  value={sub.label}
                  onChange={(e) => onUpdateSubOption(subIdx, 'label', e.target.value)}
                  placeholder="Label"
                  className="ctx-suboption-row__input"
                  aria-label={`Label da sub-opção ${subIdx + 1}`}
                />
                <input
                  value={sub.value}
                  onChange={(e) => onUpdateSubOption(subIdx, 'value', e.target.value)}
                  placeholder="Valor"
                  className="ctx-suboption-row__input"
                  aria-label={`Valor da sub-opção ${subIdx + 1}`}
                />
                <button
                  className="btn btn--ghost btn--icon btn--sm"
                  onClick={() => onRemoveSubOption(subIdx)}
                  aria-label="Remover sub-opção"
                  title="Remover"
                  type="button"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
