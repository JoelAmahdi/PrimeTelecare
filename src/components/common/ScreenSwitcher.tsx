import React, { useState } from 'react';
import { Layers, X, UserCheck, Stethoscope, ShieldCheck, Check } from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface ScreenSwitcherProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenLogoutModal: () => void;
}

const ALL_SCREENS: { id: ScreenId; label: string; number: number; category: 'auth' | 'patient' | 'doctor' | 'admin' | 'clinical' }[] = [
  { id: 'welcome', label: '1. Welcome & Splash', number: 1, category: 'auth' },
  { id: 'login', label: '2. Log In & Biometrics', number: 2, category: 'auth' },
  { id: 'signup', label: '3. Create Account', number: 3, category: 'auth' },
  { id: 'terms', label: '4. Terms of Care & Agreement', number: 4, category: 'auth' },
  { id: 'patient-home', label: '5. Patient Home Dashboard', number: 5, category: 'patient' },
  { id: 'book-consultation', label: '6. Book Consultation & Triage', number: 6, category: 'patient' },
  { id: 'doctor-discovery', label: '7. Doctors Discovery Roster', number: 7, category: 'patient' },
  { id: 'doctor-profile', label: '8. Doctor Profile & Reviews', number: 8, category: 'patient' },
  { id: 'payment', label: '9. Payment & Invoicing', number: 9, category: 'patient' },
  { id: 'active-chat', label: '10. Active Chat Consultation', number: 10, category: 'clinical' },
  { id: 'video-call', label: '11. Active HD Video Call', number: 11, category: 'clinical' },
  { id: 'health-records', label: '12. Health Records & Medical Wallet', number: 12, category: 'patient' },
  { id: 'new-prescription', label: '13. Issue E-Prescription (Doctor)', number: 13, category: 'doctor' },
  { id: 'prescription-detail', label: '14. Prescription Detail & Seal', number: 14, category: 'clinical' },
  { id: 'doctor-home', label: '15. Doctor Clinical Dashboard', number: 15, category: 'doctor' },
  { id: 'admin-dashboard', label: '16. Administrator Command Center', number: 16, category: 'admin' },
  { id: 'family-account', label: '17. Family Dependents Account', number: 17, category: 'patient' },
  { id: 'settings', label: '18. Account & Biometric Settings', number: 18, category: 'patient' },
  { id: 'security-center', label: '19. Trust & Security Center', number: 19, category: 'patient' },
  { id: 'account-details', label: '20. Account Profile Details', number: 20, category: 'patient' },
  { id: 'withdrawal', label: '21. Earnings & Withdrawal (Doctor)', number: 21, category: 'doctor' },
  { id: 'post-consultation-journey', label: '22. Post-Consultation Recovery', number: 22, category: 'patient' },
  { id: 'service-router', label: '23. Service Router & Triage', number: 23, category: 'patient' },
  { id: 'upload-media', label: '24. Upload Clinical Media', number: 24, category: 'patient' },
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
        onClick={() => {
          triggerHaptic('light');
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-20 right-4 z-40 flex items-center space-x-2 bg-[#022434] hover:bg-[#1c3a4a] text-white px-3.5 py-2.5 rounded-full shadow-2xl border border-teal-400/30 transition-all transform active:scale-95 cursor-pointer"
        title="Quick Navigate All Screens (24)"
      >
        <Layers className="w-4 h-4 text-[#77daa4]" />
        <span className="text-xs font-bold font-outfit">Screens (24)</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#006c44]" />
                <h3 className="font-bold font-outfit text-[#022434]">App Screens (24)</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Perspective Switch */}
            <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block mb-2 font-nunito">Active Role Perspective:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    onRoleChange('patient');
                    onNavigate('patient-home');
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1 py-2 rounded-xl text-xs font-bold font-outfit transition-all cursor-pointer ${
                    role === 'patient'
                      ? 'bg-[#006c44] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Patient</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    onRoleChange('doctor');
                    onNavigate('doctor-home');
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1 py-2 rounded-xl text-xs font-bold font-outfit transition-all cursor-pointer ${
                    role === 'doctor'
                      ? 'bg-[#022434] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    onRoleChange('admin');
                    onNavigate('admin-dashboard');
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-1 py-2 rounded-xl text-xs font-bold font-outfit transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-[#006c44] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Screens List */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {ALL_SCREENS.map((screen) => {
                const isActive = currentScreen === screen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      onNavigate(screen.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-outfit flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#006c44] text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{screen.label}</span>
                    {isActive && <Check className="w-4 h-4 text-emerald-300 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
