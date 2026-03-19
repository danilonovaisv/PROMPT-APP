import { describe, it, expect } from '@jest/globals';
// Implementations will live in src/models/outputSchema
import { normalizeOutputSchema, sanitizeUrlField, DEFAULT_OUTPUT_FORMAT } from '../src/models/outputSchema';
import { toExportFormat } from '../src/utils/exportJson';
import { createPromptPayloadFromLegacyRecord } from '../src/models/promptSchema';

describe('normalizeOutputSchema', () => {
  it('fallbacks to markdown when formato is missing or unknown', () => {
    const normalized = normalizeOutputSchema({ formato: 'yaml', estrutura: '  test ' });
    expect(normalized.formato).toBe(DEFAULT_OUTPUT_FORMAT);
    expect(normalized.estrutura).toBe('test');
  });

  it('accepts imagem and code formats', () => {
    const image = normalizeOutputSchema({ formato: 'imagem', estrutura: 'scene: sunset' });
    const code = normalizeOutputSchema({ formato: 'code', estrutura: 'js code block' });
    expect(image.formato).toBe('imagem');
    expect(code.formato).toBe('code');
  });
});

describe('sanitizeUrlField', () => {
  it('trims and validates http/https URLs', () => {
    const result = sanitizeUrlField('  https://example.com/page  ');
    expect(result.value).toBe('https://example.com/page');
    expect(result.error).toBeUndefined();
  });

  it('returns undefined for empty strings', () => {
    const result = sanitizeUrlField('   ');
    expect(result.value).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('flags invalid URLs', () => {
    const result = sanitizeUrlField('notaurl');
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});

describe('toExportFormat with new schema', () => {
  const promptPayload = createPromptPayloadFromLegacyRecord({
    title: 'Teste',
    systemRole: 'role',
    task: 'task',
    context: 'ctx',
    outputSchema: { formato: 'image', estrutura: 'scene' },
    referenceUrl: 'https://ref.com',
  });

  const basePrompt = {
    id: 1,
    categoryId: 1,
    title: 'Teste',
    promptPayload,
    schemaVersion: promptPayload.meta.schema_version,
    language: promptPayload.meta.language,
    outputFormat: promptPayload.output_contract.format,
    fewShotExamples: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    referenceUrl: 'https://ref.com',
  };

  it('exports canonical template payload with normalized format', () => {
    const exported = toExportFormat(basePrompt);
    expect(exported.meta.template_name).toBe('Teste');
    expect(exported.output_contract.format).toBe('image');
  });
});
