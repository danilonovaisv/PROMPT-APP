import { useContext } from 'react';
import { CloudSyncContext } from '@/context/CloudSyncContext.shared';

export function useCloudSync() {
  const context = useContext(CloudSyncContext);
  if (!context) {
    throw new Error('useCloudSync deve ser usado dentro de CloudSyncProvider');
  }

  return context;
}
