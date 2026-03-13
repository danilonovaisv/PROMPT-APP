import type { TemplatePayload } from '@/models/promptSchema';
import type { Category } from '@/models/types';

type EditorMetaFormProps = {
  template: TemplatePayload;
  categoryId: number;
  categories: Category[];
  updateMetaField: <K extends keyof TemplatePayload['meta']>(field: K, value: TemplatePayload['meta'][K]) => void;
  onCategoryChange: (categoryId: number) => void;
};

export function EditorMetaForm({ template, categoryId, categories, updateMetaField, onCategoryChange }: EditorMetaFormProps) {
  return (
    <div className="form-section">
      <h3 className="form-section__title">
        Metadados do Template
      </h3>

      <div className="form-group">
        <label className="form-label" htmlFor="template-name">Nome do template</label>
        <input
          id="template-name"
          value={template.meta.template_name}
          onChange={(event) => updateMetaField('template_name', event.target.value)}
          placeholder="Ex: Gerador de Cenas Publicitárias"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="template-id">ID do template</label>
        <input
          id="template-id"
          value={template.meta.template_id}
          onChange={(event) => updateMetaField('template_id', event.target.value)}
          placeholder="scene_generator_v1"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="template-type">Tipo</label>
        <input
          id="template-type"
          value={template.meta.template_type}
          onChange={(event) => updateMetaField('template_type', event.target.value)}
          placeholder="scene_generation"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="template-category">Categoria</label>
        <select
          id="template-category"
          value={categoryId}
          onChange={(event) => onCategoryChange(Number(event.target.value))}
        >
          <option value={0}>Selecione uma categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="template-language">Idioma</label>
        <input
          id="template-language"
          value={template.meta.language}
          onChange={(event) => updateMetaField('language', event.target.value)}
          placeholder="pt-BR"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="template-schema-version">Schema version</label>
        <input
          id="template-schema-version"
          value={template.meta.schema_version}
          onChange={(event) => updateMetaField('schema_version', event.target.value)}
          placeholder="1.0.0"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="template-status">Status</label>
        <select
          id="template-status"
          value={template.meta.status}
          onChange={(event) => updateMetaField('status', event.target.value as TemplatePayload['meta']['status'])}
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
      </div>
    </div>
  );
}
