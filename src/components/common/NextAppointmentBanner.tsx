import React, { useState, useEffect } from 'react';
import {
  Video,
  Phone,
  MessageSquare,
  Clock,
  X,
  ArrowRight,
} from 'lucide-react';
import { ScreenId, BookingSummary } from '../../types';
import {
  AppointmentAlert,
  getActive15MinAppointmentAlert,
  dismissAppointmentAlert,
  requestAndTriggerWebNotification,
} from '../../utils/appointmentNotifications';
import { triggerHaptic } from '../../utils/haptics';
import { processJoinOrPayConsultation } from '../../utils/consultationPayment';
import { GoogleCalendarSyncModal } from './GoogleCalendarSyncModal';

interface NextAppointmentBannerProps {
  onNavigate: (screen: ScreenId) => void;
  role?: 'patient' | 'doctor';
  onSaveBookingSummary?: (summary: BookingSummary) => void;
}

export const NextAppointmentBanner: React.FC<NextAppointmentBannerProps> = ({
  onNavigate,
  role = 'patient',
  onSaveBookingSummary,
}) => {
  const [activeAlert, setActiveAlert] = useState<AppointmentAlert | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [minutesLeftNum, setMinutesLeftNum] = useState<number>(0);
  const [hasNotifiedNative, setHasNotifiedNative] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateAlert = () => {
      const alert = getActive15MinAppointmentAlert();
      setActiveAlert(alert);

      if (alert) {
        const diffMs = alert.startTimeTimestamp - Date.now();
        if (diffMs <= 0) {
          setTimeLeftStr('Starting now');
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
            'Upcoming Consultation',
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
    processJoinOrPayConsultation({
      id: activeAlert.id,
      type: activeAlert.type,
      doctorId: 'doc-anya',
      doctorName: activeAlert.doctorName,
      doctorSpecialty: activeAlert.doctorSpecialty,
      doctorAvatar: activeAlert.doctorAvatar,
      price: 10000,
      onNavigate,
      onSaveBookingSummary,
    });
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    dismissAppointmentAlert(activeAlert.id);
    setActiveAlert(null);
  };

  const personName = role === 'doctor' ? activeAlert.patientName : activeAlert.doctorName;
  const personSubtitle =
    role === 'doctor'
      ? `${activeAlert.type} Consultation · Chief Complaint: High Fever & Fatigue`
      : `${activeAlert.doctorSpecialty} · ${activeAlert.type} Consultation`;


  return (
    <>
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 transition-all duration-200">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
              Next Appointment
            </h3>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{minutesLeftNum === 0 ? 'Starting now' : `In ${timeLeftStr}`}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsCalendarModalOpen(true);
              }}
              className="p-1 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold px-2 py-1"
              title="Add to Google Calendar"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Google Calendar</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Appointment Content Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src={activeAlert.doctorAvatar}
              alt={personName}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
            />
            <div className="min-w-0">
              <h4 className="font-bold font-outfit text-sm text-[#0f172a] truncate">
                {personName}
              </h4>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {personSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsCalendarModalOpen(true);
              }}
              className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold font-outfit text-xs rounded-xl border border-blue-200 transition-colors flex items-center space-x-1.5 cursor-pointer sm:hidden"
            >
              <span>Sync Calendar</span>
            </button>

            <button
              type="button"
              onClick={handleJoin}
              className="px-4 py-2.5 bg-[#006c44] hover:bg-[#005536] text-white font-bold font-outfit text-xs rounded-xl shadow-2xs transition-all active:scale-98 flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              {activeAlert.type === 'Video' && <Video className="w-3.5 h-3.5" />}
              {activeAlert.type === 'Voice' && <Phone className="w-3.5 h-3.5" />}
              {activeAlert.type === 'Chat' && <MessageSquare className="w-3.5 h-3.5" />}
              <span>Join Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <GoogleCalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        pendingAppointment={{
          doctorName: activeAlert.doctorName,
          doctorSpecialty: activeAlert.doctorSpecialty,
          patientName: activeAlert.patientName,
          consultationType: activeAlert.type,
          dateStr: activeAlert.scheduledDate,
          timeSlot: activeAlert.scheduledTime,
          durationMinutes: 30,
        }}
      />
    </>
  );
};
