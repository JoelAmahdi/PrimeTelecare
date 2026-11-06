import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Video, Clock, ChevronRight, ChevronDown, CheckCircle2, Users, ArrowUpRight, Stethoscope, WifiOff, FileDown, Lock, FileText, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';
import { ScreenId, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { useHealthRecordPermission } from '../../utils/healthRecordPermissions';
import { NextAppointmentBanner } from '../common/NextAppointmentBanner';
import { ClinicalDocumentationModal } from '../common/ClinicalDocumentationModal';
import { useOfflineStatus } from '../../utils/useOfflineStatus';
import { getActiveOrUpcomingConsultations } from '../../utils/appointmentNotifications';
import { primeApi } from '../../services/apiClient';

interface DoctorHomeDashboardProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  isOfflineMode?: boolean;
}

export const DoctorHomeDashboard: React.FC<DoctorHomeDashboardProps> = ({ user, onNavigate, isOfflineMode }) => {
  const { isOffline, lastSyncTime } = useOfflineStatus();
  const effectiveOffline = isOfflineMode ?? isOffline;
  const [selectedPatientForDoc, setSelectedPatientForDoc] = useState<string | null>(null);

  // Health record export authorization management
  const { permission, grantPermission, revokePermission } = useHealthRecordPermission('app-1');

  // Today's clinical queue - dynamic live appointments
  interface PatientQueueItem {
    id: string;
    name: string;
    time: string;
    type: string;
    symptom: string;
    status: string;
    avatar: string;
    tag: string;
    tagColor: string;
  }

  const [todaysPatients, setTodaysPatients] = useState<PatientQueueItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadQueue = async () => {
      const local = getActiveOrUpcomingConsultations().map((c) => ({
        id: c.id,
        name: c.patientName || 'Patient',
        time: c.scheduledTime || 'Scheduled',
        type: c.type || 'Video',
        symptom: 'Telehealth Consultation',
        status: 'Booked',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        tag: c.bookingMode === 'instant' ? 'Instant Care' : 'Scheduled',
        tagColor: 'bg-emerald-100 text-[#006c44] border-emerald-200',
      }));

      try {
        const res = await primeApi.getAppointments();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const apiItems = res.data.map((a: any) => ({
            id: a.id,
            name: a.patientName || 'Patient',
            time: a.timeSlot || 'Scheduled',
            type: a.type || 'Video',
            symptom: a.notes || 'Telehealth Consultation',
            status: a.status || 'Booked',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
            tag: 'Live Booking',
            tagColor: 'bg-emerald-100 text-[#006c44] border-emerald-200',
          }));
          const ids = new Set(local.map((l) => l.id));
          const merged = [...local];
          for (const item of apiItems) {
            if (!ids.has(item.id)) {
              merged.push(item);
            }
          }
          setTodaysPatients(merged);
          return;
        }
      } catch (e) {
        // Fall back to local
      }
      if (isMounted) {
        setTodaysPatients(local);
      }
    };

    loadQueue();
    window.addEventListener('appointment-alerts-updated', loadQueue);
    return () => {
      isMounted = false;
      window.removeEventListener('appointment-alerts-updated', loadQueue);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 sm:pb-32 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" />

      {/* Main Header (Mobile view) */}
      <div className="md:hidden">
        <Header
          title="Doctor Dashboard"
          showBell
          bellCount={3}
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
            <span className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs font-bold ${
              effectiveOffline
                ? 'bg-amber-100 border border-amber-300 text-amber-900'
                : 'bg-emerald-100/90 border border-emerald-300 text-[#006c44]'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${effectiveOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{effectiveOffline ? 'Offline (Cached Mode)' : 'Online & Accepting Patients'}</span>
            </span>

            <button
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('active-chat');
              }}
              className="px-5 py-2.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
            >
              <Video className="w-4 h-4 text-emerald-300" />
              <span>Open Virtual Clinic</span>
            </button>
          </div>
        </div>

        {/* Offline IndexedDB Banner */}
        {effectiveOffline && (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-800 shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold font-outfit text-amber-900 text-sm block">Offline Mode — Cached Doctor Dashboard</span>
                <span className="text-xs text-amber-800">Practice records and earnings saved locally in IndexedDB. Will sync when reconnected.</span>
              </div>
            </div>
            <span className="text-[11px] font-bold font-mono bg-amber-200 text-amber-900 px-3 py-1 rounded-full shrink-0">
              IndexedDB Local
            </span>
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
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-300 font-nunito uppercase tracking-wider">
                      Today's Consultation Earnings
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                      +18% vs yesterday
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <h3 className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight text-white">
                      ₦45,200
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 font-nunito mt-1.5">
                    12 Telehealth Consultations Completed • Direct NUBAN Settled
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 relative z-10">
                  <span className="text-[11px] font-bold font-outfit uppercase tracking-wider text-slate-300 mb-3 block">
                    Clinical Quick Actions
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        onNavigate('active-chat');
                      }}
                      className="px-3.5 py-3 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer bg-white/10 hover:bg-white/15 border-white/15 text-white"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold font-outfit block text-white truncate">Live Sessions</span>
                          <span className="text-[11px] font-bold font-outfit text-emerald-200 block truncate">Enter Room</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-emerald-300 opacity-80 group-hover:opacity-100 shrink-0" />
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        onNavigate('new-prescription');
                      }}
                      className="px-3.5 py-3 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-100"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold font-outfit block text-amber-200 truncate">Digital Rx Pad</span>
                          <span className="text-[11px] font-bold font-outfit text-amber-300 block truncate">Write Rx</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-amber-300 opacity-80 group-hover:opacity-100 shrink-0" />
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

                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('active-chat');
                  }}
                  className="w-full py-3.5 px-4 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-5 cursor-pointer"
                >
                  <Video className="w-4 h-4 shrink-0 text-emerald-300" />
                  <span>Launch Telemedicine Room</span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-white/80" />
                </button>
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
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('active-chat');
                  }}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-[#006c44] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Video className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold font-outfit text-base text-[#022434] group-hover:text-[#006c44] transition-colors">
                      Consultation Rooms
                    </h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#006c44]">
                    <span>Enter Rooms</span>
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

            {/* Today's Patient Queue Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold font-outfit text-lg sm:text-xl text-[#022434]">
                  Today&apos;s Patient Queue
                </h3>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {todaysPatients.length} Patients
                </span>
              </div>

              {todaysPatients.length === 0 ? (
                <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-emerald-50 text-[#006c44] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434] mb-1">
                    No Patients Currently in Queue
                  </h4>
                  <p className="text-xs text-slate-500 font-nunito max-w-sm mx-auto px-4">
                    Your clinical queue is clear. When patients book video, voice, or chat consultations, they will appear here live in real-time.
                  </p>
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
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434]">
                              {patient.name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${patient.tagColor}`}>
                              {patient.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-nunito mt-0.5">
                            {patient.symptom} • <span className="font-medium text-slate-700">{patient.time}</span> ({patient.type})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientForDoc(patient.name)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Clinical Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            onNavigate(patient.type === 'Chat' ? 'active-chat' : 'video-call');
                          }}
                          className="px-4 py-1.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Start Session</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                    <span className="text-[11px] text-slate-500 font-nunito">NDPA & MDCN Compliance</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-nunito leading-relaxed">
                  All clinical release requests from patients undergo verified cryptographic signing before PDF dossier generation.
                </p>
              </div>
            )}

            {/* Doctor's Telemedicine Schedule Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold font-outfit text-sm sm:text-base text-[#022434]">
                  Clinical Schedule
                </h4>
                <span className="text-xs font-bold text-slate-400 font-mono">WAT (GMT+1)</span>
              </div>

              <div className="space-y-2.5 text-xs font-nunito">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Morning Shift</span>
                  <span className="font-bold text-[#022434]">08:00 AM – 01:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Afternoon Shift</span>
                  <span className="font-bold text-[#022434]">02:00 PM – 06:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Emergency On-Call</span>
                  <span className="font-bold text-emerald-600">Active (24/7 Hotline)</span>
                </div>
              </div>
            </div>

            {/* Regulatory & Security Info Box */}
            <div className="bg-slate-100/70 rounded-3xl p-5 border border-slate-200 text-xs text-slate-600 font-nunito space-y-2">
              <div className="flex items-center space-x-2 text-[#022434] font-bold font-outfit">
                <Lock className="w-4 h-4 text-[#006c44]" />
                <span>Encrypted Telehealth Room</span>
              </div>
              <p className="leading-relaxed text-slate-500">
                End-to-end encrypted consultations compliant with NDPA 2023, HIPAA, and MDCN Telemedicine Regulations.
              </p>
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
    </div>
  );
};
