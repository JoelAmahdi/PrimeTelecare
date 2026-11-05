import React, { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8" />

      {/* Main Header */}
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
              General Practice & Telehealth Hub • Clinical Overview
            </p>
          </div>

          <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            effectiveOffline
              ? 'bg-amber-100 border border-amber-300 text-amber-900'
              : 'bg-emerald-100/80 border border-emerald-300/80 text-[#006c44]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${effectiveOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
            <span>{effectiveOffline ? 'Offline (Cached Mode)' : 'Online & Available'}</span>
          </span>
        </div>

        {/* Offline IndexedDB Banner */}
        {effectiveOffline && (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-800 shrink-0">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold font-outfit text-amber-900 block">Offline Mode — Cached Doctor Dashboard</span>
                <span className="text-[11px] text-amber-800">Practice records and earnings saved locally in IndexedDB.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
              IndexedDB
            </span>
          </div>
        )}

        {/* 15-Minute Next Appointment Local Notification Banner */}
        <NextAppointmentBanner onNavigate={onNavigate} role="doctor" />

        {/* Health Record Export Release Governance Banner */}
        {permission.status === 'pending_doctor_approval' && (
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-800 shrink-0 mt-0.5">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold font-outfit text-sm text-amber-900">
                    Health Record Export Release Requested
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                    Sign-Off Required
                  </span>
                </div>
                <p className="text-xs text-amber-800 font-nunito mt-0.5">
                  Patient <strong>{permission.patientName}</strong> requested PDF export release for session <strong>{permission.sessionId}</strong> ({permission.purpose}).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setSelectedPatientForDoc(permission.patientName)}
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold font-outfit text-xs rounded-xl shadow-2xs transition-all"
              >
                Review Notes
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  grantPermission(user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`, user.doctorLicenseNo || 'MDCN/2019/88492');
                  showToast('Clinical record release digitally signed & authorized for patient export!');
                }}
                className="px-4 py-1.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Release</span>
              </button>
            </div>
          </div>
        )}

        {permission.status === 'granted' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#006c44]" />
              <span>EHR Export Permission for <strong>{permission.patientName}</strong>: Digitally Authorized by you.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                revokePermission();
                showToast('Export release authorization revoked.');
              }}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              Revoke Release
            </button>
          </div>
        )}

        {/* SECTION 1: DOCTOR DASHBOARD OVERVIEW GRID (CSS Grid with Uniform Card Sizing) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 auto-rows-fr">
          {/* Card A: Earnings & Clinical Quick Actions Card */}
          <div className="h-full min-h-[260px] bg-gradient-to-br from-[#022434] via-[#1c3a4a] to-[#012f45] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden flex flex-col justify-between">
            {/* Ambient light element */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#77daa4]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 mb-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-300 font-nunito uppercase tracking-wider">
                  Today's Earnings
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  +18% vs yesterday
                </span>
              </div>
              <div className="flex items-baseline space-x-2 mt-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight text-white">
                  ₦45,200
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-nunito mt-1">
                12 Consultations Completed Today • Telehealth Direct
              </p>
            </div>

            {/* QUICK NAVIGATION BUTTONS */}
            <div className="pt-3 border-t border-white/10 relative z-10">
              <span className="text-[11px] font-bold font-outfit uppercase tracking-wider text-slate-300 mb-2.5 block">
                Clinical Quick Actions
              </span>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 auto-rows-fr">
                {/* 1. CONSULTATION PAGE */}
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('active-chat');
                  }}
                  className="min-h-[48px] h-full px-2 py-2 sm:px-3 sm:py-2.5 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer bg-white/10 hover:bg-white/15 border-white/15 text-white"
                >
                  <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                      <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs sm:text-sm font-extrabold font-outfit leading-tight text-white">Sessions</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold font-outfit text-emerald-200 block truncate leading-tight">
                        Consultations
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300 opacity-80 group-hover:opacity-100 shrink-0 ml-0.5 hidden sm:block" />
                </button>

                {/* 2. PRESCRIPTIONS */}
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('new-prescription');
                  }}
                  className="min-h-[48px] h-full px-2 py-2 sm:px-3 sm:py-2.5 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-100"
                >
                  <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs sm:text-sm font-extrabold font-outfit leading-tight text-amber-200">Rx Hub</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold font-outfit text-amber-200 block truncate leading-tight">
                        Review & Edit
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 opacity-80 group-hover:opacity-100 shrink-0 ml-0.5 hidden sm:block" />
                </button>
              </div>
            </div>
          </div>

          {/* Card B: Clinical Practice & Patient Quality Metrics (Strictly Uniform Height & Styling) */}
          <div className="h-full min-h-[260px] bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-extrabold font-outfit uppercase tracking-wider text-[#022434] truncate">
                  Clinical Practice Status
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#006c44] border border-emerald-200 shrink-0">
                  MDCN Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-nunito block truncate">Patient Rating</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-xl font-extrabold font-outfit text-[#022434]">4.9</span>
                    <span className="text-xs text-amber-500 font-bold">★ (128 reviews)</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-nunito block truncate">Response Rate</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-xl font-extrabold font-outfit text-[#006c44]">98%</span>
                    <span className="text-xs text-slate-500 font-medium font-nunito">under 2 mins</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-nunito line-clamp-2">
                Your consultation room is armed for HD video, secure clinical note-taking, and verified patient care.
              </p>
            </div>

            <button
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('active-chat');
              }}
              className="w-full min-h-[44px] py-2.5 sm:py-3 px-4 bg-[#1c3a4a] hover:bg-[#022434] text-white font-bold font-outfit text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mt-4"
            >
              <Video className="w-4 h-4 shrink-0 text-[#77daa4]" />
              <span className="truncate">Open Consultations</span>
              <ArrowRight className="w-4 h-4 shrink-0 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Clinical Workspace & Tools Grid */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                Clinical Workspace
              </h3>
              <p className="text-xs text-slate-500 font-nunito mt-0.5">
                Centralized telehealth rooms, patient records, electronic prescriptions, and disbursements
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#006c44] border border-emerald-200 shrink-0 hidden sm:inline-block">
              Telemedicine Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Consultations & Queue */}
            <div
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('active-chat');
              }}
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-400/80 bg-slate-50/60 hover:bg-emerald-50/20 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#006c44] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <h4 className="font-bold font-outfit text-sm text-[#022434] group-hover:text-[#006c44] transition-colors">
                  Consultation Rooms
                </h4>
                <p className="text-xs text-slate-500 font-nunito mt-1">
                  Access live video calls, patient queue, and active chat sessions.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#006c44]">
                <span>Open Consultations</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* 2. Write Prescription */}
            <div
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('new-prescription');
              }}
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-amber-400/80 bg-slate-50/60 hover:bg-amber-50/20 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold font-outfit text-sm text-[#022434] group-hover:text-amber-800 transition-colors">
                  Electronic Rx Pad
                </h4>
                <p className="text-xs text-slate-500 font-nunito mt-1">
                  Issue verified digital prescriptions with dosage and instructions.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Write Prescription</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* 3. Health Records / EHR */}
            <div
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('health-records');
              }}
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-400/80 bg-slate-50/60 hover:bg-blue-50/20 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h4 className="font-bold font-outfit text-sm text-[#022434] group-hover:text-blue-800 transition-colors">
                  Health Records & EHR
                </h4>
                <p className="text-xs text-slate-500 font-nunito mt-1">
                  Review verified diagnostic files, clinical history, and release sign-offs.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-blue-800">
                <span>View EHR Dossier</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* 4. Earnings & Payouts */}
            <div
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('withdrawal');
              }}
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-400/80 bg-slate-50/60 hover:bg-slate-100/60 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold font-outfit text-sm text-[#022434] group-hover:text-[#022434] transition-colors">
                  Earnings & Payouts
                </h4>
                <p className="text-xs text-slate-500 font-nunito mt-1">
                  Review consultation fee disbursements, balances, and bank settlements.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Manage Payouts</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
    </div>
  );
};
