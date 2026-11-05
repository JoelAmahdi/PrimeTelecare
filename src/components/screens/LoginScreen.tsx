import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Mail, Lock, Eye, EyeOff, Fingerprint, ScanFace, ShieldCheck, CheckCircle2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { ScreenId, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { getBiometricSettings, BiometricType } from '../../utils/biometrics';
import { BiometricAuthModal } from '../common/BiometricAuthModal';

interface LoginScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('patient@telecare.com');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);

  // Rate Limiter State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutTimer !== null && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            setFailedAttempts(0);
            setErrorMsg(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Biometric Auth Modal State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(() => {
    try {
      return getBiometricSettings().type;
    } catch {
      return 'faceid';
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    if (lockoutTimer !== null && lockoutTimer > 0) {
      triggerHaptic('error');
      return;
    }

    if (password !== 'Password@123') {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLockoutTimer(30);
        setErrorMsg('Too many failed attempts. Try again in 30 seconds.');
      } else {
        setErrorMsg(`Incorrect password. ${3 - newAttempts} attempts remaining.`);
      }
      triggerHaptic('error');
      return;
    }

    setErrorMsg(null);
    let role: UserRole = 'patient';
    if (email.includes('admin')) {
      role = 'admin';
    } else if (email.includes('doctor') || email.includes('dr')) {
      role = 'doctor';
    }
    
    onLoginSuccess(role);
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const getPasswordColorClasses = (pass: string) => {
    if (pass.length === 0) return "border-slate-300 focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20";
    const score = getPasswordStrength(pass);
    if (score <= 2) return "border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20";
    if (score <= 4) return "border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20";
    return "border-emerald-500 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20";
  };

  const getPasswordFeedback = (pass: string) => {
    const missing = [];
    if (pass.length < 8) missing.push('8+ chars');
    if (!/[A-Z]/.test(pass)) missing.push('uppercase');
    if (!/[a-z]/.test(pass)) missing.push('lowercase');
    if (!/[0-9]/.test(pass)) missing.push('numbers');
    if (!/[^A-Za-z0-9]/.test(pass)) missing.push('symbols');
    
    if (missing.length === 0) return 'Strong password!';
    return `Add: ${missing.join(', ')}`;
  };

  const handleStartBiometric = () => {
    triggerHaptic('medium');
    const settings = getBiometricSettings();
    setBiometricType(settings.type);
    setShowBiometricModal(true);
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

          {/* Quick Demo Role Selectors */}
          <div className="bg-slate-100 p-1.5 rounded-2xl mb-4 flex items-center justify-between border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 font-outfit px-2 hidden sm:inline">Demo Role:</span>
            <div className="grid grid-cols-3 gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setEmail('patient@telecare.com');
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold font-outfit transition-all text-center ${
                  email.includes('patient') ? 'bg-white text-[#022434] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setEmail('dr.emeka@primetelecare.com');
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold font-outfit transition-all text-center ${
                  email.includes('doctor') || email.includes('dr') ? 'bg-[#1c3a4a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setEmail('admin@primetelecare.com');
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold font-outfit transition-all text-center ${
                  email.includes('admin') ? 'bg-[#006c44] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
          {/* Apple-style Biometric Sign-in Banner */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs mb-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-800">
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 font-outfit">Sign in with Face ID</p>
                <p className="text-[11px] text-slate-500 font-nunito">Or use Touch ID or Passcode</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartBiometric}
              className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-semibold font-outfit text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Verify
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

                        {errorMsg && (
              <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-3 rounded-2xl border border-red-200 text-xs font-semibold font-nunito transition-all animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg} {lockoutTimer !== null && lockoutTimer > 0 && `(${lockoutTimer}s)`}</span>
              </div>
            )}
            {/* Password Field */}
            <div className={`border rounded-2xl p-3 bg-white transition-all ${getPasswordColorClasses(password)}`}>
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
              
              {/* Password Strength Feedback */}
              {password.length > 0 && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <p className={`text-[10px] font-nunito ${getPasswordStrength(password) === 5 ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                    {getPasswordFeedback(password)}
                  </p>
                </div>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-left pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  showToast('Password reset link sent to your email!', 'info');
                }}
                className="text-xs font-semibold text-[#006c44] hover:underline cursor-pointer"
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
            <span className="relative bg-[#f6fafd] px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 font-outfit">
              or continue with
            </span>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onLoginSuccess('patient');
              }}
              className="w-full py-3 bg-white border border-slate-300 rounded-2xl flex items-center justify-center space-x-3 text-sm font-bold font-outfit text-slate-800 shadow-xs hover:bg-slate-50 transition-all active:scale-98"
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
              onClick={() => {
                triggerHaptic('selection');
                onLoginSuccess('patient');
              }}
              className="w-full py-3 bg-black text-white rounded-2xl flex items-center justify-center space-x-3 text-sm font-bold font-outfit shadow-xs hover:bg-slate-900 transition-all active:scale-98"
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

      {/* Real WebAuthn Biometric Authentication Modal */}
      <BiometricAuthModal
        isOpen={showBiometricModal}
        biometricType={biometricType}
        title="Sign In with Face ID"
        subtitle="Confirm your identity to sign into your account"
        onClose={() => setShowBiometricModal(false)}
        onSuccess={() => {
          setShowBiometricModal(false);
          let role: UserRole = 'patient';
          if (email.includes('admin')) {
            role = 'admin';
          } else if (email.includes('doctor') || email.includes('dr')) {
            role = 'doctor';
          }
          onLoginSuccess(role);
        }}
      />
    </div>
  );
};

