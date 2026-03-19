import { createEmptyPromptPayload, createEmptyUserSelection } from '@/models/promptSchema';
import { syncToCloud } from '@/services/syncService';
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
    contextMenus: { update: jest.fn() },
    prompts: { update: jest.fn() },
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
});
