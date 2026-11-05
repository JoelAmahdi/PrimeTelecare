import React from 'react';
import { Logo } from '../common/Logo';
import { StatusBar } from '../common/StatusBar';
import { ScreenId } from '../../types';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6f9f0] via-[#f6fafd] to-[#e6f9f0] flex flex-col justify-between p-6 sm:p-10 w-full max-w-2xl mx-auto text-[#171c1f] relative overflow-hidden">
      <StatusBar className="-mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-2" />
      {/* Top Spacer & Logo */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-6">
        <div className="transform hover:scale-105 transition-transform duration-300 my-2 flex justify-center w-full">
          <Logo size="sm" />
        </div>

        {/* Copy Text */}
        <div className="mt-8 text-center px-4 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#022434] leading-tight">
            Welcome to the future of family medicine
          </h1>
          <p className="text-[#42474c] font-nunito text-sm sm:text-base leading-relaxed px-2">
            Connect with licensed doctors for virtual consultations, prescriptions, lab tests, and health records.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] w-full">
        <button
          onClick={() => onNavigate('signup')}
          className="w-full py-4 bg-[#1c3a4a] text-white font-bold font-outfit text-base rounded-2xl shadow-lg hover:bg-[#022434] transition-all transform active:scale-98"
        >
          Get Started
        </button>

        <button
          onClick={() => onNavigate('login')}
          className="w-full text-center py-2 text-[#006c44] font-semibold font-nunito text-sm hover:underline"
        >
          Already have an account? <span className="font-bold">Log In</span>
        </button>
      </div>
    </div>
  );
};
