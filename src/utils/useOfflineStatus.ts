import { useState, useEffect, useCallback } from 'react';
import {
  getPendingOfflineActions,
  markOfflineActionsSynced,
  PendingOfflineAction,
  getDashboardFromOfflineDB,
  getHealthRecordsFromOfflineDB,
} from './offlineDb';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('prime_simulate_offline') === 'true';
    } catch {
      return false;
    }
  });

  const [pendingActions, setPendingActions] = useState<PendingOfflineAction[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Effective offline flag is true if real network is offline OR user toggled simulated offline
  const isOffline = !isOnline || isSimulatedOffline;

  const refreshPendingActions = useCallback(async () => {
    try {
      const actions = await getPendingOfflineActions();
      setPendingActions(actions);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingActions();
    };

    const handleActionQueued = () => {
      refreshPendingActions();
    };

    const handleSynced = () => {
      refreshPendingActions();
      setLastSyncTime('Just now');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('prime-offline-action-queued', handleActionQueued);
    window.addEventListener('prime-offline-synced', handleSynced);

    refreshPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('prime-offline-action-queued', handleActionQueued);
      window.removeEventListener('prime-offline-synced', handleSynced);
    };
  }, [refreshPendingActions]);

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('prime_simulate_offline', String(next));
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent('prime-offline-mode-changed', { detail: { isOffline: next } }));
      return next;
    });
  };

  const syncNow = async () => {
    if (!isOnline && isSimulatedOffline) {
      // If simulated, turn off simulation to simulate reconnecting
      setIsSimulatedOffline(false);
      sessionStorage.setItem('prime_simulate_offline', 'false');
    }

    setIsSyncing(true);
    try {
      await markOfflineActionsSynced();
      await Promise.all([getDashboardFromOfflineDB(), getHealthRecordsFromOfflineDB()]);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOffline,
    isRealOffline: !isOnline,
    isSimulatedOffline,
    toggleSimulateOffline,
    pendingActionsCount: pendingActions.length,
    lastSyncTime,
    isSyncing,
    syncNow,
  };
}
