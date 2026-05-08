import { jest } from "@jest/globals";


type MockSubscription = {
  unsubscribe: jest.Mock;
};

const channelNames: string[] = [];
const subscriptions: MockSubscription[] = [];

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    channel: jest.fn(),
  },
}));

jest.mock('@/db/database', () => ({
  db: {
    categories: {},
    prompts: {},
    contextMenus: {},
  },
}));

jest.mock('@/utils/backupManager', () => ({
  saveLocalBackup: jest.fn(),
}));

describe('realtimeService', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    channelNames.length = 0;
    subscriptions.length = 0;

    const { supabase: mockedSupabase } = (await import('@/lib/supabase')) as unknown as { supabase: { auth: { getSession: jest.Mock }, channel: jest.Mock } };
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });
    mockedSupabase.channel.mockImplementation((name: unknown) => {
      channelNames.push(name);
      const subscription = { unsubscribe: jest.fn() };
      subscriptions.push(subscription);

      return {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(() => subscription),
      };
    });
  });

  const activeSubscriptions = () =>
    subscriptions.filter((subscription) => subscription.unsubscribe.mock.calls.length === 0).length;

  test('setupRealtimeListeners replaces old listeners instead of stacking them', async () => {
    const { setupRealtimeListeners } = await import('@/services/realtimeService');
    const { supabase } = await import('@/lib/supabase');

    await setupRealtimeListeners();
    await setupRealtimeListeners();

    expect(supabase.channel).toHaveBeenCalledTimes(6);
    expect(channelNames).toEqual([
      'categories_changes',
      'prompts_changes',
      'context_menus_changes',
      'categories_changes',
      'prompts_changes',
      'context_menus_changes',
    ]);
    expect(activeSubscriptions()).toBe(3);
    expect(subscriptions.slice(0, 3).every((subscription) => subscription.unsubscribe.mock.calls.length === 1)).toBe(true);
    expect(subscriptions.slice(3).every((subscription) => subscription.unsubscribe.mock.calls.length === 0)).toBe(true);
  });

  test('cleanupRealtimeListeners unsubscribes all channels and is idempotent', async () => {
    const { setupRealtimeListeners, cleanupRealtimeListeners } = await import('@/services/realtimeService');

    await setupRealtimeListeners();
    cleanupRealtimeListeners();
    cleanupRealtimeListeners();

    expect(activeSubscriptions()).toBe(0);
    expect(subscriptions).toHaveLength(3);
    expect(subscriptions.every((subscription) => subscription.unsubscribe.mock.calls.length === 1)).toBe(true);
  });
});
