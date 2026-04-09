import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CloudSyncItem from '@/components/CloudSyncItem';

const showToast = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabaseConfigErrorMessage: 'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL.',
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

describe('CloudSyncItem', () => {
  beforeEach(() => {
    showToast.mockClear();
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
});
