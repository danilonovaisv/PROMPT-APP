import { syncCategories } from '@/services/sync/categorySync';
import { supabase } from '@/lib/supabase';
import { createSnapshot } from '@/utils/backupManager';
import { syncToCloud, downloadFromCloud } from '@/services/syncService';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  assertSupabaseConfigured: jest.fn(),
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
    from: jest.fn(),
  },
  isSupabaseConfigured: true,
}));

jest.mock('@/db/database', () => ({
  db: {
    categories: {
      update: jest.fn(),
      toArray: jest.fn(),
      bulkPut: jest.fn(),
      delete: jest.fn(),
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
    },
    contextMenus: {
      update: jest.fn(),
      toArray: jest.fn(),
      bulkPut: jest.fn(),
      delete: jest.fn(),
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
    },
    prompts: {
      update: jest.fn(),
      toArray: jest.fn(),
      bulkPut: jest.fn(),
      delete: jest.fn(),
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
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

// Mock sync sub-modules so tests run without real I/O
jest.mock('@/services/sync/categorySync', () => ({
  syncCategories: jest.fn().mockResolvedValue(new Map()),
  downloadCategories: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock('@/services/sync/menuSync', () => ({
  syncMenus: jest.fn().mockResolvedValue(undefined),
  downloadMenus: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock('@/services/sync/promptSync', () => ({
  syncPrompts: jest.fn().mockResolvedValue(undefined),
  downloadPrompts: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/sync/memorySync', () => ({
  syncMemoryToCloud: jest.fn().mockResolvedValue(undefined),
  downloadMemoryFromCloud: jest.fn().mockResolvedValue(undefined),
}));

import { syncMemoryToCloud } from '@/services/sync/memorySync';

// Re-import mocked sub-module functions for per-test assertions
import { syncCategories, downloadCategories } from '@/services/sync/categorySync';
import { syncMenus, downloadMenus } from '@/services/sync/menuSync';
import { syncPrompts, downloadPrompts } from '@/services/sync/promptSync';

describe('syncToCloud', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.auth.refreshSession as unknown as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
      error: null,
    });

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
    (supabase.auth.refreshSession as unknown as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(syncToCloud()).rejects.toThrow('Usuário não autenticado');
  });

  test('calls all 4 sync phases and returns true on success', async () => {
    const result = await syncToCloud();

    expect(result).toBe(true);
    expect(syncCategories).toHaveBeenCalledTimes(1);
    expect(syncMenus).toHaveBeenCalledTimes(1);
    expect(syncPrompts).toHaveBeenCalledTimes(1);
  });

  test('passes snapshot data to each phase', async () => {
    const mockCategory = { id: 1, name: 'Work', syncStatus: 'pending' };
    const mockMenu = { id: 2, menuId: 'tone', syncStatus: 'pending' };
    const mockPrompt = { id: 3, title: 'Fix', syncStatus: 'pending' };

    (createSnapshot as unknown as jest.Mock).mockResolvedValue({
      data: { categories: [mockCategory], contextMenus: [mockMenu], prompts: [mockPrompt] },
    });

    await syncToCloud();

    expect(syncCategories).toHaveBeenCalledWith(mockUserId, [mockCategory]);
    expect(syncMenus).toHaveBeenCalledWith(mockUserId, [mockMenu]);
  });

  test('returns true on partial success (one phase fails)', async () => {
    (syncCategories as unknown as jest.Mock).mockRejectedValueOnce(new Error('cats down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await syncToCloud();

    // Partial success: remaining phases still ran
    expect(result).toBe(true);
    expect(syncMenus).toHaveBeenCalledTimes(1);
    expect(syncPrompts).toHaveBeenCalledTimes(1);
  });

  test('throws when all phases fail', async () => {
    (syncCategories as unknown as jest.Mock).mockRejectedValueOnce(new Error('a'));
    (syncMenus as unknown as jest.Mock).mockRejectedValueOnce(new Error('b'));
    (syncPrompts as unknown as jest.Mock).mockRejectedValueOnce(new Error('c'));
    (syncMemoryToCloud as unknown as jest.Mock).mockRejectedValueOnce(new Error('d'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(syncToCloud()).rejects.toThrow('Sincronização falhou em todas as fases');
  });

  test('downloadFromCloud calls all 4 download phases and returns true', async () => {
    const result = await downloadFromCloud();

    expect(result).toBe(true);
    expect(downloadCategories).toHaveBeenCalledTimes(1);
    expect(downloadMenus).toHaveBeenCalledTimes(1);
    expect(downloadPrompts).toHaveBeenCalledTimes(1);
  });

  test('downloadFromCloud throws if session missing', async () => {
    (supabase.auth.getSession as unknown as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.refreshSession as unknown as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: new Error('Usuário não autenticado'),
    });

    await expect(downloadFromCloud()).rejects.toThrow('Usuário não autenticado');
  });

  test('downloadFromCloud returns true on partial phase failure', async () => {
    (downloadCategories as unknown as jest.Mock).mockRejectedValueOnce(new Error('cats'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await downloadFromCloud();

    expect(result).toBe(true);
    expect(downloadMenus).toHaveBeenCalledTimes(1);
    expect(downloadPrompts).toHaveBeenCalledTimes(1);
  });
});
