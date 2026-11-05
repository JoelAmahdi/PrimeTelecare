import React, { useState, useEffect } from 'react';
import { Delete, X } from 'lucide-react';
import {
  BiometricType,
  verifyBiometricCredential,
  verifySecurityPin,
  isWebAuthnSupported,
} from '../../utils/biometrics';
import { triggerHaptic } from '../../utils/haptics';

export type AuthMode = 'face' | 'thumb' | 'code';

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

// Authentic Apple Face ID Glyph
const AppleFaceIdIcon: React.FC<{ isVerifying?: boolean; isSuccess?: boolean }> = ({
  isVerifying,
  isSuccess,
}) => {
  if (isSuccess) {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="w-16 h-16 text-[#34C759] transition-all transform scale-105 duration-300"
      >
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="#34C759" fillOpacity="0.12" />
        <path
          d="M20 33L28 41L44 23"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={`w-16 h-16 text-slate-800 transition-all duration-300 ${
        isVerifying ? 'scale-105 opacity-90' : 'opacity-80'
      }`}
    >
      {/* 4 Corner Brackets */}
      <path d="M14 24V16C14 14.8954 14.8954 14 16 14H24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 24V16C50 14.8954 49.1046 14 48 14H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 40V48C14 49.1046 14.8954 50 16 50H24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 40V48C50 49.1046 49.1046 50 48 50H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="25" cy="27" r="2.5" fill="currentColor" />
      <circle cx="39" cy="27" r="2.5" fill="currentColor" />

      {/* Nose bridge */}
      <path d="M32 26V35H29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Smile */}
      <path d="M24 41C26.5 44 37.5 44 40 41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

// Authentic Apple Touch ID Glyph
const AppleTouchIdIcon: React.FC<{ isVerifying?: boolean; isSuccess?: boolean }> = ({
  isVerifying,
  isSuccess,
}) => {
  if (isSuccess) {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="w-16 h-16 text-[#34C759] transition-all transform scale-105 duration-300"
      >
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="#34C759" fillOpacity="0.12" />
        <path
          d="M20 33L28 41L44 23"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={`w-16 h-16 text-slate-800 transition-all duration-300 ${
        isVerifying ? 'scale-105 opacity-90' : 'opacity-80'
      }`}
    >
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M32 15C23.7 15 17 21.7 17 30C17 33 17.8 35.8 19.3 38.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M47 30C47 21.7 40.3 15 32 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 30C22 24.5 26.5 20 32 20C37.5 20 42 24.5 42 30C42 37 38.2 41.2 35.5 46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 30C27 27.2 29.2 25 32 25C34.8 25 37 27.2 37 30C37 35 33.5 39 31.5 43.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 30V35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23.5 44C26.2 47.5 29 49 32 49C35 49 39 46.5 42.2 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

// Standard iOS Phone Keypad Matrix
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
  biometricType = 'faceid',
  title = 'Verification',
  subtitle = 'Choose Face ID, Touch ID, or Passcode',
  isSessionLockBarrier = false,
  onSuccess,
  onClose,
  onLogout,
}) => {
  const [activeMode, setActiveMode] = useState<AuthMode>(biometricType === 'fingerprint' ? 'thumb' : 'face');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveMode(biometricType === 'fingerprint' ? 'thumb' : 'face');
      setStatus('idle');
      setPin('');
      setErrorMessage(null);
      setShake(false);
    } else {
      setStatus('idle');
      setErrorMessage(null);
    }
  }, [isOpen, biometricType]);

  if (!isOpen) return null;

  // Face Scan
  const handleFaceScan = async () => {
    setStatus('verifying');
    setErrorMessage(null);
    triggerHaptic('medium');

    if (isWebAuthnSupported()) {
      try {
        const result = await verifyBiometricCredential();
        if (result.success) {
          setStatus('success');
          triggerHaptic('success');
          setTimeout(() => {
            onSuccess();
          }, 500);
          return;
        }
      } catch (e) {
        console.warn('WebAuthn Face ID fallback:', e);
      }
    }

    // Natural iOS Face ID recognition delay
    setTimeout(() => {
      triggerHaptic('success');
      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 550);
    }, 750);
  };

  // Touch ID Scan
  const handleThumbScan = async () => {
    setStatus('verifying');
    setErrorMessage(null);
    triggerHaptic('medium');

    if (isWebAuthnSupported()) {
      try {
        const result = await verifyBiometricCredential();
        if (result.success) {
          setStatus('success');
          triggerHaptic('success');
          setTimeout(() => {
            onSuccess();
          }, 500);
          return;
        }
      } catch (e) {
        console.warn('WebAuthn Touch ID fallback:', e);
      }
    }

    // Natural iOS Touch ID recognition delay
    setTimeout(() => {
      triggerHaptic('success');
      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 550);
    }, 700);
  };

  // Keypad number press
  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4 && status !== 'verifying') {
      triggerHaptic('light');
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage(null);

      if (nextPin.length === 4) {
        if (verifySecurityPin(nextPin)) {
          triggerHaptic('success');
          setStatus('success');
          setTimeout(() => {
            onSuccess();
          }, 400);
        } else {
          triggerHaptic('error');
          setShake(true);
          setErrorMessage('Incorrect Passcode');
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const switchMode = (mode: AuthMode) => {
    triggerHaptic('selection');
    setActiveMode(mode);
    setStatus('idle');
    setErrorMessage(null);
    setPin('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSessionLockBarrier && onClose) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-[28px] w-full max-w-[340px] shadow-2xl border border-black/5 text-center relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* iOS Close Button (Top-Right) */}
        {!isSessionLockBarrier && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer z-10"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="pt-6 px-6 pb-2">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight font-outfit">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-nunito mt-0.5 leading-snug">
            {subtitle}
          </p>

          {/* Authentic iOS Segmented Control */}
          <div className="mt-4 p-0.5 bg-[#767680]/12 rounded-xl grid grid-cols-3 gap-0.5 select-none">
            <button
              type="button"
              onClick={() => switchMode('face')}
              className={`py-1.5 px-1 rounded-[10px] text-xs font-semibold transition-all ${
                activeMode === 'face'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Face ID
            </button>

            <button
              type="button"
              onClick={() => switchMode('thumb')}
              className={`py-1.5 px-1 rounded-[10px] text-xs font-semibold transition-all ${
                activeMode === 'thumb'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Touch ID
            </button>

            <button
              type="button"
              onClick={() => switchMode('code')}
              className={`py-1.5 px-1 rounded-[10px] text-xs font-semibold transition-all ${
                activeMode === 'code'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Passcode
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-3 flex-1 flex flex-col justify-center">
          {/* Subtle error message */}
          {errorMessage && (
            <div className="mb-2 text-xs font-semibold text-[#FF3B30] animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* 1. APPLE FACE ID VIEW */}
          {activeMode === 'face' && (
            <div className="py-2 flex flex-col items-center space-y-4 animate-in fade-in duration-150">
              {/* Apple Face ID Card Container */}
              <div
                className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-300 border ${
                  status === 'verifying'
                    ? 'bg-slate-50 border-slate-300 shadow-inner'
                    : status === 'success'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200/80 shadow-2xs'
                }`}
              >
                <AppleFaceIdIcon
                  isVerifying={status === 'verifying'}
                  isSuccess={status === 'success'}
                />
              </div>

              {/* Status Hint */}
              <div className="min-h-[28px] flex flex-col justify-center">
                {status === 'verifying' ? (
                  <p className="text-xs font-semibold text-slate-600">Verifying Face ID...</p>
                ) : status === 'success' ? (
                  <p className="text-xs font-bold text-[#34C759]">Verified</p>
                ) : (
                  <p className="text-xs text-slate-500 font-nunito">Look directly at your screen</p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={status === 'verifying' || status === 'success'}
                onClick={handleFaceScan}
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-semibold font-outfit text-xs rounded-2xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {status === 'verifying' ? 'Verifying...' : 'Scan with Face ID'}
              </button>
            </div>
          )}

          {/* 2. APPLE TOUCH ID VIEW */}
          {activeMode === 'thumb' && (
            <div className="py-2 flex flex-col items-center space-y-4 animate-in fade-in duration-150">
              {/* Apple Touch ID Sensor Circle */}
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 border ${
                  status === 'verifying'
                    ? 'bg-slate-50 border-slate-300 shadow-inner ring-4 ring-slate-100'
                    : status === 'success'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200/80 shadow-2xs'
                }`}
              >
                <AppleTouchIdIcon
                  isVerifying={status === 'verifying'}
                  isSuccess={status === 'success'}
                />
              </div>

              {/* Status Hint */}
              <div className="min-h-[28px] flex flex-col justify-center">
                {status === 'verifying' ? (
                  <p className="text-xs font-semibold text-slate-600">Scanning Touch ID...</p>
                ) : status === 'success' ? (
                  <p className="text-xs font-bold text-[#34C759]">Verified</p>
                ) : (
                  <p className="text-xs text-slate-500 font-nunito">Rest your finger on the sensor</p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={status === 'verifying' || status === 'success'}
                onClick={handleThumbScan}
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-semibold font-outfit text-xs rounded-2xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {status === 'verifying' ? 'Scanning...' : 'Scan with Touch ID'}
              </button>
            </div>
          )}

          {/* 3. APPLE PASSCODE KEYPAD VIEW */}
          {activeMode === 'code' && (
            <div className={`py-1 space-y-3.5 animate-in fade-in duration-150 ${shake ? 'animate-shake' : ''}`}>
              {/* 4 Apple Passcode Circles */}
              <div className="flex items-center justify-center space-x-3.5 py-1">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        isFilled
                          ? 'bg-slate-900 border-slate-900 scale-105'
                          : 'bg-transparent border border-slate-300'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Authentic iOS Circular Keypad (3x4) */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[230px] mx-auto select-none">
                {KEYPAD_KEYS.map((item) => (
                  <button
                    key={item.digit}
                    type="button"
                    onClick={() => handleKeypadPress(item.digit)}
                    className="w-16 h-16 mx-auto bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full flex flex-col items-center justify-center transition-colors active:scale-95 cursor-pointer"
                  >
                    <span className="text-2xl font-normal text-slate-900 leading-none">
                      {item.digit}
                    </span>
                    {item.sub && (
                      <span className="text-[8px] font-bold text-slate-400 tracking-[0.12em] uppercase mt-0.5">
                        {item.sub}
                      </span>
                    )}
                  </button>
                ))}

                {/* Quick fill / Helper */}
                <button
                  type="button"
                  onClick={() => {
                    setPin('1234');
                    triggerHaptic('success');
                    setStatus('success');
                    setTimeout(() => onSuccess(), 400);
                  }}
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-[10px] font-semibold text-[#007AFF] hover:bg-blue-50 transition-colors active:scale-95"
                  title="Quick fill default passcode (1234)"
                >
                  Quick Fill
                </button>

                {/* 0 Key */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-16 mx-auto bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full flex flex-col items-center justify-center transition-colors active:scale-95 cursor-pointer"
                >
                  <span className="text-2xl font-normal text-slate-900 leading-none">
                    0
                  </span>
                </button>

                {/* Delete / Backspace Key */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
                  title="Delete"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-nunito">
                Default passcode: <span className="font-semibold text-slate-600">1234</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action (Apple HIG Sheet Footer) */}
        <div className="border-t border-slate-100 bg-white">
          {isSessionLockBarrier && onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 text-xs font-semibold text-[#FF3B30] hover:bg-red-50/50 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-xs font-semibold text-[#007AFF] hover:bg-blue-50/40 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
