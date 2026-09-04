import React, { useState, useEffect } from 'react';
import {
  Video,
  Phone,
  MessageSquare,
  Clock,
  Bell,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { ScreenId } from '../../types';
import {
  AppointmentAlert,
  getActive15MinAppointmentAlert,
  dismissAppointmentAlert,
  snoozeAppointmentAlert,
  resetDemoAppointment15Min,
  requestAndTriggerWebNotification,
} from '../../utils/appointmentNotifications';
import { triggerHaptic } from '../../utils/haptics';

interface NextAppointmentBannerProps {
  onNavigate: (screen: ScreenId) => void;
  role?: 'patient' | 'doctor';
}

export const NextAppointmentBanner: React.FC<NextAppointmentBannerProps> = ({
  onNavigate,
  role = 'patient',
}) => {
  const [activeAlert, setActiveAlert] = useState<AppointmentAlert | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [minutesLeftNum, setMinutesLeftNum] = useState<number>(0);
  const [hasNotifiedNative, setHasNotifiedNative] = useState<boolean>(false);

  useEffect(() => {
    const updateAlert = () => {
      const alert = getActive15MinAppointmentAlert();
      setActiveAlert(alert);

      if (alert) {
        const diffMs = alert.startTimeTimestamp - Date.now();
        if (diffMs <= 0) {
          setTimeLeftStr('Starting Now');
          setMinutesLeftNum(0);
        } else {
          const totalSecs = Math.floor(diffMs / 1000);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
          setMinutesLeftNum(mins);
        }

        // Trigger local Web Notification once when entering 15min window
        if (!hasNotifiedNative) {
          requestAndTriggerWebNotification(
            'Upcoming Consultation (15 Mins)',
            `Your ${alert.type} session with ${alert.doctorName} starts soon at ${alert.scheduledTime}.`
          );
          setHasNotifiedNative(true);
        }
      } else {
        setTimeLeftStr('');
      }
    };

    updateAlert();
    const timer = setInterval(updateAlert, 1000);

    const handleSync = () => updateAlert();
    window.addEventListener('appointment-alerts-updated', handleSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('appointment-alerts-updated', handleSync);
    };
  }, [hasNotifiedNative]);

  if (!activeAlert) {
    return null;
  }

  const handleJoin = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
    triggerHaptic('success');
    if (activeAlert.type === 'Chat') {
      onNavigate('active-chat');
    } else {
      onNavigate('video-call');
    }
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    dismissAppointmentAlert(activeAlert.id);
    setActiveAlert(null);
  };

  const handleSnooze = () => {
    triggerHaptic('selection');
    snoozeAppointmentAlert(activeAlert.id, 5);
    setActiveAlert(null);
  };

  const handleResetDemo = () => {
    triggerHaptic('medium');
    resetDemoAppointment15Min();
    setHasNotifiedNative(false);
  };

  return (
    <div className="bg-gradient-to-r from-[#022434] via-[#005a39] to-[#01354d] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-emerald-400/40 relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-3">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-3.5">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full text-[11px] font-bold font-outfit uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Next Appointment Alert</span>
            </span>

            {/* Countdown Badge */}
            <span className="bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-bold font-outfit flex items-center space-x-1">
              <Clock className="w-3 h-3 text-emerald-300" />
              <span>{minutesLeftNum === 0 ? 'Starting Now' : `In ${timeLeftStr}`}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleResetDemo}
              className="p-1.5 text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Reset 15-Minute Test Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor & Appointment Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="flex items-start space-x-3 min-w-0">
            <img
              src={activeAlert.doctorAvatar}
              alt={activeAlert.doctorName}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-emerald-400/30 shadow-xs"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-outfit text-sm text-white truncate">
                  {role === 'doctor' ? activeAlert.patientName : activeAlert.doctorName}
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-emerald-400/20">
                  {activeAlert.type} Consultation
                </span>
              </div>
              <p className="text-xs text-slate-300 font-nunito mt-0.5 truncate">
                {role === 'doctor' ? 'Chief Complaint: High Fever & Fatigue' : `${activeAlert.doctorSpecialty} • Scheduled ${activeAlert.scheduledTime}`}
              </p>
              <p className="text-[11px] text-emerald-200 font-medium mt-1 flex items-center space-x-1">
                <Bell className="w-3 h-3 text-emerald-300 animate-bounce" />
                <span>Starts in 15 minutes! Please prepare your audio & video.</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/10 justify-end">
            <button
              onClick={handleSnooze}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold font-outfit text-xs rounded-xl transition-all"
            >
              Snooze 5m
            </button>

            <button
              onClick={handleJoin}
              className="px-3.5 py-1.5 bg-[#77daa4] hover:bg-emerald-300 text-[#022434] font-bold font-outfit text-xs rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center space-x-1 whitespace-nowrap cursor-pointer"
            >
              {activeAlert.type === 'Video' && <Video className="w-3.5 h-3.5 text-[#022434]" />}
              {activeAlert.type === 'Voice' && <Phone className="w-3.5 h-3.5 text-[#022434]" />}
              {activeAlert.type === 'Chat' && <MessageSquare className="w-3.5 h-3.5 text-[#022434]" />}
              <span>Join Consultation</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#022434]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
