import React from 'react';
import { Home, Calendar, FolderHeart, User, Users, FileText, ShieldCheck, HeartPulse, Building2 } from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  role: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, role }) => {
  // Do not disrupt active video consultation call
  if (currentScreen === 'video-call') {
    return null;
  }

  const handleNav = (screen: ScreenId) => {
    triggerHaptic('selection');
    onNavigate(screen);
  };


  if (role === 'admin') {
    const adminTabs = [
      {
        id: 'admin-dashboard' as ScreenId,
        label: 'Overseer',
        icon: ShieldCheck,
        isActive: currentScreen === 'admin-dashboard',
      },

      {
        id: 'doctor-discovery' as ScreenId,
        label: 'Doctors',
        icon: HeartPulse,
        isActive: currentScreen === 'doctor-discovery',
      },
      {
        id: 'settings' as ScreenId,
        label: 'Profile',
        icon: User,
        isActive: currentScreen === 'settings',
      },
    ];

    return (
      <nav aria-label="Admin Navigation" className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-lg mx-auto z-40">
        <div className="bg-[#022434]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-full p-1.5 flex items-center justify-between text-white">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id)}
                aria-current={tab.isActive ? 'page' : undefined}
                className={`flex-1 flex items-center justify-center space-x-1.5 min-h-[44px] px-2 py-2 rounded-full text-[11px] sm:text-xs font-outfit transition-colors duration-150 outline-none ${
                  tab.isActive
                    ? 'bg-[#77daa4] text-[#022434] font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.isActive && <span className="whitespace-nowrap font-bold truncate max-w-[80px] sm:max-w-none">{tab.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (role === 'patient') {
    const tabs = [
      {
        id: 'patient-home' as ScreenId,
        label: 'Home',
        icon: Home,
        isActive: currentScreen === 'patient-home',
      },
      {
        id: 'book-consultation' as ScreenId,
        label: 'Consultation',
        icon: Calendar,
        isActive: currentScreen === 'book-consultation' || currentScreen === 'doctor-profile' || currentScreen === 'doctor-discovery',
      },
      {
        id: 'health-records' as ScreenId,
        label: 'Records',
        icon: FolderHeart,
        isActive: currentScreen === 'health-records',
      },
      {
        id: 'settings' as ScreenId,
        label: 'Profile',
        icon: User,
        isActive: currentScreen === 'settings',
      },
    ];

    return (
      <nav aria-label="Patient Navigation" className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-lg mx-auto z-40">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-full p-1.5 flex items-center justify-between">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id)}
                aria-current={tab.isActive ? 'page' : undefined}
                className={`flex-1 flex items-center justify-center space-x-1.5 min-h-[44px] px-2 py-2 rounded-full text-[11px] sm:text-xs font-outfit transition-colors duration-150 outline-none ${
                  tab.isActive
                    ? 'bg-[#1c3a4a] text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.isActive && <span className="whitespace-nowrap font-bold truncate max-w-[80px] sm:max-w-none">{tab.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Doctor Navigation
  const doctorTabs = [
    {
      id: 'doctor-home' as ScreenId,
      label: 'Dashboard',
      icon: Home,
      isActive: currentScreen === 'doctor-home',
    },
    {
      id: 'active-chat' as ScreenId,
      label: 'Sessions',
      icon: Users,
      isActive: currentScreen === 'active-chat',
    },
    {
      id: 'new-prescription' as ScreenId,
      label: 'Prescriptions',
      icon: FileText,
      isActive: currentScreen === 'new-prescription' || currentScreen === 'prescription-detail',
    },
    {
      id: 'settings' as ScreenId,
      label: 'Profile',
      icon: User,
      isActive: currentScreen === 'settings',
    },
  ];

  return (
    <nav aria-label="Doctor Navigation" className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-lg mx-auto z-40">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-full p-1.5 flex items-center justify-between">
        {doctorTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              aria-current={tab.isActive ? 'page' : undefined}
              className={`flex-1 flex items-center justify-center space-x-1.5 min-h-[44px] px-2 py-2 rounded-full text-[11px] sm:text-xs font-outfit transition-colors duration-150 outline-none ${
                tab.isActive
                  ? 'bg-[#1c3a4a] text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.isActive && <span className="whitespace-nowrap font-bold truncate max-w-[80px] sm:max-w-none">{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
