import { act, render, waitFor } from '@testing-library/react';
import App from '@/App';
import { supabase } from '@/lib/supabase';
import { setupRealtimeListeners, cleanupRealtimeListeners } from '@/services/realtimeService';
import { syncToCloud } from '@/services/syncService';

jest.mock('@/context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@/context/ConfirmProvider', () => ({
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/SkeletonLoader', () => ({
  SkeletonEditor: () => <div>Loading</div>,
}));

jest.mock('@/components/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ImportExportModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/services/autoSync', () => ({
  setupAutoSync: jest.fn(),
}));

jest.mock('@/services/realtimeService', () => ({
  setupRealtimeListeners: jest.fn().mockResolvedValue(undefined),
  cleanupRealtimeListeners: jest.fn(),
}));

jest.mock('@/services/syncService', () => ({
  syncToCloud: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/utils/backupManager', () => ({
  saveLocalBackup: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/db/database', () => ({
  seedDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
  },
}));

jest.mock('@/pages/HomePage', () => ({ __esModule: true, default: () => <div>Home</div> }));
jest.mock('@/pages/CategoryPage', () => ({ __esModule: true, default: () => <div>Category</div> }));
jest.mock('@/pages/CategoryManagerPage', () => ({ __esModule: true, default: () => <div>Categories</div> }));
jest.mock('@/pages/EditorPage', () => ({ __esModule: true, default: () => <div>Editor</div> }));
jest.mock('@/pages/MenuManagerPage', () => ({ __esModule: true, default: () => <div>Menus</div> }));
jest.mock('@/pages/AboutPage', () => ({ __esModule: true, default: () => <div>About</div> }));
jest.mock('@/pages/ContactPage', () => ({ __esModule: true, default: () => <div>Contact</div> }));
jest.mock('@/pages/PrivacyPage', () => ({ __esModule: true, default: () => <div>Privacy</div> }));

describe('App auth-state listener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('reinstalls realtime listeners and syncs again when auth changes to signed in', async () => {
    render(<App />);

    await waitFor(() => expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(setupRealtimeListeners).toHaveBeenCalledTimes(1));

    const authCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0] as (
      event: string,
      session: { user: { id: string } } | null,
    ) => Promise<void> | void;

    await act(async () => {
      await authCallback('SIGNED_IN', { user: { id: 'user-123' } });
    });

    await waitFor(() => expect(setupRealtimeListeners).toHaveBeenCalledTimes(2));
    expect(syncToCloud).toHaveBeenCalledTimes(1);
  });

  test('cleans up realtime listeners when auth changes to signed out', async () => {
    render(<App />);

    await waitFor(() => expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1));

    const authCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0] as (
      event: string,
      session: { user: { id: string } } | null,
    ) => Promise<void> | void;

    await act(async () => {
      await authCallback('SIGNED_OUT', null);
    });

    expect(cleanupRealtimeListeners).toHaveBeenCalled();
  });
});
