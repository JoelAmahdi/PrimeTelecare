import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ScreenId, User, MedicationReminder } from '../../types';
import { mockDoctors, mockUpcomingAppointment } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { getStoredReminders, saveStoredReminders } from '../../utils/reminders';
import { NextAppointmentBanner } from '../common/NextAppointmentBanner';
import { resetDemoAppointment15Min } from '../../utils/appointmentNotifications';

interface PatientHomeDashboardProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  onSelectDoctor: (doctorId: string) => void;
}

export const PatientHomeDashboard: React.FC<PatientHomeDashboardProps> = ({
  user,
  onNavigate,
  onSelectDoctor,
}) => {
  const [activeCategory, setActiveCategory] = useState('General Visits');
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    setReminders(getStoredReminders());
    const handleSync = () => setReminders(getStoredReminders());
    window.addEventListener('reminders-updated', handleSync);
    return () => window.removeEventListener('reminders-updated', handleSync);
  }, []);

  const dueReminders = reminders.filter((r) => r.enabled && r.isDueNow && !r.takenToday);
  const activeReminders = reminders.filter((r) => r.enabled);

  const handleMarkTaken = (id: string) => {
    triggerHaptic('selection');
    const updated = reminders.map((r) =>
      r.id === id
        ? {
            ...r,
            takenToday: true,
            isDueNow: false,
            lastTakenTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        : r
    );
    saveStoredReminders(updated);
    setReminders(updated);
  };

  const handleSnooze = (id: string) => {
    triggerHaptic('light');
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, isDueNow: false } : r
    );
    saveStoredReminders(updated);
    setReminders(updated);
  };

  const categories = ['General Visits', 'Specialists', 'Mental Health', 'Pediatrics'];

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8" />

      {/* Main Header */}
      <Header
        title="Prime Telecare"
        showBell
        bellCount={dueReminders.length > 0 ? dueReminders.length + 1 : 1}
        onBellClick={() => {
          triggerHaptic('light');
          setIsNotificationsOpen(true);
        }}
        rightElement={
          <button
            onClick={() => onNavigate('settings')}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform active:scale-95"
          >
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </button>
        }
      />

      <div className="px-5 space-y-6 mt-2">
        {/* User Greeting */}
        <div>
          <h2 className="text-xl font-bold font-outfit text-[#022434]">Good morning, {user.name.split(' ')[0]}</h2>
          <p className="text-sm text-slate-500 font-nunito">How are you feeling today?</p>
        </div>

        {/* 15-Minute Next Appointment Local Notification Banner */}
        <NextAppointmentBanner onNavigate={onNavigate} role="patient" />

        {/* Due Medication Reminder Alert Banner */}
        {dueReminders.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-4.5 shadow-lg border border-amber-400/40 animate-in fade-in slide-in-from-top-2 duration-300">
            {dueReminders.map((due) => (
              <div key={due.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-amber-100 animate-bounce">
                      <Bell className="w-6 h-6 text-white fill-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-md">
                          Dose Due Now
                        </span>
                        <span className="text-xs font-semibold text-amber-100">{due.time}</span>
                      </div>
                      <h4 className="font-extrabold font-outfit text-base text-white mt-0.5">
                        {due.drugName} {due.dosage}
                      </h4>
                      <p className="text-xs text-amber-100 font-nunito">{due.frequency} • {due.doctorName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-amber-400/30">
                  <button
                    onClick={() => handleMarkTaken(due.id)}
                    className="flex-1 py-2.5 bg-white text-amber-950 font-extrabold font-outfit text-xs rounded-xl shadow-sm hover:bg-amber-50 transition-all active:scale-98 flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Mark as Taken</span>
                  </button>
                  <button
                    onClick={() => handleSnooze(due.id)}
                    className="px-3.5 py-2.5 bg-amber-800/60 hover:bg-amber-800 text-amber-100 font-bold font-outfit text-xs rounded-xl transition-colors"
                  >
                    Snooze
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Appointment Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100/80">
          <span className="text-xs font-bold font-outfit text-[#022434] block mb-3">Upcoming Appointment</span>

          <div className="flex items-center space-x-4 mb-4">
            <img
              src={mockUpcomingAppointment.doctorAvatar}
              alt={mockUpcomingAppointment.doctorName}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm"
            />
            <div>
              <h3 className="font-bold font-outfit text-[#022434] text-base">{mockUpcomingAppointment.doctorName}</h3>
              <p className="text-xs text-slate-500 font-nunito">{mockUpcomingAppointment.doctorSpecialty}</p>
              <p className="text-xs text-[#006c44] font-semibold mt-1">
                {mockUpcomingAppointment.date}, {mockUpcomingAppointment.timeSlot}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">{mockUpcomingAppointment.type} Consultation</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([30, 50, 30]);
              }
              triggerHaptic('medium');
              onNavigate('video-call');
            }}
            className="w-full py-2.5 sm:py-3 bg-[#1c3a4a] text-white font-bold font-outfit text-xs sm:text-sm rounded-xl shadow hover:bg-[#022434] transition-all transform active:scale-98 whitespace-nowrap"
          >
            Start Consultation
          </button>
        </div>

        {/* Categories Chips Horizontal Scroll */}
        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold font-outfit whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[#1c3a4a] text-white shadow-sm'
                  : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Doctors Available Now */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold font-outfit text-[#022434] text-base">Doctors Available Now</h3>
            <button onClick={() => onNavigate('book-consultation')} className="text-xs font-bold text-[#006c44] hover:underline flex items-center">
              See All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {mockDoctors.slice(1, 3).map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col justify-between group"
              >
                {/* Doctor Photo & Gradient Details */}
                <div
                  className="relative h-44 cursor-pointer"
                  onClick={() => {
                    onSelectDoctor(doc.id);
                    onNavigate('doctor-profile');
                  }}
                >
                  <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#022434]/90 via-[#022434]/30 to-transparent flex flex-col justify-end p-3 text-white">
                    <h4 className="font-bold font-outfit text-sm leading-tight">{doc.name}</h4>
                    <p className="text-[11px] text-slate-200">{doc.specialty}</p>
                    <div className="flex items-center space-x-1 mt-1 text-[11px]">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="font-semibold">{doc.rating}</span>
                      <span className="text-slate-300">({doc.reviewsCount}+ Reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Doctor Interaction Icons */}
                <div className="p-2 flex justify-around items-center bg-slate-50 border-t border-slate-100 text-slate-600">
                  <button
                    onClick={() => {
                      onSelectDoctor(doc.id);
                      onNavigate('doctor-profile');
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"
                    title="Doctor Info"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('video-call')}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('video-call')}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"
                    title="Video"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('active-chat')}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600"
                    title="Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="font-bold font-outfit text-[#022434] text-base mb-3">Quick Actions</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Redesigned Premium Book Consultation Card */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('book-consultation');
              }}
              className="relative overflow-hidden bg-gradient-to-br from-[#022434] via-[#1c3a4a] to-[#004d30] text-white p-5 rounded-3xl flex flex-col justify-between h-44 text-left shadow-xl hover:shadow-2xl transition-all transform active:scale-98 border border-emerald-500/30 group"
            >
              {/* Background ambient light */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#77daa4]/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>

              <div className="flex items-start justify-between relative z-10">
                <div className="p-3 bg-[#77daa4]/20 border border-[#77daa4]/40 rounded-2xl text-[#77daa4] shadow-inner group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Doctors Live 24/7</span>
                </div>
              </div>

              <div className="relative z-10 mt-3">
                <h4 className="font-extrabold font-outfit text-lg text-white leading-tight">
                  Book Consultation
                </h4>
                <p className="text-xs text-slate-300 font-nunito mt-0.5">
                  Instant Video, Audio or Chat
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-emerald-300 font-nunito">
                  From ₦8,000
                </span>
                <span className="bg-[#77daa4] text-[#022434] font-extrabold font-outfit text-xs px-3 py-1.5 rounded-xl shadow-sm group-hover:bg-emerald-300 transition-colors flex items-center space-x-1">
                  <span>Book Now</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Right stacked cards */}
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
              {/* Prescriptions Button */}
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigate('prescription-detail');
                }}
                className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between text-left hover:border-[#006c44] hover:shadow-sm transition-all active:scale-98 group w-full overflow-hidden"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2.5 sm:p-3 bg-emerald-100 text-[#006c44] border border-emerald-200/80 rounded-2xl group-hover:bg-[#006c44] group-hover:text-white transition-colors shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold font-outfit text-sm text-[#022434] leading-tight">
                        Prescriptions
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-nunito block truncate mt-0.5">
                      {activeReminders.length > 0 ? `${activeReminders.length} Active Alarms & Refills` : 'View Digital Rx & Refills'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#006c44] bg-emerald-100/80 px-2.5 py-1 rounded-full shrink-0 ml-2 group-hover:bg-[#006c44] group-hover:text-white transition-colors">
                  View Rx
                </span>
              </button>

              {/* Health Records Button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onNavigate('health-records');
                }}
                className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between text-left hover:border-[#006c44] hover:shadow-sm transition-all active:scale-98 group w-full overflow-hidden"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2.5 sm:p-3 bg-blue-100/80 rounded-2xl text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <span className="font-bold font-outfit text-sm text-[#022434] block leading-tight truncate">
                      Health Records
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-nunito block truncate mt-0.5">
                      Lab results & notes
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full shrink-0 ml-2">
                  Open
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Medication Reminders Section */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 text-[#006c44] rounded-xl">
                <Bell className="w-4 h-4 fill-[#006c44]" />
              </div>
              <div>
                <h3 className="font-bold font-outfit text-[#022434] text-sm leading-tight">Medication Reminders</h3>
                <span className="text-[11px] text-slate-400 font-nunito">Prescription Alarms</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('prescription-detail')}
              className="text-xs font-bold text-[#006c44] hover:underline flex items-center"
            >
              Set from Rx <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeReminders.map((rem) => (
              <div key={rem.id} className="py-3 flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-2xl shrink-0 ${rem.takenToday ? 'bg-emerald-100 text-[#006c44]' : 'bg-slate-100 text-slate-600'}`}>
                    {rem.takenToday ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold font-outfit text-xs text-[#022434] truncate">{rem.drugName} ({rem.dosage})</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">{rem.time}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-nunito block mt-0.5 truncate">
                      {rem.takenToday ? `Dose taken today at ${rem.lastTakenTime || '08:00 AM'}` : `${rem.frequency} • ${rem.doctorName}`}
                    </span>
                  </div>
                </div>

                {!rem.takenToday && (
                  <button
                    onClick={() => handleMarkTaken(rem.id)}
                    className="ml-2 px-3 py-1.5 bg-[#006c44] hover:bg-[#004d30] text-white font-bold font-outfit text-[11px] rounded-xl transition-all active:scale-95 shrink-0"
                  >
                    Take
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications & Reminders Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 rounded-xl text-[#006c44]">
                  <Bell className="w-5 h-5 fill-[#006c44]" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-base text-[#022434]">Notifications & Reminders</h3>
                  <span className="text-xs text-slate-400 font-nunito">Rx Alerts & System Updates</span>
                </div>
              </div>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Dose Alerts */}
            <div className="space-y-3">
              <span className="text-xs font-bold font-outfit uppercase tracking-wider text-slate-400 block">
                Prescription Dose Alerts
              </span>

              {reminders.map((r) => (
                <div key={r.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-emerald-100 text-[#006c44] rounded-xl shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <span className="font-bold text-xs text-[#022434] block truncate">{r.drugName} {r.dosage}</span>
                      <span className="text-[10px] text-slate-500 font-nunito block truncate">Scheduled for {r.time} ({r.frequency})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      onNavigate('prescription-detail');
                    }}
                    className="text-xs font-bold text-[#006c44] bg-emerald-100 px-2.5 py-1 rounded-full shrink-0 ml-2"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>

            {/* General Appointment Notification */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 text-[#006c44] rounded-xl shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-[#022434] block">Next Consultation Reminder</span>
                  <p className="text-[11px] text-slate-600 font-nunito mt-0.5">
                    Your video consultation with Dr. Anya Sharma is set to trigger a local banner alert 15 minutes prior.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  resetDemoAppointment15Min();
                  setIsNotificationsOpen(false);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold font-outfit text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1"
              >
                <span>Trigger 15-Min Banner Now</span>
              </button>
            </div>

            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="w-full py-3 bg-[#1c3a4a] text-white font-bold font-outfit text-xs rounded-xl hover:bg-[#022434] transition-colors"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
