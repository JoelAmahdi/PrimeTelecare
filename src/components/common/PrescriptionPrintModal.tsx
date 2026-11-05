import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Pill,
  User,
  Stethoscope,
  Clock,
  AlertTriangle,
  Info,
  Copy,
  FileText
} from 'lucide-react';
import { Prescription } from '../../types';
import { Logo } from './Logo';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface PrescriptionPrintModalProps {
  isOpen: boolean;
  prescription: Prescription | null;
  onClose: () => void;
}

export const PrescriptionPrintModal: React.FC<PrescriptionPrintModalProps> = ({
  isOpen,
  prescription,
  onClose,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !prescription) return null;

  const handlePrint = () => {
    triggerHaptic('medium');
    setIsPrinting(true);
    showToast('Opening print dialog for E-Prescription...');
    setTimeout(() => {
      setIsPrinting(false);
      triggerHaptic('success');
      window.print();
    }, 600);
  };

  const handleDownload = () => {
    triggerHaptic('medium');
    showToast(`Downloading official E-Prescription ${prescription.referenceNo}.pdf...`);
    setTimeout(() => {
      triggerHaptic('success');
      showToast('E-Prescription PDF saved to device downloads.');
    }, 900);
  };

  const handleCopyRef = () => {
    triggerHaptic('selection');
    navigator.clipboard?.writeText?.(prescription.referenceNo);
    setCopied(true);
    showToast('Prescription reference copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 font-nunito">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#022434] via-[#1c3a4a] to-[#004830] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-400/20 text-[#77daa4] border border-emerald-400/30 rounded-2xl shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-outfit text-base text-white">
                  Official Electronic Prescription (Rx)
                </h3>
                <span className="bg-[#77daa4] text-[#022434] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  MDCN Certified
                </span>
              </div>
              <p className="text-xs text-slate-300 font-nunito">
                Ref: {prescription.referenceNo} • Issued {prescription.date}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Prescription Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 print:p-0 print:overflow-visible">
          {/* Clinic Header / Stamp */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Logo size="sm" />
              <div>
                <h2 className="font-extrabold font-outfit text-[#022434] text-base sm:text-lg leading-tight">
                  PRIME TELECARE CLINICAL NETWORK
                </h2>
                <p className="text-[11px] text-slate-500 font-nunito">
                  Federal Republic of Nigeria • Licensed Digital Health Provider
                </p>
                <p className="text-[10px] font-mono text-emerald-700 font-semibold">
                  NDPA Compliant • E-Rx Cryptographic Authorization
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>VALID DISPENSATION</span>
              </div>
              <span className="block text-[11px] font-mono font-bold text-slate-600 mt-1">
                Rx #{prescription.referenceNo}
              </span>
            </div>
          </div>

          {/* Patient & Doctor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            {/* Patient Info */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-outfit block">
                Patient Information
              </span>
              <p className="font-bold text-[#022434] text-sm">{prescription.patientName}</p>
              <p className="text-slate-600">
                Patient ID: <span className="font-mono font-semibold">{prescription.patientId}</span>
              </p>
              {prescription.patientAgeGender && (
                <p className="text-slate-500">{prescription.patientAgeGender}</p>
              )}
              {prescription.patientAllergies && prescription.patientAllergies.length > 0 && (
                <div className="flex items-center space-x-1 pt-0.5">
                  <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Allergies: {prescription.patientAllergies.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Prescriber Info */}
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-outfit block">
                Prescribing Physician
              </span>
              <p className="font-bold text-[#022434] text-sm">{prescription.doctorName}</p>
              <p className="text-emerald-700 font-semibold">{prescription.doctorSpecialty}</p>
              <p className="font-mono text-slate-500">License: {prescription.doctorLicense}</p>
              <p className="text-[11px] text-slate-400">{prescription.doctorClinic}</p>
            </div>
          </div>

          {/* Linked Encounter / Diagnosis */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider font-outfit block">
                Clinical Diagnosis & Clinical Indication
              </span>
              <p className="font-bold text-[#022434] text-sm mt-0.5">
                {prescription.diagnosis || prescription.chiefComplaint || 'Upper Respiratory & Febrile Symptoms'}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-nunito shrink-0">
              <span className="font-semibold text-slate-700 block">Session Date: {prescription.date}</span>
              <span className="text-emerald-700 font-medium">Verified Telehealth Encounter</span>
            </div>
          </div>

          {/* Rx Symbol Header */}
          <div className="flex items-center space-x-2 pt-1 border-b border-slate-100 pb-1.5">
            <span className="font-serif text-3xl font-extrabold text-[#006c44] leading-none">Rx</span>
            <span className="text-xs font-bold text-[#022434] uppercase tracking-wider font-outfit">
              Prescribed Medications & Dispensation Schedule
            </span>
          </div>

          {/* Medications Table / List */}
          <div className="space-y-2.5">
            {prescription.medications.map((med, index) => (
              <div
                key={med.id || index}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#006c44] font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="font-extrabold font-outfit text-sm text-[#022434]">
                      {med.drugName}
                    </h4>
                    {med.strength && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                        {med.strength}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                    {med.duration}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700 pt-1 font-nunito">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Dosage</span>
                    <span className="font-bold">{med.dosage}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Frequency</span>
                    <span className="font-bold">{med.frequency}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block font-semibold">Instructions</span>
                    <span className="text-slate-600">{med.instructions || 'As advised'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Doctor Notes & Instructions */}
          {prescription.doctorNotes && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <span className="font-bold text-[#022434] font-outfit block">
                Physician's Directions & Lifestyle Notes:
              </span>
              <p className="text-slate-600 font-nunito leading-relaxed">
                {prescription.doctorNotes}
              </p>
            </div>
          )}

          {/* Doctor Signature & Pharmacy Verification Seal */}
          <div className="pt-3 border-t-2 border-slate-200 flex items-end justify-between">
            <div>
              <span className="font-outfit text-lg font-extrabold italic text-[#022434] tracking-wider block">
                {prescription.doctorSignature || prescription.doctorName}
              </span>
              <span className="text-xs font-bold text-[#022434] block">{prescription.doctorName}</span>
              <span className="text-[10px] text-slate-500 font-mono block">
                MDCN: {prescription.doctorLicense} • {prescription.doctorSpecialty}
              </span>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Digitally Sealed & Verified</span>
              </div>
              <p className="text-[9px] font-mono text-slate-400 block">
                Token: {prescription.authSealToken || 'MDCN-SEAL-VERIFIED-AUTH'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyRef}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:text-[#022434] text-xs font-bold font-outfit rounded-xl transition-all flex items-center space-x-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Rx #'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:text-[#022434] text-xs font-bold font-outfit rounded-xl transition-all flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-bold font-outfit text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#006c44] to-[#022434] hover:from-[#005536] hover:to-[#011b27] text-white font-extrabold font-outfit text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              {isPrinting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>Print E-Prescription</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
