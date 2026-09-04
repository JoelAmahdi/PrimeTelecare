import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Mail, Lock, Eye, EyeOff, UserCheck, Stethoscope } from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface CreateAccountScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSignupSuccess: (role: UserRole) => void;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ onNavigate, onSignupSuccess }) => {
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('email@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    onSignupSuccess(role);
  };

  const handleRoleSelect = (r: UserRole) => {
    triggerHaptic('selection');
    setRole(r);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] flex flex-col justify-between p-6 sm:p-10 w-full max-w-2xl mx-auto text-[#171c1f]">
      <div>
        <StatusBar className="-mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-2" />

        <Header title="Prime Telecare" showBack onBack={() => onNavigate('welcome')} />

        <div className="mt-4">
          <h1 className="text-2xl font-bold font-outfit text-[#022434] mb-4">Create Account</h1>

          {/* Role Segmented Selector */}
          <div className="grid grid-cols-2 gap-3 mb-5 p-1 bg-slate-200/50 rounded-2xl">
            <button
              type="button"
              onClick={() => handleRoleSelect('patient')}
              className={`py-3 rounded-xl font-bold font-outfit text-sm transition-all flex items-center justify-center space-x-2 ${
                role === 'patient'
                  ? 'bg-[#1c3a4a] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Patient</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('doctor')}
              className={`py-3 rounded-xl font-bold font-outfit text-sm transition-all flex items-center justify-center space-x-2 ${
                role === 'doctor'
                  ? 'bg-[#1c3a4a] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="border border-slate-300 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-transparent border-none text-sm font-nunito focus:outline-none text-[#171c1f]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="border border-slate-300 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-none text-sm font-nunito focus:outline-none text-[#171c1f]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#1c3a4a] text-white font-bold font-outfit text-base rounded-xl shadow-md hover:bg-[#022434] transition-all transform active:scale-98 mt-2"
            >
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-[#f6fafd] px-4 text-xs text-slate-400 font-nunito">or</span>
          </div>

          {/* Social Signups */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onSignupSuccess(role)}
              className="w-full py-3 bg-white border border-slate-300 rounded-full flex items-center justify-center space-x-3 text-sm font-bold font-outfit text-slate-800 shadow-sm hover:bg-slate-50 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => onSignupSuccess(role)}
              className="w-full py-3 bg-black text-white rounded-full flex items-center justify-center space-x-3 text-sm font-bold font-outfit shadow-sm hover:bg-slate-900 transition-all"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.75 1.04-1.8 0.92-2.84-.9.04-2 .61-2.65 1.37-.58.67-.99 1.74-.85 2.78.99.08 2.01-.5 2.58-1.31z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Link */}
      <div className="text-center py-4">
        <button
          onClick={() => onNavigate('login')}
          className="text-[#006c44] text-sm font-nunito"
        >
          Already have an account? <span className="font-bold underline">Log In</span>
        </button>
      </div>
    </div>
  );
};
