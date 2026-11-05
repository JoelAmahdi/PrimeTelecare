import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  BadgeCheck,
  Globe,
  Clock,
  Award,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Phone,
  Video,
  MessageSquare,
  X,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Users,
  RefreshCw,
  Sliders,
  Power,
  ShieldAlert,
} from 'lucide-react';
import { ScreenId, Doctor, UserRole } from '../../types';
import { mockDoctors } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { NotificationsDrawer } from '../common/NotificationsDrawer';

interface DoctorDiscoveryScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectDoctor: (doctorId: string) => void;
  role?: UserRole;
}

export const DoctorDiscoveryScreen: React.FC<DoctorDiscoveryScreenProps> = ({
  onNavigate,
  onSelectDoctor,
  role = 'patient',
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'active' | 'inactive'>('all');
  const [selectedDoctorDossier, setSelectedDoctorDossier] = useState<Doctor | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const specialties = [
    'All Specialties',
    'Pediatrician',
    'Cardiologist',
    'Dermatologist',
    'Family Medicine',
    'Obstetrician',
    'Orthopedic',
    'General Practitioner',
  ];

  // Counters
  const totalDoctorsCount = doctors.length;
  const onlineDoctorsCount = doctors.filter((d) => d.isOnline).length;
  const offlineDoctorsCount = doctors.filter((d) => !d.isOnline).length;
  const activeDoctorsCount = doctors.filter((d) => d.isActive !== false).length;
  const inactiveDoctorsCount = doctors.filter((d) => d.isActive === false).length;

  // Administrative Actions
  const handleToggleActiveStatus = (docId: string) => {
    triggerHaptic('medium');
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const currentlyActive = d.isActive !== false;
          const nextActive = !currentlyActive;
          return {
            ...d,
            isActive: nextActive,
            practiceStatus: nextActive ? 'active' : 'suspended',
            verification: {
              ...d.verification,
              isVerified: nextActive,
              licenseNumber: d.verification?.licenseNumber || 'MDCN/2026/001',
              boardName: d.verification?.boardName || 'Medical and Dental Council of Nigeria (MDCN)',
              verifiedBadgeText: nextActive ? 'Verified MDCN Doctor' : 'Practice Suspended / Inactive',
              verificationDate: d.verification?.verificationDate || 'Updated',
            },
          };
        }
        return d;
      })
    );
    showToast('Clinician practice authorization updated');
    if (selectedDoctorDossier?.id === docId) {
      setSelectedDoctorDossier(null);
    }
  };

  const handleToggleOnlineStatus = (docId: string) => {
    triggerHaptic('light');
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const nextOnline = !d.isOnline;
          return {
            ...d,
            isOnline: nextOnline,
            availabilityStatus: {
              ...d.availabilityStatus,
              isOnline: nextOnline,
              statusText: nextOnline ? 'Online & Available Today' : 'Offline · Away',
              nextAvailableSlot: nextOnline ? 'Available Now' : 'Next Available Tomorrow',
              workingDays: d.availabilityStatus?.workingDays || 'Mon - Fri',
            },
          };
        }
        return d;
      })
    );
    showToast('Live tele-presence status toggled');
  };

  // Filter Logic
  const filteredDoctors = doctors.filter((doc) => {
    // Search
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.hospitalAffiliation &&
        doc.hospitalAffiliation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.verification?.licenseNumber &&
        doc.verification.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    // Specialty filter
    const matchesSpecialty =
      selectedSpecialty === 'All Specialties' ||
      doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'online') {
      matchesStatus = doc.isOnline;
    } else if (statusFilter === 'offline') {
      matchesStatus = !doc.isOnline;
    } else if (statusFilter === 'active') {
      matchesStatus = doc.isActive !== false;
    } else if (statusFilter === 'inactive') {
      matchesStatus = doc.isActive === false;
    }

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#022434] text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/30 text-xs font-bold font-outfit flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-[#77daa4]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        title="Doctors on Platform"
        showBack
        onBack={() => onNavigate(role === 'admin' ? 'admin-dashboard' : 'patient-home')}
        showBell
        bellCount={2}
        onBellClick={() => {
          triggerHaptic('light');
          setIsNotificationsOpen(true);
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onNavigate}
      />

      <div className="mt-3 space-y-5">
        {/* Platform Roster Banner with Live Telemetry */}
        <div className="bg-[#022434] text-white p-5 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#77daa4]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider text-[#77daa4] bg-[#006c44]/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Platform Clinicians Roster
                </span>
                <span className="text-xs text-slate-400 font-nunito">· MDCN Nigeria Synchronized</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-white mt-1">
                All Clinicians on Platform
              </h2>
              <p className="text-xs text-slate-300 font-nunito mt-1">
                Real-time directory of all licensed physicians, monitoring online presence and active practice authorization.
              </p>
            </div>

            {role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin-dashboard')}
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-[#77daa4] border border-emerald-400/40 rounded-xl text-xs font-bold font-outfit transition-colors shrink-0 flex items-center space-x-1.5 cursor-pointer self-start sm:self-center"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Command Center</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/70 text-xs font-nunito">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-slate-400 text-[11px] block">Total Registered</span>
              <strong className="text-lg font-bold font-outfit text-white block mt-0.5 font-mono">
                {totalDoctorsCount} Doctors
              </strong>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-slate-400 text-[11px] block">Online & Available</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <strong className="text-lg font-bold font-outfit text-emerald-300 font-mono">
                  {onlineDoctorsCount} Online
                </strong>
              </div>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-slate-400 text-[11px] block">Active Practice</span>
              <strong className="text-lg font-bold font-outfit text-slate-200 block mt-0.5 font-mono">
                {activeDoctorsCount} Active
              </strong>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <span className="text-slate-400 text-[11px] block">Inactive / Audit</span>
              <strong className="text-lg font-bold font-outfit text-amber-300 block mt-0.5 font-mono">
                {inactiveDoctorsCount} Inactive
              </strong>
            </div>
          </div>
        </div>

        {/* Status Filter Segmented Controls: ALL, ONLINE, OFFLINE, ACTIVE, INACTIVE */}
        <div className="flex items-center space-x-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: `All Doctors (${totalDoctorsCount})` },
              { id: 'online', label: `Online (${onlineDoctorsCount})`, dot: 'bg-emerald-500 animate-pulse' },
              { id: 'offline', label: `Offline (${offlineDoctorsCount})`, dot: 'bg-slate-400' },
              { id: 'active', label: `Active (${activeDoctorsCount})`, check: true },
              { id: 'inactive', label: `Inactive (${inactiveDoctorsCount})`, alert: true },
            ] as const
          ).map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setStatusFilter(tab.id);
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-outfit whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#006c44] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {'dot' in tab && tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Specialty Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center space-x-2 border border-slate-200/90 rounded-2xl p-3 bg-white focus-within:border-[#006c44] focus-within:ring-2 focus-within:ring-[#006c44]/20 shadow-xs transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by clinician name, specialty, hospital, or license #"
              className="w-full bg-transparent text-xs font-nunito font-semibold focus:outline-none text-[#171c1f]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold font-outfit text-slate-700 focus:outline-none focus:border-[#006c44] shadow-xs cursor-pointer"
            >
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSearchQuery('');
                setSelectedSpecialty('All Specialties');
                setStatusFilter('all');
                showToast('Filters reset');
              }}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl shadow-xs transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Header Count */}
        <div className="flex items-center justify-between text-xs font-bold font-outfit text-slate-600 px-1">
          <span>Showing {filteredDoctors.length} of {totalDoctorsCount} Clinicians</span>
          <span className="text-[#006c44]">
            {statusFilter === 'all'
              ? 'Complete Platform Roster'
              : `Filtered by ${statusFilter.toUpperCase()}`}
          </span>
        </div>

        {/* Clinicians Roster Cards */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold font-outfit text-base text-[#022434]">
                No Clinicians Match Filter
              </h3>
              <p className="text-xs text-slate-500 font-nunito">
                No doctors currently match the &quot;{statusFilter}&quot; status and search terms.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('All Specialties');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-[#006c44] text-white text-xs font-bold rounded-xl font-outfit cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredDoctors.map((doc) => {
              const fullName = doc.fullNameWithTitle || doc.name;
              const isDocActive = doc.isActive !== false;
              const isDocOnline = doc.isOnline;
              const hospital = doc.hospitalAffiliation || 'Lagos State Health Service / Telehealth Direct';
              const licenseNo = doc.verification?.licenseNumber || 'MDCN/2024/77810';

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition-all p-5 space-y-4 ${
                    !isDocActive
                      ? 'border-amber-200/90 bg-amber-50/20'
                      : !isDocOnline
                      ? 'border-slate-200/90'
                      : 'border-slate-200/90 hover:border-emerald-300'
                  }`}
                >
                  {/* Top Doctor Row: Photograph + Names + Real-time Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      {/* Avatar with Status Halo */}
                      <div className="relative shrink-0">
                        <img
                          src={doc.avatarUrl}
                          alt={fullName}
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 shadow-2xs ${
                            isDocOnline ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                          }`}
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                            isDocOnline ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={isDocOnline ? 'Online Now' : 'Offline'}
                        />
                      </div>

                      <div className="space-y-1">
                        {/* Two Dual Badges: Online State & Practice State */}
                        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                          {/* 1. Connection Presence Badge */}
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-outfit border ${
                              isDocOnline
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDocOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>{isDocOnline ? 'Online & Available' : 'Offline'}</span>
                          </span>

                          {/* 2. Practice Authorization Badge */}
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-outfit border ${
                              isDocActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : doc.practiceStatus === 'suspended'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {isDocActive ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            ) : doc.practiceStatus === 'suspended' ? (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-700" />
                            )}
                            <span>
                              {isDocActive
                                ? 'Active Practice'
                                : doc.practiceStatus === 'suspended'
                                ? 'Suspended'
                                : 'Inactive / Pending Audit'}
                            </span>
                          </span>
                        </div>

                        {/* Clinician Title & Name */}
                        <h3 className="font-extrabold font-outfit text-[#022434] text-base sm:text-lg leading-snug">
                          {fullName}
                        </h3>

                        {/* Specialty */}
                        <p className="text-xs font-semibold text-[#006c44] font-nunito">
                          {doc.specialty}
                        </p>

                        {/* Hospital Affiliation & MDCN License */}
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 font-nunito pt-0.5">
                          <span className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{hospital}</span>
                          </span>
                          <span>·</span>
                          <span className="font-mono text-slate-700 font-semibold">
                            License #{licenseNo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rating & Patients Pill */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-1">
                      <div className="flex items-center space-x-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{doc.rating}</span>
                        <span className="text-slate-400 text-[10px]">({doc.reviewsCount} reviews)</span>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500 font-nunito">
                        {doc.patientsCount.toLocaleString()} Patients Treated
                      </span>
                    </div>
                  </div>

                  {/* Consultation Pricing & Availability Bar */}
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-nunito">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Video Consult</span>
                        <strong className="text-sm font-bold font-mono text-[#022434]">
                          ₦{doc.prices.video.toLocaleString()}
                        </strong>
                      </div>
                      <div className="border-l border-slate-200 pl-4">
                        <span className="text-[10px] text-slate-400 block">Voice Call</span>
                        <strong className="text-sm font-bold font-mono text-[#022434]">
                          ₦{doc.prices.voice.toLocaleString()}
                        </strong>
                      </div>
                      <div className="border-l border-slate-200 pl-4">
                        <span className="text-[10px] text-slate-400 block">Chat Rx</span>
                        <strong className="text-sm font-bold font-mono text-[#022434]">
                          ₦{doc.prices.chat.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Availability</span>
                      <span className="font-semibold text-slate-700 block">
                        {doc.availabilityStatus?.statusText || (isDocOnline ? 'Available Now' : 'Offline')}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDoctorDossier(doc)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Inspect Dossier
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          onSelectDoctor(doc.id);
                          onNavigate('doctor-profile');
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Public Profile
                      </button>
                    </div>

                    {/* Role-Specific Actions: Admin Governance vs Patient Booking */}
                    <div className="flex items-center space-x-2">
                      {role === 'admin' ? (
                        <>
                          {/* Toggle Online/Offline simulation */}
                          <button
                            type="button"
                            onClick={() => handleToggleOnlineStatus(doc.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold font-outfit border transition-colors cursor-pointer flex items-center space-x-1 ${
                              isDocOnline
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                            title="Simulate Doctor Online/Offline Presence"
                          >
                            <Power className="w-3 h-3" />
                            <span>{isDocOnline ? 'Set Offline' : 'Set Online'}</span>
                          </button>

                          {/* Toggle Active/Inactive Practice Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleActiveStatus(doc.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-outfit transition-colors cursor-pointer text-white shadow-xs ${
                              isDocActive
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : 'bg-[#006c44] hover:bg-[#005837]'
                            }`}
                          >
                            {isDocActive ? 'Deactivate Doctor' : 'Activate Practice'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={!isDocActive}
                          onClick={() => {
                            triggerHaptic('medium');
                            onSelectDoctor(doc.id);
                            onNavigate('book-consultation');
                          }}
                          className={`px-4 py-2 font-extrabold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                            isDocActive
                              ? 'bg-[#006c44] hover:bg-[#022434] text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{isDocActive ? 'Book Consult' : 'Unavailable'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Clinician Dossier Modal                                                   */}
      {/* ========================================================================= */}
      {selectedDoctorDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedDoctorDossier.avatarUrl}
                  alt={selectedDoctorDossier.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div>
                  <h3 className="font-bold font-outfit text-base text-[#0f172a]">
                    {selectedDoctorDossier.fullNameWithTitle || selectedDoctorDossier.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito">
                    {selectedDoctorDossier.specialty}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctorDossier(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-nunito">
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-500">Live Presence:</span>
                  <span
                    className={`font-bold ${
                      selectedDoctorDossier.isOnline ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {selectedDoctorDossier.isOnline ? '● Online & Available' : '○ Offline (Away)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Practice Authorization:</span>
                  <span
                    className={`font-bold ${
                      selectedDoctorDossier.isActive !== false ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {selectedDoctorDossier.isActive !== false
                      ? 'Active Licensed Practice'
                      : 'Suspended / Pending Audit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MDCN Registration:</span>
                  <strong className="font-mono text-slate-800">
                    {selectedDoctorDossier.verification?.licenseNumber || 'MDCN/2026/001'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hospital Affiliation:</span>
                  <span className="text-slate-800 font-semibold">
                    {selectedDoctorDossier.hospitalAffiliation || 'National Telecare Network'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                <strong className="block font-semibold">Qualifications & Fellowships:</strong>
                {selectedDoctorDossier.qualifications?.map((q, idx) => (
                  <p key={idx}>✓ {q}</p>
                )) || <p>✓ Certified Specialist Practitioner</p>}
              </div>

              <div className="text-slate-600 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                <strong>Clinical Profile Summary:</strong>
                <p className="mt-0.5">{selectedDoctorDossier.about}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleToggleActiveStatus(selectedDoctorDossier.id)}
                  className={`flex-1 py-2.5 font-bold font-outfit text-xs rounded-xl transition-colors cursor-pointer text-white shadow-xs ${
                    selectedDoctorDossier.isActive !== false
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#006c44] hover:bg-[#005837]'
                  }`}
                >
                  {selectedDoctorDossier.isActive !== false
                    ? 'Deactivate Practice'
                    : 'Activate Practice License'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDoctorDossier(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
