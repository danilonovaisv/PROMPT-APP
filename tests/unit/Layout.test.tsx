import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/Layout';

jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn(() => []),
}));

jest.mock('@/components/CloudSyncItem', () => () => <div>Cloud Sync</div>);

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
    'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
}));

describe('Layout', () => {
  test('renders a non-blocking Supabase configuration warning in the shell', () => {
    render(
      <MemoryRouter>
        <Layout onOpenImportExport={jest.fn()}>
          <div>Conteúdo</div>
        </Layout>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/configuração do supabase ausente/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/recursos em nuvem permanecem desativados/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });
});
