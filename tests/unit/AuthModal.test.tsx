import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '@/components/AuthModal';

const showToast = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseConfigErrorMessage: '',
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

describe('AuthModal', () => {
  test('associates visible labels with form controls', async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={jest.fn()} />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');

    await user.type(emailInput, 'danilo@example.com');
    await user.type(passwordInput, 'secret123');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('renders the correct form shape for different initial modes', () => {
    const { rerender } = render(<AuthModal key="login" isOpen onClose={jest.fn()} initialMode="login" />);

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

    rerender(<AuthModal key="update-password" isOpen onClose={jest.fn()} initialMode="update-password" />);

    expect(screen.getByRole('heading', { name: 'Atualizar Senha' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
  });
});
