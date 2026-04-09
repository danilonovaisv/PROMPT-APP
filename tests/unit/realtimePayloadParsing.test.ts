import { jest } from '@jest/globals';
import { createEmptyPromptPayload } from '@/models/promptSchema';

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

type RealtimeCallback = (payload: RealtimePayload) => Promise<void> | void;

const channelCallbacks: Partial<Record<'categories' | 'prompts' | 'context_menus', RealtimeCallback>> = {};

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    channel: jest.fn((name: string) => {
      const subscription = { unsubscribe: jest.fn() };
      const channel = {
        on: jest.fn((_eventName: string, config: { table: 'categories' | 'prompts' | 'context_menus' }, callback: RealtimeCallback) => {
          channelCallbacks[config.table] = callback;
          return channel;
        }),
        subscribe: jest.fn(() => subscription),
      };

      return channel;
    }),
  },
}));

jest.mock('@/db/database', () => ({
  db: {
    categories: {
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      where: jest.fn(),
    },
    prompts: {
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      where: jest.fn(),
    },
    contextMenus: {
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      where: jest.fn(),
    },
  },
}));

jest.mock('@/utils/backupManager', () => ({
  saveLocalBackup: jest.fn(),
}));

describe('realtime payload parsing', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    channelCallbacks.categories = undefined;
    channelCallbacks.prompts = undefined;
    channelCallbacks.context_menus = undefined;

    const { supabase } = require('@/lib/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    const { db } = require('@/db/database');
    db.categories.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => ({ id: 11 })),
      })),
    });
    db.prompts.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
    });
    db.contextMenus.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('normalizes an invalid realtime selection payload into the fallback menu selection', async () => {
    jest.useFakeTimers();

    const { setupRealtimeListeners } = await import('@/services/realtimeService');
    const { db } = await import('@/db/database');

    const template = createEmptyPromptPayload('Realtime boundary');
    template.meta.template_id = 'realtime-template';
    template.meta.template_name = 'Realtime boundary';
    template.menu_definitions = [
      {
        menu_id: 'tone',
        menu_name: 'Tone',
        description: '',
        selection_mode: 'single',
        required: false,
        options: [
          {
            label: 'Formal',
            value: 'formal',
            description: '',
            sub_options: [
              {
                label: 'Concise',
                value: 'concise',
                description: '',
              },
            ],
          },
        ],
      },
    ];

    await setupRealtimeListeners();
    const promptCallback = channelCallbacks.prompts;
    expect(promptCallback).toBeDefined();

    await promptCallback!({
      eventType: 'INSERT',
      new: {
        id: 42,
        category_id: 7,
        title: 'Realtime boundary',
        prompt_payload_jsonb: template,
        selection_payload_jsonb: { invalid: true },
        compiled_payload_jsonb: null,
        context_menus: {
          tone: {
            option: 'formal',
            subOptions: ['concise'],
          },
        },
        enabled_menu_ids: ['tone'],
        constraints: [],
        negative_prompt: [],
        output_schema: { formato: 'markdown', estrutura: '' },
        reference_url: '',
        language: 'pt-BR',
        schema_version: '1.0.0',
        few_shot_examples: [],
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:00:00.000Z',
      },
      old: null,
    });

    expect(db.prompts.add).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 11,
        title: 'Realtime boundary',
        syncStatus: 'synced',
        selectionPayload: expect.objectContaining({
          template_id: 'realtime-template',
          selected_menus: [
            expect.objectContaining({
              menu_id: 'tone',
              selected_options: [
                expect.objectContaining({
                  option_value: 'formal',
                  selected_sub_options: ['concise'],
                }),
              ],
            }),
          ],
        }),
        compiledPayload: expect.objectContaining({
          template_id: 'realtime-template',
          compiled_context: expect.objectContaining({
            menu_interpretation: expect.objectContaining({
              tone: expect.objectContaining({
                selected_options: ['formal'],
                selected_sub_options: ['concise'],
              }),
            }),
          }),
        }),
      })
    );
  });

  test('normalizes malformed realtime menu options into an empty array', async () => {
    jest.useFakeTimers();

    const { setupRealtimeListeners } = await import('@/services/realtimeService');
    const { db } = await import('@/db/database');

    await setupRealtimeListeners();
    const menuCallback = channelCallbacks.context_menus;
    expect(menuCallback).toBeDefined();

    await menuCallback!({
      eventType: 'INSERT',
      new: {
        id: 91,
        menu_id: 'tone',
        menu_name: 'Tone',
        description: 'Tone options',
        selection_mode: 'single',
        options: 123,
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:00:00.000Z',
      },
      old: null,
    });

    expect(db.contextMenus.add).toHaveBeenCalledWith(
      expect.objectContaining({
        menuId: 'tone',
        menuName: 'Tone',
        selectionMode: 'single',
        options: [],
        syncStatus: 'synced',
      })
    );
  });
});
