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
    removeChannel: jest.fn(),
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

describe('realtimeService cleanup cycles', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    channelNames.length = 0;
    subscriptions.length = 0;

    const { supabase: mockedSupabase } = (await import('@/lib/supabase')) as unknown as { supabase: { auth: { getSession: jest.Mock }, channel: jest.Mock, removeChannel: jest.Mock } };
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });
    mockedSupabase.removeChannel.mockResolvedValue('ok');
    mockedSupabase.channel.mockImplementation((name: unknown) => {
      channelNames.push(name);
      const subscription = { unsubscribe: jest.fn() };
      subscriptions.push(subscription);

      return {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn((callback?: (status: string) => void) => {
          callback?.('SUBSCRIBED');
          return subscription;
        }),
        unsubscribe: subscription.unsubscribe,
      };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const activeSubscriptions = () =>
    subscriptions.filter((subscription) => subscription.unsubscribe.mock.calls.length === 0).length;

  test('login and logout cycles keep realtime listener counts bounded', async () => {
    const { setupRealtimeListeners, cleanupRealtimeListeners } = await import('@/services/realtimeService');
    const { supabase } = await import('@/lib/supabase');

    await setupRealtimeListeners();
    expect(activeSubscriptions()).toBe(4);

    cleanupRealtimeListeners();
    expect(activeSubscriptions()).toBe(0);

    await setupRealtimeListeners();
    expect(activeSubscriptions()).toBe(4);

    cleanupRealtimeListeners();
    expect(activeSubscriptions()).toBe(0);

    expect(supabase.channel).toHaveBeenCalledTimes(8);
    expect(channelNames).toEqual([
      'categories_changes',
      'prompts_changes',
      'context_menus_changes',
      'prompt_memory_changes',
      'categories_changes',
      'prompts_changes',
      'context_menus_changes',
      'prompt_memory_changes',
    ]);
    expect(subscriptions).toHaveLength(8);
    expect(subscriptions.every((subscription) => subscription.unsubscribe.mock.calls.length === 1)).toBe(true);
  });
});
