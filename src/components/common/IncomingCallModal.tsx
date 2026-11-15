import React, { useEffect } from 'react';
import {
  Video,
  Phone,
  PhoneOff,
  PhoneCall,
  Activity,
  Heart,
  Thermometer,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ActiveCall } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { playRingingTone, playConnectedTone, playHangupTone } from '../../utils/audioTones';

interface IncomingCallModalProps {
  call: ActiveCall | null;
  onAccept: (call: ActiveCall) => void;
  onDecline: (call: ActiveCall) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline,
}) => {
  useEffect(() => {
    if (!call || call.status !== 'ringing') return;

    // Start acoustic ringing tone
    const stopAudio = playRingingTone();

    // Start haptic ring pattern on supported mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 300, 500, 300, 800]);
      } catch {}
    }

    return () => {
      stopAudio();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(0);
        } catch {}
      }
    };
  }, [call]);

  if (!call || call.status !== 'ringing') return null;

  const isVideo = call.type !== 'Voice' && call.type !== 'Chat';
  const defaultAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

  const handleAccept = () => {
    triggerHaptic('success');
    playConnectedTone();
    onAccept(call);
  };

  const handleDecline = () => {
    triggerHaptic('heavy');
    playHangupTone();
    onDecline(call);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Incoming Patient Consultation Call"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#022434] to-[#04364e] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-center space-y-6 overflow-hidden">
        
        {/* Radar Ringing Pulse Background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-emerald-500/10 animate-ping" />
          <div className="absolute w-48 h-48 rounded-full bg-emerald-400/10 animate-pulse" />
        </div>

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold font-outfit bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>INCOMING CONSULTATION CALL</span>
          </span>

          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/80">
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>Priority Queue</span>
          </span>
        </div>

        {/* Patient Avatar & Ringing Animation */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-emerald-400/40 p-1 bg-white/5 shadow-2xl flex items-center justify-center">
              <img
                src={call.patientAvatar || defaultAvatar}
                alt={call.patientName}
                className="w-full h-full rounded-full object-cover shadow-inner"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#022434] flex items-center justify-center shadow-md animate-bounce">
              {isVideo ? (
                <Video className="w-3.5 h-3.5 text-white" />
              ) : (
                <Phone className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold font-outfit text-white tracking-tight">
              {call.patientName}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-300 font-medium">
              Calling for {isVideo ? 'Encrypted HD Video Consultation' : `${call.type} Consultation`}
            </p>
          </div>
        </div>

        {/* Patient Vitals Pill (if provided during triage) */}
        {call.vitals && (
          <div className="relative z-10 bg-white/10 border border-white/10 rounded-2xl p-3 flex items-center justify-around text-xs font-nunito">
            {call.vitals.temp && (
              <div className="flex items-center space-x-1.5 text-slate-200">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">{call.vitals.temp}°C</span>
              </div>
            )}
            {call.vitals.spo2 && (
              <div className="flex items-center space-x-1.5 text-slate-200">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">SpO2 {call.vitals.spo2}%</span>
              </div>
            )}
            {call.vitals.systolicBp && (
              <div className="flex items-center space-x-1.5 text-slate-200">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold">BP {call.vitals.systolicBp}/{call.vitals.diastolicBp || '80'}</span>
              </div>
            )}
          </div>
        )}

        {/* Room & Payment Status Safeguard */}
        <div className="relative z-10 flex items-center justify-center space-x-2 text-[11px] text-slate-300 font-nunito">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Patient consultation fee paid & clinical room unlocked</span>
        </div>

        {/* Dual Action Buttons: Green Accept & Red Decline */}
        <div className="relative z-10 grid grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={handleDecline}
            className="w-full py-4 px-4 bg-rose-600/90 hover:bg-rose-600 text-white font-bold font-outfit text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer border border-rose-500/40"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="w-full py-4 px-4 bg-[#006c44] hover:bg-[#008755] text-white font-extrabold font-outfit text-xs sm:text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer border border-emerald-400/50 animate-pulse hover:animate-none"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Join Room</span>
          </button>
        </div>

      </div>
    </div>
  );
};
