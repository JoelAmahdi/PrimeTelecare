import React, { useState, useEffect } from 'react';
import { X, KeyRound, Key, Eye, EyeOff, Lock } from 'lucide-react';
import { BiometricType, verifySecurityPin } from '../../utils/biometrics';
import { verifyQuickPassword } from '../../utils/sessionLock';
import { triggerHaptic } from '../../utils/haptics';

export type AuthMode = 'code' | 'password';

interface BiometricAuthModalProps {
  isOpen: boolean;
  biometricType?: BiometricType;
  title?: string;
  subtitle?: string;
  isSessionLockBarrier?: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  onLogout?: () => void;
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

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  title = 'Security Verification',
  subtitle = 'Enter your 4-digit PIN or account password to continue',
  isSessionLockBarrier = false,
  onSuccess,
  onClose,
}) => {
  const [activeMode, setActiveMode] = useState<AuthMode>('code');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveMode('code');
      setPin('');
      setPassword('');
      setErrorMessage(null);
      setShake(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      triggerHaptic('light');
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage(null);

      if (nextPin.length === 4) {
        if (verifySecurityPin(nextPin)) {
          triggerHaptic('success');
          setTimeout(() => {
            onSuccess();
          }, 150);
        } else {
          triggerHaptic('error');
          setShake(true);
          setErrorMessage('Incorrect PIN. Please try again (default: 1234).');
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 550);
        }
      }
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    if (verifyQuickPassword(password)) {
      triggerHaptic('success');
      onSuccess();
    } else {
      triggerHaptic('error');
      setShake(true);
      setErrorMessage('Password must be at least 6 characters.');
      setTimeout(() => setShake(false), 550);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#022434]/75 backdrop-blur-md animate-in fade-in duration-150 font-nunito">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#022434] to-[#006c44] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold font-outfit text-base">{title}</h3>
              <p className="text-[11px] text-emerald-100">{subtitle}</p>
            </div>
          </div>
          {!isSessionLockBarrier && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mode Switcher: PIN vs Password */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold font-outfit">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveMode('code');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeMode === 'code'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security PIN</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveMode('password');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeMode === 'password'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold text-center">
              {errorMessage}
            </div>
          )}

          {activeMode === 'code' ? (
            <div className={`space-y-4 ${shake ? 'animate-shake' : ''}`}>
              <div className="flex justify-center space-x-4 py-1">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      pin.length > idx
                        ? 'bg-[#006c44] scale-125'
                        : 'border-2 border-slate-300 bg-slate-50'
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto select-none">
                {KEYPAD_KEYS.map((k) => (
                  <button
                    key={k.digit}
                    type="button"
                    onClick={() => handleKeypadPress(k.digit)}
                    className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-[#022434] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="text-lg font-bold font-outfit leading-none">{k.digit}</span>
                    {k.sub && (
                      <span className="text-[9px] font-semibold tracking-wider text-slate-400 mt-0.5">
                        {k.sub}
                      </span>
                    )}
                  </button>
                ))}
                <div className="h-14" />
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-[#022434] flex items-center justify-center text-lg font-bold font-outfit transition-all active:scale-95 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold font-outfit transition-all active:scale-95 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className={`space-y-4 ${shake ? 'animate-shake' : ''}`}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-outfit text-slate-700 block">
                  Account Password
                </label>
                <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus-within:border-[#006c44] focus-within:bg-white">
                  <Key className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm text-[#022434] focus:outline-none"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Verify Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
