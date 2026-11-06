import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { ScreenId, User, Prescription, StructuredClinicalRecord } from '../../types';
import { 
  FileText, 
  Stethoscope, 
  Pill, 
  Download, 
  Calendar, 
  Clock, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  Filter,
  Video,
  Phone,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Activity,
  HeartPulse,
  BadgeCheck,
  X,
  Lock,
  ScanFace,
  Fingerprint,
  KeyRound,
  Plus,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { ConsultationSummaryPDFModal } from '../common/ConsultationSummaryPDFModal';
import { PrescriptionPrintModal } from '../common/PrescriptionPrintModal';
import { primeApi } from '../../services/apiClient';
import { useHealthRecordPermission } from '../../utils/healthRecordPermissions';
import { getBiometricSettings, BiometricType } from '../../utils/biometrics';
import { BiometricAuthModal } from '../common/BiometricAuthModal';

interface HealthRecordsScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
}

export interface ClinicalSession {
  id: string;
  consultationId: string;
  date: string;
  time: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorLicense: string;
  doctorAvatar?: string;
  consultationType: 'Video' | 'Voice' | 'Chat';
  diagnosis: string;
  chiefComplaint: string;
  clinicalNotes: string;
  vitals?: {
    bp: string;
    temp: string;
    hr: string;
    spo2?: string;
  };
  carePlan: string[];
  prescription?: Prescription;
  testsRequested?: string[];
  isLatest?: boolean;
}

// Master Sessions Record
const initialSessions: ClinicalSession[] = [];

export const HealthRecordsScreen: React.FC<HealthRecordsScreenProps> = ({ user, onNavigate }) => {
  // Search & Filter State for Past Sessions
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'Video' | 'Voice' | 'Chat' | 'with-rx'>('all');

  // Central export permission and approval state
  const { permission } = useHealthRecordPermission('SESS-2026-9948');

  // Modals
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [selectedRecordForExport, setSelectedRecordForExport] = useState<StructuredClinicalRecord | null>(null);

  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<Prescription | null>(null);

  // Biometric verification for accessing confidential health records
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      const settings = getBiometricSettings();
      if (!settings.enabled) return true;
      return sessionStorage.getItem('prime_telecare_health_records_unlocked') === 'true';
    } catch {
      return true;
    }
  });

  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(() => {
    try {
      const settings = getBiometricSettings();
      if (!settings.enabled) return false;
      return sessionStorage.getItem('prime_telecare_health_records_unlocked') !== 'true';
    } catch {
      return false;
    }
  });

  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load live prescriptions and consultation records
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const rxs = await primeApi.getPrescriptions();
        const mapped: ClinicalSession[] = (rxs || []).map((rx, idx) => ({
          id: rx.id,
          consultationId: rx.consultationId || `CNS-${rx.referenceNo}`,
          date: rx.date || 'Recent Encounter',
          time: rx.consultationTime || '10:00 AM',
          doctorName: rx.doctorName,
          doctorSpecialty: rx.doctorSpecialty || 'General Practice',
          doctorLicense: rx.doctorLicense,
          doctorClinic: rx.doctorClinic || 'Prime Telecare Digital Practice',
          doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
          consultationType: (rx.consultationType as any) || 'Video',
          diagnosis: rx.diagnosis || 'Clinical Consultation',
          chiefComplaint: rx.chiefComplaint || 'Consultation Encounter',
          clinicalNotes: rx.doctorNotes || 'Patient evaluated and e-prescription issued.',
          vitals: {
            bp: '120/80 mmHg',
            temp: '36.8°C',
            hr: '76 bpm',
            spo2: '99%',
          },
          carePlan: rx.medications?.map((m) => `${m.drugName} ${m.strength || ''} - ${m.frequency}`) || [],
          prescription: rx,
          testsRequested: [],
          isLatest: idx === 0,
        }));
        setSessions(mapped);
      } catch {
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const biometricSettings = getBiometricSettings();

  // Identify latest session
  const latestSession = sessions.find((s) => s.isLatest) || sessions[0];
  const oldSessions = sessions.filter((s) => !s.isLatest);

  // Filtered Old Sessions
  const filteredOldSessions = useMemo(() => {
    return oldSessions.filter((session) => {
      // Format filter
      if (formatFilter === 'with-rx' && !session.prescription) return false;
      if (formatFilter !== 'all' && formatFilter !== 'with-rx' && session.consultationType !== formatFilter) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchDoctor = session.doctorName.toLowerCase().includes(q);
      const matchSpecialty = session.doctorSpecialty.toLowerCase().includes(q);
      const matchDiagnosis = session.diagnosis.toLowerCase().includes(q);
      const matchComplaint = session.chiefComplaint.toLowerCase().includes(q);
      const matchDate = session.date.toLowerCase().includes(q);
      const matchRxRef = session.prescription?.referenceNo.toLowerCase().includes(q);
      const matchDrug = session.prescription?.medications.some((m) =>
        m.drugName.toLowerCase().includes(q)
      );

      return (
        matchDoctor ||
        matchSpecialty ||
        matchDiagnosis ||
        matchComplaint ||
        matchDate ||
        matchRxRef ||
        matchDrug
      );
    });
  }, [oldSessions, searchQuery, formatFilter]);

  // Convert ClinicalSession to StructuredClinicalRecord for ConsultationSummaryPDFModal
  const convertSessionToStructuredRecord = (session: ClinicalSession): StructuredClinicalRecord => {
    return {
      id: session.consultationId,
      consultationId: session.consultationId,
      patientId: user.id || 'pat-1',
      patientName: user.name || 'Ada Okonkwo',
      patientAgeGender: `${user.gender || 'Female'}, ${user.age || 28} Yrs`,
      doctorName: session.doctorName,
      doctorSpecialty: session.doctorSpecialty,
      doctorLicense: session.doctorLicense,
      dateStr: `${session.date} at ${session.time}`,
      timestamp: Date.now(),
      diagnosis: session.diagnosis,
      patientComplaint: session.chiefComplaint,
      observations: session.clinicalNotes,
      carePlan: session.carePlan.join('. '),
      medications: session.prescription?.medications,
      testsRequested: session.testsRequested,
      vitals: session.vitals
        ? {
            bloodPressure: session.vitals.bp,
            temperature: session.vitals.temp,
            heartRate: session.vitals.hr,
            oxygenSaturation: session.vitals.spo2 || '98%',
          }
        : undefined,
    };
  };

  // Export action for any session
  const handleExportSession = (session: ClinicalSession) => {
    triggerHaptic('medium');
    const record = convertSessionToStructuredRecord(session);
    setSelectedRecordForExport(record);
    setIsConsultationModalOpen(true);
  };

  // Print E-Prescription action for any session
  const handlePrintPrescription = (session: ClinicalSession) => {
    triggerHaptic('medium');
    if (!session.prescription) {
      showToast('No e-prescription was issued during this consultation.');
      return;
    }
    setSelectedRxForPrint(session.prescription);
    setIsRxModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 sm:pb-32 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#171c1f] font-nunito">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8 md:hidden" />

      <Header
        title="Health Records & Sessions"
        showBack
        onBack={() =>
          onNavigate(
            user.role === 'doctor'
              ? 'doctor-home'
              : user.role === 'admin'
              ? 'admin-dashboard'
              : 'patient-home'
          )
        }
      />

      {!isUnlocked ? (
        <div className="mt-12 bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm text-center space-y-5 max-w-sm mx-auto animate-in fade-in">
          <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-7 h-7 text-slate-700" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-outfit text-slate-900 tracking-tight">
              Health Records Protected
            </h2>
            <p className="text-xs text-slate-500 font-nunito leading-relaxed">
              Authenticate with Face ID, Touch ID, or your passcode to access your medical records and prescriptions.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setShowBiometricModal(true);
              }}
              className="w-full min-h-[44px] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-sm rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
            >
              <span>Unlock Records</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  user.role === 'doctor'
                    ? 'doctor-home'
                    : user.role === 'admin'
                    ? 'admin-dashboard'
                    : 'patient-home'
                )
              }
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 font-outfit cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </div>
      ) : (
      <div className="space-y-6 mt-3 sm:mt-4">
        {/* Patient Profile Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold font-outfit text-[#022434]">
                Medical Health Wallet
              </h2>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                NDPA Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 font-nunito mt-0.5">
              Patient: <strong className="text-slate-800">{user.name || 'Ada Okonkwo'}</strong> • ID: <span className="font-mono">{user.id || 'PAT-88219401'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl font-semibold">
              {sessions.length} Total Sessions Recorded
            </span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-sm my-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center mx-auto text-[#006c44]">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-outfit text-[#022434]">No Health Records on File Yet</h3>
            <p className="text-sm text-slate-500 font-nunito max-w-md mx-auto leading-relaxed">
              When you complete consultations with our certified physicians, your e-prescriptions, clinical diagnoses, and tamper-evident EHR encounter summaries will be archived here.
            </p>
            <button
              onClick={() => {
                triggerHaptic('selection');
                onNavigate('doctor-discovery');
              }}
              className="px-6 py-3 bg-[#006c44] hover:bg-[#005233] text-white text-sm font-bold font-outfit rounded-xl transition-all shadow-md active:scale-95 inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Book Your First Consultation</span>
            </button>
          </div>
        ) : (
          <>
            {/* 1. EXPORT LATEST SESSION (SPOTLIGHT HERO CARD) */}
            <div className="relative bg-gradient-to-br from-[#022434] via-[#083248] to-[#004830] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#77daa4]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Top Badge & Date */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                {permission.status === 'pending_doctor_approval' ? (
                  <span className="px-3 py-1 bg-amber-400 text-amber-950 font-extrabold font-outfit text-[11px] rounded-full uppercase tracking-wider shadow-xs flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-950" />
                    <span>Awaiting Doctor's Approval</span>
                  </span>
                ) : !permission.isPaid ? (
                  <span className="px-3 py-1 bg-amber-300 text-[#022434] font-extrabold font-outfit text-[11px] rounded-full uppercase tracking-wider shadow-xs flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-[#022434]" />
                    <span>Doctor Approved • Pay ₦3,000</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#77daa4] text-[#022434] font-extrabold font-outfit text-[11px] rounded-full uppercase tracking-wider shadow-xs flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#022434]" />
                    <span>Session Unlocked</span>
                  </span>
                )}
                <span className="text-xs text-emerald-200/90 font-mono font-semibold">
                  Ref: #{latestSession.consultationId}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-nunito">
                <Calendar className="w-3.5 h-3.5 text-[#77daa4]" />
                <span>{latestSession.date}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-[#77daa4]" />
                <span>{latestSession.time}</span>
              </div>
            </div>

            {/* Doctor & Encounter Info */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={latestSession.doctorAvatar}
                    alt={latestSession.doctorName}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400/40"
                  />
                  <div>
                    <h3 className="font-extrabold font-outfit text-base text-white">
                      {latestSession.doctorName}
                    </h3>
                    <p className="text-xs text-[#77daa4] font-semibold">
                      {latestSession.doctorSpecialty}
                    </p>
                    <p className="text-[11px] text-slate-300 font-mono">
                      License: {latestSession.doctorLicense}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-xl text-xs text-emerald-200 font-semibold border border-white/10">
                  <Video className="w-3.5 h-3.5 text-[#77daa4]" />
                  <span>{latestSession.consultationType} Tele-Consult</span>
                </div>
              </div>

              {/* Diagnosis Highlight */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Confirmed Diagnosis
                  </span>
                  <p className="text-white font-bold mt-0.5">{latestSession.diagnosis}</p>
                </div>
                {latestSession.vitals && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Encounter Vitals
                    </span>
                    <p className="text-emerald-200 font-mono mt-0.5">
                      BP: {latestSession.vitals.bp} • Temp: {latestSession.vitals.temp} • HR: {latestSession.vitals.hr}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Session PDF Release Status Advisory Strip */}
            <div className="p-3 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center space-x-2.5">
                {permission.status === 'pending_doctor_approval' ? (
                  <>
                    <div className="p-1 bg-amber-400/20 text-amber-300 rounded-lg shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-amber-200 block text-[11px]">
                        Export Status: Awaiting Doctor's Approval
                      </strong>
                      <span className="text-[11px] text-slate-300">
                        Doctor clinical sign-off required, then ₦3,000 payment wall to unlock session PDF.
                      </span>
                    </div>
                  </>
                ) : !permission.isPaid ? (
                  <>
                    <div className="p-1 bg-emerald-400/20 text-[#77daa4] rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-[#77daa4] block text-[11px]">
                        Export Status: Doctor Approved!
                      </strong>
                      <span className="text-[11px] text-slate-300">
                        Sign-off granted. Complete ₦3,000 payment wall to have and export session.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-1 bg-emerald-400/20 text-[#77daa4] rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-[#77daa4] block text-[11px]">
                        Export Status: Unlocked (₦3,000 Paid)
                      </strong>
                      <span className="text-[11px] text-slate-300">
                        Official clinical summary ready for permanent download & printing.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Primary Action Buttons for Latest Session */}
            <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
              {/* Export Latest Session PDF Button */}
              <button
                type="button"
                onClick={() => handleExportSession(latestSession)}
                className="w-full sm:flex-1 min-h-[44px] py-3 px-4 bg-[#77daa4] hover:bg-[#63cc94] text-[#022434] font-bold font-outfit text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
              >
                {permission.status === 'pending_doctor_approval' ? (
                  <>
                    <Download className="w-4 h-4 text-[#022434]" />
                    <span>Export Last Session PDF (Awaiting Doctor's Approval)</span>
                  </>
                ) : !permission.isPaid ? (
                  <>
                    <Lock className="w-4 h-4 text-[#022434]" />
                    <span>Unlock Last Session PDF • Pay ₦3,000</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#022434]" />
                    <span>Download Last Session PDF (Unlocked)</span>
                  </>
                )}
              </button>

              {/* Print E-Prescription for Latest Session */}
              {latestSession.prescription && (
                <button
                  type="button"
                  onClick={() => handlePrintPrescription(latestSession)}
                  className="w-full sm:w-auto py-3 px-5 bg-white/15 hover:bg-white/25 text-white border border-white/20 font-extrabold font-outfit text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#77daa4]" />
                  <span>Print E-Prescription (Rx)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. SEARCH & FILTER SECTION FOR OLD SESSIONS */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold font-outfit text-[#022434]">
                Past Consultations & Encounters
              </h3>
              <p className="text-xs text-slate-500 font-nunito">
                Search medical history, export clinical records, or print e-prescriptions
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shrink-0 self-start sm:self-auto">
              {filteredOldSessions.length} record{filteredOldSessions.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor, diagnosis, medication (e.g. Amlodipine, Coartem), or date..."
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

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setFormatFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit whitespace-nowrap transition-all ${
                formatFilter === 'all'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Past Sessions
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setFormatFilter('with-rx');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit whitespace-nowrap transition-all flex items-center space-x-1 ${
                formatFilter === 'with-rx'
                  ? 'bg-[#006c44] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Pill className="w-3 h-3" />
              <span>With E-Prescription (Rx)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setFormatFilter('Video');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit whitespace-nowrap transition-all flex items-center space-x-1 ${
                formatFilter === 'Video'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setFormatFilter('Voice');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit whitespace-nowrap transition-all flex items-center space-x-1 ${
                formatFilter === 'Voice'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Phone className="w-3 h-3" />
              <span>Voice</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setFormatFilter('Chat');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold font-outfit whitespace-nowrap transition-all flex items-center space-x-1 ${
                formatFilter === 'Chat'
                  ? 'bg-[#022434] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Chat</span>
            </button>
          </div>
        </div>

        {/* 3. OLD SESSIONS LIST WITH DEDICATED E-PRESCRIPTION PRINT & EXPORT BUTTONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOldSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 hover:border-slate-300 hover:shadow-sm transition-all space-y-3.5"
            >
              {/* Session Top Metadata */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006c44] flex items-center justify-center shrink-0 border border-emerald-100">
                    {session.consultationType === 'Video' ? (
                      <Video className="w-5 h-5" />
                    ) : session.consultationType === 'Voice' ? (
                      <Phone className="w-5 h-5" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold font-outfit text-sm text-[#022434]">
                      {session.doctorName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold font-nunito">
                      {session.doctorSpecialty} • <span className="font-mono">{session.doctorLicense}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-700 block font-nunito">
                    {session.date}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Ref #{session.consultationId}
                  </span>
                </div>
              </div>

              {/* Diagnosis & Chief Complaint */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-outfit block">
                    Diagnosis:
                  </span>
                  <span className="font-bold text-[#022434]">{session.diagnosis}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-outfit block">
                    Reason for visit:
                  </span>
                  <span className="text-slate-600 font-nunito">{session.chiefComplaint}</span>
                </div>
              </div>

              {/* Prescribed Medications Preview (if any) */}
              {session.prescription && (
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
                      <Pill className="w-3.5 h-3.5 text-[#006c44]" />
                      <span>E-Prescription Issued (#{session.prescription.referenceNo})</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {session.prescription.medications.length} Medication{session.prescription.medications.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {session.prescription.medications.map((m) => (
                      <span
                        key={m.id}
                        className="bg-white text-slate-800 px-2 py-0.5 rounded-lg border border-emerald-200/60 text-[11px] font-medium"
                      >
                        <strong>{m.drugName}</strong> {m.strength && `(${m.strength})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006c44]" />
                  <span>Verified Clinical Record</span>
                </span>

                <div className="flex items-center space-x-2">
                  {/* Print E-Prescription Button (for old session) */}
                  {session.prescription && (
                    <button
                      type="button"
                      onClick={() => handlePrintPrescription(session)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold font-outfit text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-98"
                      title="Print E-Prescription for this session"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Print E-Prescription</span>
                    </button>
                  )}

                  {/* Export Session Summary PDF */}
                  <button
                    type="button"
                    onClick={() => handleExportSession(session)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold font-outfit text-[#022434] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-98"
                    title="Export session consultation notes as PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export Session PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredOldSessions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/90 p-6 space-y-2">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-extrabold font-outfit text-sm text-[#022434]">
                No matching past sessions found
              </h4>
              <p className="text-xs text-slate-500 font-nunito max-w-sm mx-auto">
                No past consultations matched your current search or filter criteria. Try adjusting your search query or reset the filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFormatFilter('all');
                }}
                className="mt-2 px-4 py-2 bg-[#022434] text-white text-xs font-bold font-outfit rounded-xl hover:bg-[#03364f] transition-all"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
        </>
        )}
      </div>
      )}

      {/* 4. MODALS */}
      {/* Consultation Summary PDF Export Modal */}
      <ConsultationSummaryPDFModal
        isOpen={isConsultationModalOpen}
        user={user}
        consultationRecord={selectedRecordForExport}
        onClose={() => {
          setIsConsultationModalOpen(false);
          setSelectedRecordForExport(null);
        }}
      />

      {/* Official E-Prescription Print Modal */}
      <PrescriptionPrintModal
        isOpen={isRxModalOpen}
        prescription={selectedRxForPrint}
        onClose={() => {
          setIsRxModalOpen(false);
          setSelectedRxForPrint(null);
        }}
      />

      {/* Biometric Verification Modal for Accessing Health Records */}
      <BiometricAuthModal
        isOpen={showBiometricModal}
        biometricType={biometricSettings.type}
        title="Unlock Health Records"
        subtitle="Confirm your identity to access confidential medical records"
        onClose={() => {
          setShowBiometricModal(false);
          if (!isUnlocked) {
            onNavigate(
              user.role === 'doctor'
                ? 'doctor-home'
                : user.role === 'admin'
                ? 'admin-dashboard'
                : 'patient-home'
            );
          }
        }}
        onSuccess={() => {
          try {
            sessionStorage.setItem('prime_telecare_health_records_unlocked', 'true');
          } catch {}
          setIsUnlocked(true);
          setShowBiometricModal(false);
          showToast('Health records unlocked successfully', 'success');
        }}
      />
    </div>
  );
};
