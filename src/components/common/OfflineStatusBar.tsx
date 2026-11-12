import React, { useState } from 'react';
import { WifiOff, Database, RefreshCw, CheckCircle2, ChevronRight, HardDrive, Wifi, Sparkles, AlertCircle } from 'lucide-react';
import { useOfflineStatus } from '../../utils/useOfflineStatus';
import { triggerHaptic } from '../../utils/haptics';
import { ScreenId } from '../../types';

interface OfflineStatusBarProps {
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({ currentScreen, onNavigate }) => {
  const {
    isOffline,
    isSimulatedOffline,
    toggleSimulateOffline,
    pendingActionsCount,
    lastSyncTime,
    isSyncing,
    syncNow,
  } = useOfflineStatus();

  const [isExpanded, setIsExpanded] = useState(false);

  // Only render when the app is genuinely offline
  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-[#022434] text-white border-b border-amber-500/40 shadow-lg px-4 py-2.5 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Main Info */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold font-outfit text-xs sm:text-sm text-amber-300 flex items-center space-x-1.5">
                  <span>Offline Mode</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate font-nunito mt-0.5">
                Viewing cached records • Changes will sync automatically when reconnected
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            {pendingActionsCount > 0 && (
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-1 rounded-lg">
                {pendingActionsCount} local action{pendingActionsCount > 1 ? 's' : ''} queued
              </span>
            )}

            {currentScreen !== 'health-records' && onNavigate && (
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigate('health-records');
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-outfit text-xs rounded-xl border border-slate-700 transition-colors flex items-center space-x-1"
              >
                <span>Health Records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentScreen !== 'patient-home' && currentScreen !== 'doctor-home' && currentScreen !== 'admin-dashboard' && onNavigate && (
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigate('patient-home');
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-outfit text-xs rounded-xl border border-slate-700 transition-colors flex items-center space-x-1"
              >
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic('medium');
                syncNow();
              }}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-outfit text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : isSimulatedOffline ? 'Restore Online' : 'Retry Sync'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
