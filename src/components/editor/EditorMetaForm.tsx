import type { TemplatePayload } from '@/models/promptSchema';
import type { Category } from '@/models/types';

type EditorMetaFormProps = {
  template: TemplatePayload;
  categoryId: number;
  categories: Category[];
  updateMetaField: <K extends keyof TemplatePayload['meta']>(field: K, value: TemplatePayload['meta'][K]) => void;
  onCategoryChange: (categoryId: number) => void;
};

// A11y Audit Fix #6 — aria-required, aria-describedby, aria-invalid para campos críticos
export function EditorMetaForm({ template, categoryId, categories, updateMetaField, onCategoryChange }: EditorMetaFormProps) {
  const nameEmpty = !template.meta.template_name.trim();
  const categoryMissing = !categoryId;

  return (
    <div className="form-section">
      <h3 className="form-section__title">
        Metadados do Template
      </h3>

      {/* Campo obrigatório: Nome */}
      <div className="form-group">
        <label className="form-label" htmlFor="template-name">
          Nome do template
          <span className="form-label__required" aria-hidden="true"> *</span>
        </label>
        <input
          id="template-name"
          value={template.meta.template_name}
          onChange={(event) => updateMetaField('template_name', event.target.value)}
          placeholder="Ex: Gerador de Cenas Publicitárias"
          aria-required="true"
          aria-invalid={nameEmpty}
          aria-describedby={nameEmpty ? 'template-name-error' : 'template-name-hint'}
        />
        {nameEmpty ? (
          <span id="template-name-error" className="form-error-inline" role="alert">
            O nome do template é obrigatório.
          </span>
        ) : (
          <span id="template-name-hint" className="form-label__hint">
            Nome exibido nas listagens e no breadcrumb.
          </span>
        )}
      </div>

      {/* Campo: ID */}
      <div className="form-group">
        <label className="form-label" htmlFor="template-id">
          ID do template
        </label>
        <input
          id="template-id"
          value={template.meta.template_id}
          onChange={(event) => updateMetaField('template_id', event.target.value)}
          placeholder="scene_generator_v1"
          aria-describedby="template-id-hint"
        />
        <span id="template-id-hint" className="form-label__hint">
          Identificador único. Gerado automaticamente se vazio.
        </span>
      </div>

      {/* Campo: Tipo */}
      <div className="form-group">
        <label className="form-label" htmlFor="template-type">Tipo</label>
        <input
          id="template-type"
          value={template.meta.template_type}
          onChange={(event) => updateMetaField('template_type', event.target.value)}
          placeholder="scene_generation"
        />
      </div>

      {/* Campo obrigatório: Categoria */}
      <div className="form-group">
        <label className="form-label" htmlFor="template-category">
          Categoria
          <span className="form-label__required" aria-hidden="true"> *</span>
        </label>
        <select
          id="template-category"
          value={categoryId}
          onChange={(event) => onCategoryChange(Number(event.target.value))}
          aria-required="true"
          aria-invalid={categoryMissing}
          aria-describedby={categoryMissing ? 'template-category-error' : undefined}
        >
          <option value={0}>Selecione uma categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        {categoryMissing && (
          <span id="template-category-error" className="form-error-inline" role="alert">
            Selecione uma categoria para o template.
          </span>
        )}
      </div>

      {/* Campo: Idioma */}
      <div className="form-group">
        <label className="form-label" htmlFor="template-language">Idioma</label>
        <input
          id="template-language"
          value={template.meta.language}
          onChange={(event) => updateMetaField('language', event.target.value)}
          placeholder="pt-BR"
          aria-describedby="template-language-hint"
        />
        <span id="template-language-hint" className="form-label__hint">
          Ex: pt-BR, en-US
        </span>
      </div>

      {/* Campo: Schema version */}
      <div className="form-group">
        <label className="form-label" htmlFor="template-schema-version">Schema version</label>
        <input
          id="template-schema-version"
          value={template.meta.schema_version}
          onChange={(event) => updateMetaField('schema_version', event.target.value)}
          placeholder="1.0.0"
        />
      </div>

      {/* Campo: Status */}
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
