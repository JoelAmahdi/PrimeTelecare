import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Video, Clock, ChevronRight, ChevronDown, CheckCircle2, Users, ArrowUpRight, Stethoscope, WifiOff, FileDown, Lock, FileText, CreditCard, ArrowRight, ShieldCheck, Share2, Copy, Check, X, Zap, AlertCircle, Calendar, Phone, MessageSquare } from 'lucide-react';
import { ScreenId, User, ConsultationSummaryData } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { useHealthRecordPermission } from '../../utils/healthRecordPermissions';
import { NextAppointmentBanner } from '../common/NextAppointmentBanner';
import { ClinicalDocumentationModal } from '../common/ClinicalDocumentationModal';
import { ConsultationSummaryModal } from '../common/ConsultationSummaryModal';
import { useOfflineStatus } from '../../utils/useOfflineStatus';
import { getActiveOrUpcomingConsultations, getCompletedConsultations, completeConsultation, rescheduleConsultation, AppointmentAlert } from '../../utils/appointmentNotifications';
import { primeApi } from '../../services/apiClient';
import { createGoogleCalendarWebUrl } from '../../services/googleCalendar';
import { PhoneNotificationBanner } from '../common/PhoneNotificationBanner';

interface DoctorHomeDashboardProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  isOfflineMode?: boolean;
}

export const DoctorHomeDashboard: React.FC<DoctorHomeDashboardProps> = ({ user, onNavigate, isOfflineMode }) => {
  const { isOffline, lastSyncTime } = useOfflineStatus();
  const effectiveOffline = isOfflineMode ?? isOffline;
  const [selectedPatientForDoc, setSelectedPatientForDoc] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDoctorOnline, setIsDoctorOnline] = useState<boolean>(true);

  // Register & keep this logged-in doctor marked ONLINE in the live directory so patients immediately see them
  useEffect(() => {
    if (!user?.id || !user?.name) return;
    const docId = user.id.startsWith('doc-') ? user.id : `doc-${user.id}`;
    const cleanName = user.name.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name.trim()}`;
    const specialty = user.doctorSpecialty || 'General Practice / Family Medicine';

    primeApi
      .addDoctor({
        id: docId,
        name: cleanName,
        fullNameWithTitle: `${cleanName}, MD`,
        specialty,
        title: `Consultant in ${specialty}`,
        avatarUrl:
          user.avatarUrl ||
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        isOnline: isDoctorOnline,
        verification: {
          isVerified: true,
          licenseNumber: user.doctorLicenseNo || 'MDCN Verified',
          boardName: 'Medical and Dental Council of Nigeria (MDCN)',
          verifiedBadgeText: 'Verified MDCN License',
          verificationDate: 'Verified',
        },
        prices: { chat: 5000, voice: 7000, video: 10000 },
      })
      .then((saved) => {
        try {
          const custom = JSON.parse(localStorage.getItem('prime_telecare_custom_doctors') || '[]');
          const filtered = custom.filter((d: any) => d.id !== saved.id);
          localStorage.setItem('prime_telecare_custom_doctors', JSON.stringify([saved, ...filtered]));
          window.dispatchEvent(new Event('doctors-directory-updated'));
        } catch {}
      })
      .catch(() => {});
  }, [user?.id, user?.name, user?.doctorSpecialty, user?.doctorLicenseNo, user?.avatarUrl, isDoctorOnline]);

  const handleToggleOnlineStatus = async () => {
    triggerHaptic('medium');
    const next = !isDoctorOnline;
    setIsDoctorOnline(next);
    const docId = user?.id?.startsWith('doc-') ? user.id : `doc-${user?.id || '1'}`;
    await primeApi.updateDoctorOnlineStatus(docId, next);
    showToast(
      next
        ? 'You are now Online and visible to patients for instant consultations.'
        : 'You are now Offline and hidden from instant consultations.',
      'info'
    );
  };

  const handleShareBookingLink = async () => {
    triggerHaptic('selection');
    const targetDocId = user?.id ? (user.id.startsWith('doc-') ? user.id : `doc-${user.id}`) : 'doc-1';
    const doctorBookingUrl = `${window.location.origin}/?refDoctor=${encodeURIComponent(targetDocId)}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Book a Consultation with ${user.name}`,
          text: `Consult with ${user.name} on Prime Telecare. Choose Video, Voice, or Chat for instant or scheduled medical consultations.`,
          url: doctorBookingUrl,
        });
        showToast('Booking link shared successfully!', 'success');
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(doctorBookingUrl);
      setCopiedLink(true);
      showToast('Doctor booking link copied! New patients will be guided to sign up and view your profile.', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showToast('Booking URL: ' + doctorBookingUrl, 'info');
    }
  };

  // Health record export authorization management
  const { permission, grantPermission, revokePermission } = useHealthRecordPermission('app-1');

  // Today's clinical queue - dynamic live appointments
  interface PatientQueueItem {
    id: string;
    name: string;
    time: string;
    date?: string;
    type: string;
    symptom: string;
    status: string;
    avatar: string;
    tag: string;
    tagColor: string;
    doctorId?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    rescheduled?: boolean;
    rescheduleReason?: string;
  }

  const [todaysPatients, setTodaysPatients] = useState<PatientQueueItem[]>([]);
  const [patientToReschedule, setPatientToReschedule] = useState<PatientQueueItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('Clinical emergency conflict');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const rescheduleDates = React.useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      dates.push({ label, fullDate });
    }
    return dates;
  }, []);

  const rescheduleSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '11:30 AM',
    '01:30 PM',
    '02:30 PM',
    '03:30 PM',
    '04:30 PM',
    '05:30 PM',
  ];

  const handleSyncToDoctorCalendar = (patient: PatientQueueItem) => {
    triggerHaptic('selection');
    const doctorCleanName = user.name.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name.trim()}`;
    const url = createGoogleCalendarWebUrl({
      doctorName: doctorCleanName,
      doctorSpecialty: user.doctorSpecialty || patient.doctorSpecialty || 'General Practice',
      patientName: patient.name,
      consultationType: patient.type,
      dateStr: patient.date || 'Today',
      timeSlot: patient.time,
      consultationId: patient.id,
      doctorId: user.id,
      targetRole: 'doctor',
      notes: patient.symptom,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening Google Calendar for Clinician...', 'success');
  };

  const handleConfirmReschedule = async () => {
    if (!patientToReschedule || !rescheduleDate || !rescheduleSlot) {
      showToast('Please select both a date and time slot.', 'error');
      return;
    }
    setIsSubmittingReschedule(true);
    try {
      triggerHaptic('success');
      rescheduleConsultation(
        patientToReschedule.id,
        rescheduleDate,
        rescheduleSlot,
        rescheduleReason
      );

      await primeApi.updateAppointment(patientToReschedule.id, {
        scheduledDate: rescheduleDate,
        timeSlot: rescheduleSlot,
        notes: `Rescheduled: ${rescheduleReason}`,
      }).catch(() => {});

      showToast(`Appointment for ${patientToReschedule.name} rescheduled to ${rescheduleDate} at ${rescheduleSlot}. Patient has been notified!`, 'success');
      setPatientToReschedule(null);
      window.dispatchEvent(new Event('appointment-alerts-updated'));
    } catch (e) {
      showToast('Failed to reschedule appointment.', 'error');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const [liveConsultationAlert, setLiveConsultationAlert] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('prime_telecare_new_consultation_alert');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [consultationTab, setConsultationTab] = useState<'queue' | 'completed'>('queue');
  const [completedConsultations, setCompletedConsultations] = useState<AppointmentAlert[]>([]);
  const [selectedPatientForSummary, setSelectedPatientForSummary] = useState<{ id: string; name: string; type?: any } | null>(null);
  const [isConsultationSummaryModalOpen, setIsConsultationSummaryModalOpen] = useState(false);

  // Active Consultation Session in progress (allows re-entry if the room was closed or refreshed)
  const [activeSession, setActiveSession] = useState<{ id?: string; type?: string; patientName?: string; appointmentId?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('prime_telecare_active_call_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.id || parsed.appointmentId)) return parsed;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    const syncActiveSession = () => {
      try {
        const raw = localStorage.getItem('prime_telecare_active_call_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.id || parsed.appointmentId)) {
            setActiveSession(parsed);
            return;
          }
        }
      } catch {}
      setActiveSession(null);
    };
    syncActiveSession();
    window.addEventListener('active-call-session-updated', syncActiveSession);
    window.addEventListener('storage', syncActiveSession);
    return () => {
      window.removeEventListener('active-call-session-updated', syncActiveSession);
      window.removeEventListener('storage', syncActiveSession);
    };
  }, []);

  const handleEnterConsultationRoom = () => {
    triggerHaptic('selection');
    // 1. Re-enter active session in progress if one exists (e.g. room was closed or refreshed)
    try {
      const raw = localStorage.getItem('prime_telecare_active_call_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.id || parsed.appointmentId)) {
          showToast(`Resuming active consultation with ${parsed.patientName || 'patient'}...`, 'info');
          onNavigate(parsed.type === 'Chat' ? 'active-chat' : 'video-call');
          return;
        }
      }
    } catch {}

    try {
      const callRaw = localStorage.getItem('prime_telecare_active_call') || localStorage.getItem('prime_telecare_incoming_call');
      if (callRaw) {
        const parsed = JSON.parse(callRaw);
        if (parsed && (parsed.id || parsed.callId)) {
          showToast(`Resuming active call with ${parsed.callerName || parsed.patientName || 'patient'}...`, 'info');
          onNavigate(parsed.modality === 'Chat' || parsed.type === 'Chat' ? 'active-chat' : 'video-call');
          return;
        }
      }
    } catch {}

    // 2. Check if there are active queue consultations to enter
    const active = getActiveOrUpcomingConsultations();
    const liveFirst = active.find((a) => a.status === 'active') || active[0];
    if (liveFirst) {
      const sessionPayload = {
        id: liveFirst.appointmentId || liveFirst.id,
        appointmentId: liveFirst.appointmentId || liveFirst.id,
        consultationId: liveFirst.id,
        doctorId: user.id,
        doctorName: user.name.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name.trim()}`,
        doctorSpecialty: user.doctorSpecialty || '',
        doctorAvatar: user.avatarUrl || '',
        patientName: liveFirst.patientName || '',
        type: liveFirst.type || 'Video',
      };
      try {
        localStorage.setItem('prime_telecare_active_call_session', JSON.stringify(sessionPayload));
        window.dispatchEvent(new Event('active-call-session-updated'));
      } catch {}
      showToast(`Entering consultation room with ${liveFirst.patientName}...`, 'info');
      onNavigate(liveFirst.type === 'Chat' ? 'active-chat' : 'video-call');
      return;
    }

    // 3. Fallback to active-chat screen (which displays patient queue without find doctor)
    showToast('Opening Patient Queue & Consultations...', 'info');
    onNavigate('active-chat');
  };

  const handleConcludeConsultation = async (patientId: string, patientName: string, summary?: ConsultationSummaryData) => {
    triggerHaptic('success');
    const doctorDisplayName = user.name.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name.trim()}`;
    completeConsultation(patientId, summary, {
      doctorName: doctorDisplayName,
      patientName,
    });
    await primeApi.completeAppointment(patientId, summary).catch(() => {});
    showToast(`Consultation with ${patientName} concluded and summary saved under Completed.`, 'success');
    window.dispatchEvent(new Event('appointment-alerts-updated'));
    setIsConsultationSummaryModalOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    const loadQueue = async () => {
      const local: PatientQueueItem[] = getActiveOrUpcomingConsultations().map((c) => ({
        id: c.id,
        name: c.patientName || 'Patient',
        time: c.scheduledTime || 'Scheduled',
        date: c.scheduledDate || 'Today',
        type: c.type || 'Video',
        symptom: 'Telehealth Consultation',
        status: 'Booked',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        tag: c.bookingMode === 'instant' ? 'Instant Care' : 'Scheduled',
        tagColor: 'bg-emerald-100 text-[#006c44] border-emerald-200',
        doctorId: c.doctorId,
        doctorName: c.doctorName,
        doctorSpecialty: c.doctorSpecialty,
        rescheduled: c.rescheduled,
        rescheduleReason: c.rescheduleReason,
      }));

      try {
        const res = await primeApi.getAppointments();
        const apiAppointments: any[] = Array.isArray(res) ? res : (res as any)?.appointments || (res as any)?.data || [];
        if (isMounted && apiAppointments.length > 0) {
          const activeOnly = apiAppointments.filter((a: any) => a.status !== 'completed' && a.status !== 'cancelled');
          const apiItems: PatientQueueItem[] = activeOnly.map((a: any) => ({
            id: a.id,
            name: a.patientName || 'Patient',
            time: a.timeSlot || 'Scheduled',
            date: a.scheduledDate || 'Today',
            type: a.type || 'Video',
            symptom: a.notes || 'Telehealth Consultation',
            status: a.status === 'upcoming' ? 'Paid & Upcoming' : (a.status || 'Booked'),
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
            tag: (a.timeSlot?.includes('Immediate') || a.scheduledDate?.includes('Instant')) ? 'Instant Care' : 'Live Booking',
            tagColor: 'bg-emerald-100 text-[#006c44] border-emerald-200',
            doctorId: a.doctorId,
            doctorName: a.doctorName,
            doctorSpecialty: a.doctorSpecialty,
          }));
          const ids = new Set(local.map((l) => l.id));
          const merged: PatientQueueItem[] = [...local];
          for (const item of apiItems) {
            if (!ids.has(item.id)) {
              merged.push(item);
            }
          }
          setTodaysPatients(merged);
          setCompletedConsultations(getCompletedConsultations());
          return;
        }
      } catch (e) {
        // Fall back to local
      }
      if (isMounted) {
        setTodaysPatients(local);
        setCompletedConsultations(getCompletedConsultations());
      }
    };

    loadQueue();

    const handleNewBooking = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setLiveConsultationAlert(detail);
        triggerHaptic('heavy');
        showToast(`🔔 New Consultation Alert: ${detail.patientName} booked an instant consultation with you!`, 'success');
      }
      loadQueue();
    };

    const handleAlertsUpdated = () => {
      try {
        const raw = localStorage.getItem('prime_telecare_new_consultation_alert');
        if (raw) {
          const parsed = JSON.parse(raw);
          setLiveConsultationAlert(parsed);
        }
      } catch {}
      loadQueue();
    };

    window.addEventListener('appointment-alerts-updated', handleAlertsUpdated);
    window.addEventListener('new-consultation-booked', handleNewBooking);
    return () => {
      isMounted = false;
      window.removeEventListener('appointment-alerts-updated', handleAlertsUpdated);
      window.removeEventListener('new-consultation-booked', handleNewBooking);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 sm:pb-32 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" />

      {/* Main Header (Mobile view) */}
      <div className="md:hidden">
        <Header
          title="Doctor Dashboard"
          showBell={todaysPatients.length > 0}
          bellCount={todaysPatients.length}
          onBellClick={() => {
            triggerHaptic('light');
            onNavigate('active-chat');
          }}
          rightElement={
            <button
              onClick={() => { triggerHaptic('selection'); onNavigate('settings'); }}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </button>
          }
        />
      </div>

      <div className="space-y-6 sm:space-y-8 mt-2">
        {/* Doctor Greeting & Tele-presence Bar */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center space-x-4 sm:space-x-5">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${effectiveOffline ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#022434] tracking-tight">
                  Welcome back, {user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-[#006c44] border border-emerald-200">
                  {user.doctorLicenseNo || 'MDCN/2018/74920'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-nunito mt-1">
                {user.doctorSpecialty || 'General Practice & Telehealth Hub'} • Clinical Overview
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleOnlineStatus}
              disabled={effectiveOffline}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                effectiveOffline
                  ? 'bg-amber-100 border border-amber-300 text-amber-900'
                  : isDoctorOnline
                  ? 'bg-emerald-100/90 border border-emerald-300 text-[#006c44] hover:bg-emerald-200/80'
                  : 'bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
              title="Click to toggle your live Online / Offline status for patients"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  effectiveOffline
                    ? 'bg-amber-500'
                    : isDoctorOnline
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span>
                {effectiveOffline
                  ? 'Offline (Cached Mode)'
                  : isDoctorOnline
                  ? 'Online & Accepting Patients'
                  : 'Offline (Tap to Go Online)'}
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('active-chat');
              }}
              className="px-5 py-2.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Open Virtual Clinic</span>
            </button>
          </div>
        </div>

        {/* Real Mobile / Phone Notifications Prompt Banner */}
        <PhoneNotificationBanner />

        {/* Offline Banner */}
        {effectiveOffline && (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-800 shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold font-outfit text-amber-900 text-sm block">Offline Mode</span>
                <span className="text-xs text-amber-800">Practice records saved locally. Will sync when reconnected.</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Incoming Consultation Alert Banner */}
        {liveConsultationAlert && (
          <div className="bg-linear-to-r from-emerald-600 via-[#006c44] to-teal-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-emerald-400/40 animate-in slide-in-from-top-3 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-4">
                <div className="w-13 h-13 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Video className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                    <span className="text-[11px] font-extrabold font-outfit uppercase tracking-wider text-emerald-200 bg-black/20 px-2.5 py-0.5 rounded-full">
                      New Consultation Alert
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-extrabold font-outfit text-white mt-1">
                    {liveConsultationAlert.patientName} • {liveConsultationAlert.type} Consultation
                  </h3>
                  <p className="text-xs text-emerald-100 font-nunito mt-0.5">
                    {liveConsultationAlert.timeSlot} • Fee: ₦{(liveConsultationAlert.price || 10000).toLocaleString()} Credited
                  </p>
                  {liveConsultationAlert.vitals && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono text-emerald-200 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                      <span>🌡️ {liveConsultationAlert.vitals.temp || '36.8'}°C</span>
                      <span>•</span>
                      <span>💓 {liveConsultationAlert.vitals.hr || '72'} BPM</span>
                      <span>•</span>
                      <span>🫁 {liveConsultationAlert.vitals.spo2 || '99'}%</span>
                      <span>•</span>
                      <span>🩺 {liveConsultationAlert.vitals.systolicBp || '120'}/{liveConsultationAlert.vitals.diastolicBp || '80'} mmHg</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:self-center">
                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    const sessionPayload = {
                      doctorId: user.id,
                      doctorName: user.name.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name.trim()}`,
                      doctorSpecialty: user.doctorSpecialty || '',
                      doctorAvatar: user.avatarUrl || '',
                      patientName: liveConsultationAlert.patientName || '',
                      type: liveConsultationAlert.type,
                    };
                    setLiveConsultationAlert(null);
                    try {
                      localStorage.setItem('prime_telecare_active_call_session', JSON.stringify(sessionPayload));
                      window.dispatchEvent(new Event('active-call-session-updated'));
                      localStorage.removeItem('prime_telecare_new_consultation_alert');
                    } catch {}
                    if (liveConsultationAlert.type === 'Chat') {
                      onNavigate('active-chat');
                    } else {
                      onNavigate('video-call');
                    }
                  }}
                  className="px-5 py-3 bg-white hover:bg-emerald-50 text-[#006c44] font-extrabold font-outfit text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                >
                  {liveConsultationAlert.type === 'Voice' ? (
                    <Phone className="w-4 h-4 text-[#006c44]" />
                  ) : liveConsultationAlert.type === 'Chat' ? (
                    <MessageSquare className="w-4 h-4 text-[#006c44]" />
                  ) : (
                    <Video className="w-4 h-4 text-[#006c44]" />
                  )}
                  <span>
                    {liveConsultationAlert.type === 'Voice'
                      ? 'Start Audio Consultation'
                      : liveConsultationAlert.type === 'Chat'
                      ? 'Open Chat Consultation'
                      : 'Start Video Consultation'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setLiveConsultationAlert(null);
                    try {
                      localStorage.removeItem('prime_telecare_new_consultation_alert');
                    } catch {}
                  }}
                  className="p-2.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss Alert"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 15-Minute Next Appointment Local Notification Banner */}
        <NextAppointmentBanner onNavigate={onNavigate} role="doctor" />

        {/* 12-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Main Clinical Column (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            {/* Top 2 Cards: Earnings & Clinical Practice Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr">
              {/* Card A: Earnings & Quick Actions */}
              <div className="bg-gradient-to-br from-[#022434] via-[#1c3a4a] to-[#012f45] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/60 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#77daa4]/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 mb-5">
                  {(() => {
                    const currentDoctorEarnings = (user.walletBalance && user.walletBalance > 0)
                      ? user.walletBalance
                      : Number(localStorage.getItem('prime_telecare_doctor_earnings') || '0');
                    return (
                      <>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-slate-300 font-nunito uppercase tracking-wider">
                            Consultation Earnings & Balance
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-2 mt-2">
                          <h3 className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight text-white">
                            ₦{currentDoctorEarnings.toLocaleString()}
                          </h3>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="pt-4 border-t border-white/10 relative z-10">
                  <span className="text-[11px] font-bold font-outfit uppercase tracking-wider text-slate-300 mb-3 block">
                    Clinical Quick Actions
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      onClick={handleEnterConsultationRoom}
                      className="px-3 py-2.5 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer bg-white/10 hover:bg-white/15 border-white/15 text-white"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="p-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-300 shrink-0">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold font-outfit block text-white truncate">
                            {activeSession ? 'Resume Room' : 'Consultation Room'}
                          </span>
                          <span className="text-[10px] text-emerald-200 block truncate">
                            {activeSession ? 'Tap to Re-enter' : 'Active Consultations'}
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        onNavigate('new-prescription');
                      }}
                      className="px-3 py-2.5 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-100"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="p-1.5 bg-amber-500/20 border border-amber-400/40 rounded-lg text-amber-300 shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold font-outfit block text-amber-200 truncate">Prescriptions</span>
                          <span className="text-[10px] text-amber-300 block truncate">Write Rx</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleShareBookingLink}
                      className="px-3 py-2.5 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer bg-emerald-600/30 hover:bg-emerald-600/50 border-emerald-400/40 text-white"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="p-1.5 bg-emerald-400/30 rounded-lg text-emerald-200 shrink-0">
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold font-outfit block text-white truncate">Share Link</span>
                          <span className="text-[10px] text-emerald-200 block truncate">
                            {copiedLink ? 'Copied!' : 'Copy Link'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card B: Practice Status & Metrics */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="font-extrabold font-outfit text-base text-[#022434]">
                      Practice Metrics
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-[#006c44] border border-emerald-200">
                      MDCN Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-xs text-slate-500 font-nunito block truncate">Patient Rating</span>
                      <div className="flex items-baseline space-x-1.5 mt-1">
                        <span className="text-2xl font-extrabold font-outfit text-[#022434]">4.9</span>
                        <span className="text-xs text-amber-500 font-bold">★ (128)</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-xs text-slate-500 font-nunito block truncate">Response Rate</span>
                      <div className="flex items-baseline space-x-1.5 mt-1">
                        <span className="text-2xl font-extrabold font-outfit text-[#006c44]">98%</span>
                        <span className="text-xs text-slate-500 font-medium font-nunito">&lt; 2m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Workspace & Tools Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold font-outfit text-lg sm:text-xl text-[#022434]">
                  Clinical Workspace
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Consultations & Queue */}
                <div
                  onClick={handleEnterConsultationRoom}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-[#006c44] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Video className="w-5 h-5" />
                      </div>
                      {activeSession && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[#006c44] text-[10px] font-extrabold border border-emerald-300 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active Session</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold font-outfit text-base text-[#022434] group-hover:text-[#006c44] transition-colors">
                      Consultation Rooms
                    </h4>
                    <p className="text-xs text-slate-500 font-nunito mt-1">
                      {activeSession
                        ? `Consultation in progress with ${activeSession.patientName || 'Patient'}. Tap to resume session.`
                        : 'Access active, queued and upcoming patient consultation sessions.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#006c44]">
                    <span>{activeSession ? 'Resume Active Room' : 'Enter Rooms'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Write Prescription */}
                <div
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('new-prescription');
                  }}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold font-outfit text-base text-[#022434] group-hover:text-amber-800 transition-colors">
                      Electronic Rx Pad
                    </h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>Issue Rx</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Health Records / EHR */}
                <div
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('health-records');
                  }}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold font-outfit text-base text-[#022434] group-hover:text-blue-800 transition-colors">
                      Health Records & EHR
                    </h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-800">
                    <span>View Dossier</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 4. Earnings & Payouts */}
                <div
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('withdrawal');
                  }}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/60 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold font-outfit text-base text-[#022434] group-hover:text-[#022434] transition-colors">
                      Earnings & Payouts
                    </h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Manage Payouts</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Queue & Completed Consultations Section */}
            <div id="patient-queue-section" className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 scroll-mt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setConsultationTab('queue');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-outfit transition-all cursor-pointer ${
                      consultationTab === 'queue'
                        ? 'bg-[#006c44] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Patient Queue ({todaysPatients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setConsultationTab('completed');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-outfit transition-all cursor-pointer ${
                      consultationTab === 'completed'
                        ? 'bg-[#006c44] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Completed ({completedConsultations.length})
                  </button>
                </div>
              </div>

              {consultationTab === 'completed' ? (
                completedConsultations.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434]">
                      No Completed Consultations Yet
                    </h4>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 space-y-3">
                    {completedConsultations.map((consult) => (
                      <div key={consult.id} className="pt-3 pb-4 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold font-outfit text-sm sm:text-base text-[#022434]">
                              {consult.patientName}
                            </span>
                            <span className="text-xs text-slate-500 font-nunito ml-2">
                              {consult.scheduledDate} • {consult.type} Call
                            </span>
                          </div>
                          <span className="self-start sm:self-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                            Completed
                          </span>
                        </div>

                        {consult.consultationSummary && (
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-nunito">
                            {consult.consultationSummary.diagnosis && (
                              <div>
                                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block font-outfit">
                                  Diagnosis:
                                </span>
                                <span className="text-emerald-950 font-bold">{consult.consultationSummary.diagnosis}</span>
                              </div>
                            )}
                            {consult.consultationSummary.treatment && (
                              <div>
                                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block font-outfit">
                                  Treatment:
                                </span>
                                <span className="text-slate-700 line-clamp-2">{consult.consultationSummary.treatment}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {consultationTab === 'queue' && (
                todaysPatients.length === 0 ? (
                <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-emerald-50 text-[#006c44] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434]">
                    No Patients Currently in Queue
                  </h4>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {todaysPatients.map((patient) => (
                    <div key={patient.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 -mx-3 px-3 rounded-2xl transition-colors">
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={patient.avatar}
                          alt={patient.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434]">
                              {patient.name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${patient.tagColor}`}>
                              {patient.tag}
                            </span>
                            {patient.rescheduled && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                                <span>Rescheduled</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-nunito mt-0.5">
                            {patient.symptom} • <span className="font-medium text-slate-700">{patient.date ? `${patient.date}, ` : ''}{patient.time}</span> ({patient.type})
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleSyncToDoctorCalendar(patient)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold font-outfit text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
                          title="Sync with Doctor's Google Calendar"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Google Cal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setPatientToReschedule(patient);
                            setRescheduleDate(patient.date || rescheduleDates[1]?.fullDate || rescheduleDates[0]?.fullDate);
                            setRescheduleSlot(patient.time && !patient.time.includes('Immediate') ? patient.time : '11:00 AM');
                            setRescheduleReason('Clinical emergency conflict');
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                          title="Reschedule if unavailable"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPatientForDoc(patient.name)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Notes
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            try {
                              localStorage.setItem(
                                'prime_telecare_active_call_session',
                                JSON.stringify({
                                  id: patient.id,
                                  appointmentId: patient.id,
                                  consultationId: patient.id,
                                  doctorId: user.id,
                                  doctorName: user.name.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name.trim()}`,
                                  doctorSpecialty: user.doctorSpecialty || '',
                                  doctorAvatar: user.avatarUrl || '',
                                  patientName: patient.name || '',
                                  type: patient.type,
                                })
                              );
                              window.dispatchEvent(new Event('active-call-session-updated'));
                            } catch {}
                            onNavigate(patient.type === 'Chat' ? 'active-chat' : 'video-call');
                          }}
                          className="px-3.5 py-1.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          {patient.type === 'Voice' ? (
                            <Phone className="w-3.5 h-3.5 text-emerald-300" />
                          ) : patient.type === 'Chat' ? (
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                          ) : (
                            <Video className="w-3.5 h-3.5 text-emerald-300" />
                          )}
                          <span>{patient.type === 'Chat' ? 'Open Chat' : 'Start Session'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setSelectedPatientForSummary({ id: patient.id, name: patient.name, type: patient.type });
                            setIsConsultationSummaryModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006c44] border border-emerald-200/80 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                          title="Input Consultation Summary & Complete"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Conclude</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
          </div>

          {/* Right Sidebar Column (lg:col-span-4 space-y-6) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Health Record Export Release Governance Banner / Card */}
            {permission.status === 'pending_doctor_approval' ? (
              <div className="bg-amber-500/10 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-amber-500/20 rounded-2xl text-amber-800 shrink-0">
                    <FileDown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold font-outfit text-sm text-amber-900">
                        Record Release Requested
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 font-nunito mt-1 leading-relaxed">
                      Patient <strong>{permission.patientName}</strong> requested PDF export release for session <strong>{permission.sessionId}</strong> ({permission.purpose}).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-amber-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('success');
                      grantPermission(user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`, user.doctorLicenseNo || 'MDCN/2019/88492');
                      showToast('Clinical record release digitally signed & authorized for patient export!');
                    }}
                    className="w-full py-2.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Authorize & Sign Release</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForDoc(permission.patientName)}
                    className="w-full py-2 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold font-outfit text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Review Clinical Notes First
                  </button>
                </div>
              </div>
            ) : permission.status === 'granted' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-xs flex flex-col gap-2">
                <div className="flex items-center space-x-2 text-xs text-emerald-900 font-bold">
                  <ShieldCheck className="w-5 h-5 text-[#006c44] shrink-0" />
                  <span>EHR Export Authorized</span>
                </div>
                <p className="text-xs text-emerald-800 font-nunito">
                  Release for <strong>{permission.patientName}</strong> digitally signed by you.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    revokePermission();
                    showToast('Export release authorization revoked.');
                  }}
                  className="text-xs font-bold text-amber-700 hover:underline self-start mt-1 cursor-pointer"
                >
                  Revoke Release
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#006c44] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold font-outfit text-sm text-[#022434]">
                      EHR Release Sign-Off
                    </h4>
                  </div>
                </div>
              </div>
            )}

            {/* Regulatory & Security Info Box */}
            <div className="bg-slate-100/70 rounded-3xl p-5 border border-slate-200 text-xs text-slate-600 font-nunito space-y-2">
              <div className="flex items-center space-x-2 text-[#022434] font-bold font-outfit">
                <Lock className="w-4 h-4 text-[#006c44]" />
                <span>Encrypted Telehealth Room</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Clinical Documentation Modal */}
      {selectedPatientForDoc && (
        <ClinicalDocumentationModal
          isOpen={!!selectedPatientForDoc}
          patientName={selectedPatientForDoc}
          doctorUser={user}
          onClose={() => setSelectedPatientForDoc(null)}
        />
      )}

      {/* Clinician Reschedule Appointment Modal */}
      {patientToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Calendar className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                    Reschedule Appointment
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito">
                    Patient: <strong className="text-slate-800">{patientToReschedule.name}</strong> • Currently: {patientToReschedule.date || 'Today'} ({patientToReschedule.time})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPatientToReschedule(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-nunito">
              {/* 1. Select New Date */}
              <div className="space-y-2">
                <label className="font-bold font-outfit text-slate-700 block text-xs">
                  Select New Date
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {rescheduleDates.map((item) => {
                    const isSelected = rescheduleDate === item.fullDate;
                    return (
                      <button
                        key={item.fullDate}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setRescheduleDate(item.fullDate);
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all font-outfit cursor-pointer ${
                          isSelected
                            ? 'bg-[#006c44] text-white border-[#006c44] font-bold shadow-xs ring-2 ring-emerald-400/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <span className="block text-xs font-bold">{item.label}</span>
                        <span className="block text-[10px] opacity-80 truncate">{item.fullDate.split(',')[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Select New Time Slot */}
              <div className="space-y-2">
                <label className="font-bold font-outfit text-slate-700 block text-xs">
                  Select New Time Slot
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {rescheduleSlots.map((slot) => {
                    const isSelected = rescheduleSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setRescheduleSlot(slot);
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all font-mono text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-[#022434] text-white border-[#022434] font-bold shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Reason for Reschedule */}
              <div className="space-y-2">
                <label className="font-bold font-outfit text-slate-700 block text-xs">
                  Reason for Reschedule (Sent to Patient)
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Clinical emergency conflict',
                    'Ward rounds delay',
                    'Hospital surgical duty',
                    'Clinician schedule adjustment',
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRescheduleReason(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        rescheduleReason === r
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Enter custom reason or note..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0f172a] focus:outline-none focus:border-[#006c44]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  The patient will receive a real-time notification with the new date, reason, and a 1-click <strong>Save to Google Calendar</strong> link with login deep-link.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPatientToReschedule(null)}
                className="px-4 py-2 text-xs font-bold font-outfit text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={isSubmittingReschedule || !rescheduleDate || !rescheduleSlot}
                className="px-5 py-2.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                {isSubmittingReschedule ? (
                  <span>Updating Schedule...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Confirm &amp; Notify Patient</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End-of-Consultation Clinical Summary Modal (Doctor) */}
      {selectedPatientForSummary && (
        <ConsultationSummaryModal
          isOpen={isConsultationSummaryModalOpen}
          onClose={() => {
            setIsConsultationSummaryModalOpen(false);
            setSelectedPatientForSummary(null);
          }}
          patientName={selectedPatientForSummary.name}
          doctorName={user.name.trim().startsWith('Dr.') ? user.name.trim() : `Dr. ${user.name.trim()}`}
          doctorSpecialty={user.doctorSpecialty || 'General Practice'}
          doctorLicense={user.doctorLicenseNo || 'MDCN Verified'}
          appointmentId={selectedPatientForSummary.id}
          consultationType={selectedPatientForSummary.type || 'Video'}
          onSaveSummary={(summary) => {
            handleConcludeConsultation(selectedPatientForSummary.id, selectedPatientForSummary.name, summary);
          }}
        />
      )}
    </div>
  );
};
