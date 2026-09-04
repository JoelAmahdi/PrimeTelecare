import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Video, Clock, FileText, ChevronRight, CheckCircle2, AlertCircle, X, Users, ArrowUpRight, Filter } from 'lucide-react';
import { ScreenId, User } from '../../types';
import { mockDoctorPatients } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { NextAppointmentBanner } from '../common/NextAppointmentBanner';

interface DoctorHomeDashboardProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
}

export const DoctorHomeDashboard: React.FC<DoctorHomeDashboardProps> = ({ user, onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'sessions' | 'pending'>('all');
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);

  const filteredPatients = mockDoctorPatients.filter((patient) => {
    if (activeFilter === 'sessions') return patient.type === 'Video' || patient.type === 'Chat';
    if (activeFilter === 'pending') return patient.type === 'Pending';
    return true;
  });

  const pendingCount = mockDoctorPatients.filter((p) => p.type === 'Pending').length + 2; // total 3 pending

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8" />

      {/* Main Header */}
      <Header
        title="Doctor Dashboard"
        showBell
        bellCount={4}
        onBellClick={() => {
          triggerHaptic('light');
          setIsQueueDrawerOpen(true);
        }}
        rightElement={
          <button
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform active:scale-95"
          >
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </button>
        }
      />

      <div className="px-1 sm:px-3 space-y-6 mt-2">
        {/* Doctor Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#022434] tracking-tight">
              Welcome back, {user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-nunito mt-0.5">
              You have 4 patients waiting in your queue today
            </p>
          </div>

          <span className="inline-flex items-center space-x-1.5 bg-emerald-100/80 border border-emerald-300/80 px-3 py-1.5 rounded-full text-xs font-bold text-[#006c44]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Online & Available</span>
          </span>
        </div>

        {/* 15-Minute Next Appointment Local Notification Banner */}
        <NextAppointmentBanner onNavigate={onNavigate} role="doctor" />

        {/* Earnings & Dashboard Summary Card */}
        <div className="bg-gradient-to-br from-[#022434] via-[#1c3a4a] to-[#012f45] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          {/* Ambient light element */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#77daa4]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-start mb-5 relative z-10">
            <div>
              <span className="text-xs font-semibold text-slate-300 font-nunito uppercase tracking-wider">
                Today's Earnings
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight text-white">
                  ₦45,200
                </h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  +18% vs yesterday
                </span>
              </div>
              <p className="text-xs text-slate-300 font-nunito mt-1">
                12 Consultations Completed Today
              </p>
            </div>
          </div>

          {/* REDESIGNED SESSIONS, PENDING, & PRESCRIPTION BUTTONS */}
          <div className="pt-2 border-t border-white/10 relative z-10">
            <span className="text-[11px] font-bold font-outfit uppercase tracking-wider text-slate-300 mb-3 block">
              Clinical Quick Actions & Counts
            </span>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* 1. SESSIONS BUTTON */}
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveFilter(activeFilter === 'sessions' ? 'all' : 'sessions');
                }}
                className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer ${
                  activeFilter === 'sessions'
                    ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-md'
                    : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                }`}
              >
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                    <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs sm:text-sm font-extrabold font-outfit leading-tight text-white">12</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold font-outfit text-emerald-200 block truncate leading-tight">
                      Sessions
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300 opacity-80 group-hover:opacity-100 shrink-0 ml-0.5 hidden sm:block" />
              </button>

              {/* 2. PENDING BUTTON */}
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending');
                }}
                className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer ${
                  activeFilter === 'pending'
                    ? 'bg-amber-500/30 border-amber-400 text-white shadow-md'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-100'
                }`}
              >
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs sm:text-sm font-extrabold font-outfit leading-tight text-amber-200">{pendingCount}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold font-outfit text-amber-200 block truncate leading-tight">
                      Pending
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 opacity-80 group-hover:opacity-100 shrink-0 ml-0.5 hidden sm:block" />
              </button>

              {/* 3. PRESCRIPTION BUTTON */}
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigate('new-prescription');
                }}
                className="px-2 py-2 sm:px-3 sm:py-2.5 rounded-2xl border border-teal-400/30 bg-teal-500/15 hover:bg-teal-500/25 transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer text-teal-100"
              >
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-teal-500/20 border border-teal-400/40 rounded-xl text-teal-300 shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold font-outfit leading-tight text-teal-200 block">8</span>
                    <span className="text-[10px] sm:text-[11px] font-bold font-outfit text-teal-200 block truncate leading-tight">
                      Rx Prescr.
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-300 opacity-80 group-hover:opacity-100 shrink-0 ml-0.5 hidden sm:block" />
              </button>
            </div>
          </div>
        </div>

        {/* Patients Queue Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold font-outfit text-[#022434] text-lg">
                {activeFilter === 'sessions'
                  ? 'Active Patient Sessions'
                  : activeFilter === 'pending'
                  ? 'Pending Patient Reviews'
                  : "Today's Patient Queue"}
              </h3>
              <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {filteredPatients.length}
              </span>
            </div>

            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="text-xs font-bold text-[#006c44] hover:underline flex items-center space-x-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Show All Patients</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/90 flex items-center justify-between hover:border-slate-300 transition-all"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <img
                    src={patient.avatar}
                    alt={patient.name}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200/80 shadow-xs"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold font-outfit text-[#022434] text-sm truncate">{patient.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          patient.type === 'Video'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : patient.type === 'Pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {patient.type}
                      </span>
                      <span className="text-xs text-slate-500 font-medium font-nunito">{patient.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      onNavigate('new-prescription');
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Issue Prescription"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                        navigator.vibrate([30, 50, 30]);
                      }
                      triggerHaptic('medium');
                      onNavigate(patient.type === 'Video' ? 'video-call' : 'active-chat');
                    }}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-bold font-outfit text-[11px] sm:text-xs rounded-xl shadow-xs transition-all transform active:scale-95 whitespace-nowrap shrink-0"
                  >
                    Start Consultation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Prescriptions Alert Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-300/80 p-4 rounded-3xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold font-outfit text-amber-950 uppercase tracking-wider">
                Pending Prescription Review
              </h4>
              <p className="text-xs text-amber-900 font-nunito mt-0.5">
                You have 3 patient prescriptions awaiting digital signature.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('new-prescription');
            }}
            className="px-4 py-2 bg-[#1c3a4a] text-white font-bold font-outfit text-xs rounded-xl hover:bg-[#022434] transition-all shadow-sm shrink-0 ml-2"
          >
            Review Now
          </button>
        </div>
      </div>

      {/* Patient Queue Drawer */}
      {isQueueDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 rounded-xl text-[#006c44]">
                  <Users className="w-5 h-5 text-[#006c44]" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-base text-[#022434]">Patient Queue</h3>
                  <span className="text-xs text-slate-400 font-nunito">4 Patients Awaiting Consultation</span>
                </div>
              </div>
              <button
                onClick={() => setIsQueueDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {mockDoctorPatients.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold font-outfit text-xs text-[#022434]">{p.name}</h4>
                      <span className="text-[10px] text-slate-500">{p.time} • {p.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                        navigator.vibrate([30, 50, 30]);
                      }
                      triggerHaptic('medium');
                      setIsQueueDrawerOpen(false);
                      onNavigate('active-chat');
                    }}
                    className="px-3 py-1.5 bg-[#1c3a4a] text-white font-bold font-outfit text-xs rounded-xl hover:bg-[#022434] transition-all"
                  >
                    Start Consultation
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
