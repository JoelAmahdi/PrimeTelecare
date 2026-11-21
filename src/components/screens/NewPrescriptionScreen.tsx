import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Pill,
  Search,
  Plus,
  Edit3,
  Printer,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  Filter,
  AlertCircle,
  ExternalLink,
  Video,
  Phone,
  MessageSquare,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';
import { ScreenId, Prescription, UserRole } from '../../types';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { getStoredPrescriptions } from '../../utils/prescriptionStore';
import { PrescriptionComposerModal } from '../common/PrescriptionComposerModal';
import { PrescriptionPrintModal } from '../common/PrescriptionPrintModal';
import {
  getCompletedConsultations,
  getActiveOrUpcomingConsultations,
} from '../../utils/appointmentNotifications';
import { notifyPrescriptionIssued } from '../../services/phoneNotifications';

interface NewPrescriptionScreenProps {
  onNavigate: (screen: ScreenId) => void;
  role?: UserRole;
}

export const NewPrescriptionScreen: React.FC<NewPrescriptionScreenProps> = ({
  onNavigate,
  role = 'doctor',
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => getStoredPrescriptions());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  // Modal states
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedRxForEdit, setSelectedRxForEdit] = useState<Prescription | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<Prescription | null>(null);

  // Consulted patients selector state (required before issuing new Rx)
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedConsultedPatient, setSelectedConsultedPatient] = useState<{
    id: string;
    name: string;
    dob?: string;
    ageGender?: string;
    allergies?: string[];
    diagnosis?: string;
    chiefComplaint?: string;
  } | null>(null);

  // Retrieve all patients previously consulted (completed + queue alerts)
  const consultedPatients = useMemo(() => {
    const completed = getCompletedConsultations();
    const upcoming = getActiveOrUpcomingConsultations();
    const all = [...completed, ...upcoming];

    let clinicalRecords: Record<string, any> = {};
    try {
      const raw = localStorage.getItem('prime_telecare_clinical_records_v1');
      if (raw) clinicalRecords = JSON.parse(raw);
    } catch {}

    const list: Array<{
      id: string;
      name: string;
      date: string;
      time?: string;
      type: string;
      diagnosis?: string;
      symptoms?: string;
      status: string;
    }> = [];

    const seen = new Set<string>();

    for (const c of all) {
      const name = (c.patientName || '').trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());

      const dossier = clinicalRecords[c.id] || clinicalRecords[c.appointmentId];
      const diagnosis = c.consultationSummary?.diagnosis || dossier?.diagnosis || dossier?.assessment || '';
      const symptoms = c.consultationSummary?.symptoms || dossier?.symptoms || dossier?.subjective || '';

      list.push({
        id: c.patientId || c.id || `PAT-${Date.now()}`,
        name,
        date: c.scheduledDate || 'Today',
        time: c.scheduledTime,
        type: c.type || 'Video',
        diagnosis,
        symptoms,
        status: c.status === 'completed' ? 'Concluded Consultation' : 'Active Patient Queue',
      });
    }

    return list;
  }, [isSelectPatientModalOpen]);

  const filteredConsultedPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return consultedPatients;
    const q = patientSearchQuery.toLowerCase().trim();
    return consultedPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(q)) ||
        (p.symptoms && p.symptoms.toLowerCase().includes(q))
    );
  }, [consultedPatients, patientSearchQuery]);

  // Sync prescriptions on store update events
  useEffect(() => {
    const handleUpdate = () => {
      setPrescriptions(getStoredPrescriptions());
    };
    window.addEventListener('prescriptions-updated', handleUpdate);
    return () => window.removeEventListener('prescriptions-updated', handleUpdate);
  }, []);

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      // Status filter
      if (statusFilter !== 'all') {
        const isExp = rx.status === 'expired' || rx.status === 'past';
        if (statusFilter === 'active' && isExp) return false;
        if (statusFilter === 'expired' && !isExp) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchPatient = rx.patientName?.toLowerCase().includes(q);
      const matchDiagnosis = rx.diagnosis?.toLowerCase().includes(q);
      const matchRef = rx.referenceNo?.toLowerCase().includes(q);
      const matchDoctor = rx.doctorName?.toLowerCase().includes(q);
      const matchMed = rx.medications?.some((m) =>
        m.drugName.toLowerCase().includes(q)
      );

      return matchPatient || matchDiagnosis || matchRef || matchDoctor || matchMed;
    });
  }, [prescriptions, searchQuery, statusFilter]);

  const activeCount = prescriptions.filter((p) => p.status === 'active').length;
  const expiredCount = prescriptions.filter((p) => p.status === 'expired' || p.status === 'past').length;

  const handleOpenNewPrescription = () => {
    triggerHaptic('medium');
    setSelectedRxForEdit(null);
    setPatientSearchQuery('');
    setIsSelectPatientModalOpen(true);
  };

  const handleSelectPatientForRx = (patient: {
    id: string;
    name: string;
    diagnosis?: string;
    symptoms?: string;
  }) => {
    triggerHaptic('selection');
    setSelectedConsultedPatient({
      id: patient.id,
      name: patient.name,
      diagnosis: patient.diagnosis,
      chiefComplaint: patient.symptoms,
      dob: 'Not specified',
      ageGender: 'Adult',
      allergies: [],
    });
    setIsSelectPatientModalOpen(false);
    setSelectedRxForEdit(null);
    setIsComposerOpen(true);
  };

  const handleManualPatientEntry = () => {
    triggerHaptic('selection');
    setSelectedConsultedPatient(null);
    setIsSelectPatientModalOpen(false);
    setSelectedRxForEdit(null);
    setIsComposerOpen(true);
  };

  const handleEditPrescription = (rx: Prescription) => {
    triggerHaptic('selection');
    setSelectedRxForEdit(rx);
    setIsComposerOpen(true);
  };

  const handlePrintPrescription = (rx: Prescription) => {
    triggerHaptic('selection');
    setSelectedRxForPrint(rx);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#171c1f] font-nunito">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" />

      <Header
        title="Prescription Management"
        showBack
        onBack={() => onNavigate(role === 'doctor' ? 'doctor-home' : 'patient-home')}
      />

      <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-5">
        {/* Top Summary Banner */}
        <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-[#006c44] border border-emerald-100">
                <Pill className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-outfit text-[#022434]">
                Clinical Prescriptions & Rx Hub
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-nunito mt-1">
              Review, edit, and issue electronic medical prescriptions with cryptographic MDCN seals.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewPrescription}
            className="w-full sm:w-auto px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold font-outfit transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ New Prescription</span>
          </button>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 font-outfit uppercase tracking-wider block">
              Total Prescriptions
            </span>
            <span className="text-xl sm:text-2xl font-bold font-outfit text-[#022434] mt-0.5 block tabular-nums">
              {prescriptions.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 font-outfit uppercase tracking-wider block">
              Active Refills
            </span>
            <span className="text-xl sm:text-2xl font-bold font-outfit text-emerald-700 mt-0.5 block tabular-nums">
              {activeCount}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 font-outfit uppercase tracking-wider block">
              Expired / Past
            </span>
            <span className="text-xl sm:text-2xl font-bold font-outfit text-slate-600 mt-0.5 block tabular-nums">
              {expiredCount}
            </span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient, medication (e.g. Coartem, Amoxicillin), diagnosis, or Rx code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-nunito text-[#022434] placeholder:text-slate-400 focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs select-none">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setStatusFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Prescriptions ({prescriptions.length})
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setStatusFilter('active');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit transition-all flex items-center space-x-1 ${
                statusFilter === 'active'
                  ? 'bg-[#006c44] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Active ({activeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setStatusFilter('expired');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit transition-all flex items-center space-x-1 ${
                statusFilter === 'expired'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Expired / Completed ({expiredCount})</span>
            </button>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="space-y-3.5">
          {filteredPrescriptions.map((rx) => {
            const isActive = rx.status === 'active';

            return (
              <div
                key={rx.id}
                className="bg-white rounded-[24px] p-5 border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs space-y-3.5"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006c44] flex items-center justify-center shrink-0 border border-emerald-100 font-bold font-outfit">
                      Rx
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434]">
                          {rx.patientName}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-nunito">
                          ({rx.patientAgeGender || 'Patient'})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-nunito mt-0.5">
                        Ref: <strong className="font-mono text-slate-800">{rx.referenceNo}</strong> • Prescribed by {rx.doctorName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-outfit uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Expired'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-nunito block mt-1">
                      {rx.date}
                    </span>
                  </div>
                </div>

                {/* Diagnosis & Chief Complaint */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-outfit block">
                      Clinical Diagnosis:
                    </span>
                    <span className="font-bold text-[#022434]">{rx.diagnosis}</span>
                  </div>
                  {rx.chiefComplaint && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-outfit block">
                        Symptoms / Complaint:
                      </span>
                      <span className="text-slate-600 font-nunito">{rx.chiefComplaint}</span>
                    </div>
                  )}
                </div>

                {/* Prescribed Medications Preview */}
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center space-x-1.5 font-outfit">
                      <Pill className="w-3.5 h-3.5 text-[#006c44]" />
                      <span>Medications Formulated ({rx.medications.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {rx.medications.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="bg-white p-2 rounded-xl border border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">
                            {m.drugName} {m.strength && `(${m.strength})`}
                          </span>
                          <span className="text-slate-500">• {m.dosage}</span>
                        </div>
                        <div className="text-slate-500 font-nunito sm:text-right text-[10px]">
                          <span>{m.frequency}</span>
                          <span className="mx-1">·</span>
                          <span className="font-semibold text-slate-700">{m.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {rx.doctorNotes && (
                    <p className="text-[11px] text-slate-500 font-nunito pt-1 italic">
                      Note: "{rx.doctorNotes}"
                    </p>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#006c44]" />
                    <span>MDCN Digital Seal: {rx.authSealToken ? 'Verified' : 'Signed'}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    {/* Edit Prescription Trigger */}
                    <button
                      type="button"
                      onClick={() => handleEditPrescription(rx)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold font-outfit text-[#022434] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      title="Edit medications, dosage, or instructions"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Prescription</span>
                    </button>

                    {/* Print / View Official Document */}
                    <button
                      type="button"
                      onClick={() => handlePrintPrescription(rx)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold font-outfit text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      title="Preview or print official E-Prescription"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Print Rx</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredPrescriptions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/90 p-6 space-y-3">
              <Pill className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434]">
                No prescriptions match your criteria
              </h4>
              <p className="text-xs text-slate-500 font-nunito max-w-sm mx-auto">
                Try clearing your search query or switching the status filter tab.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="mt-2 px-4 py-2 bg-[#022434] text-white text-xs font-bold font-outfit rounded-xl hover:bg-[#03364f] transition-all"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Consulted Patients Selection Modal (Shows patients consulted before issuing Rx) */}
      {isSelectPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-nunito animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#022434] to-[#004830] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold font-outfit text-base sm:text-lg text-white">
                    Select Consulted Patient
                  </h3>
                  <p className="text-xs text-slate-300">
                    Choose a patient from your consultations to issue an authorized Rx
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectPatientModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by patient name, symptoms, or clinical diagnosis..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] placeholder:text-slate-400 focus:outline-none focus:border-[#006c44] shadow-2xs"
                />
              </div>
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
              {filteredConsultedPatients.length === 0 ? (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <User className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold font-outfit text-[#022434]">No matching consulted patients found</p>
                  <p className="text-[11px] text-slate-400">You can still prescribe manually below.</p>
                </div>
              ) : (
                filteredConsultedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 p-3 rounded-2xl transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold font-outfit text-sm text-[#022434]">
                          {patient.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#006c44] border border-emerald-200">
                          {patient.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-nunito">
                        {patient.date} {patient.time ? `• ${patient.time}` : ''} • {patient.type} Consult
                      </p>
                      {patient.diagnosis && (
                        <p className="text-xs text-emerald-950 font-bold font-nunito">
                          <span className="text-slate-400 font-normal">Dx:</span> {patient.diagnosis}
                        </p>
                      )}
                      {patient.symptoms && (
                        <p className="text-[11px] text-slate-600 font-nunito line-clamp-1">
                          <span className="text-slate-400 font-normal">Symptoms:</span> {patient.symptoms}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPatientForRx(patient)}
                      className="px-4 py-2 bg-[#006c44] hover:bg-[#005233] text-white text-xs font-bold font-outfit rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer self-end sm:self-center"
                    >
                      <Pill className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Select & Write Rx</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Manual Patient Entry Fallback Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 text-center sm:text-left">
                Need to prescribe for a walk-in or unscheduled patient?
              </span>
              <button
                type="button"
                onClick={handleManualPatientEntry}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-[#022434] text-xs font-bold font-outfit rounded-xl border border-slate-300 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Enter Patient Manually</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Composer Modal (Pre-populated with selected consulted patient) */}
      <PrescriptionComposerModal
        isOpen={isComposerOpen}
        initialPrescription={selectedRxForEdit}
        patientInfo={selectedConsultedPatient || undefined}
        onClose={() => {
          setIsComposerOpen(false);
          setSelectedRxForEdit(null);
          setSelectedConsultedPatient(null);
        }}
        onPrescriptionSaved={(savedRx) => {
          // Notify patient of new issued e-prescription with chime, system push & vibration
          try {
            notifyPrescriptionIssued({
              doctorName: (savedRx.doctorName || 'Doctor').replace(/^Dr\.\s*/i, ''),
              medicationCount: savedRx.medications?.length || 1,
              prescriptionId: savedRx.id,
            });
          } catch {}

          showToast(
            selectedRxForEdit
              ? `Prescription #${savedRx.referenceNo} updated successfully!`
              : `New prescription #${savedRx.referenceNo} issued & notification sent to ${savedRx.patientName}!`,
            'success'
          );
          setPrescriptions(getStoredPrescriptions());
          setIsComposerOpen(false);
          setSelectedRxForEdit(null);
          setSelectedConsultedPatient(null);
        }}
      />

      {/* Prescription Print Modal */}
      <PrescriptionPrintModal
        isOpen={isPrintModalOpen}
        prescription={selectedRxForPrint}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedRxForPrint(null);
        }}
      />
    </div>
  );
};
