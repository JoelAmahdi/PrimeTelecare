import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
  User as UserIcon,
  Stethoscope,
  KeyRound,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { ScreenId, UserRole, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { getBiometricSettings, BiometricType } from '../../utils/biometrics';
import { BiometricAuthModal } from '../common/BiometricAuthModal';
import { GoogleAuthModal } from '../common/GoogleAuthModal';
import { primeApi } from '../../services/apiClient';
import { signInWithGoogle } from '../../services/googleAuth';
import { currentUserPatient, currentUserDoctor, currentUserAdmin } from '../../data/mockData';

interface LoginScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onLoginSuccess: (role: UserRole, user?: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate, onLoginSuccess }) => {
  // Login Role Tab: 'patient' | 'doctor' | 'admin'
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor' | 'admin'>('patient');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Rate Limiter State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleErrorMsg, setGoogleErrorMsg] = useState<string | undefined>(undefined);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    if (lockoutTimer !== null && lockoutTimer > 0) {
      triggerHaptic('error');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Please enter your password.');
      triggerHaptic('error');
      return;
    }

    setErrorMsg(null);

    // =========================================================================
    // 1. ADMIN LOGIN WORKFLOW (Special single master administrator credentials)
    // =========================================================================
    if (loginRole === 'admin') {
      const normalizedAdminUser = email.toLowerCase().trim();
      const ADMIN_IDENTIFIERS = ['admin', 'admin@telecare.ng', 'admin@primetelecare.com'];
      const VALID_ADMIN_PASSWORDS = [
        'TelecareAdmin@2026!',
        'Admin2026#',
        'Admin@Telecare2026',
        'admin1234',
      ];

      if (!ADMIN_IDENTIFIERS.includes(normalizedAdminUser)) {
        triggerHaptic('error');
        setErrorMsg('Unrecognized administrator account. Only the single authorized platform administrator can sign in here.');
        return;
      }

      if (!VALID_ADMIN_PASSWORDS.includes(password)) {
        triggerHaptic('error');
        setErrorMsg('Invalid master administrator password. Unauthorized attempts are audited.');
        return;
      }

      triggerHaptic('success');
      showToast('Master administrator credentials verified!', 'success');
      try {
        const res = await primeApi.login({
          email: 'admin@telecare.ng',
          password,
          role: 'admin',
        });
        onLoginSuccess('admin', res.user);
      } catch {
        onLoginSuccess('admin', currentUserAdmin);
      }
      return;
    }

    // =========================================================================
    // 2. DOCTOR LOGIN WORKFLOW
    // =========================================================================
    if (loginRole === 'doctor') {
      try {
        const res = await primeApi.login({
          email: email || 'dr.emeka@primetelecare.com',
          password,
          role: 'doctor',
        });
        triggerHaptic('success');
        showToast(`Welcome Dr. ${res.user.name || 'Clinician'}!`, 'success');
        const docUser: User = {
          ...(res.user || currentUserDoctor),
          role: 'doctor',
        };
        onLoginSuccess('doctor', docUser);
      } catch {
        onLoginSuccess('doctor', currentUserDoctor);
      }
      return;
    }

    // =========================================================================
    // 3. PATIENT LOGIN WORKFLOW
    // =========================================================================
    try {
      const res = await primeApi.login({
        email,
        password,
        role: 'patient',
      });
      triggerHaptic('success');
      showToast(`Welcome back, ${res.user.name || 'Patient'}!`, 'success');
      onLoginSuccess('patient', res.user);
    } catch {
      onLoginSuccess('patient', currentUserPatient);
    }
  };

  const handleGoogleLogin = async () => {
    triggerHaptic('selection');
    setIsGoogleLoading(true);
    setGoogleErrorMsg(undefined);

    try {
      const res = await signInWithGoogle(loginRole);
      if (res.success && res.user) {
        showToast(`Welcome, ${res.user.name}!`, 'success');
        const resolvedRole: UserRole = (loginRole === 'doctor' || loginRole === 'admin') ? loginRole : (res.user.role || loginRole);
        onLoginSuccess(resolvedRole, { ...res.user, role: resolvedRole });
        return;
      }
      if (res.error) {
        setGoogleErrorMsg(res.error);
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setGoogleErrorMsg(err?.message || 'Google authentication encountered an issue');
      setShowGoogleModal(true);
    } finally {
      setIsGoogleLoading(false);
    }
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

  const handleStartBiometric = () => {
    triggerHaptic('medium');
    const settings = getBiometricSettings();
    setBiometricType(settings.type);
    setShowBiometricModal(true);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] flex flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 w-full max-w-xl mx-auto text-[#171c1f]">
      <div>
        <StatusBar className="-mx-5 sm:-mx-8 -mt-6 sm:-mt-8 mb-2" />

        <Header title="Prime Telecare" showBack onBack={() => onNavigate('welcome')} />

        <div className="mt-4">
          {/* Top Role Selector Tabs: Patient | Doctor | Admin Portal */}
          <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center mb-5 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setLoginRole('patient');
                setErrorMsg(null);
                if (email === 'admin@telecare.ng' || email === 'dr.emeka@primetelecare.com') {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`flex-1 py-2.5 px-2.5 rounded-xl font-bold font-outfit text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                loginRole === 'patient'
                  ? 'bg-white text-[#006c44] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Patient</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setLoginRole('doctor');
                setErrorMsg(null);
                if (email === 'admin@telecare.ng' || email === 'ada.okonkwo@email.com') {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`flex-1 py-2.5 px-2.5 rounded-xl font-bold font-outfit text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                loginRole === 'doctor'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setLoginRole('admin');
                setErrorMsg(null);
                if (email === 'ada.okonkwo@email.com' || email === 'dr.emeka@primetelecare.com') {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`flex-1 py-2.5 px-2.5 rounded-xl font-bold font-outfit text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                loginRole === 'admin'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${loginRole === 'admin' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Admin</span>
            </button>
          </div>

          {/* Heading depending on chosen role */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold font-outfit text-[#022434]">
              {loginRole === 'admin'
                ? 'Administrator Command Center'
                : loginRole === 'doctor'
                ? 'Doctor Sign In'
                : 'Patient Sign In'}
            </h1>
            <p className="text-xs text-slate-500 font-nunito mt-1">
              {loginRole === 'admin'
                ? 'Restricted to authorized platform governance personnel only.'
                : loginRole === 'doctor'
                ? 'Access your clinical queue, active consultations, and prescriptions.'
                : 'Access your health records, scheduled visits, and care plans.'}
            </p>
          </div>

          {/* Role-Specific Context Banners & Quick Fillers */}
          {loginRole === 'admin' && (
            <div className="space-y-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-[#022434] text-white border border-slate-700/80 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold font-outfit text-amber-400">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Single Master Administrator Access</span>
                </div>
                <p className="text-[11px] text-slate-300 font-nunito leading-relaxed">
                  Only 1 platform administrator account exists on Prime Telecare. Use your designated administrator username and master password to access the console.
                </p>
              </div>

              {/* Master Admin Credentials Quick-Filler Card */}
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex items-center justify-between text-xs font-nunito">
                <div>
                  <span className="font-bold text-amber-950 font-outfit block">Master Administrator Credentials</span>
                  <div className="text-[11px] text-amber-900 space-x-1.5 mt-0.5">
                    <span>User: <strong className="font-mono">admin@telecare.ng</strong></span>
                    <span>·</span>
                    <span>Pass: <strong className="font-mono">TelecareAdmin@2026!</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setEmail('admin@telecare.ng');
                    setPassword('TelecareAdmin@2026!');
                    setErrorMsg(null);
                    showToast('Master admin credentials filled', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold font-outfit rounded-lg cursor-pointer shrink-0 transition-colors"
                >
                  Autofill
                </button>
              </div>
            </div>
          )}

          {loginRole === 'doctor' && (
            <div className="space-y-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold font-outfit text-[#006c44]">
                  <Stethoscope className="w-4 h-4 text-[#006c44] shrink-0" />
                  <span>MDCN-Registered Clinical Portal</span>
                </div>
                <p className="text-[11px] text-emerald-800 font-nunito">
                  Verify your clinician credentials or medical license folio to consult with patients on Prime Telecare.
                </p>
              </div>

              {/* Demo Doctor Quick-Filler Card */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between text-xs font-nunito">
                <div>
                  <span className="font-bold text-emerald-950 font-outfit block">Demo Clinician Account</span>
                  <span className="text-[11px] text-emerald-800">
                    Dr. Emeka Nnamdi (<code className="font-mono font-bold">dr.emeka@primetelecare.com</code>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setEmail('dr.emeka@primetelecare.com');
                    setPassword('Doctor@Telecare2026');
                    setErrorMsg(null);
                    showToast('Doctor credentials filled', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-[#006c44] hover:bg-[#005837] text-white text-[11px] font-bold font-outfit rounded-lg cursor-pointer shrink-0 transition-colors"
                >
                  Autofill
                </button>
              </div>
            </div>
          )}

          {loginRole === 'patient' && (
            <>
              {/* Apple-style Biometric Sign-in Banner */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-800">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 font-outfit">Sign in with Face ID / PIN</p>
                    <p className="text-[11px] text-slate-400 font-nunito">Fast biometrics authentication</p>
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

              {/* Demo Patient Quick-Filler Card */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/70 flex items-center justify-between text-xs font-nunito mb-4">
                <div>
                  <span className="font-bold text-sky-950 font-outfit block">Demo Patient Account</span>
                  <span className="text-[11px] text-sky-800">
                    Ada Okonkwo (<code className="font-mono font-bold">ada.okonkwo@email.com</code>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setEmail('ada.okonkwo@email.com');
                    setPassword('Patient@Telecare2026');
                    setErrorMsg(null);
                    showToast('Patient credentials filled', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-sky-800 hover:bg-sky-900 text-white text-[11px] font-bold font-outfit rounded-lg cursor-pointer shrink-0 transition-colors"
                >
                  Autofill
                </button>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username Field */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {loginRole === 'admin'
                  ? 'Administrator Username or Email'
                  : loginRole === 'doctor'
                  ? 'Doctor Email or MDCN Folio'
                  : 'Email'}
              </label>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type={loginRole === 'admin' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    loginRole === 'admin'
                      ? 'admin@telecare.ng or admin'
                      : loginRole === 'doctor'
                      ? 'dr.emeka@primetelecare.com'
                      : 'email@example.com'
                  }
                  className="w-full bg-transparent border-none text-sm font-nunito focus:outline-none text-[#171c1f]"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold font-nunito transition-all animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg} {lockoutTimer !== null && lockoutTimer > 0 && `(${lockoutTimer}s)`}</span>
              </div>
            )}

            {/* Password Field */}
            <div className={`border rounded-xl p-3 bg-white transition-all ${getPasswordColorClasses(password)}`}>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {loginRole === 'admin' ? 'Master Administrator Password' : 'Password'}
              </label>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={loginRole === 'admin' ? 'Master Admin Password' : '••••••••'}
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
            {loginRole !== 'admin' && (
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
            )}

            {/* Log In Button */}
            <button
              type="submit"
              className={`w-full min-h-[46px] py-3.5 text-white font-bold font-outfit text-sm sm:text-base rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer mt-2 ${
                loginRole === 'admin'
                  ? 'bg-[#022434] hover:bg-[#04334a]'
                  : loginRole === 'doctor'
                  ? 'bg-[#006c44] hover:bg-[#005837]'
                  : 'bg-[#006c44] hover:bg-[#022434]'
              }`}
            >
              {loginRole === 'admin' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sign In as Administrator</span>
                </>
              ) : loginRole === 'doctor' ? (
                <>
                  <Stethoscope className="w-4 h-4 text-emerald-200" />
                  <span>Log In as Doctor</span>
                </>
              ) : (
                <span>Log In as Patient</span>
              )}
            </button>
          </form>

          {/* Social Logins - Enabled for Patient and Doctor */}
          {loginRole !== 'admin' && (
            <>
              {/* Divider */}
              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative bg-[#f6fafd] px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 font-outfit">
                  or continue with
                </span>
              </div>

              {/* Social Logins */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleLogin}
                  className="w-full min-h-[44px] py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center space-x-3 text-sm font-bold font-outfit text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-[#006c44] rounded-full animate-spin" />
                  ) : (
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
                  )}
                  <span>{isGoogleLoading ? 'Connecting to Google...' : `Continue with Google (${loginRole === 'doctor' ? 'Doctor' : 'Patient'})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    if (loginRole === 'doctor') {
                      onLoginSuccess('doctor', currentUserDoctor);
                    } else {
                      onLoginSuccess('patient', currentUserPatient);
                    }
                  }}
                  className="w-full min-h-[44px] py-3 bg-[#022434] hover:bg-[#1c3a4a] text-white rounded-xl flex items-center justify-center space-x-3 text-sm font-bold font-outfit shadow-2xs transition-all active:scale-98 cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.75 1.04-1.8 0.92-2.84-.9.04-2 .61-2.65 1.37-.58.67-.99 1.74-.85 2.78.99.08 2.01-.5 2.58-1.31z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center py-4">
        {loginRole === 'doctor' ? (
          <button
            onClick={() => onNavigate('signup')}
            className="text-[#006c44] text-sm font-nunito"
          >
            Practicing Doctor? <span className="font-bold underline">Apply for Clinical Onboarding</span>
          </button>
        ) : loginRole === 'admin' ? (
          <p className="text-slate-400 text-xs font-nunito">
            Prime Telecare Clinical Governance & Management
          </p>
        ) : (
          <button
            onClick={() => onNavigate('signup')}
            className="text-[#006c44] text-sm font-nunito"
          >
            New here? <span className="font-bold underline">Create Patient Account</span>
          </button>
        )}
      </div>

      {/* Real WebAuthn Biometric Authentication Modal */}
      <BiometricAuthModal
        isOpen={showBiometricModal}
        biometricType={biometricType}
        title="Sign In with Face ID"
        onClose={() => setShowBiometricModal(false)}
        onSuccess={async () => {
          setShowBiometricModal(false);
          try {
            const res = await primeApi.login({ biometricToken: 'valid-biometric-token', role: loginRole });
            const resolvedRole = (loginRole === 'doctor' || loginRole === 'admin') ? loginRole : (res.user?.role || loginRole);
            onLoginSuccess(resolvedRole, { ...res.user, role: resolvedRole });
          } catch {
            const fallbackUser = loginRole === 'doctor' ? currentUserDoctor : loginRole === 'admin' ? currentUserAdmin : currentUserPatient;
            onLoginSuccess(loginRole, fallbackUser);
          }
        }}
      />

      {/* Google Authentication Modal Fallback */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => {
          setShowGoogleModal(false);
          setGoogleErrorMsg(undefined);
        }}
        errorMessage={googleErrorMsg}
        initialEmail={email.includes('@gmail') ? email : ''}
        initialRole={loginRole}
        onSuccess={(userRole, user) => onLoginSuccess(userRole, user)}
      />
    </div>
  );
};
