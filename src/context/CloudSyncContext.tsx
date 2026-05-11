import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { checkForUpdates } from '@/services/assetManager';
import { cleanupRealtimeListeners, reconnectRealtime, setupRealtimeListeners } from '@/services/realtimeService';
import { syncToCloud } from '@/services/syncService';
import { CloudSyncContext, type CloudSyncContextValue } from '@/context/CloudSyncContext.shared';

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const manualLogoutRef = useRef(false);

  const refreshUpdates = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setHasUpdates(false);
      return;
    }

    try {
      setHasUpdates(await checkForUpdates());
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    }
  }, []);

  const setupRealtime = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      await setupRealtimeListeners();
      setRealtimeActive(true);
    } catch (error) {
      console.error('❌ Erro ao iniciar realtime:', error);
      setRealtimeActive(false);
    }
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      await syncToCloud();
    } catch (error) {
      console.error('❌ Erro ao sincronizar pendências:', error);
    }
  }, []);

  const bootstrapSession = useCallback(async (shouldSync: boolean) => {
    await setupRealtime();

    if (shouldSync && typeof navigator !== 'undefined' && navigator.onLine) {
      await syncPendingChanges();
    }

    await refreshUpdates();
  }, [refreshUpdates, setupRealtime, syncPendingChanges]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (cancelled) return;

      setSession(currentSession);
      setRealtimeActive(!!currentSession);

      if (currentSession) {
        await bootstrapSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession((currentSession: Session | null) => {
        if (!nextSession && currentSession && !manualLogoutRef.current && event !== 'INITIAL_SESSION') {
          setSessionNotice('Sua sessão expirou. Faça login novamente para continuar sincronizando.');
        }

        if (nextSession) {
          setSessionNotice(null);
        }

        if (!nextSession && manualLogoutRef.current) {
          manualLogoutRef.current = false;
        }

        return nextSession;
      });

      if (nextSession) {
        await bootstrapSession(event === 'SIGNED_IN');
      } else {
        cleanupRealtimeListeners();
        setRealtimeActive(false);
        setHasUpdates(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      cleanupRealtimeListeners();
    };
  }, [bootstrapSession]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setRealtimeActive(false);
    };

    const handleOnline = () => {
      setIsOffline(false);

      if (!session) {
        return;
      }

      void (async () => {
        try {
          await reconnectRealtime();
          setRealtimeActive(true);
          await syncPendingChanges();
          await refreshUpdates();
        } catch (error) {
          console.error('❌ Erro ao reativar sync após reconexão:', error);
        }
      })();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshUpdates, session, syncPendingChanges]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      void refreshUpdates();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshUpdates, session]);

  const value = useMemo<CloudSyncContextValue>(() => ({
    session,
    hasUpdates,
    isOffline,
    realtimeActive,
    sessionNotice,
    refreshUpdates,
    clearUpdates: () => setHasUpdates(false),
    registerManualLogout: () => {
      manualLogoutRef.current = true;
      setSessionNotice(null);
    },
  }), [hasUpdates, isOffline, realtimeActive, refreshUpdates, session, sessionNotice]);

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>;
}
