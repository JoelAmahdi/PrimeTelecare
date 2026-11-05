import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  RefreshCw,
  PhoneCall,
  Volume2,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  ArrowRight,
  X,
  Activity,
  Zap,
  Calendar,
  Lock,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface ConnectionRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorAvatar?: string;
  patientPhone?: string;
  onRecheckConnection?: () => void;
  onSwitchToAudioOnly?: () => void;
  onRequestCallback?: (phone: string) => void;
  onSwitchToChat?: () => void;
  onReschedule?: () => void;
}

export const ConnectionRecoveryModal: React.FC<ConnectionRecoveryModalProps> = ({
  isOpen,
  onClose,
  doctorName = 'Dr. Sarah Johnson',
  doctorSpecialty = 'Pediatric Specialist',
  doctorAvatar = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
  patientPhone = '+234 803 123 4567',
  onRecheckConnection,
  onSwitchToAudioOnly,
  onRequestCallback,
  onSwitchToChat,
  onReschedule,
}) => {
  if (!isOpen) return null;

  // Active state handlers
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticResult, setDiagnosticResult] = useState<'testing' | 'success' | 'failed' | null>(null);

  const [callbackRequested, setCallbackRequested] = useState(false);
  const [phoneInput, setPhoneInput] = useState(patientPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [audioOnlySuccess, setAudioOnlySuccess] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Countdown timer for automated reconnect attempt
  useEffect(() => {
    if (!isOpen || callbackRequested || isDiagnosticRunning) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30; // Reset countdown loop
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, callbackRequested, isDiagnosticRunning]);

  // Handle 'Re-check Connection'
  const handleRecheck = () => {
    triggerHaptic('medium');
    setIsDiagnosticRunning(true);
    setDiagnosticProgress(0);
    setDiagnosticResult('testing');

    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      setDiagnosticProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsDiagnosticRunning(false);
        // Simulate successful re-handshake 70% of time
        const success = Math.random() > 0.3;
        if (success) {
          setDiagnosticResult('success');
          triggerHaptic('success');
          setTimeout(() => {
            onRecheckConnection?.();
            onClose();
          }, 1200);
        } else {
          setDiagnosticResult('failed');
          triggerHaptic('heavy');
        }
      }
    }, 400);
  };

  // Handle 'Attempt Audio-Only Mode'
  const handleAudioOnly = () => {
    triggerHaptic('success');
    setAudioOnlySuccess(true);
    setTimeout(() => {
      onSwitchToAudioOnly?.();
      onClose();
    }, 1000);
  };

  // Handle 'Request Doctor Call-back'
  const handleCallbackRequest = () => {
    triggerHaptic('heavy');
    setCallbackRequested(true);
    onRequestCallback?.(phoneInput);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/85 backdrop-blur-md flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header Alert Bar */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl animate-pulse">
              <WifiOff className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold font-outfit uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded-full">
                Connection Recovery Mode
              </span>
              <h3 className="text-base font-extrabold font-outfit text-white leading-tight">
                WebRTC Stream Interrupted
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
            title="Dismiss overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Doctor Info & Session Protection Badge */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={doctorAvatar}
                  alt={doctorName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#006c44]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-400 rounded-full ring-2 ring-white" />
              </div>
              <div>
                <h4 className="font-extrabold font-outfit text-sm text-[#022434]">{doctorName}</h4>
                <p className="text-[11px] text-slate-500">{doctorSpecialty}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-[#006c44] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Session Saved</span>
              </span>
            </div>
          </div>

          {/* Real-Time Session Status Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start space-x-3">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-spin" />
            <div className="text-xs text-amber-900">
              <p className="font-bold font-outfit">Consultation Paused • Auto-retry in {countdown}s</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Don't worry! Your clinical consultation timer is paused and your notes are safely preserved. Choose an option below to resume immediately:
              </p>
            </div>
          </div>

          {/* Diagnostic Progress / Result Feedback Banner */}
          {isDiagnosticRunning && (
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-blue-950 font-outfit">
                <span className="flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Testing Cellular & Wi-Fi Bandwidth...</span>
                </span>
                <span>{diagnosticProgress}%</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${diagnosticProgress}%` }}
                />
              </div>
            </div>
          )}

          {diagnosticResult === 'success' && (
            <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center space-x-3 text-emerald-900 text-xs font-bold font-outfit">
              <CheckCircle2 className="w-5 h-5 text-[#006c44] shrink-0" />
              <span>Network Restored! Rejoining HD Video Room...</span>
            </div>
          )}

          {diagnosticResult === 'failed' && (
            <div className="bg-rose-50 border border-rose-300 p-3 rounded-2xl flex items-start space-x-2.5 text-rose-950 text-xs font-nunito">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold font-outfit block text-rose-950">High Latency Detected</strong>
                <span>Local 3G/4G signal is unstable for HD video. Please select Audio-Only or Request Call-Back below.</span>
              </div>
            </div>
          )}

          {audioOnlySuccess && (
            <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center space-x-3 text-emerald-900 text-xs font-bold font-outfit">
              <Volume2 className="w-5 h-5 text-[#006c44] shrink-0 animate-pulse" />
              <span>Switching to Low-Bandwidth Audio Mode (32 kbps)...</span>
            </div>
          )}

          {callbackRequested && (
            <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl space-y-1.5 text-emerald-950 text-xs font-nunito animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#006c44] shrink-0" />
                <strong className="font-extrabold font-outfit text-sm text-[#022434]">Call-back Request Dispatched!</strong>
              </div>
              <p className="text-emerald-900 pl-7 text-[11px]">
                Dr. Sarah Johnson has been notified to call your cellular line <strong>{phoneInput}</strong> directly via standard telephone network within 60 seconds.
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* THREE MAIN RECOVERY ACTION BUTTONS (AS REQUESTED)                         */}
          {/* ========================================================================= */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] font-extrabold font-outfit text-slate-400 uppercase tracking-wider block">
              Recommended Recovery Options
            </span>

            {/* OPTION 1: Re-check Connection */}
            <button
              disabled={isDiagnosticRunning}
              onClick={handleRecheck}
              className="w-full p-3.5 bg-slate-900 hover:bg-[#022434] active:scale-[0.98] text-white rounded-2xl transition-all shadow-md flex items-center justify-between group border border-slate-800"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 bg-[#77daa4]/20 text-[#77daa4] rounded-xl group-hover:bg-[#77daa4] group-hover:text-[#022434] transition-colors">
                  <RefreshCw className={`w-5 h-5 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h5 className="font-extrabold font-outfit text-xs text-white group-hover:text-[#77daa4] transition-colors">
                    1. Re-check Connection
                  </h5>
                  <p className="text-[11px] text-slate-300">
                    Run live network diagnostic & retry WebRTC video stream
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* OPTION 2: Attempt Audio-Only Mode */}
            <button
              onClick={handleAudioOnly}
              className="w-full p-3.5 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.98] text-[#022434] rounded-2xl transition-all border border-emerald-300 flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 bg-[#006c44] text-white rounded-xl">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h5 className="font-extrabold font-outfit text-xs text-[#022434]">
                      2. Attempt Audio-Only Mode
                    </h5>
                    <span className="text-[9px] font-extrabold bg-[#006c44] text-white px-1.5 py-0.5 rounded-full">
                      85% Data Saver
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Switch from HD video to ultra-low 32kbps voice call
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#006c44] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* OPTION 3: Request Doctor Call-Back */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold font-outfit text-xs text-blue-950">
                      3. Request Doctor Call-back
                    </h5>
                    <p className="text-[11px] text-slate-600">
                      Doctor dials your phone directly on GSM network
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Phone Number Confirmation Field */}
              <div className="pt-1 flex items-center justify-between bg-white p-2.5 rounded-xl border border-blue-200 text-xs">
                <div className="flex items-center space-x-2 font-mono font-bold text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {isEditingPhone ? (
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="bg-slate-100 px-2 py-1 rounded text-xs outline-none border border-blue-400 w-36"
                    />
                  ) : (
                    <span>{phoneInput}</span>
                  )}
                </div>
                <button
                  onClick={() => setIsEditingPhone(!isEditingPhone)}
                  className="text-[11px] font-bold text-blue-700 underline hover:text-blue-900"
                >
                  {isEditingPhone ? 'Save' : 'Change Phone'}
                </button>
              </div>

              <button
                disabled={callbackRequested}
                onClick={handleCallbackRequest}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-400 text-white text-xs font-extrabold font-outfit rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{callbackRequested ? 'Call-back Dispatched' : 'Request Direct Cellular Call-back'}</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECONDARY SESSION LOSS MINIMIZATION FALLBACKS                             */}
          {/* ========================================================================= */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-extrabold font-outfit text-slate-400 uppercase tracking-wider block">
              Additional Session Protections
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onSwitchToChat?.();
                  onClose();
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-[#022434] rounded-xl text-left transition-colors border border-slate-200 flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold font-outfit text-xs block truncate">Switch to Text Chat</span>
                  <span className="text-[10px] text-slate-500 block truncate">Async Messaging</span>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onReschedule?.();
                  onClose();
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-[#022434] rounded-xl text-left transition-colors border border-slate-200 flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold font-outfit text-xs block truncate">1-Click Reschedule</span>
                  <span className="text-[10px] text-slate-500 block truncate">SLA Free Guarantee</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-nunito flex items-center justify-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-[#006c44]" />
          <span>Prime Telecare SLA Guarantee: Zero financial loss on interrupted sessions.</span>
        </div>
      </div>
    </div>
  );
};
