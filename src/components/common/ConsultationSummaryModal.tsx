import React, { useState } from 'react';
import {
  FileText,
  X,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Pill,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ConsultationSummaryData, UserRole } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface ConsultationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSummary: (summary: ConsultationSummaryData) => void;
  patientName: string;
  patientId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
  appointmentId?: string;
  consultationType?: 'Video' | 'Voice' | 'Chat';
  initialSummary?: Partial<ConsultationSummaryData>;
}

const CLINICAL_PRESETS = [
  {
    label: 'Malaria / Febrile',
    symptoms: 'High fever (38.8°C), chills, persistent headache, generalized fatigue for 3 days.',
    diagnosis: 'Acute Uncomplicated Malaria (P. falciparum)',
    treatment: 'Artemether / Lumefantrine (80/480mg) twice daily for 3 days with fatty meal. Paracetamol 1000mg TID for fever. Oral hydration.',
  },
  {
    label: 'URTI / Flu',
    symptoms: 'Sore throat, nasal congestion, dry cough, low-grade fever for 48 hours.',
    diagnosis: 'Acute Viral Upper Respiratory Tract Infection (Rhinopharyngitis)',
    treatment: 'Warm saline gargles, Vitamin C 1000mg daily, Paracetamol 500mg PRN. Steam inhalation twice daily. Adequate rest and fluid intake.',
  },
  {
    label: 'Gastroenteritis',
    symptoms: 'Nausea, watery diarrhea (4-5 episodes/day), diffuse crampy abdominal pain for 24 hours.',
    diagnosis: 'Acute Infective Gastroenteritis without severe dehydration',
    treatment: 'Oral Rehydration Salts (ORS) 1 sachet per loose stool. Zinc sulfate 20mg daily x 10 days. Bland diet (BRAT). Return if bloody stool or severe lethargy.',
  },
  {
    label: 'Hypertension Review',
    symptoms: 'Routine chronic follow-up. Occasional morning occipital headache. No visual blur.',
    diagnosis: 'Primary Essential Hypertension (Stage 1 - Under Management)',
    treatment: 'Continue Amlodipine 5mg once daily in morning. Dietary sodium reduction (<2g/day). Regular daily BP logging. 30 mins brisk daily walking.',
  },
];

export const ConsultationSummaryModal: React.FC<ConsultationSummaryModalProps> = ({
  isOpen,
  onClose,
  onSaveSummary,
  patientName,
  patientId = 'PAT-User',
  doctorName = 'Attending Physician',
  doctorSpecialty = 'General Practice',
  doctorLicense = 'MDCN Verified',
  appointmentId,
  consultationType = 'Video',
  initialSummary,
}) => {
  const [symptoms, setSymptoms] = useState(initialSummary?.symptoms || '');
  const [diagnosis, setDiagnosis] = useState(initialSummary?.diagnosis || '');
  const [treatment, setTreatment] = useState(initialSummary?.treatment || '');
  const [doctorNotes, setDoctorNotes] = useState(initialSummary?.doctorNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof CLINICAL_PRESETS)[0]) => {
    triggerHaptic('selection');
    setSymptoms(preset.symptoms);
    setDiagnosis(preset.diagnosis);
    setTreatment(preset.treatment);
    showToast(`Loaded "${preset.label}" clinical template`, 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || !diagnosis.trim() || !treatment.trim()) {
      triggerHaptic('error');
      showToast('Please complete symptoms, diagnosis, and treatment plan.', 'info');
      return;
    }

    triggerHaptic('success');
    setIsSubmitting(true);

    const summaryData: ConsultationSummaryData = {
      symptoms: symptoms.trim(),
      diagnosis: diagnosis.trim(),
      treatment: treatment.trim(),
      doctorNotes: doctorNotes.trim() || undefined,
      doctorName,
      doctorSpecialty,
      doctorLicense,
      patientName,
      patientId,
      appointmentId,
      consultationType,
      completedAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    onSaveSummary(summaryData);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] w-full max-w-2xl shadow-2xl border border-slate-200/90 my-auto overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006c44] flex items-center justify-center border border-emerald-100">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-outfit text-[#022434] leading-tight">
                Consultation Clinical Summary
              </h2>
              <p className="text-xs text-slate-500 font-nunito">
                Input clinical findings to conclude session and record official dossier for patient
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Patient Details Strip */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#006c44] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-[#022434] font-outfit block">
                  Patient: {patientName}
                </span>
                <span className="text-[11px] text-slate-500 font-nunito">
                  Consultation Modality: {consultationType} Call
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-right">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-[#006c44] text-[11px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Doctor Sign-off</span>
              </span>
            </div>
          </div>

          {/* Quick Clinical Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold font-outfit text-slate-600 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Documentation Templates:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-nunito">Click to prefill</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLINICAL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-[#006c44] hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold font-outfit transition-all cursor-pointer"
                >
                  + {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Symptoms */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1.5">
              Reported Symptoms & Chief Complaint <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. High fever (38.8°C), sore throat, body chills, persistent dry cough for 3 days..."
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
            />
          </div>

          {/* 2. Diagnosis */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1.5">
              Clinical Diagnosis (Provisional or Confirmed) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Viral Upper Respiratory Tract Infection (Rhinopharyngitis)"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
            />
          </div>

          {/* 3. Treatment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1.5">
              Treatment Plan & Medication Regimen <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="e.g. Prescribed Artemether/Lumefantrine 80/480mg twice daily with meals for 3 days. Paracetamol 500mg PRN. Maintain adequate fluid hydration and bed rest."
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
            />
          </div>

          {/* 4. Doctor Notes & Additional Advice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1.5">
              Additional Physician Instructions & Warning Signs (Optional)
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Return for physical evaluation if symptoms persist past 72 hours or if shortness of breath develops."
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
            />
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-[11px] text-emerald-900 font-nunito flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#006c44] shrink-0" />
            <span>
              This clinical summary will be archived directly under the patient's <strong>Completed Consultations</strong> and <strong>Medical Health Records</strong>.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Summary & Complete Consultation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
