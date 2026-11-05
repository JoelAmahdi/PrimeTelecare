import React from 'react';
import { Logo } from '../common/Logo';
import { StatusBar } from '../common/StatusBar';
import { ScreenId } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6f9f0] via-[#f6fafd] to-[#e6f9f0] flex flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 w-full max-w-xl mx-auto text-[#171c1f] relative overflow-hidden">
      <StatusBar className="-mx-5 sm:-mx-8 -mt-6 sm:-mt-8 mb-2" />
      
      {/* Top Spacer & Logo */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="transform hover:scale-105 transition-transform duration-300 my-2 flex justify-center w-full">
          <Logo size="sm" />
        </div>

        {/* Copy Text */}
        <div className="mt-8 text-center px-4 space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-[#006c44] text-xs font-bold font-outfit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MDCN Licensed Telehealth</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#022434] leading-tight">
            The future of family medicine in your pocket
          </h1>
          <p className="text-slate-600 font-nunito text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Connect with certified doctors for instant virtual consultations, digital prescriptions, lab tests, and encrypted records.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] w-full">
        <button
          onClick={() => {
            triggerHaptic('medium');
            onNavigate('signup');
          }}
          className="w-full min-h-[48px] py-3.5 px-6 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-base rounded-xl shadow-md transition-all transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 text-emerald-300" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('login');
          }}
          className="w-full text-center py-2.5 text-slate-700 hover:text-[#006c44] font-semibold font-outfit text-sm transition-colors cursor-pointer"
        >
          Already have an account? <span className="text-[#006c44] font-bold underline">Log In</span>
        </button>
      </div>
    </div>
  );
};
