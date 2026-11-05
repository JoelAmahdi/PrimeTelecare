import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  FileText,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  Stethoscope,
  Activity,
  Pill,
  Save,
  Send,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { StructuredClinicalRecord, Medication, User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { grantDoctorExportPermission } from '../../utils/healthRecordPermissions';

interface ClinicalDocumentationModalProps {
  isOpen: boolean;
  patientName: string;
  patientAgeGender?: string;
  patientId?: string;
  doctorUser: User;
  onClose: () => void;
  onSaveRecord?: (record: StructuredClinicalRecord) => void;
}

export const ClinicalDocumentationModal: React.FC<ClinicalDocumentationModalProps> = ({
  isOpen,
  patientName,
  patientAgeGender = '28 / Female',
  patientId = 'pat-1',
  doctorUser,
  onClose,
  onSaveRecord,
}) => {
  const [markdownNotes, setMarkdownNotes] = useState(
`# Chief Complaint
High fever (38.8°C), body aches, chills, and fatigue for 2 days.

# Relevant History
No prior hospital admissions. Known allergy to Penicillin. Seasonal asthma history.

# Observations
Patient alert and oriented. Mild pharyngeal redness observed via tele-examination. Skin clear.

# Assessment & Diagnosis
**Assessment**: Acute viral upper respiratory tract infection.
**Provisional Diagnosis**: Viral Rhinopharyngitis

# Care Plan
- Steam inhalation
- Warm saline gargles
- High vitamin C intake
- Rest

# Medications
- Paracetamol 500mg, 2 tablets, 3 times daily, 3 days
- Vitamin C 1000mg Effervescent, 1 tablet, Once daily, 7 days

# Tests Requested
- Malaria RDT / Blood Smear
- Full Blood Count (FBC)

# Warning Signs (Red Flags)
Seek emergency care if experiencing difficulty breathing, chest pain, or persistent fever above 39.5°C.
`
  );
  
  const [isPreview, setIsPreview] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [authorizeExportRelease, setAuthorizeExportRelease] = useState(true);

  if (!isOpen) return null;

  // Handle Quick Templates
  const handleApplyTemplate = (type: string) => {
    triggerHaptic('selection');
    if (type === 'fever') {
      setMarkdownNotes(
`# Chief Complaint
Low grade fever, sore throat, sneezing, and runny nose for 24 hours.

# Assessment & Diagnosis
**Assessment**: Acute viral upper respiratory tract infection.
**Diagnosis**: Provisional: Viral Rhinopharyngitis

# Care Plan
Steam inhalation, warm saline gargles, high vitamin C intake, and rest.

# Medications
- Paracetamol 500mg, 2 tablets, 3 times daily, 3 days
- Vitamin C 1000mg Effervescent, 1 tablet, Once daily, 7 days`
      );
    } else if (type === 'hypertension') {
      setMarkdownNotes(
`# Chief Complaint
Routine blood pressure follow-up. Occasional morning headache.

# Assessment & Diagnosis
**Assessment**: Essential hypertension under steady outpatient monitoring.
**Diagnosis**: Confirmed: Primary Essential Hypertension

# Care Plan
Salt intake reduction (<2g/day), 30 mins daily brisk walk, daily BP logging.

# Medications
- Amlodipine 5mg, 1 tablet, Once daily (Morning), 30 days

# Tests Requested
- Serum Electrolytes, Urea & Creatinine (E/U/Cr)
- Lipid Profile

# Follow-up
Next checkup: 2026-10-15`
      );
    }
  };

  // Save Record
  const handleSave = () => {
    triggerHaptic('heavy');

    const doctorDisplayName = doctorUser.name.startsWith('Dr.') ? doctorUser.name : `Dr. ${doctorUser.name}`;
    const doctorLicenseNumber = doctorUser.doctorLicenseNo || 'MDCN/2018/74920';

    if (authorizeExportRelease) {
      grantDoctorExportPermission(doctorDisplayName, doctorLicenseNumber);
    }

    const newRecord: StructuredClinicalRecord = {
      id: `CR-${Date.now()}`,
      patientId,
      patientName,
      patientAgeGender,
      doctorName: doctorDisplayName,
      doctorSpecialty: doctorUser.doctorSpecialty || 'Telemedicine Specialist',
      doctorLicense: doctorLicenseNumber,
      dateStr: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      markdownNotes,
      exportPermissionStatus: authorizeExportRelease ? 'granted' : 'pending_doctor_approval',
      exportGrantedBy: authorizeExportRelease ? doctorDisplayName : undefined,
      exportGrantedAt: authorizeExportRelease ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
    };

    // Save to Local Storage for Persistence
    try {
      const existingRaw = localStorage.getItem('prime_telecare_clinical_records_v1');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('prime_telecare_clinical_records_v1', JSON.stringify([newRecord, ...existing]));
    } catch (e) {
      console.error('Failed to save clinical record to localStorage', e);
    }

    if (onSaveRecord) {
      onSaveRecord(newRecord);
    }

    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 font-nunito">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-[#022434] text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-[#77daa4] border border-emerald-400/30 rounded-2xl shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold font-outfit text-base sm:text-lg text-white">
                  Structured Clinical Encounter Documentation
                </h3>
                <span className="bg-[#77daa4] text-[#022434] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  EHR Standard
                </span>
              </div>
              <p className="text-xs text-slate-300 font-nunito">
                Patient: <strong className="text-white">{patientName}</strong> ({patientAgeGender})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fill Templates Bar */}
        <div className="bg-slate-50 p-3 px-5 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <span className="font-extrabold font-outfit text-[#022434] whitespace-nowrap flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Clinical Templates:</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleApplyTemplate('fever')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-lg shadow-2xs whitespace-nowrap"
            >
              Viral URI / Fever
            </button>
            <button
              onClick={() => handleApplyTemplate('hypertension')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 font-bold rounded-lg shadow-2xs whitespace-nowrap"
            >
              Hypertension Follow-up
            </button>
          </div>
        </div>

        {/* Modal Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold font-outfit text-sm text-[#022434] uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Clinical Notes (Markdown)</span>
            </h3>
            <div className="flex bg-slate-200 rounded-lg p-1">
              <button
                onClick={() => setIsPreview(false)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isPreview ? 'bg-white shadow-xs text-[#022434]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Edit
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isPreview ? 'bg-white shadow-xs text-[#022434]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Preview
              </button>
            </div>
          </div>
          
          {!isPreview ? (
            <textarea
              value={markdownNotes}
              onChange={(e) => setMarkdownNotes(e.target.value)}
              className="w-full h-[350px] sm:h-[400px] bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 font-nunito focus:ring-2 focus:ring-[#77daa4] focus:outline-none transition-all resize-none shadow-inner"
              placeholder="Type clinical notes here using markdown (# Heading, **bold**, - list)..."
            />
          ) : (
            <div className="w-full h-[350px] sm:h-[400px] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-800 shadow-inner prose prose-sm prose-emerald max-w-none">
              <Markdown>{markdownNotes}</Markdown>
            </div>
          )}

          {/* Doctor Export Permission Gate Toggle */}
          <div className="mt-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold font-outfit text-sm text-[#022434]">
                    Doctor Authorization for Health Record Export
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono">
                    NDPA & Tele-Governance
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-nunito">
                  Grant permission for patient <strong>{patientName}</strong> to export this session’s medical records as an official PDF dossier.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={authorizeExportRelease}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setAuthorizeExportRelease(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006c44]"></div>
            </label>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-[#006c44] hover:bg-[#022434] text-white font-extrabold font-outfit text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Finalize Clinical Documentation & Send Summary to Patient</span>
          </button>
        </div>
      </div>

      {/* Saved Notification Toast */}
      {showSavedToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-[#022434] text-[#77daa4] border border-emerald-400/40 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 font-bold text-xs animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#77daa4]" />
          <span>Clinical Record Saved & Sent to Patient Summary EHR!</span>
        </div>
      )}
    </div>
  );
};
