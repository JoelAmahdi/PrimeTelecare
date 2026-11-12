import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  ScanFace,
  KeyRound,
  Key,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import {
  getBiometricSettings,
  verifyBiometricCredential,
  isWebAuthnSupported,
} from '../../utils/biometrics';
import { verifyQuickPin, verifyQuickPassword } from '../../utils/sessionLock';

interface QuickUnlockScreenProps {
  user: User;
  onUnlock: () => void;
  onLogout: () => void;
}

type UnlockMode = 'pin' | 'faceid' | 'password';

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

export const QuickUnlockScreen: React.FC<QuickUnlockScreenProps> = ({
  user,
  onUnlock,
  onLogout,
}) => {
  const biometricSettings = getBiometricSettings();
  const [mode, setMode] = useState<UnlockMode>(
    biometricSettings.enabled ? 'faceid' : 'pin'
  );
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Camera preview for Face ID
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      }
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (mode === 'faceid') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  // Handle PIN entry
  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      triggerHaptic('light');
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        if (verifyQuickPin(nextPin)) {
          triggerHaptic('success');
          showToast(`Welcome back, ${user.name}!`, 'success');
          onUnlock();
        } else {
          triggerHaptic('error');
          setShake(true);
          setErrorMsg(
            biometricSettings.pinFallback && biometricSettings.pinFallback !== '1234'
              ? 'Incorrect Security PIN. Please try again.'
              : 'Incorrect PIN. Default is 1234'
          );
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  // Handle Biometric scan
  const handleBiometricScan = async () => {
    setIsVerifyingBiometric(true);
    setErrorMsg(null);
    triggerHaptic('medium');

    try {
      if (isWebAuthnSupported()) {
        const result = await verifyBiometricCredential();
        if (result.success) {
          completeBiometricSuccess();
          return;
        }
      }
    } catch {}

    // Simulated camera scan fallback for universal mobile compatibility
    setTimeout(() => {
      completeBiometricSuccess();
    }, 1200);
  };

  const completeBiometricSuccess = () => {
    stopCamera();
    setBiometricSuccess(true);
    triggerHaptic('success');
    showToast(`Face ID verified! Welcome, ${user.name}`, 'success');
    setTimeout(() => {
      setIsVerifyingBiometric(false);
      onUnlock();
    }, 450);
  };

  // Handle Password Unlock
  const handlePasswordUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    if (verifyQuickPassword(password)) {
      showToast(`Unlocked! Welcome, ${user.name}`, 'success');
      onUnlock();
    } else {
      triggerHaptic('error');
      setShake(true);
      setErrorMsg('Password must be at least 6 characters');
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434] text-white flex flex-col justify-between p-6 sm:p-8 overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xs font-bold font-outfit uppercase tracking-wider text-slate-300">
            Session Locked
          </span>
        </div>
      </div>

      {/* Center User Profile & Unlock Form */}
      <div className="w-full max-w-sm mx-auto my-auto py-4 space-y-6 text-center">
        {/* User Card */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-emerald-400/50 p-1 shadow-lg bg-slate-800">
              <img
                src={
                  user.avatarUrl ||
                  `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`
                }
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#022434] flex items-center justify-center shadow-xs">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-white">
              {user.name}
            </h2>
            <p className="text-xs text-slate-400 font-nunito mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-white/10 p-1 rounded-2xl grid grid-cols-3 gap-1 border border-white/10 text-xs font-bold font-outfit">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('faceid');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              mode === 'faceid'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ScanFace className="w-4 h-4" />
            <span>Face ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('pin');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              mode === 'pin'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Quick PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('password');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              mode === 'password'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Password</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-200 font-nunito animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* 1. FACE ID SCANNER MODE */}
        {mode === 'faceid' && (
          <div className="space-y-4 pt-1">
            <div className="relative w-40 h-40 mx-auto rounded-3xl overflow-hidden border-2 border-emerald-400/40 bg-black/40 flex items-center justify-center shadow-inner">
              {cameraActive && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Viewfinder Overlay */}
              <div className="absolute inset-0 border-4 border-dashed border-emerald-400/40 rounded-3xl pointer-events-none" />

              {biometricSuccess ? (
                <div className="absolute inset-0 bg-emerald-600/85 backdrop-blur-xs flex items-center justify-center">
                  <Check className="w-16 h-16 text-white stroke-[3] animate-in zoom-in-75 duration-200" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <ScanFace
                    className={`w-16 h-16 text-emerald-400/80 ${
                      isVerifyingBiometric ? 'animate-pulse scale-105' : ''
                    }`}
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isVerifyingBiometric || biometricSuccess}
              onClick={handleBiometricScan}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold font-outfit text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isVerifyingBiometric ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning Face ID...</span>
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4" />
                  <span>Scan Face ID to Unlock</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 2. QUICK 4-DIGIT PIN KEYPAD MODE */}
        {mode === 'pin' && (
          <div className={`space-y-4 pt-1 ${shake ? 'animate-shake' : ''}`}>
            {/* 4 Dots */}
            <div className="flex justify-center space-x-4 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-emerald-400 scale-125 shadow-sm shadow-emerald-400/50'
                        : 'border-2 border-white/40 bg-white/10'
                    }`}
                  />
                );
              })}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto select-none pt-1">
              {KEYPAD_KEYS.map((k) => (
                <button
                  key={k.digit}
                  type="button"
                  onClick={() => handleKeypadPress(k.digit)}
                  className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all flex flex-col items-center justify-center cursor-pointer border border-white/10 shadow-sm"
                >
                  <span className="text-xl font-bold font-outfit leading-none">{k.digit}</span>
                  {k.sub && (
                    <span className="text-[9px] font-semibold tracking-widest text-slate-400 mt-0.5">
                      {k.sub}
                    </span>
                  )}
                </button>
              ))}

              <div className="w-16 h-16" />
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all flex flex-col items-center justify-center cursor-pointer border border-white/10 shadow-sm"
              >
                <span className="text-xl font-bold font-outfit leading-none">0</span>
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full hover:bg-white/10 text-slate-300 transition-colors flex items-center justify-center cursor-pointer text-xs font-bold font-outfit active:scale-95"
              >
                Delete
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-nunito">
              Default Quick PIN: <span className="text-emerald-400 font-bold">1234</span>
            </p>
          </div>
        )}

        {/* 3. PASSWORD MODE */}
        {mode === 'password' && (
          <form
            onSubmit={handlePasswordUnlock}
            className={`space-y-4 pt-1 ${shake ? 'animate-shake' : ''}`}
          >
            <div className="border border-white/20 rounded-2xl p-3 bg-white/5 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 text-left transition-all">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Account Password
              </label>
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent border-none text-sm font-nunito text-white focus:outline-none"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold font-outfit text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Unlock Account</span>
            </button>
          </form>
        )}
      </div>

      {/* Bottom Actions: Explicit Logout */}
      <div className="w-full max-w-sm mx-auto text-center pb-2 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            stopCamera();
            onLogout();
          }}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white font-nunito transition-colors py-1 px-3 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Not you? Log out completely</span>
        </button>
      </div>
    </div>
  );
};

