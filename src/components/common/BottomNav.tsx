import React from 'react';
import { Home, Calendar, FolderHeart, User, Users, FileText } from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  role: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, role }) => {
  const handleNav = (screen: ScreenId) => {
    triggerHaptic('selection');
    onNavigate(screen);
  };

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
        isActive: currentScreen === 'book-consultation' || currentScreen === 'doctor-profile',
      },
      {
        id: 'health-records' as ScreenId,
        label: 'Health Record',
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
      <div className="fixed bottom-3 left-3 right-3 max-w-lg mx-auto z-40">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-100/90 shadow-xl shadow-slate-900/10 rounded-full p-1.5 flex items-center justify-between">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-outfit transition-colors duration-150 outline-none ${
                  tab.isActive
                    ? 'bg-[#1c3a4a] text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.isActive && <span className="whitespace-nowrap font-bold">{tab.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
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
      isActive: currentScreen === 'active-chat' || currentScreen === 'video-call',
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
    <div className="fixed bottom-3 left-3 right-3 max-w-lg mx-auto z-40">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-100/90 shadow-xl shadow-slate-900/10 rounded-full p-1.5 flex items-center justify-between">
        {doctorTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-outfit transition-colors duration-150 outline-none ${
                tab.isActive
                  ? 'bg-[#1c3a4a] text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.isActive && <span className="whitespace-nowrap font-bold">{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
