import React from 'react';

interface StatusBarProps {
  time?: string;
  carrier?: string;
  batteryLevel?: number;
  className?: string;
  dark?: boolean;
}

/**
 * Native phone status bar has been removed to keep the interface clean and production-ready.
 * Native iOS/Android/browser shells provide their own real hardware status bar.
 */
export const StatusBar: React.FC<StatusBarProps> = () => {
  return null;
};
