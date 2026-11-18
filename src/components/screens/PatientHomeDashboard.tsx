import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle2,
  X,
  Calendar,
  WifiOff,
  Video,
  Phone,
  MessageSquare,
  Clock,
  Plus,
  Stethoscope,
  FileText,
  Users,
  PhoneCall,
  ChevronRight,
  ShieldCheck,
  Activity,
  Star,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { ScreenId, User, BookingSummary, Doctor } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { useOfflineStatus } from '../../utils/useOfflineStatus';
import {
  AppointmentAlert,
  getActiveOrUpcomingConsultations,
  cancelConsultation,
} from '../../utils/appointmentNotifications';
import { processJoinOrPayConsultation } from '../../utils/consultationPayment';
import { showToast } from '../../utils/toast';
import { primeApi } from '../../services/apiClient';
import { AddDoctorModal } from '../common/AddDoctorModal';
import { CareJourneyPatientWidget } from '../common/CareJourneyPatientWidget';
import { PostConsultationNotificationsWidget } from '../common/PostConsultationNotificationsWidget';
import {
  getStoredReminders,
  getStoredDrugPurchaseNotifications,
} from '../../utils/reminders';
import { MedicationReminder, DrugPurchaseNotification } from '../../types';

interface PatientHomeDashboardProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  onSelectDoctor: (doctorId: string) => void;
  onSaveBookingSummary?: (summary: BookingSummary) => void;
  isOfflineMode?: boolean;
}

export const PatientHomeDashboard: React.FC<PatientHomeDashboardProps> = ({
  user,
  onNavigate,
  onSelectDoctor,
  onSaveBookingSummary,
  isOfflineMode = false,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [onlineDoctors, setOnlineDoctors] = useState<Doctor[]>([]);
  const [consultations, setConsultations] = useState<AppointmentAlert[]>([]);
  const [medReminders, setMedReminders] = useState<MedicationReminder[]>(() => getStoredReminders());
  const [purchaseAlerts, setPurchaseAlerts] = useState<DrugPurchaseNotification[]>(() => getStoredDrugPurchaseNotifications());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');
  const [metricView, setMetricView] = useState<'bpm' | 'temp' | 'bp'>('bpm');
  const { isOffline, isSimulatedOffline } = useOfflineStatus();
  const effectiveOffline = isOfflineMode || isOffline || isSimulatedOffline;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [allRegisteredDoctors, setAllRegisteredDoctors] = useState<Doctor[]>([]);

  const loadDoctors = () => {
    const legacyIds = new Set(['doc-anya', 'doc-kenji', 'doc-emeka', 'doc-sarah', 'doc-ching', 'doc-chike', 'doc-fatima', 'doc-1']);
    primeApi.getDoctors().then((docs) => {
      const serverDocs = (docs || []).filter((d) => !legacyIds.has(d.id));
      const finalDocs = [...serverDocs];
      try {
        const custom = JSON.parse(localStorage.getItem('prime_telecare_custom_doctors') || '[]')
          .filter((d: any) => d && !legacyIds.has(d.id));
        if (custom.length > 0) {
          const ids = new Set(finalDocs.map((d: any) => d.id));
          for (const cd of custom) {
            if (!ids.has(cd.id)) finalDocs.push(cd);
          }
        }
      } catch {}
      setAllRegisteredDoctors(finalDocs);
      setOnlineDoctors(finalDocs.filter((d) => d.isOnline !== false));
    }).catch(() => {
      try {
        const custom = JSON.parse(localStorage.getItem('prime_telecare_custom_doctors') || '[]')
          .filter((d: any) => d && !legacyIds.has(d.id));
        setAllRegisteredDoctors(custom);
        setOnlineDoctors(custom.filter((d: any) => d.isOnline !== false));
      } catch {
        setAllRegisteredDoctors([]);
        setOnlineDoctors([]);
      }
    });
  };

  useEffect(() => {
    loadDoctors();
    const poll = window.setInterval(loadDoctors, 10000);
    const handleFocus = () => loadDoctors();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('doctors-directory-updated', handleFocus);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('doctors-directory-updated', handleFocus);
    };
  }, []);

  useEffect(() => {
    const loadConsultations = () => {
      const active = getActiveOrUpcomingConsultations();
      setConsultations(active);
    };
    const loadAlerts = () => {
      setMedReminders(getStoredReminders());
      setPurchaseAlerts(getStoredDrugPurchaseNotifications());
    };
    loadConsultations();
    loadAlerts();
    window.addEventListener('appointment-alerts-updated', loadConsultations);
    window.addEventListener('consultation-payment-updated', loadConsultations);
    window.addEventListener('reminders-updated', loadAlerts);
    window.addEventListener('drug-purchase-notifications-updated', loadAlerts);
    return () => {
      window.removeEventListener('appointment-alerts-updated', loadConsultations);
      window.removeEventListener('consultation-payment-updated', loadConsultations);
      window.removeEventListener('reminders-updated', loadAlerts);
      window.removeEventListener('drug-purchase-notifications-updated', loadAlerts);
    };
  }, []);

  const handleJoinConsultation = (consult: AppointmentAlert) => {
    triggerHaptic('heavy');
    processJoinOrPayConsultation({
      id: consult.id,
      type: consult.type,
      doctorId: consult.doctorId || 'doc-attending',
      doctorName: consult.doctorName,
      doctorSpecialty: consult.doctorSpecialty,
      doctorAvatar: consult.doctorAvatar,
      price: consult.price || 10000,
      onNavigate,
      onSaveBookingSummary,
    });
  };

  const handleCancelConsultation = (id: string, doctorName: string) => {
    triggerHaptic('medium');
    cancelConsultation(id);
    showToast(`Consultation with ${doctorName} has been cancelled.`);
  };

  const weeklyVitalsData = [
    { day: 'Mon', bpm: 72, temp: 98.2, sys: 120, dia: 80 },
    { day: 'Tue', bpm: 74, temp: 98.4, sys: 118, dia: 79 },
    { day: 'Wed', bpm: 71, temp: 98.1, sys: 121, dia: 81 },
    { day: 'Thu', bpm: 75, temp: 98.6, sys: 122, dia: 82 },
    { day: 'Fri', bpm: 73, temp: 98.3, sys: 119, dia: 78 },
    { day: 'Sat', bpm: 76, temp: 98.5, sys: 124, dia: 83 },
    { day: 'Sun', bpm: 72, temp: 98.2, sys: 120, dia: 80 },
  ];
  const monthlyVitalsData = [
    { day: 'W1', bpm: 73, temp: 98.2, sys: 120, dia: 80 },
    { day: 'W2', bpm: 71, temp: 98.4, sys: 118, dia: 79 },
    { day: 'W3', bpm: 75, temp: 98.1, sys: 121, dia: 81 },
    { day: 'W4', bpm: 74, temp: 98.6, sys: 122, dia: 82 },
  ];
  const currentVitalsData = chartView === 'weekly' ? weeklyVitalsData : monthlyVitalsData;

  const isWeekly = chartView === 'weekly';
  let activeMetricInfo = { 
    title: 'Heart Rate', unit: 'bpm', value: '73', color: '#006c44', dataKey: 'bpm',
    trend: { value: isWeekly ? '-2%' : '-5%', direction: 'down', colorClass: 'text-emerald-600 bg-emerald-50' }
  };
  if (metricView === 'temp') {
    activeMetricInfo = { 
      title: 'Temperature', unit: '°F', value: '98.3', color: '#ea580c', dataKey: 'temp',
      trend: { value: isWeekly ? '+0.2%' : '+0.5%', direction: 'up', colorClass: 'text-rose-600 bg-rose-50' }
    };
  } else if (metricView === 'bp') {
    activeMetricInfo = { 
      title: 'Blood Pressure', unit: 'mmHg', value: '120/80', color: '#2563eb', dataKey: 'sys',
      trend: { value: isWeekly ? '-1%' : '-3%', direction: 'down', colorClass: 'text-emerald-600 bg-emerald-50' }
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-nunito selection:bg-emerald-100 selection:text-emerald-900 pb-28 sm:pb-32">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Header Greeting Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={user.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-outfit text-[#022434] tracking-tight">
                  Good day, {(user?.name?.trim() || 'Patient').split(' ')[0]}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#006c44] border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                  Health ID: {user?.id ? (user.id.startsWith('user-') ? 'PRM-' + user.id.slice(-4) : user.id.toUpperCase()) : 'PRM-0001'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 self-end md:self-center">
            <button
              onClick={() => { triggerHaptic('selection'); setIsNotificationsOpen(true); }}
              className="relative p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-[#022434] transition-all cursor-pointer shadow-2xs"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {(consultations.length > 0 || medReminders.some((r) => r.enabled) || purchaseAlerts.some((p) => p.enabled && !p.purchased)) && (
                <span className="absolute top-2 right-2 flex items-center justify-center w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                onNavigate('book-consultation');
              }}
              className="px-4 py-2.5 sm:px-5 sm:py-3 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-xs sm:text-sm rounded-2xl shadow-xs transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Offline Banner if effectiveOffline */}
        {effectiveOffline && (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-800 shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold font-outfit text-amber-900 block text-sm">Offline Mode</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setIsInstantModalOpen(true);
            }}
            className="p-4 sm:p-5 bg-white hover:bg-emerald-50/40 rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-[#006c44] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold font-outfit text-sm sm:text-base text-[#022434] block">
              Instant Doctor
            </span>
            <span className="text-[11px] text-[#006c44] font-semibold flex items-center space-x-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineDoctors.length} Online Now</span>
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('doctor-discovery');
            }}
            className="p-4 sm:p-5 bg-white hover:bg-blue-50/40 rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold font-outfit text-sm sm:text-base text-[#022434] block">
              Specialist Clinic
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('family-account');
            }}
            className="p-4 sm:p-5 bg-white hover:bg-purple-50/40 rounded-2xl border border-slate-200/90 hover:border-purple-300 shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-bold font-outfit text-sm sm:text-base text-[#022434] block">
              Family Dependents
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('health-records');
            }}
            className="p-4 sm:p-5 bg-white hover:bg-teal-50/40 rounded-2xl border border-slate-200/90 hover:border-teal-300 shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-bold font-outfit text-sm sm:text-base text-[#022434] block">
              Medical Records
            </span>
          </button>
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Main Column (lg:col-span-7 xl:col-span-8) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
            
            {/* Online Doctors Live Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006c44] flex items-center justify-center border border-emerald-200/60">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                        Online Doctors
                      </h3>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[#006c44] text-[10px] font-extrabold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{onlineDoctors.length} Live</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('doctor-discovery');
                  }}
                  className="text-xs font-bold text-[#006c44] hover:underline flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {onlineDoctors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {onlineDoctors.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-slate-50/60 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={doc.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'}
                            alt={doc.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold font-outfit text-xs sm:text-sm text-[#022434] truncate">
                            {doc.name}
                          </p>
                          <p className="text-[11px] font-semibold text-[#006c44] truncate">
                            {doc.specialty}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            ₦{(doc.prices?.video || 10000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          onSelectDoctor(doc.id);
                          try {
                            localStorage.setItem('prime_telecare_booking_mode', 'instant');
                          } catch {}
                          onNavigate('book-consultation');
                        }}
                        className="px-3 py-2 bg-[#006c44] hover:bg-[#022434] text-white text-[11px] font-bold font-outfit rounded-xl transition-colors shrink-0 cursor-pointer"
                      >
                        Consult
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                  No doctors online.
                </div>
              )}
            </div>

            {/* Care Journey Tracker (Doctor-decided Recovery To-Do List) */}
            <CareJourneyPatientWidget onNavigate={onNavigate} patientId={user?.id} />

            {/* After-Consultation Notifications (Drug Purchase & Prescription Administration Alerts) */}
            <PostConsultationNotificationsWidget user={user} onNavigate={onNavigate} />

            {/* Upcoming / Active Bookings Section */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold font-outfit text-[#022434] text-lg sm:text-xl">
                  Active & Upcoming Consultations
                </h3>
                {consultations.length > 0 && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-[#006c44] font-bold text-xs rounded-xl font-mono">
                    {consultations.length} Scheduled
                  </span>
                )}
              </div>

              {consultations.length > 0 ? (
                <div className="space-y-4">
                  {consultations.map((consult) => {
                    const diffMs = consult.startTimeTimestamp - currentTime;
                    const isStartingSoon = diffMs <= 15 * 60 * 1000 && diffMs >= -45 * 60 * 1000;
                    
                    let countdownLabel = `${consult.scheduledDate} • ${consult.scheduledTime}`;
                    if (diffMs <= 0 && diffMs >= -45 * 60 * 1000) {
                      countdownLabel = 'Live Now • Room Ready';
                    } else if (diffMs > 0 && diffMs <= 15 * 60 * 1000) {
                      const totalSecs = Math.floor(diffMs / 1000);
                      const mins = Math.floor(totalSecs / 60);
                      const secs = totalSecs % 60;
                      countdownLabel = `Starts in ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
                    }

                    return (
                      <motion.div
                        key={consult.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 hover:border-slate-300 transition-all space-y-4"
                      >
                        {/* Top Meta Bar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
                              {consult.type === 'Chat' ? (
                                <MessageSquare className="w-3.5 h-3.5 text-[#006c44]" />
                              ) : consult.type === 'Voice' ? (
                                <Phone className="w-3.5 h-3.5 text-[#006c44]" />
                              ) : (
                                <Video className="w-3.5 h-3.5 text-[#006c44]" />
                              )}
                              <span>{consult.type} Call</span>
                            </span>

                            {isStartingSoon ? (
                              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-[#006c44] border border-emerald-200/80 text-xs font-bold rounded-xl">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{countdownLabel}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{consult.scheduledDate}, {consult.scheduledTime}</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleCancelConsultation(consult.id, consult.doctorName)}
                            className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors px-1 py-0.5 shrink-0"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Doctor Details */}
                        <div className="flex items-center space-x-4">
                          <img
                            src={consult.doctorAvatar}
                            alt={consult.doctorName}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold font-outfit text-base sm:text-lg text-[#022434] leading-snug">
                              {consult.doctorName}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-500 font-nunito mt-0.5">
                              {consult.doctorSpecialty}
                            </p>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={() => handleJoinConsultation(consult)}
                          className="w-full py-3.5 px-5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-2xl shadow-xs hover:shadow-sm transition-all active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          {consult.type === 'Chat' ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : consult.type === 'Voice' ? (
                            <Phone className="w-4 h-4" />
                          ) : (
                            <Video className="w-4 h-4" />
                          )}
                          <span>{isStartingSoon ? 'Join Consultation Room' : 'Enter Consultation'}</span>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* When there are no active consultations or booked consultations: show 'book a consultation now' */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-8 sm:p-10 shadow-xs border border-slate-200/90 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006c44] border border-emerald-100">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h4 className="text-base sm:text-lg font-bold font-outfit text-[#022434]">
                      No active or scheduled consultations
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onNavigate('book-consultation');
                    }}
                    className="w-full max-w-sm py-3.5 px-6 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Book a consultation now</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Care Continuity & Health Wallet Card */}
            <div className="bg-gradient-to-r from-[#022434] to-[#04364e] rounded-3xl p-6 sm:p-7 text-white shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Data Privacy & Security
                    </span>
                  </div>
                  <h4 className="font-extrabold font-outfit text-lg sm:text-xl text-white">
                    Clinical Data Encryption & Patient Rights
                  </h4>
                </div>
                <button
                  onClick={() => onNavigate('health-records')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold font-outfit transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  View EHR Audit Logs
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Biometrics & Clinical Support (lg:col-span-5 xl:col-span-4) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 sm:space-y-8">
            
            {/* 1. Quick-Glance Health Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold font-outfit text-[#022434] text-base">Health Summary</h3>
                <div className="flex bg-slate-100 p-0.5 rounded-xl shrink-0">
                  <button 
                    onClick={() => { triggerHaptic('selection'); setChartView('weekly'); }}
                    className={`px-3 py-1 text-xs font-bold font-outfit rounded-lg transition-colors ${chartView === 'weekly' ? 'bg-white text-[#022434] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    1W
                  </button>
                  <button 
                    onClick={() => { triggerHaptic('selection'); setChartView('monthly'); }}
                    className={`px-3 py-1 text-xs font-bold font-outfit rounded-lg transition-colors ${chartView === 'monthly' ? 'bg-white text-[#022434] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    1M
                  </button>
                </div>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => { triggerHaptic('selection'); setMetricView('bpm'); }}
                  className={`flex-1 py-1.5 text-xs font-bold font-outfit rounded-lg transition-colors ${metricView === 'bpm' ? 'bg-white text-[#006c44] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Pulse
                </button>
                <button 
                  onClick={() => { triggerHaptic('selection'); setMetricView('temp'); }}
                  className={`flex-1 py-1.5 text-xs font-bold font-outfit rounded-lg transition-colors ${metricView === 'temp' ? 'bg-white text-[#ea580c] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Temp
                </button>
                <button 
                  onClick={() => { triggerHaptic('selection'); setMetricView('bp'); }}
                  className={`flex-1 py-1.5 text-xs font-bold font-outfit rounded-lg transition-colors ${metricView === 'bp' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  BP
                </button>
              </div>
              
              <div className="flex items-end space-x-4 pt-1">
                <div className="pb-1 min-w-[90px]">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="text-3xl font-extrabold font-outfit text-[#022434] leading-none">{activeMetricInfo.value}</div>
                    <div className={`flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeMetricInfo.trend.colorClass}`}>
                      {activeMetricInfo.trend.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {activeMetricInfo.trend.value}
                    </div>
                  </div>
                  <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">{activeMetricInfo.unit}</div>
                </div>
                <div className="flex-1 h-24 -mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentVitalsData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorbpm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#006c44" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#006c44" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colortemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorbp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorbp_dia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '4px 12px' }}
                        labelStyle={{ display: 'none' }}
                        itemStyle={{ color: activeMetricInfo.color, fontWeight: 'bold', fontSize: '14px' }}
                        cursor={{ stroke: activeMetricInfo.color, strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey={activeMetricInfo.dataKey} stroke={activeMetricInfo.color} strokeWidth={3} fillOpacity={1} fill={`url(#color${metricView})`} />
                      {metricView === 'bp' && (
                        <Area type="monotone" dataKey="dia" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorbp_dia)" />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* 24/7 Medical Hotline & Urgent Care */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold font-outfit text-sm text-[#022434]">
                    24/7 Clinical Emergency Hotline
                  </h4>
                </div>
              </div>

              <a
                href="tel:112"
                className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl flex items-center justify-between text-xs font-bold font-outfit transition-all cursor-pointer"
              >
                <span>National Emergency: Dial 112 / 199</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>

      </div>

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 rounded-xl text-[#006c44]">
                  <Bell className="w-5 h-5 fill-[#006c44]" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-base text-[#022434]">Notifications</h3>
                </div>
              </div>
              <button
                onClick={() => { triggerHaptic('light'); setIsNotificationsOpen(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {consultations.length > 0 || medReminders.some((r) => r.enabled) || purchaseAlerts.some((p) => p.enabled && !p.purchased) ? (
              <div className="space-y-3">
                {consultations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Consultations
                    </span>
                    {consultations.map((c) => (
                      <div key={c.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
                        <p className="font-bold text-emerald-900">{c.type} session with {c.doctorName}</p>
                        <p className="text-emerald-700">{c.scheduledDate} at {c.scheduledTime}</p>
                      </div>
                    ))}
                  </div>
                )}

                {purchaseAlerts.filter((p) => p.enabled && !p.purchased).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Drug Purchase Alerts
                    </span>
                    {purchaseAlerts
                      .filter((p) => p.enabled && !p.purchased)
                      .map((p) => (
                        <div key={p.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs">
                          <p className="font-bold text-blue-950">Buy: {p.drugNames.join(', ')}</p>
                          <p className="text-blue-700">
                            {p.reminderDate} at {p.reminderTime}{p.pharmacyName ? ` • ${p.pharmacyName}` : ''}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                {medReminders.filter((r) => r.enabled).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Drug Administration (From Prescription)
                    </span>
                    {medReminders
                      .filter((r) => r.enabled)
                      .map((r) => (
                        <div key={r.id} className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs">
                          <p className="font-bold text-teal-950">
                            {r.drugName} ({r.dosage})
                          </p>
                          <p className="text-teal-700">
                            {r.time} • {r.frequency}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No active notifications yet.</p>
            )}
            <button
              onClick={() => { triggerHaptic('light'); setIsNotificationsOpen(false); }}
              className="w-full min-h-[44px] py-3 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl transition-all cursor-pointer"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}

      {/* Online Doctors Instant Consultation Modal */}
      {isInstantModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 font-nunito">
            {/* Header */}
            <div className="bg-linear-to-r from-[#022434] to-[#1c3a4a] text-white p-5 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/40 text-emerald-300">
                  <Stethoscope className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Doctors Online Now
                    </span>
                  </div>
                  <h3 className="font-extrabold font-outfit text-lg leading-tight text-white mt-0.5">
                    Choose Clinician for Instant Care
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsInstantModalOpen(false);
                }}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Online Doctors */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {onlineDoctors.length > 0 ? (
                <div className="space-y-3">
                  {onlineDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={doc.avatarUrl}
                            alt={doc.name}
                            className="w-13 h-13 rounded-2xl object-cover border border-slate-200"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold font-outfit text-sm text-[#022434] truncate">
                              {doc.name}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#006c44]">
                              MDCN
                            </span>
                          </div>
                          <p className="text-xs text-[#006c44] font-semibold truncate font-outfit mt-0.5">
                            {doc.specialty}
                          </p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center text-amber-600 font-bold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                              {doc.rating || 5.0}
                            </span>
                            <span>•</span>
                            <span className="font-mono font-bold text-[#006c44]">
                              ₦{doc.prices?.video?.toLocaleString() || '10,000'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          onSelectDoctor(doc.id);
                          try {
                            localStorage.setItem('prime_telecare_booking_mode', 'instant');
                          } catch {}
                          setIsInstantModalOpen(false);
                          onNavigate('book-consultation');
                        }}
                        className="px-4 py-2.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300" />
                        <span>Select & Connect</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006c44] mx-auto border border-emerald-100">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold font-outfit text-sm text-[#022434]">No Doctors Currently Online</h4>
                    <p className="text-xs text-slate-500">
                      Online doctors will appear here automatically as soon as they sign in and go live.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInstantModalOpen(false);
                      onNavigate('doctor-discovery');
                    }}
                    className="px-4 py-2.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Browse Specialist Clinic
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

