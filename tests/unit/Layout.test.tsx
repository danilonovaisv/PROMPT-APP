import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmProvider';
import { CloudSyncProvider } from '@/context/CloudSyncContext';

jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn(() => []),
}));

jest.mock('@/components/CloudSyncItem', () => ({
  CloudSyncItem: () => <div>Cloud Sync</div>
}));

jest.mock('@/utils/exportJson', () => ({
  downloadAllPrompts: jest.fn(),
}));

jest.mock('@/db/database', () => ({
  db: {
    categories: {
      toArray: jest.fn(async () => []),
    },
  },
}));

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabaseConfigErrorMessage:
    'Configuração do Supabase ausente. Defina NEXT_SUPABASE_URL e NEXT_SUPABASE_ANON_KEY.',
}));

describe('Layout', () => {
  test('renders a non-blocking Supabase configuration warning in the shell', () => {
    render(
      <MemoryRouter>
        <ToastProvider><ConfirmProvider><CloudSyncProvider>
          <Layout onOpenImportExport={jest.fn()}>
            <div>Conteúdo</div>
          </Layout>
        </CloudSyncProvider></ConfirmProvider></ToastProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Supabase não configurado./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/recursos em nuvem permanecem desativados/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });
});
