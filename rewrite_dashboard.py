import os

content = """import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { BottomNav } from '../common/BottomNav';
import {
  Star,
  Info,
  Phone,
  Video,
  MessageSquare,
  Stethoscope,
  Pill,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  TestTube,
  ChevronDown,
  Calendar,
  Shield,
  Users,
  WifiOff,
  Database,
  RefreshCw,
} from 'lucide-react';
import { ScreenId, User, MedicationReminder, BookingSummary } from '../../types';
import { mockDoctors, mockUpcomingAppointment } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { getStoredReminders, saveStoredReminders } from '../../utils/reminders';
import { NextAppointmentBanner } from '../common/NextAppointmentBanner';
import { DependentSwitcher } from '../common/DependentSwitcher';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { resetDemoAppointment15Min } from '../../utils/appointmentNotifications';
import { processJoinOrPayConsultation, isConsultationPaid } from '../../utils/consultationPayment';
import { useOfflineStatus } from '../../utils/useOfflineStatus';
import { getDashboardFromOfflineDB, DashboardCache } from '../../utils/offlineDb';

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
  const [activeCategory, setActiveCategory] = useState('General Practice');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMedicationsExpanded, setIsMedicationsExpanded] = useState(true);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const { isOffline, isSimulatedOffline } = useOfflineStatus();
  const effectiveOffline = isOfflineMode || isOffline || isSimulatedOffline;

  useEffect(() => {
    const loadReminders = () => {
      const stored = getStoredReminders();
      setReminders(stored);
    };
    loadReminders();
    window.addEventListener('remindersUpdated', loadReminders);
    return () => window.removeEventListener('remindersUpdated', loadReminders);
  }, []);

  const handleMarkTaken = (id: string) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, takenToday: true, lastTakenTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) } : r
    );
    setReminders(updated);
    saveStoredReminders(updated);
  };

  const handleSnooze = (id: string) => {
    // Snooze logic mock
  };

  const categories = ['General Practice', 'Pediatrics', 'Women\\'s Health', 'Mental Health', 'Cardiology'];
  const displayDoctors = mockDoctors.filter(d => activeCategory === 'General Practice' ? true : d.specialty.includes(activeCategory)).slice(0, 3);
  const activeReminders = reminders.filter(r => r.enabled);
  const dueReminders = activeReminders.filter(r => r.isDueNow && !r.takenToday);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-nunito selection:bg-emerald-100 selection:text-emerald-900 pb-24">
      <StatusBar theme="light" />
      <Header 
        user={user} 
        onNavigate={onNavigate} 
        onNotificationClick={() => { triggerHaptic('light'); setIsNotificationsOpen(true); }}
        notificationCount={dueReminders.length + 1}
      />

      <div className="flex-1 px-4 sm:px-5 pt-20 max-w-3xl mx-auto w-full space-y-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-outfit text-[#022434] truncate">
              Good morning, {user.name.split(' ')[0]}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-nunito truncate">How are you feeling today?</p>
          </div>
          <DependentSwitcher user={user} />
        </div>

        {effectiveOffline && (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-800 shrink-0">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold font-outfit text-amber-900 block">Offline Mode — Cached Dashboard Active</span>
                <span className="text-[11px] text-amber-800">Preserved in IndexedDB storage. Appointments and records are accessible without connection.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
              IndexedDB
            </span>
          </div>
        )}

        <NextAppointmentBanner 
          onNavigate={onNavigate} 
          role="patient" 
          onSaveBookingSummary={onSaveBookingSummary} 
        />

        {dueReminders.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-4.5 sm:p-5 shadow-lg border border-amber-400/40 animate-in fade-in slide-in-from-top-2 duration-300">
            {dueReminders.map((due) => (
              <div key={due.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-amber-100 animate-bounce shrink-0">
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-md shrink-0">
                          Dose Due Now
                        </span>
                        <span className="text-xs font-semibold text-amber-100 truncate">{due.time}</span>
                      </div>
                      <h4 className="font-extrabold font-outfit text-sm sm:text-base text-white mt-0.5 truncate">
                        {due.drugName} {due.dosage}
                      </h4>
                      <p className="text-xs text-amber-100 font-nunito truncate">{due.frequency} • {due.doctorName}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-1 border-t border-amber-400/30">
                  <button
                    onClick={() => { triggerHaptic('success'); handleMarkTaken(due.id); }}
                    className="flex-1 min-h-[44px] py-2.5 px-3 bg-white text-amber-950 font-extrabold font-outfit text-xs sm:text-sm rounded-xl shadow-sm hover:bg-amber-50 transition-all active:scale-98 flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mark as Taken</span>
                  </button>
                  <button
                    onClick={() => { triggerHaptic('light'); handleSnooze(due.id); }}
                    className="min-h-[44px] px-4 py-2.5 bg-amber-800/60 hover:bg-amber-800 text-amber-100 font-bold font-outfit text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center shrink-0"
                  >
                    Snooze
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          <div className="h-full min-h-[220px] bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-extrabold font-outfit uppercase tracking-wider text-[#022434] truncate">
                  Upcoming Appointment
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#006c44] border border-emerald-200 shrink-0">
                  Confirmed
                </span>
              </div>
              <div className="flex items-center space-x-3.5 sm:space-x-4 mb-4 min-w-0">
                <img
                  src={mockUpcomingAppointment.doctorAvatar}
                  alt={mockUpcomingAppointment.doctorName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-2xs border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold font-outfit text-[#022434] text-base truncate">
                    {mockUpcomingAppointment.doctorName}
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito truncate mt-0.5">
                    {mockUpcomingAppointment.doctorSpecialty}
                  </p>
                  <p className="text-xs text-[#006c44] font-bold mt-1.5 truncate flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{mockUpcomingAppointment.date}, {mockUpcomingAppointment.timeSlot}</span>
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5 inline-block">
                    {mockUpcomingAppointment.type} Consultation
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                processJoinOrPayConsultation({
                  id: mockUpcomingAppointment.id,
                  type: mockUpcomingAppointment.type,
                  doctorId: 'doc-anya',
                  doctorName: mockUpcomingAppointment.doctorName,
                  doctorSpecialty: mockUpcomingAppointment.doctorSpecialty,
                  doctorAvatar: mockUpcomingAppointment.doctorAvatar,
                  price: 10000,
                  onNavigate,
                  onSaveBookingSummary,
                });
              }}
              className="w-full min-h-[44px] py-2.5 sm:py-3 px-4 bg-[#1c3a4a] hover:bg-[#022434] text-white font-bold font-outfit text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <Video className="w-4 h-4 shrink-0" />
              <span className="truncate">Start Consultation</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-2.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { triggerHaptic('selection'); setActiveCategory(cat); }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold font-outfit whitespace-nowrap min-h-[44px] flex items-center justify-center transition-all ${
                activeCategory === cat
                  ? 'bg-[#1c3a4a] text-white shadow-sm ring-2 ring-[#1c3a4a]/20'
                  : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="min-w-0 flex-1 mr-2">
              <h3 className="font-bold font-outfit text-[#022434] text-base truncate">
                Verified Clinicians Available Now
              </h3>
              <p className="text-[11px] text-slate-500 font-nunito truncate">
                Board certified medical practitioners • {activeCategory}
              </p>
            </div>
            <button
              onClick={() => { triggerHaptic('selection'); onNavigate('doctor-discovery'); }}
              className="text-xs font-bold text-[#006c44] hover:underline flex items-center min-h-[44px] px-2 shrink-0"
            >
              <span>Discover All</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 shrink-0" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {displayDoctors.map((doc) => (
              <div
                key={doc.id}
                className="h-full flex flex-col justify-between bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={() => {
                    onSelectDoctor(doc.id);
                    onNavigate('doctor-profile');
                  }}
                >
                  <img
                    src={doc.avatarUrl}
                    alt={doc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Online</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-[#022434]/85 backdrop-blur-xs text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {doc.yearsExperience} yrs exp
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#022434] via-[#022434]/70 to-transparent p-3 sm:p-4 text-white min-w-0">
                    <h4 className="font-extrabold font-outfit text-sm sm:text-base truncate drop-shadow-md">
                      {doc.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-300 font-nunito truncate drop-shadow-md mt-0.5">
                      {doc.specialty}
                    </p>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 mb-2.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold font-outfit text-[#022434]">{doc.rating}</span>
                      <span className="text-[10px] text-slate-500 font-nunito">({doc.reviewsCount} reviews)</span>
                    </div>
                    <div className="flex gap-1.5 mb-4 flex-wrap">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold font-outfit rounded-md shrink-0">
                        Chat: ₦{doc.prices.chat.toLocaleString()}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold font-outfit rounded-md shrink-0">
                        Video: ₦{doc.prices.video.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectDoctor(doc.id);
                      onNavigate('doctor-profile');
                    }}
                    className="w-full min-h-[44px] py-2 bg-white text-[#1c3a4a] border-2 border-slate-200 hover:border-[#1c3a4a] hover:bg-slate-50 font-bold font-outfit text-xs sm:text-sm rounded-xl transition-colors active:scale-[0.98]"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div
            onClick={() => { triggerHaptic('selection'); onNavigate('doctor-discovery'); }}
            className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl group-hover:bg-emerald-800 group-hover:text-white transition-colors shrink-0 w-11 h-11 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>
              <div className="min-w-0 mt-3">
                <h4 className="font-extrabold font-outfit text-base text-[#022434] truncate">
                  Book a Doctor
                </h4>
                <p className="text-xs text-slate-500 font-nunito line-clamp-2 mt-1 min-w-0">
                  Instant teleconsultations
                </p>
              </div>
            </div>
          </div>
          <div
            onClick={() => { triggerHaptic('selection'); onNavigate('health-records'); }}
            className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="p-3 bg-blue-100 text-blue-800 border border-blue-200/80 rounded-2xl group-hover:bg-blue-800 group-hover:text-white transition-colors shrink-0 w-11 h-11 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="min-w-0 mt-3">
                <h4 className="font-extrabold font-outfit text-base text-[#022434] truncate">
                  Health Records
                </h4>
                <p className="text-xs text-slate-500 font-nunito line-clamp-2 mt-1 min-w-0">
                  Access digital EHR history
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
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
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => { triggerHaptic('light'); setIsNotificationsOpen(false); }}
              className="w-full py-3 bg-[#1c3a4a] text-white font-bold font-outfit text-xs rounded-xl hover:bg-[#022434] transition-colors"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}

      <BottomNav role="patient" currentScreen="patient-home" onNavigate={onNavigate} />
    </div>
  );
};
"""

with open("src/components/screens/PatientHomeDashboard.tsx", "w") as f:
    f.write(content)
