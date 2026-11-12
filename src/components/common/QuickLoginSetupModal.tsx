import React, { useState, useEffect } from 'react';
import {
  Lock,
  ScanFace,
  KeyRound,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import {
  getBiometricSettings,
  saveBiometricSettings,
  updateSecurityPin,
  BiometricType,
  isPlatformAuthenticatorAvailable,
} from '../../utils/biometrics';

interface QuickLoginSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userRole?: string;
  userName?: string;
}

const KEYPAD_KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
];

export const QuickLoginSetupModal: React.FC<QuickLoginSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  userRole = 'patient',
  userName = 'User',
}) => {
  const currentBiometrics = getBiometricSettings();

  // Step state: 'enter_pin' | 'confirm_pin' | 'complete'
  const [step, setStep] = useState<'enter_pin' | 'confirm_pin' | 'complete'>('enter_pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [faceIdEnabled, setFaceIdEnabled] = useState<boolean>(true);
  const [biometricType, setBiometricType] = useState<BiometricType>('faceid');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [showMasked, setShowMasked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('enter_pin');
      setPin('');
      setConfirmPin('');
      setErrorMsg(null);
      setShake(false);
      setIsSaving(false);
      const settings = getBiometricSettings();
      setFaceIdEnabled(settings.enabled);
      setBiometricType(settings.type || 'faceid');
    }
  }, [isOpen]);

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitInput(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, pin, confirmPin]);

  if (!isOpen) return null;

  const currentEntered = step === 'enter_pin' ? pin : confirmPin;

  const handleDigitInput = (digit: string) => {
    setErrorMsg(null);
    triggerHaptic('light');

    if (step === 'enter_pin') {
      if (pin.length < 4) {
        const nextPin = pin + digit;
        setPin(nextPin);
        if (nextPin.length === 4) {
          triggerHaptic('medium');
          setTimeout(() => {
            setStep('confirm_pin');
          }, 220);
        }
      }
    } else if (step === 'confirm_pin') {
      if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + digit;
        setConfirmPin(nextConfirm);

        if (nextConfirm.length === 4) {
          if (nextConfirm === pin) {
            triggerHaptic('success');
            setStep('complete');
          } else {
            triggerHaptic('error');
            setShake(true);
            setErrorMsg('PINs do not match. Please try again.');
            setTimeout(() => {
              setConfirmPin('');
              setShake(false);
            }, 600);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setErrorMsg(null);
    if (step === 'enter_pin') {
      setPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm_pin') {
      if (confirmPin.length > 0) {
        setConfirmPin((prev) => prev.slice(0, -1));
      } else {
        // Go back to step 1
        setStep('enter_pin');
        setPin('');
      }
    }
  };

  const handleResetPin = () => {
    triggerHaptic('medium');
    setStep('enter_pin');
    setPin('');
    setConfirmPin('');
    setErrorMsg(null);
  };

  const handleSaveAndActivate = async () => {
    if (pin.length !== 4 || pin !== confirmPin) {
      setErrorMsg('Please complete and verify your 4-digit PIN first.');
      triggerHaptic('error');
      return;
    }

    setIsSaving(true);
    triggerHaptic('medium');

    try {
      // 1. Update PIN fallback
      updateSecurityPin(pin);

      // 2. Save biometric settings
      saveBiometricSettings({
        enabled: faceIdEnabled,
        type: biometricType,
        isEnrolled: true,
        requireBiometricOnAppResume: true,
      });

      // 3. Flag that quick login setup has been completed
      localStorage.setItem('prime_telecare_quick_login_setup', 'true');

      triggerHaptic('success');
      showToast('Quick PIN & Face ID unlock activated successfully!', 'success');

      setTimeout(() => {
        setIsSaving(false);
        onComplete();
      }, 400);
    } catch (err) {
      console.error('Failed to configure quick login:', err);
      setIsSaving(false);
      showToast('Configuration failed. Please try again.', 'error');
    }
  };

  const handleSkip = () => {
    triggerHaptic('light');
    // Save flag so user isn't prompted on every single navigation, but keep default 1234
    localStorage.setItem('prime_telecare_quick_login_setup', 'true');
    showToast('Quick unlock skipped. Default PIN is 1234 (changeable in Settings).', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#022434]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-[#022434] via-[#04334a] to-[#006c44] text-white p-6 pb-5 relative">
          <button
            type="button"
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Skip for now"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold font-outfit uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>Subsequent Login Setup</span>
            </span>
            <span className="text-[11px] text-slate-300 font-mono">
              {userRole.toUpperCase()}
            </span>
          </div>

          <h3 className="text-xl font-bold font-outfit text-white">
            Set Up Quick Login
          </h3>
          <p className="text-xs text-slate-200 font-nunito mt-1 leading-relaxed">
            Create a 4-digit PIN for instant access on return or idle timeouts, and toggle Face ID for biometric sign-in.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Progress / Step Pill */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs">
            <span className="font-bold text-slate-700 font-outfit flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#006c44]" />
              <span>
                {step === 'enter_pin'
                  ? 'Step 1: Choose 4-Digit PIN'
                  : step === 'confirm_pin'
                  ? 'Step 2: Confirm 4-Digit PIN'
                  : 'PIN Verified'}
              </span>
            </span>

            {step === 'confirm_pin' && (
              <button
                type="button"
                onClick={handleResetPin}
                className="text-[11px] text-[#006c44] hover:underline font-bold"
              >
                Change PIN
              </button>
            )}

            {step === 'complete' && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Matched</span>
              </span>
            )}
          </div>

          {/* PIN Input Display */}
          <div className={`space-y-2 text-center ${shake ? 'animate-shake' : ''}`}>
            <p className="text-xs text-slate-500 font-medium font-nunito">
              {step === 'enter_pin'
                ? 'Enter a 4-digit numeric code'
                : step === 'confirm_pin'
                ? 'Re-enter your 4 digits to confirm'
                : 'Your PIN has been configured!'}
            </p>

            {/* 4 Pin Boxes / Dots */}
            <div className="flex items-center justify-center space-x-3.5 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = currentEntered.length > idx;
                const digitChar = currentEntered[idx];
                return (
                  <div
                    key={idx}
                    className={`w-12 h-14 rounded-2xl flex items-center justify-center text-xl font-bold font-mono transition-all duration-200 ${
                      filled
                        ? 'border-2 border-[#006c44] bg-emerald-50/50 text-[#022434] shadow-xs'
                        : 'border-2 border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {filled ? (
                      showMasked ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-[#006c44]" />
                      ) : (
                        digitChar
                      )
                    ) : (
                      <span className="text-slate-300">•</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Toggle show/hide PIN */}
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={() => setShowMasked(!showMasked)}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                {showMasked ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show digits</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide digits</span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center space-x-1.5 text-rose-600 text-xs font-bold pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Interactive Numeric Keypad (Active during PIN entry/confirmation) */}
          {step !== 'complete' && (
            <div className="w-full max-w-[280px] mx-auto grid grid-cols-3 gap-2.5 pt-1">
              {KEYPAD_KEYS.map((k) => (
                <button
                  key={k.digit}
                  type="button"
                  onClick={() => handleDigitInput(k.digit)}
                  className="h-12 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 text-[#022434] select-none cursor-pointer"
                >
                  <span className="text-lg font-bold font-outfit leading-none">{k.digit}</span>
                  {k.sub && (
                    <span className="text-[9px] font-bold text-slate-400 font-outfit tracking-wider mt-0.5">
                      {k.sub}
                    </span>
                  )}
                </button>
              ))}

              {/* Clear / Reset */}
              <button
                type="button"
                onClick={handleResetPin}
                className="h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-xs font-bold font-outfit text-slate-500 transition-all active:scale-95 select-none cursor-pointer"
              >
                Clear
              </button>

              {/* Digit 0 */}
              <button
                type="button"
                onClick={() => handleDigitInput('0')}
                className="h-12 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 rounded-2xl flex items-center justify-center text-lg font-bold font-outfit text-[#022434] transition-all active:scale-95 select-none cursor-pointer"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 transition-all active:scale-95 select-none cursor-pointer"
                title="Backspace"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* SECTION 2: BIOMETRIC / FACE ID TOGGLE */}
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#006c44] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm text-[#022434] font-outfit">
                      Enable Face ID / Biometrics
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        faceIdEnabled
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {faceIdEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-nunito block leading-snug">
                    Unlock with Face ID instantly; fallback to your 4-digit PIN anytime.
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={faceIdEnabled}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setFaceIdEnabled(e.target.checked);
                  }}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006c44]" />
              </label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-2 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">
              Protected by NDPA & ISO 27001 data protection protocols. Your PIN and biometrics never leave this device.
            </span>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto px-4 py-3 text-xs font-bold font-outfit text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Skip for Now (Use 1234)
          </button>

          <button
            type="button"
            disabled={step !== 'complete' || isSaving}
            onClick={handleSaveAndActivate}
            className={`flex-1 w-full py-3 px-4 rounded-xl font-bold font-outfit text-xs text-white flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer ${
              step === 'complete' && !isSaving
                ? 'bg-[#006c44] hover:bg-[#022434] active:scale-98'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Activating Security...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Activate Quick Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
