import { render, waitFor } from '@testing-library/react';
import App from '@/App';
import { setupAutoSync } from '@/services/autoSync';

jest.mock('@/context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@/context/ConfirmProvider', () => ({
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/context/CloudSyncContext', () => ({
  CloudSyncProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/SkeletonLoader', () => ({
  SkeletonEditor: () => <div>Loading Editor</div>,
  SkeletonCategoryGrid: () => <div>Loading Category Grid</div>,
  SkeletonPromptList: () => <div>Loading Prompt List</div>,
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

jest.mock('@/utils/backupManager', () => ({
  saveLocalBackup: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/db/database', () => ({
  seedDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/pages/HomePage', () => ({ __esModule: true, default: () => <div>Home</div> }));
jest.mock('@/pages/CategoryPage', () => ({ __esModule: true, default: () => <div>Category</div> }));
jest.mock('@/pages/CategoryManagerPage', () => ({ __esModule: true, default: () => <div>Categories</div> }));
jest.mock('@/pages/EditorPage', () => ({ __esModule: true, default: () => <div>Editor</div> }));
jest.mock('@/pages/MenuManagerPage', () => ({ __esModule: true, default: () => <div>Menus</div> }));
jest.mock('@/pages/AboutPage', () => ({ __esModule: true, default: () => <div>About</div> }));
jest.mock('@/pages/ContactPage', () => ({ __esModule: true, default: () => <div>Contact</div> }));
jest.mock('@/pages/PrivacyPage', () => ({ __esModule: true, default: () => <div>Privacy</div> }));

describe('App bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('initializes local app services on mount', async () => {
    render(<App />);

    await waitFor(() => expect(setupAutoSync).toHaveBeenCalledTimes(1));
  });
});
