import { CURRENT_PROMPT_SCHEMA_VERSION } from '@/utils/schemaCompatibility';
import { createEmptyPromptPayload } from '@/models/promptSchema';
import { migrateTemplateToCurrentSchema } from '@/utils/templateMigration';

describe('templateMigration', () => {
  describe('migrateTemplateToCurrentSchema', () => {
    test('migra template legado para o schema corrente preservando menu_ids derivados', () => {
      const template = {
        ...createEmptyPromptPayload('Template legado'),
        meta: {
          ...createEmptyPromptPayload('Template legado').meta,
          schema_version: '0.9.0',
        },
        menu_ids: ['existing_menu'],
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
      // Ensure unique merging of menu_ids from existing array and definitions
      expect(migration.template.menu_ids).toEqual(['existing_menu', 'tom']);
      expect(migration.warnings[0]).toContain('normalizado');
    });

    test('não altera schema_version e migrated=false para template atual', () => {
      const template = {
        ...createEmptyPromptPayload('Template atual'),
        meta: {
          ...createEmptyPromptPayload('Template atual').meta,
          schema_version: CURRENT_PROMPT_SCHEMA_VERSION,
        },
        menu_ids: [],
        menu_definitions: [],
      };

      const migration = migrateTemplateToCurrentSchema(template);

      expect(migration.migrated).toBe(false);
      expect(migration.template.meta.schema_version).toBe(CURRENT_PROMPT_SCHEMA_VERSION);
      expect(migration.warnings).toHaveLength(0);
    });

    test('não altera schema_version e adiciona aviso para template futuro', () => {
      const futureVersion = '99.99.99';
      const template = {
        ...createEmptyPromptPayload('Template futuro'),
        meta: {
          ...createEmptyPromptPayload('Template futuro').meta,
          schema_version: futureVersion,
        },
        menu_ids: [],
        menu_definitions: [],
      };

      const migration = migrateTemplateToCurrentSchema(template);

      expect(migration.migrated).toBe(false);
      expect(migration.template.meta.schema_version).toBe(futureVersion);
      expect(migration.warnings).toHaveLength(1);
      expect(migration.warnings[0]).toContain('mais novo que o suportado localmente');
    });

    test('não altera schema_version e adiciona aviso para template com versão inválida', () => {
      const invalidVersion = 'invalid-version';
      const template = {
        ...createEmptyPromptPayload('Template invalido'),
        meta: {
          ...createEmptyPromptPayload('Template invalido').meta,
          schema_version: invalidVersion,
        },
        menu_ids: [],
        menu_definitions: [],
      };

      const migration = migrateTemplateToCurrentSchema(template);

      expect(migration.migrated).toBe(false);
      expect(migration.template.meta.schema_version).toBe(invalidVersion);
      expect(migration.warnings).toHaveLength(1);
      expect(migration.warnings[0]).toContain('fora do formato semântico esperado');
    });

    test('uniqueStrings filters correctly through menu_ids merge', () => {
      const template = {
        ...createEmptyPromptPayload('Template duplicado'),
        meta: {
          ...createEmptyPromptPayload('Template duplicado').meta,
          schema_version: CURRENT_PROMPT_SCHEMA_VERSION,
        },
        menu_ids: [' tom ', 'tom', 'estilo', ''], // spaces and duplicates
        menu_definitions: [
          {
            menu_id: 'tom',
            menu_name: 'Tom',
            description: '',
            selection_mode: 'single' as const,
            required: false,
            options: [],
          },
          // removed duplicate menu_definition as the schema validation blocks it!
          {
            menu_id: ' estilo ', // spaces
            menu_name: 'Estilo',
            description: '',
            selection_mode: 'single' as const,
            required: false,
            options: [],
          },
        ],
      };

      const migration = migrateTemplateToCurrentSchema(template);

      expect(migration.template.menu_ids).toEqual(['tom', 'estilo']);
    });
  });
});
