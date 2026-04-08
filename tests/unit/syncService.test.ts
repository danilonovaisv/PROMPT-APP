import { createEmptyPromptPayload, createEmptyUserSelection } from '@/models/promptSchema';
import { downloadFromCloud, syncToCloud } from '@/services/syncService';
import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import { createSnapshot } from '@/utils/backupManager';
import { persistContextMenuRecord } from '@/services/contextMenuSync';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  assertSupabaseConfigured: jest.fn(),
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
  isSupabaseConfigured: true,
}));

jest.mock('@/db/database', () => ({
  db: {
    categories: { update: jest.fn() },
    contextMenus: {
      update: jest.fn(),
      toArray: jest.fn(),
      bulkPut: jest.fn(),
      delete: jest.fn(),
    },
    prompts: {
      update: jest.fn(),
      toArray: jest.fn(),
      bulkPut: jest.fn(),
      delete: jest.fn(),
    },
    transaction: jest.fn(async (_mode: unknown, _tables: unknown[], callback: () => Promise<void>) =>
      callback(),
    ),
  },
}));

jest.mock('@/utils/backupManager', () => ({
  createSnapshot: jest.fn(),
}));

jest.mock('@/services/contextMenuSync', () => ({
  persistContextMenuRecord: jest.fn(),
}));

describe('syncToCloud', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.auth.getSession as unknown as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    });

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: {
        categories: [],
        contextMenus: [],
        prompts: [],
      },
    });
  });

  test('throws an error if the user is not authenticated', async () => {
    (supabase.auth.getSession as unknown as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    await expect(syncToCloud()).rejects.toThrow('Usuário não autenticado');
  });

  test('successfully synchronizes a new category (insert)', async () => {
    const mockCategory = {
      id: 1,
      name: 'Work',
      icon: '💼',
      color: '#000000',
      syncStatus: 'pending'
    };

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: {
        categories: [mockCategory],
        contextMenus: [],
        prompts: []
      }
    });

    const mockSingle = jest.fn().mockResolvedValue({ data: { id: 101 }, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as unknown as jest.Mock).mockImplementation((table) => {
      if (table === 'categories') {
        return { insert: mockInsert };
      }
      return {};
    });

    const result = await syncToCloud();

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('categories');
    expect(db.categories.update).toHaveBeenCalledWith(1, { remoteId: 101, syncStatus: 'synced' });
  });

  test('handles error when syncing a category and updates status to error', async () => {
    const mockCategory = {
      id: 3,
      name: 'ErrorCat',
      icon: '❌',
      color: '#ff0000',
      syncStatus: 'pending'
    };

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: {
        categories: [mockCategory],
        contextMenus: [],
        prompts: []
      }
    });

    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Network error') });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as unknown as jest.Mock).mockImplementation((table) => {
      if (table === 'categories') {
        return { insert: mockInsert };
      }
      return {};
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await syncToCloud();

    expect(result).toBe(true);
    expect(db.categories.update).toHaveBeenCalledWith(3, { syncStatus: 'error' });

    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test('successfully synchronizes menus', async () => {
    const mockMenu = {
      id: 1,
      menuId: 'tone',
      menuName: 'Tone',
      description: 'Set tone',
      selectionMode: 'single',
      options: [],
      syncStatus: 'pending'
    };

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: {
        categories: [],
        contextMenus: [mockMenu],
        prompts: []
      }
    });

    (persistContextMenuRecord as unknown as jest.Mock).mockResolvedValue({ id: 303 });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await syncToCloud();

    expect(result).toBe(true);
    expect(db.contextMenus.update).toHaveBeenCalledWith(1, { remoteId: 303, syncStatus: 'synced' });

    consoleLogSpy.mockRestore();
  });

  test('successfully synchronizes a prompt', async () => {
    const mockCategory = {
      id: 1,
      remoteId: 101,
      syncStatus: 'synced'
    };

    // Construct a perfectly valid TemplatePayload based on schema
    const promptPayload = createEmptyPromptPayload();
    promptPayload.meta.template_id = 'mock-prompt-1';
    promptPayload.meta.template_name = 'Fix grammar';

    const selectionPayload = createEmptyUserSelection('mock-prompt-1');
    const compiledPayload = { final_prompt: 'Fix this text', missing_variables: [], is_ready: true };

    const mockPrompt = {
      id: 1,
      categoryId: 1,
      title: 'Fix grammar',
      promptPayload,
      selectionPayload,
      compiledPayload,
      syncStatus: 'pending'
    };

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: {
        categories: [mockCategory],
        contextMenus: [],
        prompts: [mockPrompt]
      }
    });

    const mockSingle = jest.fn().mockResolvedValue({ data: { id: 404 }, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as unknown as jest.Mock).mockImplementation((table) => {
      if (table === 'prompts') {
        return { insert: mockInsert };
      }
      return {};
    });

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await syncToCloud();

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('prompts');
    expect(db.prompts.update).toHaveBeenCalledWith(1, { remoteId: 404, syncStatus: 'synced' });

    consoleLogSpy.mockRestore();
  });

  test('handles error when syncing a prompt and updates status to error', async () => {
    const promptPayload = createEmptyPromptPayload();
    promptPayload.meta.template_id = 'mock-prompt-2';
    promptPayload.meta.template_name = 'Fail Prompt';

    const selectionPayload = createEmptyUserSelection('mock-prompt-2');
    const compiledPayload = { final_prompt: 'Fail', missing_variables: [], is_ready: true };

    const mockPrompt = {
      id: 2,
      categoryId: 1,
      title: 'Fail Prompt',
      promptPayload,
      selectionPayload,
      compiledPayload,
      syncStatus: 'pending'
    };

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: {
        categories: [],
        contextMenus: [],
        prompts: [mockPrompt]
      }
    });

    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as unknown as jest.Mock).mockImplementation((table) => {
      if (table === 'prompts') {
        return { insert: mockInsert };
      }
      return {};
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await syncToCloud();

    expect(result).toBe(true);
    expect(db.prompts.update).toHaveBeenCalledWith(2, { syncStatus: 'error' });

    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test('skips pushing a prompt when the remote version is newer', async () => {
    const promptPayload = createEmptyPromptPayload('Stale local prompt');
    promptPayload.meta.template_id = 'stale-template';
    promptPayload.meta.template_name = 'Stale local prompt';

    const selectionPayload = createEmptyUserSelection('stale-template');
    const localPrompt = {
      id: 9,
      remoteId: 101,
      categoryId: 1,
      title: 'Stale local prompt',
      promptPayload,
      selectionPayload,
      compiledPayload: {
        template_id: 'stale-template',
        meta: {
          template_name: 'Stale local prompt',
          template_type: 'prompt',
          schema_version: '1.0.0',
          language: 'pt-BR',
        },
        compiled_context: {
          menu_interpretation: {},
          free_inputs: {},
        },
        prompt_definition: promptPayload.prompt_definition,
        output_contract: promptPayload.output_contract,
      },
      schemaVersion: '1.0.0',
      language: 'pt-BR',
      outputFormat: 'markdown',
      fewShotExamples: [],
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      syncStatus: 'pending',
    };

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: {
        categories: [],
        contextMenus: [],
        prompts: [localPrompt],
      },
    });

    const remoteUpdatedAt = '2026-04-08T12:00:00.000Z';
    const mockSingle = jest.fn().mockResolvedValue({
      data: { updated_at: remoteUpdatedAt },
      error: null,
    });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockUpsert = jest.fn();
    const mockInsert = jest.fn();

    (supabase.from as unknown as jest.Mock).mockImplementation((table) => {
      if (table === 'prompts') {
        return { select: mockSelect, upsert: mockUpsert, insert: mockInsert };
      }
      return {};
    });

    const result = await syncToCloud();

    expect(result).toBe(true);
    expect(mockSelect).toHaveBeenCalledWith('updated_at');
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(db.prompts.update).not.toHaveBeenCalledWith(9, expect.anything());
  });

  test('downloads remote prompt state without dropping selection and compiled payloads', async () => {
    const promptPayload = createEmptyPromptPayload('Remote prompt');
    promptPayload.meta.template_id = 'remote-template';
    promptPayload.meta.template_name = 'Remote prompt';

    const selectionPayload = createEmptyUserSelection('remote-template');
    selectionPayload.selected_menus = [
      {
        menu_id: 'tone',
        selected_options: [{ option_value: 'formal', selected_sub_options: [] }],
      },
    ];

    const compiledPayload = {
      template_id: 'remote-template',
      meta: {
        template_name: 'Remote prompt',
        template_type: 'prompt',
        schema_version: '1.0.0',
        language: 'pt-BR',
      },
      compiled_context: {
        menu_interpretation: {
          tone: {
            selected_options: ['formal'],
            selected_sub_options: [],
            selections: [],
          },
        },
        free_inputs: {},
      },
      prompt_definition: promptPayload.prompt_definition,
      output_contract: promptPayload.output_contract,
    };

    const remotePrompt = {
      id: 404,
      category_id: 1,
      title: 'Remote prompt',
      prompt_payload_jsonb: promptPayload,
      selection_payload_jsonb: selectionPayload,
      compiled_payload_jsonb: compiledPayload,
      enabled_menu_ids: ['tone'],
      constraints: [],
      negative_prompt: [],
      output_schema: { formato: 'markdown', estrutura: '' },
      reference_url: 'https://example.com',
      language: 'pt-BR',
      schema_version: '1.0.0',
      output_format: 'markdown',
      few_shot_examples: [],
      created_at: '2026-04-08T00:00:00.000Z',
      updated_at: '2026-04-08T00:00:00.000Z',
      is_deleted: false,
    };

    (supabase.from as unknown as jest.Mock).mockImplementation((table) => {
      if (table === 'categories' || table === 'context_menus' || table === 'prompts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: table === 'prompts' ? [remotePrompt] : [],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    (db.categories.toArray as unknown as jest.Mock).mockResolvedValue([]);
    (db.contextMenus.toArray as unknown as jest.Mock).mockResolvedValue([]);
    (db.prompts.toArray as unknown as jest.Mock).mockResolvedValue([]);
    (db.prompts.bulkPut as unknown as jest.Mock).mockResolvedValue([1]);
    (db.contextMenus.bulkPut as unknown as jest.Mock).mockResolvedValue([]);

    const result = await downloadFromCloud();

    expect(result).toBe(true);
    expect(db.prompts.bulkPut).toHaveBeenCalledTimes(1);

    const payloads = (db.prompts.bulkPut as unknown as jest.Mock).mock.calls[0][0];
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toEqual(
      expect.objectContaining({
        remoteId: 404,
        title: 'Remote prompt',
        selectedMenuIds: ['tone'],
        selectionPayload,
        compiledPayload,
      }),
    );
  });
});
