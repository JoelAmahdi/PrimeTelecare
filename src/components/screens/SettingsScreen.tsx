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
  ScanFace,
  Fingerprint,
  CheckCircle2,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { ScreenId, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import {
  getBiometricSettings,
  saveBiometricSettings,
  BiometricType,
} from '../../utils/biometrics';
import { GoogleCalendarSyncModal } from '../common/GoogleCalendarSyncModal';
import {
  isGoogleCalendarConnected,
  getGoogleCalendarUser,
} from '../../services/googleCalendar';

interface SettingsScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  onOpenLogoutModal: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onNavigate, onOpenLogoutModal }) => {
  const [reminders, setReminders] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(isGoogleCalendarConnected());

  // Biometric state
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);
  const [biometricType, setBiometricType] = useState<BiometricType>('faceid');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadSettings = () => {
    const settings = getBiometricSettings();
    setBiometricEnabled(settings.enabled);
    setBiometricType(settings.type);
    setCalendarConnected(isGoogleCalendarConnected());
  };

  useEffect(() => {
    loadSettings();
    const handleUpdate = () => loadSettings();
    const handleCalendarUpdate = () => setCalendarConnected(isGoogleCalendarConnected());

    window.addEventListener('biometric-settings-updated', handleUpdate);
    window.addEventListener('google-calendar-auth-changed', handleCalendarUpdate);
    return () => {
      window.removeEventListener('biometric-settings-updated', handleUpdate);
      window.removeEventListener('google-calendar-auth-changed', handleCalendarUpdate);
    };
  }, []);

  const showToast = (msg: string, _type?: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleBiometric = () => {
    triggerHaptic('medium');
    const nextState = !biometricEnabled;
    setBiometricEnabled(nextState);
    saveBiometricSettings({
      enabled: nextState,
    });
    showToast(
      nextState
        ? `Biometric Lock Enabled for Sign In & Health Records`
        : 'Biometric Lock Disabled'
    );
  };

  const handleSelectBiometricType = (type: BiometricType) => {
    triggerHaptic('selection');
    setBiometricType(type);
    saveBiometricSettings({
      type,
    });
    showToast(`Switched biometric method to ${type === 'faceid' ? 'Face ID' : 'Touch ID / Fingerprint'}`);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 sm:pb-32 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" />
      
      <Header
        title="Profile & Settings"
        showBack
        onBack={() => onNavigate(user.role === 'doctor' ? 'doctor-home' : 'patient-home')}
      />

      <div className="px-1 sm:px-4 space-y-3.5 mt-3">
        {/* 1. Main Profile Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold font-outfit text-[#022434] text-lg leading-tight">{user.name}</h2>
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
                {user.role === 'doctor' ? `Doctor • ${user.email}` : `Patient • ${user.email}`}
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

          {/* Biometric Security Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#006c44] border border-emerald-100 shrink-0 mt-0.5">
                  {biometricType === 'faceid' ? (
                    <ScanFace className="w-5 h-5" />
                  ) : (
                    <Fingerprint className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold font-outfit text-[#022434] text-sm">
                      Biometric Security Lock
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-outfit border ${
                        biometricEnabled
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {biometricEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleBiometric}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 flex items-center shrink-0 ml-2 ${
                  biometricEnabled ? 'bg-[#006c44] justify-end' : 'bg-slate-200 justify-start'
                }`}
                title="Toggle biometric authentication"
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            {/* Biometric Method Selector & Test Scan */}
            {biometricEnabled && (
              <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-outfit">
                  <span className="text-slate-600 font-semibold">Authentication Method:</span>
                  <span className="text-[#006c44] font-bold flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Active for Login & Records</span>
                  </span>
                </div>

                {/* Method Selector Pills: Face ID & Finger Touch */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleSelectBiometricType('faceid')}
                    className={`py-2 px-3 rounded-xl font-bold font-outfit text-xs flex items-center justify-center space-x-2 transition-all ${
                      biometricType === 'faceid'
                        ? 'bg-[#022434] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>Face ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectBiometricType('fingerprint')}
                    className={`py-2 px-3 rounded-xl font-bold font-outfit text-xs flex items-center justify-center space-x-2 transition-all ${
                      biometricType === 'fingerprint'
                        ? 'bg-[#022434] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Touch ID / Fingerprint</span>
                  </button>
                </div>
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
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 font-outfit shrink-0">
                    COMPLIANCE
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-nunito mt-0.5 truncate">
                  View encryption details, privacy policies, MFA & data retention.
                </p>
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
                  <span className="bg-emerald-100 text-[#006c44] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 font-outfit shrink-0">
                    READ-ONLY LOG
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-nunito mt-0.5 truncate">
                  View read-only NDPA log of health record access history in Health Records.
                </p>
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

        {/* 3. Appointment Reminders Card */}
        <div className="bg-white rounded-[22px] border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Bell className="w-4 h-4 text-[#0284c7]" />
              </div>
              <span className="font-semibold font-outfit text-[#022434] text-sm">Push Notifications</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setReminders(!reminders);
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                reminders ? 'bg-[#022434] justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <span className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform"></span>
            </button>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Mail className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="font-semibold font-outfit text-[#022434] text-sm block">SMS Appointment Reminders</span>
                <span className="text-[11px] text-slate-400 font-nunito">Text messages for unreliable internet</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                showToast('SMS Reminders Enabled for low-data reliability');
              }}
              className="w-11 h-6 rounded-full p-0.5 bg-[#022434] flex items-center justify-end"
            >
              <span className="w-5 h-5 bg-white rounded-full shadow-md"></span>
            </button>
          </div>
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
              <p className="text-xs text-slate-500 font-nunito mt-0.5 truncate">
                Sync appointments, manage clinical slots & receive 15m/1h Google reminders.
              </p>
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

          {role === 'doctor' && (
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
    </div>
  );
};

