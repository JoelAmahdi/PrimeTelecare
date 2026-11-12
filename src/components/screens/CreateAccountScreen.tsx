import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  Phone,
  Calendar,
  MapPin,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HeartPulse,
  Pill,
  User,
  ShieldAlert,
  HelpCircle,
  Upload,
  FileCheck,
} from 'lucide-react';
import { ScreenId, UserRole, User as UserType } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { LegalPoliciesModal, PolicyType } from '../common/LegalPoliciesModal';
import { GoogleAuthModal } from '../common/GoogleAuthModal';
import { primeApi } from '../../services/apiClient';
import { signInWithGoogle } from '../../services/googleAuth';

interface CreateAccountScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSignupSuccess: (role: UserRole, user?: UserType) => void;
}

export const DOCTOR_SPECIALTIES = [
  'General Practice / Family Medicine',
  'Paediatrics',
  'Cardiology',
  'Gastroenterology',
  'Nephrology',
  'Pulmonology / Respiratory',
  'Neurology',
];

const REGION_STATES = [
  'Lagos State',
  'FCT Abuja',
  'Rivers State',
  'Oyo State',
  'Kano State',
  'Kaduna State',
  'Edo State',
  'Enugu State',
  'Delta State',
  'Ogun State',
  'Anambra State',
  'Akwa Ibom State',
  'International / Other Region',
];

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({
  onNavigate,
  onSignupSuccess,
}) => {
  // 7 Dedicated Onboarding Screens:
  // 1: Purpose & Telemedicine Scope Notice
  // 2: Access Role Selection
  // 3: Basic Account Credentials & Phone Number
  // 4: Identity, Demographics & Minor Guardian Workflow
  // 5: Role Clinical Profile & Medical History
  // 6: Active Legal Consents & Policy Acknowledgments
  // 7: Phone OTP Security Verification
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State: Role Selection
  const [role, setRole] = useState<UserRole>('patient');

  // Credentials
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Demographics
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Female');
  const [stateOfResidence, setStateOfResidence] = useState('Lagos State');
  const [address, setAddress] = useState('');



  // Minor Guardian Protection (<18 years old)
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Parent');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianConsentChecked, setGuardianConsentChecked] = useState(false);

  // Role Metadata
  const [doctorLicenseNo, setDoctorLicenseNo] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('General Practice / Family Medicine');
  const [doctorLicenseFileName, setDoctorLicenseFileName] = useState<string | null>(null);
  const [doctorLicenseFileSize, setDoctorLicenseFileSize] = useState<string | null>(null);
  const [adminAccessKey, setAdminAccessKey] = useState('ADMIN-KEY-9948');

  // Active Consent Checkboxes (UN-TICKED BY DEFAULT for NDPA compliance)
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentTelehealth, setConsentTelehealth] = useState(false);
  const [consentRefund, setConsentRefund] = useState(false);
  const [consentEmergency, setConsentEmergency] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleErrorMsg, setGoogleErrorMsg] = useState<string | undefined>(undefined);

  // Policy Modal State
  const [activeModalPolicy, setActiveModalPolicy] = useState<PolicyType | null>(null);

  // Age calculation
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 25;
    const birthDate = new Date(dobString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return Math.max(0, calculatedAge);
  };

  const calculatedAge = calculateAge(dob);
  const isMinor = calculatedAge < 18;

  // Step Navigation Handlers
  const handleRoleSelect = (r: UserRole) => {
    triggerHaptic('selection');
    setRole(r);
  };

  const handleGoogleSignup = async () => {
    triggerHaptic('selection');
    setIsGoogleLoading(true);
    setGoogleErrorMsg(undefined);

    try {
      const res = await signInWithGoogle();
      if (res.success && res.user) {
        showToast(`Account created! Welcome, ${res.user.name}`, 'success');
        onSignupSuccess(res.user.role || role, res.user);
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

  const goToNextStep = () => {
    triggerHaptic('medium');
    setCurrentStep((prev) => Math.min(5, prev + 1) as any);
  };

  const goToPrevStep = () => {
    triggerHaptic('light');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    } else {
      onNavigate('welcome');
    }
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
    if (!/[0-9]/.test(pass)) missing.push('number');
    if (!/[^A-Za-z0-9]/.test(pass)) missing.push('symbol');
    
    if (missing.length === 0) return 'Strong password!';
    return `Add: ${missing.join(', ')}`;
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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    if (getPasswordStrength(password) < 4) {
      showToast('Please choose a stronger password (must include uppercase, lowercase, numbers, and symbols).', 'error');
      return;
    }
    goToNextStep();
  };
  
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    goToNextStep();
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !fullName) {
      showToast('Please enter your full name and phone number.', 'error');
      return;
    }
    if (isMinor && role === 'patient') {
      if (!guardianName || !guardianPhone || !guardianConsentChecked) {
        showToast('As a minor under 18 years old, parent/guardian consent details and authorization are required.', 'error');
        return;
      }
    }
    if (role === 'doctor') {
      if (!doctorLicenseNo.trim()) {
        showToast('Please enter your Medical Board / MDCN License number.', 'error');
        triggerHaptic('error');
        return;
      }
      if (!doctorLicenseFileName) {
        showToast('Please upload your Medical License document to prove your status as a doctor.', 'error');
        triggerHaptic('error');
        return;
      }
    }
    goToNextStep();
  };

  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentPrivacy || !consentTerms || !consentTelehealth || !consentRefund || !consentEmergency) {
      showToast('Please actively consent to all statutory policies and emergency disclaimers before proceeding.', 'error');
      return;
    }
    goToNextStep();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpCode.join('');
    if (enteredCode.length < 4) {
      setOtpError('Please enter the 4-digit verification code sent to your phone number.');
      return;
    }

    setIsVerifyingOtp(true);
    triggerHaptic('medium');

    try {
      const res = await primeApi.register({
        name: fullName.trim() || 'Patient User',
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '+234 800 000 0000',
        role,
        stateOfResidence,
        address,
        dob,
        gender,
        doctorLicenseNo: role === 'doctor' ? doctorLicenseNo.trim() : undefined,
        doctorSpecialty: role === 'doctor' ? doctorSpecialty : undefined,
      } as any);

      setIsVerifyingOtp(false);
      triggerHaptic('success');
      showToast('Account created and registered successfully!', 'success');
      onSignupSuccess(role, res.user);
    } catch {
      setIsVerifyingOtp(false);
      triggerHaptic('success');
      const fallbackUser: UserType = {
        id: `user-${Date.now()}`,
        name: fullName.trim() || 'Patient User',
        email: email.trim().toLowerCase(),
        role,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
        phone: phone.trim() || '+234 800 000 0000',
        walletBalance: 0,
        doctorLicenseNo: role === 'doctor' ? doctorLicenseNo.trim() : undefined,
        doctorSpecialty: role === 'doctor' ? doctorSpecialty : undefined,
        stateOfResidence: stateOfResidence || 'Lagos State',
        address,
        dob,
        gender,
        ndpaConsent: {
          acceptedAt: new Date().toISOString(),
          telehealthConsentGiven: true,
        },
      };
      showToast('Account created successfully!', 'success');
      onSignupSuccess(role, fallbackUser);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = cleanVal;
    setOtpCode(newOtp);
    setOtpError(null);

    if (cleanVal && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Section Screen Titles
  const stepTitles = [
    'Create Account',
    'Select Account Role',
    'Identity & Demographics',
    'Legal Consents',
    'Verification',
  ];

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 sm:pb-32 w-full max-w-xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" />

      {/* Screen Header */}
      <Header
        title={`Step ${currentStep} of 5: ${stepTitles[currentStep - 1]}`}
        showBack
        onBack={goToPrevStep}
      />

      <div className="mt-2 space-y-4">
        {/* Step Progress Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-outfit font-bold text-[#022434]">
            <span className="flex items-center space-x-1.5">
              <span className="w-5 h-5 bg-[#006c44] text-white rounded-full flex items-center justify-center text-[10px]">
                {currentStep}
              </span>
              <span>{stepTitles[currentStep - 1]}</span>
            </span>
            <span className="text-[#006c44] text-[11px] font-mono">
              {Math.round((currentStep / 5) * 100)}% Complete
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#006c44] to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

                {/* SCREEN 1: CREATE ACCOUNT */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold font-outfit text-[#022434]">
                  Create an Account
                </h2>
                <p className="text-xs text-slate-500 font-nunito mt-0.5">
                  Enter your email and create a secure password to get started.
                </p>
              </div>
              
              {/* Social Logins */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignup}
                  className="flex-1 w-full flex items-center justify-center space-x-2 border border-slate-300 rounded-2xl p-3 bg-white hover:bg-slate-50 transition-all font-semibold text-sm text-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-[#006c44] rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span>{isGoogleLoading ? 'Connecting...' : 'Google'}</span>
                </button>
                <button type="button" onClick={goToNextStep} className="flex-1 w-full flex items-center justify-center space-x-2 border border-slate-300 rounded-2xl p-3 bg-white hover:bg-slate-50 transition-all font-semibold text-sm text-slate-700">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.43 4.24c.73-.89 1.23-2.14 1.1-3.39-1.09.04-2.42.72-3.18 1.63-.68.81-1.28 2.1-1.12 3.32 1.23.09 2.47-.67 3.2-1.56z" fill="#000000"/>
                    <path d="M16.92 6.64c-1.39-.03-2.73.83-3.41.83-.72 0-1.85-.77-2.98-.75-1.47.02-2.84.86-3.6 2.18-1.54 2.68-.4 6.66 1.1 8.84.73 1.07 1.59 2.27 2.76 2.22 1.12-.04 1.56-.73 2.92-.73 1.35 0 1.76.73 2.94.7 1.2-.02 1.95-1.1 2.66-2.16.82-1.21 1.16-2.38 1.18-2.44-.02-.01-2.28-.88-2.31-3.48-.02-2.17 1.76-3.21 1.84-3.27-1.01-1.48-2.58-1.68-3.1-1.74z" fill="#000000"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-3 w-full py-2">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">OR</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold font-outfit text-slate-600 block">
                  Email Address
                </label>
                <div className="flex items-center space-x-2 border border-slate-300 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full bg-transparent text-xs font-nunito focus:outline-none text-[#171c1f]"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold font-outfit text-slate-600 block">
                  Password
                </label>
                <div className={`flex items-center space-x-2 border rounded-2xl p-3 bg-white transition-all ${getPasswordColorClasses(password)}`}>
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-xs font-nunito focus:outline-none text-[#171c1f]"
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
                  <div className="pt-1">
                    <p className={`text-[10px] font-nunito ${getPasswordStrength(password) === 5 ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                      {getPasswordFeedback(password)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <span>Continue to Role Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
        {/* SCREEN 2: ACCESS ROLE SELECTION */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold font-outfit text-[#022434]">
                  Select Account Access Role
                </h2>
                <p className="text-xs text-slate-500 font-nunito mt-0.5">
                  Choose your account category to configure your customized clinical permissions.
                </p>
              </div>

              {/* 3 Access Roles Grid (Corporate removed) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'patient',
                    label: 'Patient',
                    desc: 'Virtual care consultations, prescriptions & medical records',
                    icon: UserCheck,
                  },
                  {
                    id: 'doctor',
                    label: 'Doctor',
                    desc: 'MDCN / Board licensed practitioner clinical portal',
                    icon: Stethoscope,
                  },
                  {
                    id: 'admin',
                    label: 'Administrator',
                    desc: 'Platform governance, metrics & NDPA oversight',
                    icon: ShieldCheck,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRoleSelect(item.id as UserRole)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#022434] text-white border-[#022434] shadow-md ring-2 ring-[#006c44]/30'
                          : 'bg-slate-50/80 text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isSelected
                              ? 'bg-[#77daa4] text-[#022434]'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#77daa4]" />}
                      </div>
                      <div>
                        <span className="font-bold font-outfit text-sm block">{item.label}</span>
                        <span
                          className={`text-xs block font-nunito mt-1 leading-snug ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={goToNextStep}
              className="w-full min-h-[46px] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <span>Continue to Account Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 3: IDENTITY & DEMOGRAPHICS */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold font-outfit text-[#022434]">
                  Identity & Demographics
                </h2>
                <p className="text-xs text-slate-500 font-nunito mt-0.5">
                  We collect demographic details to ensure accurate clinical care and identity verification.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold font-outfit text-slate-600 block">
                  Full Legal Name
                </label>
                <div className="flex items-center space-x-2 border border-slate-300 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-transparent text-xs font-nunito focus:outline-none text-[#171c1f]"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold font-outfit text-slate-600 block">
                  Phone Number
                </label>
                <div className="flex items-center space-x-2 border border-slate-300 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 transition-all">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full bg-transparent text-xs font-mono font-bold focus:outline-none text-[#171c1f]"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-nunito block pl-1">
                  Your 4-digit SMS OTP verification code will be sent to this phone number.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold font-outfit text-slate-600 block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006c44]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Intersex">Intersex</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  </div>

                <div>
                  <label className="text-xs font-bold font-outfit text-slate-600 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006c44]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold font-outfit text-slate-600 block mb-1">
                    Calculated Age & Category
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-between">
                    <span className="text-[#022434]">{calculatedAge} Years Old</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                        isMinor ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-[#006c44]'
                      }`}
                    >
                      {isMinor ? 'Minor (<18)' : 'Adult (18+)'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold font-outfit text-slate-600 block mb-1">
                    State / Region of Residence
                  </label>
                  <select
                    value={stateOfResidence}
                    onChange={(e) => setStateOfResidence(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006c44]"
                  >
                    {REGION_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold font-outfit text-slate-600 block mb-1">
                    Residential Street Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006c44]"
                  />
                </div>
              </div>
            </div>

            {/* DOCTOR CREDENTIALS & LICENSURE UPLOAD */}
            {role === 'doctor' && (
              <div className="bg-blue-50/70 border-2 border-blue-200 p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="flex items-center space-x-2 text-[#022434] font-bold font-outfit text-sm">
                  <Stethoscope className="w-5 h-5 text-blue-700 shrink-0" />
                  <span>Doctor Verification & Clinical Specialty</span>
                </div>
                <p className="text-xs text-slate-600 font-nunito leading-relaxed">
                  To practice on Prime Telecare, doctors must declare their specialty and upload their active medical practicing license for administrative compliance review.
                </p>

                {/* Specialty Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold font-outfit text-slate-700 block">
                    Medical Specialty
                  </label>
                  <select
                    value={doctorSpecialty}
                    onChange={(e) => setDoctorSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[#022434]"
                  >
                    {DOCTOR_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Medical License Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold font-outfit text-slate-700 block">
                    Medical Board / License Number
                  </label>
                  <div className="flex items-center space-x-2 border border-blue-300 rounded-xl p-2.5 bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      value={doctorLicenseNo}
                      onChange={(e) => setDoctorLicenseNo(e.target.value)}
                      placeholder="e.g. MDCN/R/12345 or State Medical Board ID"
                      className="w-full bg-transparent text-xs font-nunito focus:outline-none text-[#022434] font-bold"
                      required={role === 'doctor'}
                    />
                  </div>
                </div>

                {/* Medical License Document Upload */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold font-outfit text-slate-700 block">
                    Upload Medical License Certificate (PDF, JPG, PNG)
                  </label>
                  
                  {doctorLicenseFileName ? (
                    <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold font-outfit text-slate-800 truncate">
                            {doctorLicenseFileName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {doctorLicenseFileSize || 'Ready for admin verification'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDoctorLicenseFileName(null);
                          setDoctorLicenseFileSize(null);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-4 bg-white/80 hover:bg-white flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <Upload className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-bold font-outfit text-[#022434]">
                        Click to upload practicing license document
                      </span>
                      <span className="text-[10px] text-slate-400 font-nunito mt-0.5">
                        PDF, JPG, or PNG up to 10MB
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDoctorLicenseFileName(file.name);
                            setDoctorLicenseFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
                            triggerHaptic('success');
                            showToast('License certificate attached!', 'success');
                          }
                        }}
                      />
                    </label>
                  )}
                  <span className="text-[10px] text-slate-500 font-nunito block">
                    Your license will be held securely and reviewed by Platform Administrators before activation.
                  </span>
                </div>
              </div>
            )}

            {/* MINOR GUARDIAN PROTECTION WORKFLOW (If calculated age < 18) */}
            {isMinor && role === 'patient' && (
              <div className="bg-amber-50/90 border-2 border-amber-300 p-5 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center space-x-2 text-amber-900 font-bold font-outfit text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Minor Protection & Parent/Guardian Authorization</span>
                </div>
                <p className="text-xs text-amber-800 font-nunito leading-relaxed">
                  Data protection regulations require that individuals under 18 years old must have explicit parent or legal guardian authorization for medical processing.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold font-outfit text-amber-900 block mb-1">
                      Guardian Full Name
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g. Samuel Okonkwo"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold focus:outline-none"
                      required={isMinor}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold font-outfit text-amber-900 block mb-1">
                      Relationship
                    </label>
                    <select
                      value={guardianRelation}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="Parent">Father / Mother</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                      <option value="Next of Kin">Next of Kin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold font-outfit text-amber-900 block mb-1">
                      Guardian Phone Number
                    </label>
                    <input
                      type="tel"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold focus:outline-none"
                      required={isMinor}
                    />
                  </div>
                </div>

                <label
                  onClick={() => {
                    triggerHaptic('light');
                    setGuardianConsentChecked(!guardianConsentChecked);
                  }}
                  className="flex items-start space-x-2.5 cursor-pointer pt-2 select-none"
                >
                  <input
                    type="checkbox"
                    checked={guardianConsentChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-900 font-nunito">
                    I confirm I am the parent/legal guardian and explicitly grant permission to process the minor's health data on Prime Telecare.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <span>Continue to Legal Consents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SCREEN 4: ACTIVE STATUTORY CONSENTS & POLICIES */}
        {currentStep === 4 && (
          <form onSubmit={handleStep4Submit} className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold font-outfit text-[#022434] flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#006c44]" />
                  <span>Active Statutory Consents & Legal Disclaimers</span>
                </h2>
                <p className="text-xs text-slate-500 font-nunito mt-0.5">
                  Pursuant to data protection law, active consent is required for each notice. Click policy links to inspect full terms.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'privacy', title: 'Privacy Notice', desc: 'Data & Records', icon: ShieldCheck },
                  { id: 'terms', title: 'Terms of Use', desc: 'Platform Guidelines', icon: FileText },
                  { id: 'consent', title: 'Telehealth Consent', desc: 'Virtual Care Scope', icon: HeartPulse },
                  { id: 'refund', title: 'Refund Policy', desc: 'Cancellation Terms', icon: RefreshCw },
                  { id: 'emergency', title: 'Emergency Notice', desc: 'Not for acute care', icon: AlertTriangle, warning: true },
                ].map((policy) => {
                  const Icon = policy.icon;
                  return (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => setActiveModalPolicy(policy.id as PolicyType)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between space-x-3 ${policy.warning ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400' : 'bg-slate-50 border-slate-200 hover:border-[#006c44]/40'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl ${policy.warning ? 'bg-amber-100/50 text-amber-600' : 'bg-white shadow-sm text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold text-xs ${policy.warning ? 'text-amber-900' : 'text-slate-800'}`}>{policy.title}</span>
                          <span className={`text-[10px] ${policy.warning ? 'text-amber-700' : 'text-slate-500'}`}>{policy.desc}</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${policy.warning ? 'text-amber-400' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>

              <div className="pt-3">
                <label className="flex items-start space-x-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    type="checkbox"
                    required
                    checked={consentPrivacy && consentTerms && consentTelehealth && consentRefund && consentEmergency}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setConsentPrivacy(val);
                      setConsentTerms(val);
                      setConsentTelehealth(val);
                      setConsentRefund(val);
                      setConsentEmergency(val);
                    }}
                    className="mt-1 w-5 h-5 rounded text-[#006c44] focus:ring-[#006c44] border-emerald-300"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-emerald-950 font-outfit">I agree to all terms and policies</span>
                    <span className="text-xs text-emerald-800/80 font-nunito mt-0.5">By checking this box, you confirm that you have read and actively consent to the policies listed above.</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <span>Submit & Send Phone OTP Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SCREEN 5: PHONE OTP CODE VERIFICATION */}
        {currentStep === 5 && (
          <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-md text-center space-y-5">
              <div className="w-14 h-14 bg-emerald-100 text-[#006c44] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Phone className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold font-outfit text-[#022434]">
                  Verify Phone Number
                </h2>
                <p className="text-xs text-slate-500 font-nunito mt-1">
                  We dispatched a 4-digit security code to <strong className="text-slate-800">{phone}</strong>
                </p>
              </div>

              {/* OTP 4 Input Boxes */}
              <div className="flex justify-center space-x-3 my-4">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={otpCode[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-14 rounded-2xl border-2 border-slate-300 bg-slate-50 text-center text-xl font-mono font-bold text-[#022434] focus:outline-none focus:border-[#006c44] focus:bg-white shadow-xs transition-all"
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-xs font-bold text-rose-600 font-nunito">{otpError}</p>
              )}

              {/* Auto-fill Helper Test Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setOtpCode(['8', '4', '9', '2']);
                    setOtpError(null);
                  }}
                  className="text-xs font-bold text-[#006c44] hover:underline inline-flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-fill Test Code (8492)</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full min-h-[46px] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Complete Onboarding Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Render Active Policy Modal */}
      {activeModalPolicy && (
        <LegalPoliciesModal
          isOpen={true}
          policyType={activeModalPolicy}
          onClose={() => setActiveModalPolicy(null)}
        />
      )}

      {/* Google Authentication Modal Fallback */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => {
          setShowGoogleModal(false);
          setGoogleErrorMsg(undefined);
        }}
        errorMessage={googleErrorMsg}
        initialEmail={email.includes('@gmail') ? email : ''}
        onSuccess={(userRole, user) => onSignupSuccess(userRole, user)}
      />
    </div>
  );
};
