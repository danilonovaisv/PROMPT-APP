import type { ContextMenu, ContextMenuOption, ContextMenuSubOption } from '@/models/types';
import { X, Check, Plus, Layers } from 'lucide-react';
import { MenuOptionEditor } from './MenuOptionEditor';

type MenuFormProps = {
  form: {
    menuId: string;
    menuName: string;
    description: string;
    selectionMode: ContextMenu['selectionMode'];
    options: ContextMenuOption[];
  };
  isEditing: number | null;
  expandedOption: number | null;
  toSlug: (text: string) => string;
  onCancel: () => void;
  onSave: () => void;
  onFieldChange: <K extends keyof MenuFormProps['form']>(field: K, value: MenuFormProps['form'][K]) => void;
  onOptionUpdate: (index: number, field: keyof ContextMenuOption, value: string) => void;
  onOptionRemove: (index: number) => void;
  onSubOptionUpdate: (optIndex: number, subIndex: number, field: keyof ContextMenuSubOption, value: string) => void;
  onSubOptionRemove: (optIndex: number, subIndex: number) => void;
  onAddOption: () => void;
  onAddSubOption: (optIndex: number) => void;
  onToggleExpand: (index: number) => void;
};

export function MenuForm({
  form,
  isEditing,
  expandedOption,
  toSlug,
  onCancel,
  onSave,
  onFieldChange,
  onOptionUpdate,
  onOptionRemove,
  onSubOptionUpdate,
  onSubOptionRemove,
  onAddOption,
  onAddSubOption,
  onToggleExpand,
}: MenuFormProps) {
  return (
    <div className="card card--active">
      <h3 className="card__title">
        {isEditing ? 'Editar Menu' : 'Novo Menu do Template'}
      </h3>

      <div className="form-group">
        <label className="form-label" htmlFor="menu-name">Nome do Menu</label>
        <input
          id="menu-name"
          value={form.menuName}
          onChange={(e) => {
            onFieldChange('menuName', e.target.value);
            onFieldChange('menuId', form.menuId || toSlug(e.target.value));
          }}
          placeholder="Ex: Estilo de Escrita, Framework, Nível Técnico..."
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="menu-slug">
          Identificador
          <span className="form-label__hint">(slug único)</span>
        </label>
        <input
          id="menu-slug"
          value={form.menuId}
          onChange={(e) => onFieldChange('menuId', toSlug(e.target.value))}
          placeholder="auto-gerado a partir do nome"
          disabled={!!isEditing}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="menu-description">Descrição</label>
        <textarea
          id="menu-description"
          value={form.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Descreva o propósito deste menu dinâmico..."
          rows={2}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="menu-selection-mode">
          Modo de seleção
        </label>
        <select
          id="menu-selection-mode"
          value={form.selectionMode}
          onChange={(e) => onFieldChange('selectionMode', e.target.value as ContextMenu['selectionMode'])}
        >
          <option value="single">Seleção única</option>
          <option value="multiple">Seleção múltipla</option>
        </select>
      </div>

      <fieldset className="form-group">
        <legend className="form-label">
          <Layers size={14} aria-hidden="true" /> Opções
        </legend>

        <div className="ctx-options-list">
          {form.options.map((opt, optIdx) => (
            <MenuOptionEditor
              key={optIdx}
              option={opt}
              index={optIdx}
              isExpanded={expandedOption === optIdx}
              onToggleExpand={() => onToggleExpand(optIdx)}
              onUpdate={(field, value) => onOptionUpdate(optIdx, field, value)}
              onRemove={() => onOptionRemove(optIdx)}
              onAddSubOption={() => onAddSubOption(optIdx)}
              onUpdateSubOption={(subIdx, field, value) => onSubOptionUpdate(optIdx, subIdx, field, value)}
              onRemoveSubOption={(subIdx) => onSubOptionRemove(optIdx, subIdx)}
            />
          ))}
        </div>

        <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={onAddOption} type="button">
          <Plus size={14} aria-hidden="true" /> Adicionar opção
        </button>
      </fieldset>

      <div className="flex-row-end">
        <button className="btn btn--secondary" onClick={onCancel} type="button">
          <X size={16} aria-hidden="true" /> Cancelar
        </button>
        <button className="btn btn--primary" onClick={onSave} type="button">
          <Check size={16} aria-hidden="true" /> Salvar
        </button>
      </div>
    </div>
  );
}
