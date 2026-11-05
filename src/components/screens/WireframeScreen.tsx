import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle, ArrowLeft, SignalHigh, Wifi } from 'lucide-react';
import { ScreenId } from '../../types';

interface WireframeScreenProps {
  onRetry?: () => void;
  onNavigate?: (screen: ScreenId) => void;
  targetScreenName?: string;
  isSimulatedNetworkIssue?: boolean;
}

export const WireframeScreen: React.FC<WireframeScreenProps> = ({
  onRetry,
  onNavigate,
  targetScreenName = 'Page',
  isSimulatedNetworkIssue = true,
}) => {
  return (
    <div className="min-h-screen bg-[#1c3a4a] text-slate-100 flex flex-col font-nunito pb-24 relative overflow-hidden">
      {/* Network Issue Banner */}
      <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-3 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-outfit">
                Network Connection Issue
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-300">
              Showing wireframe blueprint for <strong className="text-white">{targetScreenName}</strong>
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-outfit text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Retry</span>
          </button>
        )}
      </div>

      {/* Screen Header Bar */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('patient-home')}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-slate-600 animate-pulse" />
            <span className="font-outfit font-bold text-sm text-slate-300 uppercase tracking-wider">
              [Wireframe Blueprint]
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <SignalHigh className="w-4 h-4 text-amber-400" />
          <span>OFFLINE PREVIEW</span>
        </div>
      </div>

      {/* Wireframe Canvas Area */}
      <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
        {/* User Header Skeleton */}
        <div className="bg-slate-800/60 border border-dashed border-slate-700/80 rounded-2xl p-4 flex items-center space-x-4 relative overflow-hidden">
          <div className="w-14 h-14 rounded-full bg-slate-700/80 shrink-0 border border-slate-600 border-dashed animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700/90 rounded-md w-3/4 animate-pulse" />
            <div className="h-3 bg-slate-700/50 rounded-md w-1/2 animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-700/60 border border-slate-600 border-dashed animate-pulse" />
        </div>

        {/* Search Bar Wireframe */}
        <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-xl p-3 flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-slate-700 animate-pulse shrink-0" />
          <div className="h-3 bg-slate-700/60 rounded-md w-full animate-pulse" />
          <div className="w-6 h-6 rounded-md bg-slate-700 animate-pulse shrink-0" />
        </div>

        {/* Action Grid Wireframes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-slate-700/80 rounded-md w-28 animate-pulse" />
            <div className="h-3 bg-slate-700/40 rounded-md w-16 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-dashed border-slate-700/80 rounded-2xl p-4 space-y-3 relative"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700/70 border border-slate-600/50 border-dashed animate-pulse" />
                <div className="h-3.5 bg-slate-700/90 rounded-md w-4/5 animate-pulse" />
                <div className="h-2.5 bg-slate-700/40 rounded-md w-3/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* List Items Wireframe */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-slate-700/80 rounded-md w-36 animate-pulse" />
            <div className="h-3 bg-slate-700/40 rounded-md w-12 animate-pulse" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-dashed border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-12 h-12 rounded-full bg-slate-700/80 border border-slate-600/50 border-dashed animate-pulse shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-3.5 bg-slate-700/90 rounded-md w-2/3 animate-pulse" />
                    <div className="h-2.5 bg-slate-700/50 rounded-md w-1/2 animate-pulse" />
                  </div>
                </div>
                <div className="w-16 h-8 rounded-xl bg-slate-700/60 border border-slate-600/50 border-dashed animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Network Error Control Footer Box */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-center space-y-3 mt-6">
          <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold font-outfit">
            <AlertTriangle className="w-4 h-4" />
            <span>Server Response Delayed</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Data cannot be synchronized right now. You are viewing the wireframe skeleton layout. Click below to re-establish connection.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-[#77daa4] hover:bg-[#62c992] text-[#1c3a4a] font-bold font-outfit text-sm py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Wifi className="w-4 h-4" />
              <span>Restore Connection & Load Live View</span>
            </button>
          )}

          {onNavigate && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
              <button
                onClick={() => onNavigate('patient-home')}
                className="bg-slate-700/80 hover:bg-slate-700 text-white font-bold font-outfit text-xs py-2 px-3 rounded-xl border border-slate-600 transition-colors"
              >
                Cached Dashboard
              </button>
              <button
                onClick={() => onNavigate('health-records')}
                className="bg-slate-700/80 hover:bg-slate-700 text-white font-bold font-outfit text-xs py-2 px-3 rounded-xl border border-slate-600 transition-colors"
              >
                Cached Health Records
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
