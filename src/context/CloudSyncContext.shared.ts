import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface CloudSyncContextValue {
  session: Session | null;
  hasUpdates: boolean;
  isOffline: boolean;
  realtimeActive: boolean;
  sessionNotice: string | null;
  refreshUpdates: () => Promise<void>;
  clearUpdates: () => void;
  registerManualLogout: () => void;
}

export const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);
