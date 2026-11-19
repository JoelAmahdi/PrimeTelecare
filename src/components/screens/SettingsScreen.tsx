import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  User as UserIcon,
  Pencil,
  Lock,
  CreditCard,
  Calendar,
  Bell,
  Mail,
  ShieldCheck,
  FileText,
  HelpCircle,
  PhoneCall,
  LogOut,
  ChevronRight,
  Star,
  UserPlus,
  Trash2,
  Share2,
  Info,
  CheckCircle2,
  KeyRound,
  Smartphone,
  Volume2,
  MessageSquare,
  Pill,
  Sparkles,
} from 'lucide-react';
import { ScreenId, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import {
  getBiometricSettings,
  saveBiometricSettings,
} from '../../utils/biometrics';
import { GoogleCalendarSyncModal } from '../common/GoogleCalendarSyncModal';
import { QuickLoginSetupModal } from '../common/QuickLoginSetupModal';
import {
  isGoogleCalendarConnected,
} from '../../services/googleCalendar';
import {
  getPhoneNotificationSettings,
  updatePhoneNotificationSettings,
  getPhoneNotificationPermission,
  requestPhoneNotificationPermission,
  sendTestPhoneNotification,
  PhoneNotificationSettings,
} from '../../services/phoneNotifications';

interface SettingsScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  onOpenLogoutModal: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onNavigate, onOpenLogoutModal }) => {
  const [reminders, setReminders] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(isGoogleCalendarConnected());

  // Phone & Device Notification Preferences
  const [phoneNotifSettings, setPhoneNotifSettings] = useState<PhoneNotificationSettings>(getPhoneNotificationSettings());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(getPhoneNotificationPermission());
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  // Security PIN Lock state
  const [pinLockEnabled, setPinLockEnabled] = useState<boolean>(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadSettings = () => {
    const settings = getBiometricSettings();
    setPinLockEnabled(settings.enabled);
    setCalendarConnected(isGoogleCalendarConnected());
    setPhoneNotifSettings(getPhoneNotificationSettings());
    setNotifPermission(getPhoneNotificationPermission());
  };

  useEffect(() => {
    loadSettings();
    const handleUpdate = () => loadSettings();
    const handleCalendarUpdate = () => setCalendarConnected(isGoogleCalendarConnected());

    window.addEventListener('biometric-settings-updated', handleUpdate);
    window.addEventListener('google-calendar-auth-changed', handleCalendarUpdate);
    window.addEventListener('phone-notifications-settings-updated', handleUpdate);
    window.addEventListener('phone-notification-permission-changed', handleUpdate);
    return () => {
      window.removeEventListener('biometric-settings-updated', handleUpdate);
      window.removeEventListener('google-calendar-auth-changed', handleCalendarUpdate);
      window.removeEventListener('phone-notifications-settings-updated', handleUpdate);
      window.removeEventListener('phone-notification-permission-changed', handleUpdate);
    };
  }, []);

  const showToast = (msg: string, _type?: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleTogglePinLock = () => {
    triggerHaptic('medium');
    const nextState = !pinLockEnabled;
    setPinLockEnabled(nextState);
    saveBiometricSettings({
      enabled: nextState,
    });
    showToast(
      nextState
        ? 'PIN & Password Security Lock Enabled'
        : 'PIN & Password Security Lock Disabled'
    );
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 sm:pb-32 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" />
      
      <Header
        title="Profile & Settings"
        showBack
        onBack={() => onNavigate(user?.role === 'doctor' ? 'doctor-home' : user?.role === 'admin' ? 'admin-dashboard' : 'patient-home')}
      />

      <div className="px-1 sm:px-4 space-y-3.5 mt-3">
        {/* 1. Main Profile Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={user?.name || 'User'}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold font-outfit text-[#022434] text-lg leading-tight">{user?.name || 'Prime Telecare User'}</h2>
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('account-details');
                  }}
                  className="p-1 text-slate-400 hover:text-[#022434] transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-nunito mt-0.5">
                {user?.role === 'doctor' ? `Doctor • ${user?.email || ''}` : user?.role === 'admin' ? `Admin • ${user?.email || ''}` : `Patient • ${user?.email || ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-3">
          <div className="px-1 flex items-center justify-between">
            <span className="text-xs font-extrabold font-outfit text-[#022434] uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#006c44]" />
              <span>Security</span>
            </span>
          </div>

          {/* PIN & Password Security Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#006c44] border border-emerald-100 shrink-0 mt-0.5">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold font-outfit text-[#022434] text-sm">
                      PIN & Password Lock
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-outfit border ${
                        pinLockEnabled
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {pinLockEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePinLock}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 flex items-center shrink-0 ml-2 cursor-pointer ${
                  pinLockEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-200 justify-start'
                }`}
                title="Toggle PIN & password lock"
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            {pinLockEnabled && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-semibold font-outfit">
                  4-Digit Security PIN
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setIsPinModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#022434] hover:bg-[#006c44] text-white font-bold font-outfit text-xs transition-colors cursor-pointer"
                >
                  Set / Change PIN
                </button>
              </div>
            )}
          </div>

          {/* Security & Compliance Center Card */}
          <div
            onClick={() => onNavigate('security-center')}
            className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#006c44] transition-all group"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold font-outfit text-[#022434] text-sm group-hover:text-indigo-700 transition-colors truncate">
                    Trust & Security Center
                  </h3>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Health Record Access Audit Trail Section */}
          <div
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('health-records');
            }}
            className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#006c44] transition-all group"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="p-2.5 rounded-2xl bg-[#022434] text-white shrink-0">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold font-outfit text-[#022434] text-sm group-hover:text-[#006c44] transition-colors truncate">
                    Health Record Access Audit Trail
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <span className="text-xs font-bold text-[#006c44] font-outfit hidden sm:inline">Go to Records</span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#006c44] group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
        <div
          onClick={() => {
            triggerHaptic('selection');
            showToast('Thank you for rating Prime Telecare!', 'success');
          }}
          className="bg-white px-5 py-4 rounded-[22px] border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <span className="font-semibold font-outfit text-[#022434] text-sm">Rate us</span>
          </div>
          <span className="text-xs font-nunito text-slate-400 font-medium">It's important for us</span>
        </div>

        {/* 3. Phone & Native Device Push Notifications Card */}
        <div className="bg-white rounded-[22px] border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
          {/* Master Toggle Row */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50/50 to-white">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#006c44] border border-emerald-200/60 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-extrabold font-outfit text-[#022434] text-sm">
                    Phone & Device Notifications
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      notifPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : notifPermission === 'denied'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {notifPermission === 'granted'
                      ? '✓ Active & Ringing'
                      : notifPermission === 'denied'
                      ? '✕ Blocked in Browser'
                      : '⚡ Tap to Enable'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-nunito mt-0.5">
                  Rings phone for incoming calls, vibrates for new texts & clinical updates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                triggerHaptic('medium');
                if (!phoneNotifSettings.enabled || notifPermission !== 'granted') {
                  const perm = await requestPhoneNotificationPermission();
                  setNotifPermission(perm);
                  if (perm === 'granted') {
                    updatePhoneNotificationSettings({ enabled: true });
                    showToast('Phone notifications enabled!', 'success');
                  } else if (perm === 'denied') {
                    showToast('Notification permission blocked in browser settings', 'warning');
                  } else {
                    updatePhoneNotificationSettings({ enabled: true });
                  }
                } else {
                  updatePhoneNotificationSettings({ enabled: false });
                  showToast('Phone notifications paused', 'info');
                }
              }}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 cursor-pointer ${
                phoneNotifSettings.enabled && notifPermission === 'granted'
                  ? 'bg-[#006c44] justify-end'
                  : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-5.5 h-5.5 bg-white rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Granular Sub-options (visible when enabled) */}
          {phoneNotifSettings.enabled && (
            <>
              {/* Call Ringtones & Vibrations */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold font-outfit text-xs text-[#022434] block">
                      Incoming Call Ringtones & Vibrations
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Rings your device continuously until answered or declined
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updatePhoneNotificationSettings({ callsEnabled: !phoneNotifSettings.callsEnabled });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    phoneNotifSettings.callsEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              {/* Chat & Text Message Alerts */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold font-outfit text-xs text-[#022434] block">
                      Chat & Text Message Chimes
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dual-tone chime & double-pulse vibration for instant messages
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updatePhoneNotificationSettings({ textsEnabled: !phoneNotifSettings.textsEnabled });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    phoneNotifSettings.textsEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              {/* Appointment Alerts */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-semibold font-outfit text-xs text-[#022434] block">
                      Appointments & Reschedules
                    </span>
                    <span className="text-[11px] text-slate-400">
                      15-min start reminder and schedule change notices
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updatePhoneNotificationSettings({ appointmentsEnabled: !phoneNotifSettings.appointmentsEnabled });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    phoneNotifSettings.appointmentsEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              {/* Prescriptions & Deliveries */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Pill className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold font-outfit text-xs text-[#022434] block">
                      Prescriptions & Medication Refills
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Immediate alert when doctor signs digital Rx
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updatePhoneNotificationSettings({ prescriptionsEnabled: !phoneNotifSettings.prescriptionsEnabled });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    phoneNotifSettings.prescriptionsEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              {/* Audio Chimes Switch */}
              <div className="px-5 py-3 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-4 h-4 text-slate-600 shrink-0" />
                  <div>
                    <span className="font-semibold font-outfit text-xs text-[#022434] block">
                      Acoustic Sound & Chimes
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Plays clean audio tones alongside mobile vibration
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updatePhoneNotificationSettings({ soundEnabled: !phoneNotifSettings.soundEnabled });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    phoneNotifSettings.soundEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              {/* Test Phone Notification Button */}
              <div className="p-3 bg-white flex justify-center">
                <button
                  type="button"
                  disabled={isTestingNotification}
                  onClick={async () => {
                    triggerHaptic('medium');
                    setIsTestingNotification(true);
                    try {
                      const sent = await sendTestPhoneNotification();
                      if (sent) {
                        showToast('Test phone alert sent! Check your notification shade.', 'success');
                      } else {
                        showToast('Please allow notification permission first.', 'warning');
                      }
                    } finally {
                      setIsTestingNotification(false);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-[#006c44] text-[#022434] font-extrabold font-outfit text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isTestingNotification ? 'Sending Alert...' : 'Test Phone Ringtone & Notification'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Google Calendar Integration Card */}
        <div
          onClick={() => {
            triggerHaptic('selection');
            setIsCalendarModalOpen(true);
          }}
          className="bg-white p-4.5 rounded-[22px] border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all group"
        >
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-outfit text-[#022434] text-sm group-hover:text-blue-700 transition-colors truncate">
                  Google Calendar Sync
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-outfit border shrink-0 ${
                    calendarConnected
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {calendarConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <span className="text-xs font-bold text-blue-600 font-outfit hidden sm:inline">
              {calendarConnected ? 'View Schedule' : 'Connect'}
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* 4. Share App / Invite Partner Card */}
        <div
          onClick={() => {
            triggerHaptic('selection');
            showToast('Invite link copied to clipboard!', 'success');
          }}
          className="bg-white px-5 py-4 rounded-[22px] border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <UserPlus className="w-4 h-4 text-purple-600" />
            </div>
            <span className="font-semibold font-outfit text-[#022434] text-sm">Invite partner / friend</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>

        {/* 5. Comprehensive Grouped Navigation Menu Card */}
        <div className="bg-white rounded-[26px] border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-100">
          <button
            onClick={() => onNavigate('account-details')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
          >
            <div className="flex items-center space-x-3.5">
              <UserIcon className="w-4 h-4 text-[#006c44]" />
              <div>
                <span className="font-semibold font-outfit text-[#022434] text-sm block">Account Details & Information Correction</span>
                <span className="text-[11px] text-slate-400 font-nunito">Edit personal info, contact details & health profile</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigate('health-records');
            }}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-emerald-50/50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3.5">
              <FileText className="w-4 h-4 text-[#006c44]" />
              <div>
                <span className="font-semibold font-outfit text-[#022434] text-sm block">Health Record Access Audit Trail</span>
                <span className="text-[11px] text-emerald-700 font-bold font-nunito">Read-only log of who accessed your records & why</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#006c44]" />
          </button>

          {user?.role === 'doctor' && (
            <button
              onClick={() => onNavigate('withdrawal')}
              className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-emerald-50/50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-semibold font-outfit text-[#022434] text-sm block">Withdrawal Page & Payouts</span>
                  <span className="text-[11px] text-emerald-600 font-bold font-nunito">Transfer wallet earnings to bank</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          <button
            onClick={() => onNavigate('book-consultation')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
          >
            <div className="flex items-center space-x-3.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Consultation History</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => onNavigate('payment')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
          >
            <div className="flex items-center space-x-3.5">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Payment Methods</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('security-center');
            }}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Security & Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => onNavigate('terms')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3.5">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Privacy Statement</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => onNavigate('terms')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Terms of Use</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              showToast('Prime Telecare Platform v1.2.0 • MDCN Certified Telehealth', 'info');
            }}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">About us</span>
            </div>
            <span className="text-xs text-slate-400 font-nunito">v1.2.0</span>
          </button>
        </div>

        {/* 6. Contact Us Card */}
        <div
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('active-chat');
          }}
          className="bg-white px-5 py-4 rounded-[22px] border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Mail className="w-4 h-4 text-[#022434]" />
            </div>
            <span className="font-semibold font-outfit text-[#022434] text-sm">Contact us</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>

        {/* 7. Delete Account Option */}
        <div className="pt-1">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              showToast('Account closure request logged with clinical governance.', 'info');
            }}
            className="w-full py-3 text-center text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
          >
            Delete Account
          </button>
        </div>

        {/* 8. Log Out Button */}
        <button
          onClick={onOpenLogoutModal}
          className="w-full py-4 bg-white border border-slate-200/80 rounded-[22px] flex items-center justify-center space-x-2.5 text-rose-600 font-bold font-outfit text-sm shadow-xs hover:bg-rose-50/40 transition-all active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Log out</span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#022434] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-outfit font-semibold flex items-center space-x-2 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Google Calendar Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* Security PIN Setup Modal */}
      <QuickLoginSetupModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onComplete={() => {
          setIsPinModalOpen(false);
          showToast('Security PIN updated successfully!');
        }}
        userRole={user?.role}
        userName={user?.name}
      />
    </div>
  );
};

