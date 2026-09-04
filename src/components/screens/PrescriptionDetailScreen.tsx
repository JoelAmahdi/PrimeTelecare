import React, { useState, useEffect } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Download, Share2, Bell, Clock, CheckCircle2, ShieldCheck, Pill, FileText, User, Stethoscope } from 'lucide-react';
import { ScreenId, Prescription, UserRole, Medication, MedicationReminder } from '../../types';
import { mockPrescriptions } from '../../data/mockData';
import { Logo } from '../common/Logo';
import { SetReminderModal } from '../common/SetReminderModal';
import { getStoredReminders, saveStoredReminders } from '../../utils/reminders';
import { triggerHaptic } from '../../utils/haptics';

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
        title: 'Prime Telecare Prescription',
        text: `Prescription ${currentRx.referenceNo} from ${currentRx.doctorName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      alert(`Prescription link copied to clipboard!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-4xl mx-auto px-3 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-3 sm:-mx-6" />
      <Header
        title="Digital Prescription"
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
              <span>Official PDF Prescription downloaded successfully!</span>
            </div>
            <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full">Saved to Downloads</span>
          </div>
        )}

        {/* Prescription Main Document Container */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200/90 relative">
          {/* Header Branding Banner */}
          <div className="bg-gradient-to-r from-[#022434] via-[#1c3a4a] to-[#012f45] text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo size="sm" />
              <div>
                <span className="text-[10px] text-emerald-300 font-semibold font-outfit uppercase tracking-widest block">
                  Official Medical E-Rx
                </span>
                <span className="text-xs font-medium text-slate-200">Ref: {currentRx.referenceNo}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full text-emerald-300 text-[10px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VERIFIED</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Patient & Doctor Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              {/* Patient */}
              <div className="flex items-start space-x-3 p-1">
                <div className="p-2 bg-emerald-100/70 text-[#006c44] rounded-xl shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Patient Details
                  </span>
                  <p className="font-bold text-[#022434] text-sm truncate">{currentRx.patientName}</p>
                  <p className="text-xs text-slate-500 font-nunito mt-0.5">
                    DOB: {currentRx.patientDob} • ID: {currentRx.patientId}
                  </p>
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-start space-x-3 p-1 sm:border-l sm:border-slate-200/60 sm:pl-3">
                <div className="p-2 bg-blue-100/70 text-[#1c3a4a] rounded-xl shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Prescribing Doctor
                  </span>
                  <p className="font-bold text-[#022434] text-sm truncate">{currentRx.doctorName}</p>
                  <p className="text-xs text-slate-500 font-nunito mt-0.5">
                    Lic: {currentRx.doctorLicense} • {currentRx.doctorClinic}
                  </p>
                </div>
              </div>
            </div>

            {/* Issued Date & Rx Symbol Header */}
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center space-x-2">
                <span className="font-serif text-2xl font-bold text-[#006c44] leading-none">Rx</span>
                <span className="text-xs font-semibold text-[#022434]">Prescribed Medications</span>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Date: {currentRx.date}
              </span>
            </div>

            {/* Medication Cards List */}
            <div className="space-y-2.5">
              {currentRx.medications.map((m, idx) => {
                const activeRem = reminders.find((r) => r.drugName === m.drugName && r.enabled);
                return (
                  <div
                    key={m.id || idx}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="p-2 bg-emerald-50 border border-emerald-200/60 text-[#006c44] rounded-xl shrink-0 mt-0.5">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold font-outfit text-sm text-[#022434]">{m.drugName}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-600 font-nunito">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {m.dosage}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {m.frequency}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{m.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      {activeRem ? (
                        <button
                          onClick={() => handleOpenReminderModal(m)}
                          className="inline-flex items-center space-x-1.5 bg-emerald-100 text-[#006c44] hover:bg-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs"
                          title="Edit Medication Reminder"
                        >
                          <Bell className="w-3.5 h-3.5 text-[#006c44] fill-[#006c44]" />
                          <span>Alert at {activeRem.time}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenReminderModal(m)}
                          className="inline-flex items-center space-x-1.5 bg-[#1c3a4a] hover:bg-[#022434] text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Set Reminder</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clinical Instructions / Notes */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#022434]">
                <FileText className="w-3.5 h-3.5 text-[#006c44]" />
                <span>Doctor's Directions & Instructions</span>
              </div>
              <p className="text-xs text-slate-600 font-nunito leading-relaxed">
                {currentRx.doctorNotes}
              </p>
            </div>

            {/* Signature & Stamp */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <div>
                <span className="font-outfit text-xl font-bold italic text-[#022434] tracking-widest block leading-none">
                  {currentRx.doctorSignature}
                </span>
                <span className="text-[11px] font-semibold text-slate-700 block mt-1">{currentRx.doctorName}</span>
                <span className="text-[10px] text-slate-400 block">{currentRx.date}</span>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-[#006c44]" />
                  <span>Digital Signature Verified</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPdf}
            className="w-full py-3 bg-[#1c3a4a] hover:bg-[#022434] text-white font-semibold font-outfit text-sm rounded-2xl shadow-sm transition-all transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full py-3 bg-white border border-slate-300 text-[#022434] font-semibold font-outfit text-sm rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
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

