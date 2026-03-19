
jest.mock('@/db/database', () => ({
  db: {
    prompts: { hook: jest.fn() },
    categories: { hook: jest.fn() },
    contextMenus: { hook: jest.fn() },
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } })
    }
  },
  isSupabaseConfigured: true
}));

jest.mock('@/services/syncService', () => ({
  syncToCloud: jest.fn().mockResolvedValue(undefined)
}));

describe('setupAutoSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');
    // Ensure we start fresh for let variables in autoSync
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('installs hooks on prompts, categories, and contextMenus tables', async () => {
    const { setupAutoSync } = await import('@/services/autoSync');
    const { db } = await import('@/db/database');
    setupAutoSync();

    expect(db.prompts.hook).toHaveBeenCalledWith('creating', expect.any(Function));
    expect(db.prompts.hook).toHaveBeenCalledWith('updating', expect.any(Function));
    expect(db.prompts.hook).toHaveBeenCalledWith('deleting', expect.any(Function));

    expect(db.categories.hook).toHaveBeenCalledWith('creating', expect.any(Function));
    expect(db.categories.hook).toHaveBeenCalledWith('updating', expect.any(Function));
    expect(db.categories.hook).toHaveBeenCalledWith('deleting', expect.any(Function));

    expect(db.contextMenus.hook).toHaveBeenCalledWith('creating', expect.any(Function));
    expect(db.contextMenus.hook).toHaveBeenCalledWith('updating', expect.any(Function));
    expect(db.contextMenus.hook).toHaveBeenCalledWith('deleting', expect.any(Function));
  });

  test('only installs hooks once', async () => {
    const { setupAutoSync } = await import('@/services/autoSync');
    const { db } = await import('@/db/database');

    setupAutoSync();
    setupAutoSync(); // Should return early and not install again

    expect(db.prompts.hook).toHaveBeenCalledTimes(3);
    expect(db.categories.hook).toHaveBeenCalledTimes(3);
    expect(db.contextMenus.hook).toHaveBeenCalledTimes(3);
  });

  test('schedules sync when a hook is triggered', async () => {
    const { setupAutoSync } = await import('@/services/autoSync');
    const { db } = await import('@/db/database');
    const { supabase } = await import('@/lib/supabase');
    const { syncToCloud } = await import('@/services/syncService');

    setupAutoSync();

    // Call the creating hook
    const createHookCall = (db.prompts.hook as unknown as jest.Mock).mock.calls.find(call => call[0] === 'creating');
    expect(createHookCall).toBeDefined();

    const hookFn = createHookCall[1];

    // Simulate being online
    const navigatorSpy = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    hookFn();

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 10000);

    // Fast-forward timer
    jest.runAllTimers();

    // In actual implementation, it calls runAutoSyncIfAuthenticated, which awaits supabase.auth.getSession
    // Need to flush promises
    await Promise.resolve();

    expect(supabase.auth.getSession).toHaveBeenCalled();
    // Since session is null (mocked above), syncToCloud should not be called
    expect(syncToCloud).not.toHaveBeenCalled();

    navigatorSpy.mockRestore();
  });

  test('does not schedule sync when offline', async () => {
    const { setupAutoSync } = await import('@/services/autoSync');
    const { db } = await import('@/db/database');

    setupAutoSync();

    const createHookCall = (db.prompts.hook as unknown as jest.Mock).mock.calls.find(call => call[0] === 'creating');
    const hookFn = createHookCall[1];

    // Simulate being offline
    const navigatorSpy = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    hookFn();

    expect(setTimeout).not.toHaveBeenCalled();

    navigatorSpy.mockRestore();
  });

  test('calls syncToCloud when timer fires and user is authenticated', async () => {
    const { setupAutoSync } = await import('@/services/autoSync');
    const { db } = await import('@/db/database');
    const { supabase } = await import('@/lib/supabase');
    const { syncToCloud } = await import('@/services/syncService');

    // Mock authenticated user
    (supabase.auth.getSession as unknown as jest.Mock).mockResolvedValue({ data: { session: { user: { id: '123' } } } });

    setupAutoSync();

    const createHookCall = (db.prompts.hook as unknown as jest.Mock).mock.calls.find(call => call[0] === 'creating');
    const hookFn = createHookCall[1];

    const navigatorSpy = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    hookFn();

    jest.runAllTimers();

    // allow microtasks to flush
    await Promise.resolve();
    await Promise.resolve();

    expect(supabase.auth.getSession).toHaveBeenCalled();
    expect(syncToCloud).toHaveBeenCalled();

    navigatorSpy.mockRestore();
  });

  test('clears previous timer if another hook is called before timeout', async () => {
    const { setupAutoSync } = await import('@/services/autoSync');
    const { db } = await import('@/db/database');

    setupAutoSync();

    const createHookCall = (db.prompts.hook as unknown as jest.Mock).mock.calls.find(call => call[0] === 'creating');
    const hookFn = createHookCall[1];

    const navigatorSpy = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    // Call first time
    hookFn();
    expect(setTimeout).toHaveBeenCalledTimes(1);

    // Call second time before timer expires
    hookFn();

    // Both clearance and new setup should occur
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(2);

    navigatorSpy.mockRestore();
  });
});
