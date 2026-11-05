import React, { useState, useEffect } from 'react';
import {
  X,
  Pill,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Prescription, Medication } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import {
  checkMedicationRestriction,
  checkDrugAllergies,
  checkDrugInteractions,
  generatePrescriberAuthToken,
} from '../../utils/prescriptionSafety';
import { addPrescription, updatePrescription } from '../../utils/prescriptionStore';

interface PrescriptionComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionSaved: (rx: Prescription) => void;
  initialPrescription?: Prescription | null;
  patientInfo?: {
    id?: string;
    name?: string;
    dob?: string;
    ageGender?: string;
    allergies?: string[];
  };
  consultationId?: string;
  consultationType?: 'Video' | 'Voice' | 'Chat';
  doctorInfo?: {
    name?: string;
    license?: string;
    specialty?: string;
    clinic?: string;
  };
}

const COMMON_DRUG_PRESETS = [
  { name: 'Artemether / Lumefantrine (Coartem)', strength: '80 / 480 mg', dosage: '1 tablet', freq: 'Twice daily with meals', dur: '3 days' },
  { name: 'Paracetamol', strength: '500 mg', dosage: '2 tablets', freq: 'Every 8 hours', dur: '5 days' },
  { name: 'Amoxicillin', strength: '500 mg', dosage: '1 capsule', freq: 'Twice daily', dur: '7 days' },
  { name: 'Ibuprofen', strength: '400 mg', dosage: '1 tablet', freq: 'Every 8 hours with meals', dur: '5 days' },
  { name: 'Omeprazole Delayed-Release', strength: '20 mg', dosage: '1 capsule', freq: 'Once daily before breakfast', dur: '14 days' },
  { name: 'Cetirizine Hydrochloride', strength: '10 mg', dosage: '1 tablet', freq: 'Once daily at bedtime', dur: '10 days' },
  { name: 'Amlodipine Besylate', strength: '5 mg', dosage: '1 tablet', freq: 'Once daily in morning', dur: '30 days' },
  { name: 'Metformin Hydrochloride', strength: '500 mg', dosage: '1 tablet', freq: 'Twice daily with meals', dur: '30 days' },
];

export const PrescriptionComposerModal: React.FC<PrescriptionComposerModalProps> = ({
  isOpen,
  onClose,
  onPrescriptionSaved,
  initialPrescription,
  patientInfo,
  consultationId,
  consultationType = 'Video',
  doctorInfo,
}) => {
  const isEditing = Boolean(initialPrescription);

  // Patient data
  const [patientName, setPatientName] = useState('Ada Okonkwo');
  const [patientId, setPatientId] = useState('PAT-88219401');
  const [patientDob, setPatientDob] = useState('May 10, 1996');
  const [patientAgeGender, setPatientAgeGender] = useState('28 Yrs • Female');
  const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Sulfa drugs']);

  // Prescription clinical data
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isDigitallySigned, setIsDigitallySigned] = useState(true);
  const [restrictionError, setRestrictionError] = useState<string | null>(null);

  // Doctor metadata
  const docName = doctorInfo?.name || 'Dr. Sarah Lee, MD';
  const docLicense = doctorInfo?.license || 'MDCN/2019/98765';
  const docSpecialty = doctorInfo?.specialty || 'Consultant Family Physician';
  const docClinic = doctorInfo?.clinic || 'Prime Telecare Specialist Clinic';

  useEffect(() => {
    if (!isOpen) return;

    if (initialPrescription) {
      // Load existing prescription for editing
      setPatientName(initialPrescription.patientName || 'Ada Okonkwo');
      setPatientId(initialPrescription.patientId || 'PAT-88219401');
      setPatientDob(initialPrescription.patientDob || 'May 10, 1996');
      setPatientAgeGender(initialPrescription.patientAgeGender || '28 Yrs • Female');
      setAllergies(initialPrescription.patientAllergies || ['Penicillin', 'Sulfa drugs']);
      setDiagnosis(initialPrescription.diagnosis || '');
      setChiefComplaint(initialPrescription.chiefComplaint || '');
      setMedications(initialPrescription.medications && initialPrescription.medications.length > 0
        ? [...initialPrescription.medications]
        : [{
            id: 'med-1',
            drugName: '',
            strength: '500 mg',
            dosage: '1 tablet',
            frequency: 'Twice daily',
            duration: '5 days',
            instructions: 'Take after meals with water',
          }]
      );
      setDoctorNotes(initialPrescription.doctorNotes || '');
      setIsDigitallySigned(true);
      setRestrictionError(null);
    } else {
      // New prescription
      const name = patientInfo?.name || 'Ada Okonkwo';
      setPatientName(name);
      setPatientId(patientInfo?.id || 'PAT-88219401');
      setPatientDob(patientInfo?.dob || 'May 10, 1996');
      setPatientAgeGender(patientInfo?.ageGender || '28 Yrs • Female');
      setAllergies(patientInfo?.allergies || ['Penicillin', 'Sulfa drugs']);
      setDiagnosis('');
      setChiefComplaint('');
      setMedications([
        {
          id: 'med-1',
          drugName: '',
          strength: '500 mg',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'Take after meals with plenty of water',
        },
      ]);
      setDoctorNotes('Maintain adequate hydration and rest. Follow up if symptoms do not improve.');
      setIsDigitallySigned(true);
      setRestrictionError(null);
    }
  }, [isOpen, initialPrescription, patientInfo]);

  if (!isOpen) return null;

  // Real-time Drug Interactions calculation
  const interactionAlerts = checkDrugInteractions(medications);

  const handleAddMedication = () => {
    triggerHaptic('light');
    const newMed: Medication = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      drugName: '',
      strength: '',
      dosage: '1 tablet',
      frequency: 'Twice daily',
      duration: '5 days',
      instructions: 'Take with water after meals',
    };
    setMedications([...medications, newMed]);
  };

  const handleRemoveMedication = (id: string) => {
    triggerHaptic('medium');
    if (medications.length <= 1) return;
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleMedChange = (id: string, field: keyof Medication, value: string) => {
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;
        const updated = { ...med, [field]: value };

        // Check restrictions & allergies when drugName changes
        if (field === 'drugName') {
          const restriction = checkMedicationRestriction(value);
          if (restriction) {
            updated.isRestricted = true;
            updated.restrictionReason = restriction.reason;
          } else {
            updated.isRestricted = false;
            updated.restrictionReason = undefined;
          }

          const allergyAlert = checkDrugAllergies(value, allergies);
          updated.allergyWarning = allergyAlert || undefined;
        }

        return updated;
      })
    );
  };

  const handleApplyPreset = (id: string, preset: (typeof COMMON_DRUG_PRESETS)[0]) => {
    triggerHaptic('selection');
    handleMedChange(id, 'drugName', preset.name);
    handleMedChange(id, 'strength', preset.strength);
    handleMedChange(id, 'dosage', preset.dosage);
    handleMedChange(id, 'frequency', preset.freq);
    handleMedChange(id, 'duration', preset.dur);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    // Validation
    const hasEmptyDrugs = medications.some((m) => !m.drugName || !m.drugName.trim());
    if (hasEmptyDrugs) {
      setRestrictionError('Please specify the medication name for all prescribed drugs.');
      return;
    }

    // Controlled substances check
    const restricted = medications.find((m) => checkMedicationRestriction(m.drugName));
    if (restricted) {
      triggerHaptic('error');
      setRestrictionError(
        `Restricted Controlled Substance Detected: "${restricted.drugName}" is prohibited from telehealth prescribing under MDCN guidelines.`
      );
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const sealToken = generatePrescriberAuthToken(docLicense, patientId);
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isEditing && initialPrescription) {
      // Update existing
      const updated = updatePrescription(initialPrescription.id, {
        diagnosis: diagnosis || initialPrescription.diagnosis,
        chiefComplaint: chiefComplaint || initialPrescription.chiefComplaint,
        medications,
        doctorNotes,
        authSealToken: sealToken.authToken,
        authVerificationDate: `${todayStr} ${timeStr}`,
      });
      if (updated) {
        onPrescriptionSaved(updated);
      }
    } else {
      // Create new
      const refNumber = `RX-${Math.floor(100000 + Math.random() * 900000)}`;
      const newPrescription: Prescription = {
        id: `rx-${Date.now()}`,
        referenceNo: refNumber,
        date: todayStr,
        patientName,
        patientDob,
        patientId,
        patientAgeGender,
        patientAllergies: allergies,
        doctorName: docName,
        doctorLicense: docLicense,
        doctorSpecialty: docSpecialty,
        doctorClinic: docClinic,
        doctorSignature: docName,
        authSealToken: sealToken.authToken,
        authVerificationDate: `${todayStr} ${timeStr}`,
        status: 'active',
        isVerified: true,
        chiefComplaint: chiefComplaint || 'Consultation Clinical Review',
        consultationId: consultationId || `CNS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        consultationType,
        consultationDate: todayStr,
        consultationTime: timeStr,
        diagnosis: diagnosis || 'Clinical Encounter Treatment Plan',
        medications,
        doctorNotes,
      };

      const saved = addPrescription(newPrescription);
      onPrescriptionSaved(saved);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] w-full max-w-2xl shadow-2xl border border-slate-200/80 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006c44] flex items-center justify-center border border-emerald-100">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-outfit text-[#022434] leading-tight">
                {isEditing ? `Edit Prescription (${initialPrescription?.referenceNo})` : 'Issue Clinical Prescription'}
              </h2>
              <p className="text-xs text-slate-500 font-nunito">
                {isEditing ? 'Modify medications, dosages, and clinical notes' : 'Official digital e-prescription during active encounter'}
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
          {/* Patient Details & Allergy Alert Strip */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-[#006c44]" />
                <span className="font-bold text-xs sm:text-sm text-[#022434] font-outfit">
                  Patient: {patientName}
                </span>
                <span className="text-[11px] text-slate-500 font-nunito">
                  ({patientAgeGender})
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                ID: {patientId}
              </span>
            </div>

            {/* Documented Allergies Tag */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-rose-800 text-[11px]">Known Allergies:</span>
              <div className="flex flex-wrap gap-1">
                {allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Validation & Restriction Errors */}
          {restrictionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Safety Guideline Alert</strong>
                <span>{restrictionError}</span>
              </div>
            </div>
          )}

          {/* Clinical Encounter Inputs: Diagnosis & Chief Complaint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 font-outfit mb-1">
                Confirmed Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Upper Respiratory Infection"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-outfit mb-1">
                Chief Complaint / Presenting Symptoms
              </label>
              <input
                type="text"
                placeholder="e.g. Fever (38.8°C), cough, fatigue for 2 days"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
              />
            </div>
          </div>

          {/* Prescribed Medications Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold font-outfit text-[#022434] flex items-center space-x-1.5">
                  <Pill className="w-4 h-4 text-[#006c44]" />
                  <span>Prescribed Medications ({medications.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-nunito">
                  Formulate strength, dosage, frequency, and instructions
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMedication}
                className="px-3 py-1.5 bg-[#006c44] hover:bg-[#005233] text-white rounded-xl text-xs font-bold font-outfit flex items-center space-x-1 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Drug</span>
              </button>
            </div>

            {/* Drug Cards */}
            <div className="space-y-3.5">
              {medications.map((med, index) => (
                <div
                  key={med.id}
                  className={`bg-white rounded-2xl p-4 border transition-all ${
                    med.allergyWarning
                      ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                      : med.isRestricted
                      ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 font-outfit">
                      Medication #{index + 1}
                    </span>

                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center space-x-1 cursor-pointer"
                        title="Remove drug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Allergy / Restriction Banner for this drug */}
                  {med.allergyWarning && (
                    <div className="mb-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] flex items-center space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-semibold">{med.allergyWarning}</span>
                    </div>
                  )}

                  {med.isRestricted && (
                    <div className="mb-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold">{med.restrictionReason}</span>
                    </div>
                  )}

                  {/* Preset Quick Fill Pills */}
                  <div className="mb-2.5 flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px]">
                    <span className="text-slate-400 font-medium shrink-0">Common:</span>
                    {COMMON_DRUG_PRESETS.slice(0, 4).map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyPreset(med.id, p)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md whitespace-nowrap transition-colors cursor-pointer"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Drug Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        Drug Name & Formulation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Artemether / Lumefantrine"
                        value={med.drugName}
                        onChange={(e) => handleMedChange(med.id, 'drugName', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:bg-white focus:border-[#006c44]"
                      />
                    </div>

                    {/* Strength */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        Strength
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 500 mg"
                        value={med.strength || ''}
                        onChange={(e) => handleMedChange(med.id, 'strength', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:bg-white focus:border-[#006c44]"
                      />
                    </div>

                    {/* Dosage */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1 tablet"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(med.id, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:bg-white focus:border-[#006c44]"
                      />
                    </div>

                    {/* Frequency */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        Frequency
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Twice daily (after meals)"
                        value={med.frequency}
                        onChange={(e) => handleMedChange(med.id, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:bg-white focus:border-[#006c44]"
                      />
                    </div>

                    {/* Duration */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 days"
                        value={med.duration}
                        onChange={(e) => handleMedChange(med.id, 'duration', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:bg-white focus:border-[#006c44]"
                      />
                    </div>

                    {/* Instructions */}
                    <div className="sm:col-span-2 md:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        Administration Instructions & Precautions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Take immediately after a lipid-rich meal. Drink 2.5L water daily."
                        value={med.instructions || ''}
                        onChange={(e) => handleMedChange(med.id, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:bg-white focus:border-[#006c44]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interaction Warnings (if any between multiple drugs) */}
          {interactionAlerts.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center space-x-2 font-bold font-outfit text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Drug Interaction Screening Warning</span>
              </div>
              {interactionAlerts.map((alert, i) => (
                <p key={i} className="text-[11px] leading-relaxed">
                  • <strong>{alert.drugA}</strong> + <strong>{alert.drugB}</strong>: {alert.summary} ({alert.clinicalRationale})
                </p>
              ))}
            </div>
          )}

          {/* Clinical Advice / Doctor Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1">
              Physician Consultation Notes & Lifestyle Care Plan
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Ensure adequate rest and fluid intake. If fever persists past 72 hours, return for physical evaluation."
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-nunito text-[#022434] focus:outline-none focus:border-[#006c44] focus:ring-1 focus:ring-[#006c44]"
            />
          </div>

          {/* Digital Signature & Prescriber Certification Strip */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-[#006c44] shrink-0" />
              <div>
                <p className="font-bold text-[#022434] text-xs font-outfit">
                  MDCN Authorized Prescriber: {docName}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  License: {docLicense} • {docClinic}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#006c44] bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006c44]" />
              <span>Digital Seal Active</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold font-outfit text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isEditing ? 'Save Prescription Changes' : 'Sign & Issue Prescription'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
