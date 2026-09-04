import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { BottomNav } from '../common/BottomNav';
import {
  User as UserIcon,
  Pencil,
  Lock,
  CreditCard,
  Heart,
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
  Info
} from 'lucide-react';
import { ScreenId, User } from '../../types';

interface SettingsScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  onOpenLogoutModal: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onNavigate, onOpenLogoutModal }) => {
  const [reminders, setReminders] = useState(true);

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" />
      
      <Header
        title="Profile & Settings"
        showBack
        onBack={() => onNavigate(user.role === 'doctor' ? 'doctor-home' : 'patient-home')}
      />

      <div className="px-1 sm:px-4 space-y-3.5 mt-3">
        {/* 1. Main Profile Card */}
        <div className="bg-white p-4 sm:p-5 rounded-[26px] border border-slate-100 shadow-xs flex items-center justify-between">
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
                  onClick={() => alert('Edit Profile')}
                  className="p-1 text-slate-400 hover:text-[#022434] transition-colors"
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

          <button
            onClick={() => onNavigate('health-records')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full text-xs font-semibold text-[#022434] font-outfit transition-all flex items-center space-x-1"
          >
            <Heart className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Records</span>
          </button>
        </div>

        {/* 2. Rate Us / Feedback Card */}
        <div
          onClick={() => alert('Thank you for rating our app!')}
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
        <div className="bg-white px-5 py-3.5 rounded-[22px] border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Bell className="w-4 h-4 text-[#0284c7]" />
            </div>
            <span className="font-semibold font-outfit text-[#022434] text-sm">Reminders</span>
          </div>
          <button
            type="button"
            onClick={() => setReminders(!reminders)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
              reminders ? 'bg-[#022434] justify-end' : 'bg-slate-200 justify-start'
            }`}
          >
            <span className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform"></span>
          </button>
        </div>

        {/* 4. Share App / Invite Partner Card */}
        <div
          onClick={() => alert('Invite link copied!')}
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
                <span className="font-semibold font-outfit text-[#022434] text-sm block">Account Details</span>
                <span className="text-[11px] text-slate-400 font-nunito">Personal info, verification & details</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

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
            onClick={() => alert('Security & Password Settings')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
          >
            <div className="flex items-center space-x-3.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Security & Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => onNavigate('terms')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
          >
            <div className="flex items-center space-x-3.5">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Privacy Statement</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => onNavigate('terms')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
          >
            <div className="flex items-center space-x-3.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="font-medium font-outfit text-[#022434] text-sm">Terms of Use</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => alert('About Application v1.2.0')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
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
          onClick={() => alert('Opening Support Chat...')}
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
            onClick={() => alert('Are you sure you want to delete your account?')}
            className="w-full py-3 text-center text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
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
    </div>
  );
};

