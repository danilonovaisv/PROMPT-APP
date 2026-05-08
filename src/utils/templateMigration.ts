import {
  TemplatePayloadSchema,
  type TemplatePayload,
  type MenuDefinition,
} from '@/models/promptSchema';
import {
  type FewShotExample,
} from '@/models/types';
import {
  CURRENT_PROMPT_SCHEMA_VERSION,
  getPromptSchemaWarning,
  getVersionCompatibility,
} from '@/utils/schemaCompatibility';

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export interface TemplateMigrationResult {
  template: TemplatePayload;
  migrated: boolean;
  warnings: string[];
}

export function migrateTemplateToCurrentSchema(template: TemplatePayload): TemplateMigrationResult {
  const warnings: string[] = [];
  const compatibility = getVersionCompatibility(
    template.meta.schema_version,
    CURRENT_PROMPT_SCHEMA_VERSION
  );

  // Pre-sanitize to avoid .strict() validation errors from extra fields
  const sanitizedMeta = {
    template_id: template.meta.template_id,
    template_name: template.meta.template_name,
    template_type: template.meta.template_type,
    schema_version:
      compatibility === 'legacy'
        ? CURRENT_PROMPT_SCHEMA_VERSION
        : template.meta.schema_version,
    language: template.meta.language || 'pt-BR',
    status: template.meta.status || 'draft',
  };

  // Rebuild the entire object to strictly match TemplatePayloadSchema and avoid .strict() errors
  const nextTemplate = TemplatePayloadSchema.parse({
    meta: sanitizedMeta,
    prompt_definition: {
      system_role: template.prompt_definition?.system_role || '',
      task: template.prompt_definition?.task || '',
      context: template.prompt_definition?.context || '',
      user_scene_description: template.prompt_definition?.user_scene_description || '',
      constraints: template.prompt_definition?.constraints || [],
      negative_prompt: template.prompt_definition?.negative_prompt || [],
      few_shot_examples: (template.prompt_definition?.few_shot_examples || []).map((ex: FewShotExample) => ({
        input: ex.input || '',
        output: ex.output || '',
      })),
    },
    menu_definitions: (template.menu_definitions || []).map((menu: MenuDefinition) => ({
      menu_id: menu.menu_id,
      menu_name: menu.menu_name,
      description: menu.description || '',
      selection_mode: menu.selection_mode || 'single',
      required: !!menu.required,
      options: (menu.options || []).map((opt) => ({
        value: opt.value,
        label: opt.label,
        description: opt.description || '',
        sub_options: (opt.sub_options || []).map((sub) => ({
          value: sub.value,
          label: sub.label,
          description: sub.description || '',
        })),
      })),
    })),
    menu_ids: uniqueStrings([
      ...(template.menu_ids || []),
      ...(template.menu_definitions || []).map((menu: MenuDefinition) => menu.menu_id),
    ]),
    output_contract: {
      format: template.output_contract?.format || 'markdown',
      language: template.output_contract?.language || 'pt-BR',
      strict_mode: template.output_contract?.strict_mode !== false,
      required_fields: template.output_contract?.required_fields || [],
      response_rules: template.output_contract?.response_rules || [],
      optional_enums: template.output_contract?.optional_enums || {},
    },
  });

  if (compatibility === 'legacy') {
    warnings.push(
      `Template normalizado do schema ${template.meta.schema_version} para ${CURRENT_PROMPT_SCHEMA_VERSION}.`
    );
  } else {
    const compatibilityWarning = getPromptSchemaWarning(template.meta.schema_version);
    if (compatibilityWarning) {
      warnings.push(compatibilityWarning);
    }
  }

  return {
    template: nextTemplate,
    migrated: compatibility === 'legacy',
    warnings,
  };
}
