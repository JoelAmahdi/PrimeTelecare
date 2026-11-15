import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Prime Telecare App Error]', error, errorInfo);
  }

  private handleReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.update()));
      }
    } catch {}
    window.location.reload();
  };

  private handleClearAndReset = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch (e) {
      console.warn('Reset error:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#022434] text-white flex flex-col items-center justify-center p-6 text-center font-outfit">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Prime Telecare Recovery
          </h1>
          <p className="text-sm text-slate-300 font-nunito max-w-sm mb-6">
            The application encountered a display refresh issue on your device. Tap below to reload or reset the session cleanly.
          </p>

          {this.state.error?.message && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-slate-400 max-w-sm w-full mb-6 text-left overflow-x-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={this.handleReload}
              className="w-full py-3.5 bg-[#77daa4] hover:bg-[#006c44] text-[#022434] hover:text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>

            <button
              onClick={this.handleClearAndReset}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer border border-white/10"
            >
              <Trash2 className="w-4 h-4 text-slate-400" />
              <span>Clear Cache & Restart Fresh</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
