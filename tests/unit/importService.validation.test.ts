import { jest } from '@jest/globals';
import { db } from '@/db/database';
import { saveCategoryToSupabase } from '@/services/supabaseCategories';
import { saveMenuToSupabase } from '@/services/supabaseMenus';

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

    (db.categories.where as any).mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
      anyOf: jest.fn(() => ({
        toArray: jest.fn(async () => []),
      })),
    });
    (db.contextMenus.where as any).mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
    });
    (db.contextMenus.toArray as any).mockResolvedValue([]);
    (db.categories.add as any).mockResolvedValue(101);
    (db.prompts.bulkAdd as any).mockResolvedValue([201]);
    (db.prompts.add as any).mockResolvedValue(202);
    (db.contextMenus.bulkPut as any).mockResolvedValue([301]);

    (saveCategoryToSupabase as any).mockResolvedValue({ id: 101 });
    (saveMenuToSupabase as any).mockResolvedValue({ id: 301 });
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

  test('preserves few_shot_examples when importing legacy prompt JSON', async () => {
    const { importFromJsonText } = await import('@/services/importService');
    const { db } = await import('@/db/database');

    const fewShotExamples = [
      {
        input: 'Usuário pede uma variação curta',
        output: 'Resposta curta e objetiva',
      },
    ];

    const result = await importFromJsonText(
      JSON.stringify({
        title: 'Prompt com exemplos',
        system_role: 'Você é útil',
        task: 'Responder perguntas',
        input_data: {
          context: 'Atendimento',
          menus_selecionados: {},
        },
        constraints: ['Seja claro'],
        negative_prompt: ['Não invente'],
        output_schema: {
          formato: 'markdown',
          estrutura: 'bullet points',
        },
        few_shot_examples: fewShotExamples,
      }),
      'single.json'
    );

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(db.prompts.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prompt com exemplos',
        fewShotExamples,
        promptPayload: expect.objectContaining({
          prompt_definition: expect.objectContaining({
            few_shot_examples: fewShotExamples,
          }),
        }),
      })
    );
  });
});
