import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Smartphone, Volume2, ShieldCheck } from 'lucide-react';
import {
  isPhoneNotificationSupported,
  getPhoneNotificationPermission,
  requestPhoneNotificationPermission,
  sendTestPhoneNotification,
} from '../../services/phoneNotifications';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface PhoneNotificationBannerProps {
  className?: string;
}

const DISMISS_KEY = 'prime_telecare_phone_notif_banner_dismissed_v1';

export const PhoneNotificationBanner: React.FC<PhoneNotificationBannerProps> = ({ className = '' }) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!isPhoneNotificationSupported()) {
      setPermission('unsupported');
      return;
    }
    setPermission(getPhoneNotificationPermission());

    const handlePermChange = (e: any) => {
      setPermission(e.detail || getPhoneNotificationPermission());
    };

    window.addEventListener('phone-notification-permission-changed', handlePermChange);
    return () => {
      window.removeEventListener('phone-notification-permission-changed', handlePermChange);
    };
  }, []);

  // Do not render if notifications are already granted, unsupported, or user dismissed
  if (permission === 'granted' || permission === 'unsupported' || isDismissed) {
    return null;
  }

  const handleEnable = async () => {
    triggerHaptic('medium');
    setIsRequesting(true);
    try {
      const res = await requestPhoneNotificationPermission();
      if (res === 'granted') {
        triggerHaptic('success');
        showToast('Phone notifications enabled! You will now receive calls and text alerts.');
        sendTestPhoneNotification().catch(() => {});
      } else if (res === 'denied') {
        showToast('Notification permission was blocked in your browser settings.', 'info');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {}
  };

  return (
    <div
      className={`bg-gradient-to-r from-[#022434] via-[#03364f] to-[#006c44] text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-emerald-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start sm:items-center space-x-3">
        <div className="p-2.5 bg-emerald-500/20 text-[#77daa4] border border-emerald-400/30 rounded-xl shrink-0 mt-0.5 sm:mt-0">
          <Bell className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold font-outfit text-sm text-white flex items-center gap-1.5">
              <span>Enable Phone Notifications</span>
              <span className="text-[10px] font-mono font-bold bg-[#77daa4] text-[#022434] px-1.5 py-0.2 rounded-full uppercase">
                Calls & Texts
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-200 font-nunito leading-tight">
            Ring your phone for incoming doctor calls, patient text messages, and appointment reminders.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
        <button
          type="button"
          disabled={isRequesting}
          onClick={handleEnable}
          className="px-4 py-2 bg-[#77daa4] hover:bg-emerald-300 text-[#022434] font-extrabold font-outfit text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isRequesting ? 'Allowing...' : 'Turn On Alerts'}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss notification prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
