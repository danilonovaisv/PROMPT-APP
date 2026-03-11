import {
  CURRENT_BULK_EXPORT_VERSION,
  CURRENT_PROMPT_SCHEMA_VERSION,
  getBulkExportWarning,
  getPromptSchemaWarning,
  getVersionCompatibility,
} from '@/utils/schemaCompatibility';
import { createEmptyPromptPayload } from '@/models/promptSchema';
import { migrateTemplateToCurrentSchema } from '@/utils/templateMigration';

describe('schemaCompatibility', () => {
  test('classifica versões atuais, legadas, futuras e inválidas', () => {
    expect(getVersionCompatibility(CURRENT_PROMPT_SCHEMA_VERSION, CURRENT_PROMPT_SCHEMA_VERSION)).toBe('current');
    expect(getVersionCompatibility('0.9.0', CURRENT_PROMPT_SCHEMA_VERSION)).toBe('legacy');
    expect(getVersionCompatibility('2.0.0', CURRENT_PROMPT_SCHEMA_VERSION)).toBe('future');
    expect(getVersionCompatibility('v1', CURRENT_PROMPT_SCHEMA_VERSION)).toBe('invalid');
  });

  test('gera aviso para schema legado e futuro', () => {
    expect(getPromptSchemaWarning('0.9.0')).toContain('modo de compatibilidade');
    expect(getPromptSchemaWarning('2.0.0')).toContain('mais novo que o suportado');
    expect(getPromptSchemaWarning(CURRENT_PROMPT_SCHEMA_VERSION)).toBeNull();
  });

  test('gera aviso para pacote bulk legado e inválido', () => {
    expect(getBulkExportWarning('2.5.0')).toContain(CURRENT_BULK_EXPORT_VERSION);
    expect(getBulkExportWarning('abc')).toContain('inválida');
    expect(getBulkExportWarning(CURRENT_BULK_EXPORT_VERSION)).toBeNull();
  });

  test('migra template legado para o schema corrente preservando menu_ids derivados', () => {
    const template = {
      ...createEmptyPromptPayload('Template legado'),
      meta: {
        ...createEmptyPromptPayload('Template legado').meta,
        schema_version: '0.9.0',
      },
      menu_ids: [],
      menu_definitions: [
        {
          menu_id: 'tom',
          menu_name: 'Tom',
          description: '',
          selection_mode: 'single' as const,
          required: false,
          options: [],
        },
      ],
    };

    const migration = migrateTemplateToCurrentSchema(template);

    expect(migration.migrated).toBe(true);
    expect(migration.template.meta.schema_version).toBe(CURRENT_PROMPT_SCHEMA_VERSION);
    expect(migration.template.menu_ids).toEqual(['tom']);
    expect(migration.warnings[0]).toContain('normalizado');
  });
});
