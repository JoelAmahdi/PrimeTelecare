import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';
import { UserRole, ScreenId } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface AccessDeniedScreenProps {
  currentRole: UserRole;
  requiredRole: UserRole | string;
  targetScreenName: string;
  onNavigateHome: () => void;
  onLogout: () => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  currentRole,
  requiredRole,
  targetScreenName,
  onNavigateHome,
  onLogout,
}) => {
  const formatRole = (r: string) => {
    if (r === 'doctor') return 'Doctor';
    if (r === 'admin') return 'Administrator';
    return 'Patient';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-nunito">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Shield Alert Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/80 mx-auto flex items-center justify-center text-rose-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
            Access Restricted
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-outfit text-[#022434]">
            {targetScreenName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This area requires a verified <strong className="text-slate-900">{formatRole(requiredRole)}</strong> account. 
            You are currently signed in as a <strong className="text-emerald-700">{formatRole(currentRole)}</strong>.
          </p>
        </div>

        {/* Policy Notice Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-bold font-outfit text-slate-800 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Role Segregation Security Policy</span>
          </p>
          <p className="text-[11px] text-slate-500 leading-normal">
            For medical safety and NDPA compliance, an account can only access the dashboard and clinical portal it was created for. To access another role, you must sign in with a different set of credentials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onNavigateHome();
            }}
            className="w-full py-3.5 px-4 bg-[#022434] hover:bg-[#1a3848] text-white rounded-2xl font-bold font-outfit text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onLogout();
            }}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold font-outfit text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out to Switch Account</span>
          </button>
        </div>

      </div>
    </div>
  );
};

