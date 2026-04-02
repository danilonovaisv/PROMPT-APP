import {
  CURRENT_BULK_EXPORT_VERSION,
  CURRENT_PROMPT_SCHEMA_VERSION,
  getBulkExportWarning,
  getPromptSchemaWarning,
  getVersionCompatibility,
} from '@/utils/schemaCompatibility';

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
});
