import { jest } from '@jest/globals';
import { db } from '@/db/database';
import { saveCategoryToSupabase } from '@/services/supabaseCategories';

jest.mock('@/db/database', () => ({
  db: {
    transaction: jest.fn(async (...args) => {
      const callback = args[args.length - 1];
      return callback();
    }),
    categories: {
      add: jest.fn(),
      where: jest.fn(),
      toArray: jest.fn(),
    },
    prompts: {
      toArray: jest.fn(),
      bulkPut: jest.fn(),
    },
    contextMenus: {
      bulkPut: jest.fn(),
      toArray: jest.fn(),
    },
    promptMemory: {
      where: jest.fn(),
    },
  },
}));

jest.mock('@/services/supabaseCategories', () => ({
  saveCategoryToSupabase: jest.fn(),
}));

jest.mock('@/utils/backupManager', () => ({
  saveLocalBackup: jest.fn(),
}));

describe('importService validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (db.categories.where as jest.Mock).mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
      anyOf: jest.fn(() => ({
        toArray: jest.fn(async () => []),
      })),
    });
    (db.contextMenus.toArray as jest.Mock).mockResolvedValue([]);
    (db.prompts.toArray as jest.Mock).mockResolvedValue([]);
    (db.categories.toArray as jest.Mock).mockResolvedValue([]);
    (db.promptMemory.where as jest.Mock).mockReturnValue({
      anyOf: jest.fn(() => ({
        toArray: jest.fn(async () => []),
      })),
    });
    (db.categories.add as jest.Mock).mockResolvedValue(101);
    (db.prompts.bulkPut as jest.Mock).mockResolvedValue([201]);
    (db.contextMenus.bulkPut as jest.Mock).mockResolvedValue([301]);

    (saveCategoryToSupabase as jest.Mock).mockResolvedValue({ id: 101 });
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
    expect(db.prompts.bulkPut).not.toHaveBeenCalled();
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
    expect(result.count).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        type: 'validation',
        field: expect.stringContaining('prompts[1]'),
      })
    );
    expect(result.errors[0].message).toEqual(expect.any(String));
    expect(result.errors[0].message.length).toBeGreaterThan(0);
    expect(db.prompts.bulkPut).not.toHaveBeenCalled();
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
    expect(db.prompts.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Prompt com exemplos',
          fewShotExamples,
          promptPayload: expect.objectContaining({
            prompt_definition: expect.objectContaining({
              few_shot_examples: fewShotExamples,
            }),
          }),
        }),
      ])
    );
  });
});
