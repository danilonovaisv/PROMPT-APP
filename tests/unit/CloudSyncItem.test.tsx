import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CloudSyncItem from '@/components/CloudSyncItem';

const showToast = jest.fn();
const mockUseCloudSync = jest.fn();
const mockSupabaseState = {
  isConfigured: false,
  errorMessage: 'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL.',
};

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));

jest.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockSupabaseState.isConfigured;
  },
  get supabaseConfigErrorMessage() {
    return mockSupabaseState.errorMessage;
  },
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

jest.mock('@/services/syncService', () => ({
  downloadFromCloud: jest.fn(),
}));

jest.mock('@/services/assetManager', () => ({
  smartSync: jest.fn(),
  checkForUpdates: jest.fn(),
}));

jest.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => jest.fn().mockResolvedValue(true),
}));

jest.mock('@/hooks/useCloudSync', () => ({
  useCloudSync: () => mockUseCloudSync(),
}));

describe('CloudSyncItem', () => {
  beforeEach(() => {
    showToast.mockClear();
    mockSupabaseState.isConfigured = false;
    mockSupabaseState.errorMessage = 'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL.';
    mockUseCloudSync.mockReturnValue({
      session: null,
      hasUpdates: false,
      isOffline: false,
      realtimeActive: false,
      sessionNotice: null,
      refreshUpdates: jest.fn(),
      clearUpdates: jest.fn(),
      registerManualLogout: jest.fn(),
    });
  });

  test('renders a disabled cloud state with setup guidance when Supabase is not configured', () => {
    render(<CloudSyncItem />);

    const unavailableButton = screen.getByRole('button', { name: /nuvem indisponível/i });

    expect(unavailableButton).toBeDisabled();
    expect(
      screen.getByText('Configuração do Supabase ausente. Defina VITE_SUPABASE_URL.')
    ).toBeInTheDocument();
  });

  test('does not emit an error toast when the unavailable cloud state is clicked', async () => {
    const user = userEvent.setup();

    render(<CloudSyncItem />);

    const unavailableButton = screen.getByRole('button', { name: /nuvem indisponível/i });

    await user.click(unavailableButton);

    expect(showToast).not.toHaveBeenCalled();
  });

  test('opens login modal when cloud is configured but user is disconnected', async () => {
    const user = userEvent.setup();
    mockSupabaseState.isConfigured = true;

    render(<CloudSyncItem />);

    await user.click(screen.getByRole('button', { name: /nuvem desconectada/i }));

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });
});
