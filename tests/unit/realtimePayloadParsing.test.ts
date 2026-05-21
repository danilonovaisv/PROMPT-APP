import { jest } from '@jest/globals';
import { createEmptyPromptPayload } from '@/models/promptSchema';

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

type RealtimeCallback = (payload: RealtimePayload) => Promise<void> | void;

type RealtimeTable = 'categories' | 'prompts' | 'context_menus' | 'prompt_memory_context';

const channelCallbacks: Partial<Record<RealtimeTable, RealtimeCallback>> = {};

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    channel: jest.fn((_name: string) => {
      const subscription = { unsubscribe: jest.fn() };
      const channel = {
        on: jest.fn((_eventName: string, config: { table: RealtimeTable }, callback: RealtimeCallback) => {
          channelCallbacks[config.table] = callback;
          return channel;
        }),
        subscribe: jest.fn((callback?: (status: string) => void) => {
          callback?.('SUBSCRIBED');
          return subscription;
        }),
        unsubscribe: subscription.unsubscribe,
      };

      return channel;
    }),
    removeChannel: jest.fn().mockResolvedValue('ok'),
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
    promptMemory: {
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
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    channelCallbacks.categories = undefined;
    channelCallbacks.prompts = undefined;
    channelCallbacks.context_menus = undefined;
    channelCallbacks.prompt_memory_context = undefined;

    const { supabase: mockedSupabase } = (await import('@/lib/supabase')) as unknown as { supabase: { auth: { getSession: jest.Mock } } };
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    const { db: mockedDb } = (await import('@/db/database')) as unknown as { db: { categories: { where: jest.Mock }, prompts: { where: jest.Mock }, contextMenus: { where: jest.Mock }, promptMemory: { where: jest.Mock } } };
    mockedDb.categories.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => ({ id: 11 })),
      })),
    });
    mockedDb.prompts.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
    });
    mockedDb.contextMenus.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => null),
      })),
    });
    mockedDb.promptMemory.where.mockReturnValue({
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

  test('creates prompt memory records from realtime inserts', async () => {
    jest.useFakeTimers();

    const { setupRealtimeListeners } = await import('@/services/realtimeService');
    const { db } = await import('@/db/database');

    await setupRealtimeListeners();
    const memoryCallback = channelCallbacks.prompt_memory_context;
    expect(memoryCallback).toBeDefined();

    await memoryCallback!({
      eventType: 'INSERT',
      new: {
        id: 'memory-remote-1',
        template_id: 'template-1',
        key: 'brand_voice',
        value: 'Direct and concise',
        is_deleted: false,
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:01:00.000Z',
      },
      old: null,
    });

    expect(db.promptMemory.add).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: 'memory-remote-1',
        templateId: 'template-1',
        key: 'brand_voice',
        value: 'Direct and concise',
        syncStatus: 'synced',
        isDeleted: false,
      })
    );
  });

  test('updates prompt memory only when realtime payload is newer', async () => {
    jest.useFakeTimers();

    const { db: mockedDb } = (await import('@/db/database')) as unknown as { db: { promptMemory: { where: jest.Mock, update: jest.Mock } } };
    mockedDb.promptMemory.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => ({
          id: 7,
          templateId: 'template-1',
          key: 'brand_voice',
          value: 'Old local',
          syncStatus: 'synced',
          isDeleted: false,
          updatedAt: new Date('2026-04-08T00:00:00.000Z'),
        })),
      })),
    });

    const { setupRealtimeListeners } = await import('@/services/realtimeService');

    await setupRealtimeListeners();
    const memoryCallback = channelCallbacks.prompt_memory_context;
    expect(memoryCallback).toBeDefined();

    await memoryCallback!({
      eventType: 'UPDATE',
      new: {
        id: 'memory-remote-1',
        template_id: 'template-1',
        key: 'brand_voice',
        value: 'New remote',
        is_deleted: false,
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:02:00.000Z',
      },
      old: null,
    });

    expect(mockedDb.promptMemory.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        value: 'New remote',
        syncStatus: 'synced',
      })
    );
  });

  test('ignores stale realtime memory payloads and local pending deletes', async () => {
    jest.useFakeTimers();

    const { db: mockedDb } = (await import('@/db/database')) as unknown as { db: { promptMemory: { where: jest.Mock, update: jest.Mock } } };
    const firstMock = jest.fn(async () => ({
      id: 7,
      templateId: 'template-1',
      key: 'brand_voice',
      value: 'Newer local',
      syncStatus: 'synced',
      isDeleted: false,
      updatedAt: new Date('2026-04-08T00:03:00.000Z'),
    }));
    const secondMock = jest.fn(async () => ({
      id: 8,
      templateId: 'template-1',
      key: 'brand_voice',
      value: 'Pending delete',
      syncStatus: 'pending',
      isDeleted: true,
      updatedAt: new Date('2026-04-08T00:03:00.000Z'),
    }));

    mockedDb.promptMemory.where
      .mockReturnValueOnce({ equals: jest.fn(() => ({ first: firstMock })) })
      .mockReturnValueOnce({ equals: jest.fn(() => ({ first: secondMock })) });

    const { setupRealtimeListeners } = await import('@/services/realtimeService');

    await setupRealtimeListeners();
    const memoryCallback = channelCallbacks.prompt_memory_context;
    expect(memoryCallback).toBeDefined();

    await memoryCallback!({
      eventType: 'UPDATE',
      new: {
        id: 'memory-remote-1',
        template_id: 'template-1',
        key: 'brand_voice',
        value: 'Stale remote',
        is_deleted: false,
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:02:00.000Z',
      },
      old: null,
    });

    await memoryCallback!({
      eventType: 'UPDATE',
      new: {
        id: 'memory-remote-1',
        template_id: 'template-1',
        key: 'brand_voice',
        value: 'Remote after delete',
        is_deleted: false,
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:04:00.000Z',
      },
      old: null,
    });

    expect(mockedDb.promptMemory.update).not.toHaveBeenCalled();
  });

  test('deletes prompt memory records from realtime delete and soft delete payloads', async () => {
    jest.useFakeTimers();

    const { db: mockedDb } = (await import('@/db/database')) as unknown as { db: { promptMemory: { where: jest.Mock, delete: jest.Mock } } };
    mockedDb.promptMemory.where.mockReturnValue({
      equals: jest.fn(() => ({
        first: jest.fn(async () => ({ id: 7 })),
      })),
    });

    const { setupRealtimeListeners } = await import('@/services/realtimeService');

    await setupRealtimeListeners();
    const memoryCallback = channelCallbacks.prompt_memory_context;
    expect(memoryCallback).toBeDefined();

    await memoryCallback!({
      eventType: 'DELETE',
      new: null,
      old: {
        id: 'memory-remote-1',
        template_id: 'template-1',
        key: 'brand_voice',
        value: '',
        is_deleted: false,
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:02:00.000Z',
      },
    });

    await memoryCallback!({
      eventType: 'UPDATE',
      new: {
        id: 'memory-remote-1',
        template_id: 'template-1',
        key: 'brand_voice',
        value: '',
        is_deleted: true,
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:03:00.000Z',
      },
      old: null,
    });

    expect(mockedDb.promptMemory.delete).toHaveBeenCalledTimes(2);
    expect(mockedDb.promptMemory.delete).toHaveBeenNthCalledWith(1, 7);
    expect(mockedDb.promptMemory.delete).toHaveBeenNthCalledWith(2, 7);
  });
});
