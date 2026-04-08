import { jest } from '@jest/globals';

jest.mock('@/db/database', () => ({
  db: {
    categories: {
      add: jest.fn(),
      where: jest.fn(),
    },
    prompts: {
      add: jest.fn(),
      bulkAdd: jest.fn(),
    },
    contextMenus: {
      add: jest.fn(),
      bulkPut: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(),
    },
  },
}));

jest.mock('@/services/supabaseCategories', () => ({
  saveCategoryToSupabase: jest.fn(),
}));

jest.mock('@/services/supabaseMenus', () => ({
  saveMenuToSupabase: jest.fn(),
}));

jest.mock('@/utils/backupManager', () => ({
  saveLocalBackup: jest.fn(),
}));

describe('importService validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { db } = require('@/db/database');
    db.categories.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
      anyOf: jest.fn(() => ({
        toArray: jest.fn(async () => []),
      })),
    });
    db.contextMenus.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
    });
    db.contextMenus.toArray.mockResolvedValue([]);
    db.categories.add.mockResolvedValue(101);
    db.prompts.bulkAdd.mockResolvedValue([201]);
    db.prompts.add.mockResolvedValue(202);
    db.contextMenus.bulkPut.mockResolvedValue([301]);

    const { saveCategoryToSupabase } = require('@/services/supabaseCategories');
    const { saveMenuToSupabase } = require('@/services/supabaseMenus');
    saveCategoryToSupabase.mockResolvedValue({ id: 101 });
    saveMenuToSupabase.mockResolvedValue({ id: 301 });
  });

  test('rejects non-json source names before parsing payloads', async () => {
    const { importFromJsonText } = await import('@/services/importService');
    const { db } = await import('@/db/database');

    const result = await importFromJsonText('{"prompt":"ignored"}', 'clipboard.txt');

    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        type: 'processing',
        field: 'general',
      })
    );
    expect(result.errors[0].message).toContain('Apenas arquivos .json são aceitos');
    expect(db.prompts.bulkAdd).not.toHaveBeenCalled();
  });

  test('fails validation for legacy prompts that contain non-string array entries', async () => {
    const { importFromJsonText } = await import('@/services/importService');
    const { db } = await import('@/db/database');

    const result = await importFromJsonText(
      JSON.stringify({
        app: 'PROMPT APP',
        version: '3.0.0',
        prompts: [
          {
            title: 'Prompt válido',
            category: 'copy',
            prompt: {
              title: 'Prompt válido',
              system_role: 'Você é útil',
              task: 'Reescreva o texto',
              context: 'Landing page',
              constraints: ['mantenha curto'],
              negative_prompt: ['não invente fatos'],
              output_schema: {
                formato: 'markdown',
                estrutura: 'bullet points',
              },
            },
          },
          {
            title: 'Prompt inválido',
            category: 'copy',
            prompt: {
              title: 'Prompt inválido',
              system_role: 'Você é útil',
              task: 'Reescreva o texto',
              context: 'Landing page',
              constraints: ['mantenha curto', 42],
              negative_prompt: ['não invente fatos'],
            },
          },
        ],
      }),
      'bulk.json'
    );

    expect(result.success).toBe(false);
    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        type: 'validation',
        field: 'prompt',
      })
    );
    expect(result.errors[0].message).toEqual(expect.any(String));
    expect(result.errors[0].message.length).toBeGreaterThan(0);
    expect(db.prompts.bulkAdd).toHaveBeenCalledTimes(1);
    expect(db.prompts.bulkAdd).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'Prompt válido',
        schemaVersion: '1.0.0',
        language: 'pt-BR',
        outputFormat: 'markdown',
      }),
    ]);
  });
});
