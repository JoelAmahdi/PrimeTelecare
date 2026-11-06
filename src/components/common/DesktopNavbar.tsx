import React, { useState } from 'react';
import {
  Home,
  Calendar,
  FolderHeart,
  User,
  Users,
  FileText,
  ShieldCheck,
  HeartPulse,
  Bell,
  ChevronDown,
  LogOut,
  Stethoscope,
  Activity,
  Search,
} from 'lucide-react';
import { ScreenId, UserRole, User as UserType } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface DesktopNavbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  user: UserType;
  isEmulatorActive?: boolean;
  onToggleEmulator?: () => void;
  onOpenLogoutModal?: () => void;
}

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  currentScreen,
  onNavigate,
  role,
  onRoleChange,
  user,
  onOpenLogoutModal,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Hidden during full-screen video consultation calls
  if (currentScreen === 'video-call') {
    return null;
  }

  const patientLinks = [
    { id: 'patient-home' as ScreenId, label: 'Dashboard', icon: Home },
    { id: 'book-consultation' as ScreenId, label: 'Book Visit', icon: Calendar },
    { id: 'doctor-discovery' as ScreenId, label: 'Find Doctors', icon: HeartPulse },
    { id: 'health-records' as ScreenId, label: 'Medical Records', icon: FolderHeart },
    { id: 'active-chat' as ScreenId, label: 'Consultations', icon: Users },
  ];

  const doctorLinks = [
    { id: 'doctor-home' as ScreenId, label: 'Clinical Home', icon: Home },
    { id: 'active-chat' as ScreenId, label: 'Patient Queue', icon: Users },
    { id: 'new-prescription' as ScreenId, label: 'Prescriptions', icon: FileText },
    { id: 'withdrawal' as ScreenId, label: 'Payouts', icon: Activity },
  ];

  const adminLinks = [
    { id: 'admin-dashboard' as ScreenId, label: 'Overview', icon: ShieldCheck },
    { id: 'doctor-discovery' as ScreenId, label: 'Clinicians', icon: Stethoscope },
    { id: 'settings' as ScreenId, label: 'Settings', icon: User },
  ];

  const activeLinks =
    role === 'admin' ? adminLinks : role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs font-nunito">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Certifications */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => {
                triggerHaptic('light');
                onNavigate(role === 'doctor' ? 'doctor-home' : role === 'admin' ? 'admin-dashboard' : 'patient-home');
              }}
              className="flex items-center space-x-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#006c44] to-[#77daa4] flex items-center justify-center text-[#022434] font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                P
              </div>
              <div>
                <span className="font-extrabold font-outfit text-base text-[#022434] tracking-tight block leading-none">
                  Prime Telecare
                </span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block mt-0.5">
                  Clinical Cloud Suite
                </span>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-1 pl-4 border-l border-slate-200">
              {activeLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentScreen === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      onNavigate(link.id);
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-outfit transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-[#006c44] font-extrabold shadow-2xs'
                        : 'text-slate-600 hover:text-[#022434] hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Role Pill, Emulator Switch, Profile & Alerts */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onRoleChange('patient');
                  if (currentScreen === 'doctor-home' || currentScreen === 'admin-dashboard') {
                    onNavigate('patient-home');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-outfit transition-all cursor-pointer ${
                  role === 'patient'
                    ? 'bg-[#006c44] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Patient
              </button>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onRoleChange('doctor');
                  if (currentScreen === 'patient-home' || currentScreen === 'admin-dashboard') {
                    onNavigate('doctor-home');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-outfit transition-all cursor-pointer ${
                  role === 'doctor'
                    ? 'bg-[#006c44] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Doctor
              </button>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onRoleChange('admin');
                  onNavigate('admin-dashboard');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-outfit transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-[#006c44] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                />
                <span className="font-bold text-xs text-[#022434] font-outfit hidden lg:inline max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 font-nunito animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-xs text-[#022434] truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#006c44] text-[10px] font-bold mt-1 uppercase">
                      {role} Account
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsProfileMenuOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsProfileMenuOpen(false);
                      onNavigate('security-center');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Security & Trust</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      triggerHaptic('heavy');
                      setIsProfileMenuOpen(false);
                      if (onOpenLogoutModal) {
                        onOpenLogoutModal();
                      } else {
                        onNavigate('welcome');
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

