import { TemplatePayloadSchema, type TemplatePayload } from '@/models/promptSchema';
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

  const nextTemplate = TemplatePayloadSchema.parse({
    ...template,
    meta: {
      ...template.meta,
      schema_version:
        compatibility === 'legacy'
          ? CURRENT_PROMPT_SCHEMA_VERSION
          : template.meta.schema_version,
    },
    menu_ids: uniqueStrings([
      ...(template.menu_ids || []),
      ...template.menu_definitions.map((menu) => menu.menu_id),
    ]),
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
