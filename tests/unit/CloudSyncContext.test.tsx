import { act, render, waitFor } from '@testing-library/react';
import { CloudSyncProvider } from '@/context/CloudSyncContext';
import { useCloudSync } from '@/hooks/useCloudSync';
import { supabase } from '@/lib/supabase';
import { checkForUpdates } from '@/services/assetManager';
import { cleanupRealtimeListeners, reconnectRealtime, setupRealtimeListeners } from '@/services/realtimeService';
import { syncToCloud } from '@/services/syncService';

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

jest.mock('@/services/assetManager', () => ({
  checkForUpdates: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/services/realtimeService', () => ({
  setupRealtimeListeners: jest.fn().mockResolvedValue({
    success: true,
    channels: {
      categories: 'subscribed',
      prompts: 'subscribed',
      menus: 'subscribed',
      memory: 'subscribed',
    },
    errors: [],
  }),
  cleanupRealtimeListeners: jest.fn(),
  reconnectRealtime: jest.fn().mockResolvedValue({
    success: true,
    channels: {
      categories: 'subscribed',
      prompts: 'subscribed',
      menus: 'subscribed',
      memory: 'subscribed',
    },
    errors: [],
  }),
}));

jest.mock('@/services/syncService', () => ({
  syncToCloud: jest.fn().mockResolvedValue(true),
}));

function Harness() {
  useCloudSync();
  return <div>Cloud Sync Harness</div>;
}

describe('CloudSyncProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  test('reinstalls realtime listeners and syncs when auth changes to signed in', async () => {
    render(
      <CloudSyncProvider>
        <Harness />
      </CloudSyncProvider>
    );

    const authCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0] as (
      event: string,
      session: { user: { id: string } } | null,
    ) => Promise<void>;

    await act(async () => {
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } });
    });

    await waitFor(() => expect(setupRealtimeListeners).toHaveBeenCalledTimes(1));
    expect(syncToCloud).toHaveBeenCalledTimes(1);
    expect(checkForUpdates).toHaveBeenCalled();
  });

  test('cleans up realtime listeners on sign out', async () => {
    render(
      <CloudSyncProvider>
        <Harness />
      </CloudSyncProvider>
    );

    const authCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0] as (
      event: string,
      session: { user: { id: string } } | null,
    ) => Promise<void>;

    await act(async () => {
      await authCallback('SIGNED_OUT', null);
    });

    expect(cleanupRealtimeListeners).toHaveBeenCalled();
  });

  test('flushes pending changes and reconnects realtime when browser comes back online', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'existing-user' } } },
    });

    render(
      <CloudSyncProvider>
        <Harness />
      </CloudSyncProvider>
    );

    await waitFor(() => expect(setupRealtimeListeners).toHaveBeenCalled());
    jest.clearAllMocks();

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(reconnectRealtime).toHaveBeenCalledTimes(1));
    expect(syncToCloud).toHaveBeenCalled();
  });
});
