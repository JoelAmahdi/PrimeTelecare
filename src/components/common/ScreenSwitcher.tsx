import React, { useState } from 'react';
import { Layers, X, UserCheck, Stethoscope } from 'lucide-react';
import { ScreenId, UserRole } from '../../types';

interface ScreenSwitcherProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenLogoutModal: () => void;
}

const SCREENS: { id: ScreenId; label: string; number: number; category: 'auth' | 'patient' | 'doctor' | 'shared' }[] = [
  { id: 'welcome', label: '1. Welcome / Splash', number: 1, category: 'auth' },
  { id: 'terms', label: '2. Terms & Agreement', number: 2, category: 'auth' },
  { id: 'login', label: '3. Log In', number: 3, category: 'auth' },
  { id: 'signup', label: '4. Create Account', number: 4, category: 'auth' },
  { id: 'patient-home', label: '5. Patient Home Dashboard', number: 5, category: 'patient' },
  { id: 'doctor-home', label: '6. Doctor Dashboard', number: 6, category: 'doctor' },
  { id: 'book-consultation', label: '7. Book Consultation', number: 7, category: 'patient' },
  { id: 'payment', label: '8. Payment Screen', number: 8, category: 'patient' },
  { id: 'active-chat', label: '9. Active Chat Consultation', number: 9, category: 'shared' },
  { id: 'video-call', label: '10. Active Video Call', number: 10, category: 'shared' },
  { id: 'upload-media', label: '11. Upload Media', number: 11, category: 'patient' },
  { id: 'new-prescription', label: '12. New Prescription', number: 12, category: 'doctor' },
  { id: 'prescription-detail', label: '13. View Prescription', number: 13, category: 'shared' },
  { id: 'health-records', label: '14. Health Records', number: 14, category: 'patient' },
  { id: 'doctor-profile', label: '15. Doctor Detail Profile', number: 15, category: 'patient' },
  { id: 'settings', label: '16. Settings & Profile', number: 16, category: 'shared' },
];

export const ScreenSwitcher: React.FC<ScreenSwitcherProps> = ({
  currentScreen,
  onNavigate,
  role,
  onRoleChange,
  onOpenLogoutModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 flex items-center space-x-2 bg-[#022434] text-white px-3.5 py-2 rounded-full shadow-2xl border border-teal-400/30 hover:bg-[#1c3a4a] transition-all transform active:scale-95"
        title="Switch Screens (16 Screens available)"
      >
        <Layers className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-bold font-outfit">Screens (16)</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#022434]" />
                <h3 className="font-bold font-outfit text-[#022434]">App Screens (16)</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Perspective Switch */}
            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block mb-2 font-nunito">Active Role Perspective:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onRoleChange('patient');
                    onNavigate('patient-home');
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    role === 'patient'
                      ? 'bg-[#022434] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Patient</span>
                </button>
                <button
                  onClick={() => {
                    onRoleChange('doctor');
                    onNavigate('doctor-home');
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    role === 'doctor'
                      ? 'bg-[#006c44] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor</span>
                </button>
              </div>
            </div>

            {/* Screens List */}
            <div className="flex-1 space-y-1 overflow-y-auto pr-1">
              {SCREENS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    if (s.id === 'doctor-home' || s.id === 'new-prescription') {
                      onRoleChange('doctor');
                    } else if (s.category === 'patient' || s.id === 'patient-home') {
                      onRoleChange('patient');
                    }
                    onNavigate(s.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold font-nunito transition-all flex items-center justify-between ${
                    currentScreen === s.id
                      ? 'bg-[#022434] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{s.label}</span>
                  {currentScreen === s.id && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              ))}

              <button
                onClick={() => {
                  onOpenLogoutModal();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold font-nunito text-red-600 hover:bg-red-50 transition-all mt-3 border border-red-100 flex items-center justify-between"
              >
                <span>16. Log Out Confirmation Modal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
