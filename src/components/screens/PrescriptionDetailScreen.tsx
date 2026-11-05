import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Download,
  Share2,
  Bell,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Pill,
  FileText,
  User,
  Stethoscope,
  Video,
  AlertTriangle,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { ScreenId, Prescription, UserRole, Medication, MedicationReminder } from '../../types';
import { mockPrescriptions } from '../../data/mockData';
import { Logo } from '../common/Logo';
import { SetReminderModal } from '../common/SetReminderModal';
import { getStoredReminders, saveStoredReminders } from '../../utils/reminders';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { checkDrugAllergies, checkDrugInteractions } from '../../utils/prescriptionSafety';

interface PrescriptionDetailScreenProps {
  prescription?: Prescription;
  onNavigate: (screen: ScreenId) => void;
  role?: UserRole;
}

export const PrescriptionDetailScreen: React.FC<PrescriptionDetailScreenProps> = ({
  prescription,
  onNavigate,
  role = 'patient',
}) => {
  const currentRx = prescription || mockPrescriptions[0];

  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [selectedMedForReminder, setSelectedMedForReminder] = useState<Medication | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    setReminders(getStoredReminders());
    const handleSync = () => setReminders(getStoredReminders());
    window.addEventListener('reminders-updated', handleSync);
    return () => window.removeEventListener('reminders-updated', handleSync);
  }, []);

  const handleOpenReminderModal = (med: Medication) => {
    triggerHaptic('light');
    setSelectedMedForReminder(med);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = (newReminder: MedicationReminder) => {
    const existing = getStoredReminders();
    const updated = existing.filter((r) => r.drugName !== newReminder.drugName);
    updated.push(newReminder);
    saveStoredReminders(updated);
    setReminders(updated);
  };

  const handleDownloadPdf = () => {
    triggerHaptic('medium');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleShare = () => {
    triggerHaptic('light');
    if (navigator.share) {
      navigator.share({
        title: 'Prime Telecare E-Prescription',
        text: `Prescription ${currentRx.referenceNo} issued by ${currentRx.doctorName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      showToast('Prescription link copied to clipboard!', 'success');
    }
  };

  // Check interactions for current Rx medications
  const interactionAlerts = checkDrugInteractions(currentRx.medications);

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-4xl mx-auto px-3 sm:px-6 text-[#171c1f] font-nunito">
      <StatusBar className="-mx-3 sm:-mx-6" />
      <Header
        title="Official Digital E-Prescription"
        showBack
        onBack={() => onNavigate(role === 'doctor' ? 'doctor-home' : 'health-records')}
        showShare
        onShare={handleShare}
      />

      <div className="px-1 sm:px-3 space-y-5 mt-3">
        {/* Verification Alert Toast */}
        {downloadSuccess && (
          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between text-xs font-semibold animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Cryptographically Verified Official PDF Prescription Downloaded!</span>
            </div>
            <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full font-mono">PDF Saved</span>
          </div>
        )}

        {/* Prescription Main Document Container */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200/90 relative">
          {/* Header Branding Banner */}
          <div className="bg-gradient-to-r from-[#022434] via-[#1c3a4a] to-[#012f45] text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo size="sm" />
              <div>
                <span className="text-[10px] text-[#77daa4] font-bold font-outfit uppercase tracking-widest block">
                  Official Telehealth E-Rx
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">Ref: {currentRx.referenceNo}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-[#77daa4] text-[10px] font-extrabold">
              <ShieldCheck className="w-4 h-4 text-[#77daa4]" />
              <span>MDCN VERIFIED & SEALED</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Prescriber Auth Token Seal Banner */}
            {currentRx.authSealToken && (
              <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#006c44] shrink-0" />
                  <div>
                    <span className="font-extrabold font-outfit text-[#022434] block">
                      Prescriber Authentication Token:
                    </span>
                    <span className="font-mono text-[11px] text-emerald-800 font-bold">{currentRx.authSealToken}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-emerald-100/80 px-2 py-1 rounded-lg shrink-0">
                  Verified: {currentRx.authVerificationDate || currentRx.date}
                </span>
              </div>
            )}

            {/* Patient & Doctor Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              {/* Patient */}
              <div className="flex items-start space-x-3 p-1">
                <div className="p-2 bg-emerald-100/70 text-[#006c44] rounded-xl shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Patient Details
                  </span>
                  <p className="font-bold text-[#022434] text-sm truncate">{currentRx.patientName}</p>
                  <p className="text-xs text-slate-500 font-nunito mt-0.5">
                    ID: <span className="font-mono font-bold text-slate-700">{currentRx.patientId}</span> • DOB: {currentRx.patientDob}
                  </p>
                  {currentRx.patientAgeGender && (
                    <p className="text-[11px] text-slate-500 font-medium">{currentRx.patientAgeGender}</p>
                  )}
                  {currentRx.patientAllergies && currentRx.patientAllergies.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {currentRx.patientAllergies.map((alg) => (
                        <span key={alg} className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Allergy: {alg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-start space-x-3 p-1 sm:border-l sm:border-slate-200/60 sm:pl-3">
                <div className="p-2 bg-blue-100/70 text-[#1c3a4a] rounded-xl shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Prescribing Doctor
                  </span>
                  <p className="font-bold text-[#022434] text-sm truncate">{currentRx.doctorName}</p>
                  {currentRx.doctorSpecialty && (
                    <p className="text-[11px] text-emerald-800 font-semibold">{currentRx.doctorSpecialty}</p>
                  )}
                  <p className="text-xs text-slate-500 font-nunito mt-0.5 font-mono">
                    Lic: {currentRx.doctorLicense}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{currentRx.doctorClinic}</p>
                </div>
              </div>
            </div>

            {/* Linked Clinical Consultation Encounter Card */}
            <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-slate-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold font-outfit uppercase tracking-wider text-emerald-800">
                        Linked Telehealth Consultation
                      </span>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-300">
                        <ShieldCheck className="w-3 h-3 text-[#006c44]" />
                        <span>Encounter Verified</span>
                      </span>
                    </div>
                    <p className="font-extrabold font-outfit text-xs text-[#022434] mt-0.5">
                      Session Reference: #{currentRx.consultationId || 'CNS-2026-8821'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-nunito text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-semibold">{currentRx.consultationDate || currentRx.date}</span>
                  {currentRx.consultationTime && <span>• {currentRx.consultationTime}</span>}
                  {currentRx.consultationDuration && (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                      {currentRx.consultationDuration}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-nunito">
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Encounter Diagnosis
                  </span>
                  <span className="font-bold text-[#022434] block mt-0.5">
                    {currentRx.diagnosis || currentRx.chiefComplaint || 'Acute Febrile Syndrome & URI'}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Encounter Care & Mode
                  </span>
                  <span className="font-bold text-emerald-900 block mt-0.5">
                    {currentRx.consultationType || 'Live Video'} Consultation with {currentRx.doctorName}
                  </span>
                </div>
              </div>
            </div>

            {/* Issued Date & Rx Symbol Header */}
            <div className="flex justify-between items-center px-1 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-serif text-3xl font-extrabold text-[#006c44] leading-none">Rx</span>
                <div>
                  <h3 className="text-xs font-bold text-[#022434]">Prescribed Medications</h3>
                  {currentRx.chiefComplaint && (
                    <p className="text-[10px] text-slate-500">For: {currentRx.chiefComplaint}</p>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                Prescription Date: {currentRx.date}
              </span>
            </div>

            {/* Global Interaction Warning Banner */}
            {interactionAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-amber-900 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Clinical Drug-Drug Interaction Note:</span>
                </span>
                {interactionAlerts.map((alt, i) => (
                  <p key={i} className="text-amber-800 text-[11px]">
                    • <strong>{alt.drugA}</strong> + <strong>{alt.drugB}</strong> ({alt.severity}): {alt.clinicalRationale}
                  </p>
                ))}
              </div>
            )}

            {/* Medication Cards List */}
            <div className="space-y-3">
              {currentRx.medications.map((m, idx) => {
                const activeRem = reminders.find((r) => r.drugName === m.drugName && r.enabled);
                const allergyWarningStr = checkDrugAllergies(m.drugName, currentRx.patientAllergies);

                return (
                  <div
                    key={m.id || idx}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 text-[#006c44] rounded-xl shrink-0 mt-0.5">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold font-outfit text-base text-[#022434]">{m.drugName}</h4>
                            {m.strength && (
                              <span className="bg-emerald-100 text-[#006c44] text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                                {m.strength}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-700 font-nunito">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                              Dosage: {m.dosage}
                            </span>
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                              Frequency: {m.frequency}
                            </span>
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                              Duration: {m.duration}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                        {activeRem ? (
                          <button
                            onClick={() => handleOpenReminderModal(m)}
                            className="inline-flex items-center space-x-1.5 bg-emerald-100 text-[#006c44] hover:bg-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                            title="Edit Medication Reminder"
                          >
                            <Bell className="w-3.5 h-3.5 text-[#006c44] fill-[#006c44]" />
                            <span>Remind at {activeRem.time}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenReminderModal(m)}
                            className="inline-flex items-center space-x-1.5 bg-[#1c3a4a] hover:bg-[#022434] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Set Reminder</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Relevant Instructions */}
                    {m.instructions && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-start space-x-1.5">
                        <Info className="w-4 h-4 text-[#006c44] shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-[#022434]">Instructions: </strong>
                          <span>{m.instructions}</span>
                        </div>
                      </div>
                    )}

                    {/* Drug Allergy Warning */}
                    {allergyWarningStr && (
                      <div className="bg-rose-100 text-rose-900 p-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{allergyWarningStr}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Clinical Instructions / Doctor Notes */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold font-outfit text-[#022434]">
                <FileText className="w-4 h-4 text-[#006c44]" />
                <span>Doctor's Directions & Lifestyle Notes</span>
              </div>
              <p className="text-xs text-slate-700 font-nunito leading-relaxed font-medium">
                {currentRx.doctorNotes}
              </p>
            </div>

            {/* Signature & Seal */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200">
              <div>
                <span className="font-outfit text-xl font-extrabold italic text-[#022434] tracking-widest block leading-none">
                  {currentRx.doctorSignature}
                </span>
                <span className="text-xs font-bold text-[#022434] block mt-1">{currentRx.doctorName}</span>
                <span className="text-[10px] text-slate-500 font-mono block">Prescription Date: {currentRx.date}</span>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006c44]" />
                  <span>Authenticated E-Signature</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 block">MDCN Lic: {currentRx.doctorLicense}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPdf}
            className="w-full py-3.5 bg-[#1c3a4a] hover:bg-[#022434] text-white font-extrabold font-outfit text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full py-3.5 bg-white border border-slate-300 text-[#022434] font-extrabold font-outfit text-sm rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
            <span>Share E-Prescription</span>
          </button>
        </div>
      </div>

      <SetReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        medication={selectedMedForReminder}
        prescriptionId={currentRx.id}
        doctorName={currentRx.doctorName}
        existingReminder={
          selectedMedForReminder
            ? reminders.find((r) => r.drugName === selectedMedForReminder.drugName)
            : undefined
        }
        onSaveReminder={handleSaveReminder}
      />
    </div>
  );
};
