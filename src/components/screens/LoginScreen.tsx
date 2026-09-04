import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Mail, Lock, Eye, EyeOff, Fingerprint, ScanFace, ShieldCheck, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface LoginScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('patient@telecare.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Biometric Auth Modal State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    const role: UserRole = email.includes('doctor') || email.includes('dr') ? 'doctor' : 'patient';
    onLoginSuccess(role);
  };

  const handleStartBiometric = () => {
    triggerHaptic('medium');
    setShowBiometricModal(true);
    setBiometricStatus('scanning');

    // Simulate biometric scanning sequence
    setTimeout(() => {
      triggerHaptic('success');
      setBiometricStatus('success');
      setTimeout(() => {
        setShowBiometricModal(false);
        const role: UserRole = email.includes('doctor') || email.includes('dr') ? 'doctor' : 'patient';
        onLoginSuccess(role);
      }, 1100);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] flex flex-col justify-between p-6 sm:p-10 w-full max-w-2xl mx-auto text-[#171c1f]">
      <div>
        <StatusBar className="-mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-2" />

        <Header title="Prime Telecare" showBack onBack={() => onNavigate('welcome')} />

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold font-outfit text-[#022434]">Welcome back</h1>
            <span className="inline-flex items-center space-x-1 bg-emerald-100/80 text-[#006c44] text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Biometric Protected</span>
            </span>
          </div>

          {/* Quick Biometric Login Card */}
          <div className="bg-gradient-to-r from-[#1c3a4a] to-[#022434] p-4 rounded-2xl text-white shadow-md mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-[#77daa4]">
                <ScanFace className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-medium">Fast & Secure Access</p>
                <p className="text-sm font-bold font-outfit text-white">Log in with Face ID / Touch ID</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartBiometric}
              className="px-3.5 py-2 bg-[#77daa4] text-[#022434] hover:bg-emerald-300 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Authenticate</span>
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

            {/* Forgot Password Link */}
            <div className="text-left pt-1">
              <button
                type="button"
                onClick={() => alert('Password reset link sent to your email!')}
                className="text-xs font-semibold text-[#006c44] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Log In Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#1c3a4a] text-white font-bold font-outfit text-base rounded-xl shadow-md hover:bg-[#022434] transition-all transform active:scale-98 mt-2"
            >
              Log In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-[#f6fafd] px-4 text-xs text-slate-400 font-nunito">or</span>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onLoginSuccess('patient')}
              className="w-full py-3 bg-white border border-slate-300 rounded-full flex items-center justify-center space-x-3 text-sm font-bold font-outfit text-slate-800 shadow-sm hover:bg-slate-50 transition-all"
            >
              {/* Google G icon */}
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
              onClick={() => onLoginSuccess('patient')}
              className="w-full py-3 bg-black text-white rounded-full flex items-center justify-center space-x-3 text-sm font-bold font-outfit shadow-sm hover:bg-slate-900 transition-all"
            >
              {/* Apple icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.75 1.04-1.8 0.92-2.84-.9.04-2 .61-2.65 1.37-.58.67-.99 1.74-.85 2.78.99.08 2.01-.5 2.58-1.31z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center py-4">
        <button
          onClick={() => onNavigate('signup')}
          className="text-[#006c44] text-sm font-nunito"
        >
          New here? <span className="font-bold underline">Create Account</span>
        </button>
      </div>

      {/* Biometric Authentication Overlay Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative border border-slate-100 space-y-5">
            <button
              onClick={() => setShowBiometricModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-outfit text-[#022434]">Biometric Authentication</h3>
              <p className="text-xs text-slate-500 font-nunito">
                Verifying Face ID / Fingerprint to access sensitive medical records
              </p>
            </div>

            {/* Scanning Graphic Container */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-4">
              {biometricStatus === 'scanning' && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-[#77daa4] animate-ping opacity-30"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-[#006c44] animate-spin border-t-transparent"></div>
                  <ScanFace className="w-14 h-14 text-[#1c3a4a] animate-pulse" />
                </>
              )}

              {biometricStatus === 'success' && (
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-[#006c44] animate-bounce">
                  <CheckCircle2 className="w-14 h-14" />
                </div>
              )}
            </div>

            {/* Status Message */}
            <div>
              {biometricStatus === 'scanning' && (
                <div className="flex items-center justify-center space-x-2 text-slate-700 text-sm font-semibold font-outfit">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#006c44]" />
                  <span>Scanning Face / Fingerprint...</span>
                </div>
              )}

              {biometricStatus === 'success' && (
                <div className="text-emerald-700 text-sm font-bold font-outfit">
                  Identity Verified! Redirecting...
                </div>
              )}
            </div>

            <button
              onClick={() => setShowBiometricModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline pt-2"
            >
              Cancel & Use Password Instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

