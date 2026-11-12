import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Copy,
  Clock,
  Lock,
  CreditCard,
  Wallet,
  Building,
  Check,
  RotateCcw,
  AlertCircle,
  Stethoscope,
  Send,
  Sparkles,
} from 'lucide-react';
import { User as UserType, StructuredClinicalRecord } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { useHealthRecordPermission } from '../../utils/healthRecordPermissions';
import { showToast } from '../../utils/toast';

interface ConsultationSummaryPDFModalProps {
  isOpen: boolean;
  user: UserType;
  consultationRecord?: StructuredClinicalRecord | null;
  onClose: () => void;
}

export const ConsultationSummaryPDFModal: React.FC<ConsultationSummaryPDFModalProps> = ({
  isOpen,
  user,
  consultationRecord,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [activeRecord, setActiveRecord] = useState<StructuredClinicalRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Hook into central export permissions & approval state
  const { permission, grantPermission, sendReminder, payForSession, resetFlow } =
    useHealthRecordPermission(consultationRecord?.id || 'SESS-2026-9948');

  useEffect(() => {
    if (consultationRecord) {
      setActiveRecord(consultationRecord);
      return;
    }

    // Try reading latest stored record from localStorage
    try {
      const storedRaw = localStorage.getItem('prime_telecare_clinical_records_v1');
      if (storedRaw) {
        const list: StructuredClinicalRecord[] = JSON.parse(storedRaw);
        if (list.length > 0) {
          setActiveRecord(list[0]);
          return;
        }
      }
    } catch (e) {
      console.error('Error reading clinical record', e);
    }

    // Default fallback structured record
    setActiveRecord({
      id: 'CR-2026-9948',
      patientId: user.id || 'pat-1',
      patientName: user.name || 'Ada Okonkwo',
      patientAgeGender: `${user.gender || 'Female'}, ${user.age || 28} Yrs`,
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Pediatrician & Family Health Specialist',
      doctorLicense: 'MDCN/2019/88492',
      dateStr: 'September 15, 2026 at 10:30 AM',
      timestamp: Date.now(),
      markdownNotes: `# Chief Complaint
High fever (38.8°C), body aches, chills, and mild fatigue for 2 days.

# Relevant History
No prior hospital admissions. Known allergy to Penicillin. Seasonal asthma history.

# Observations & Vitals
Patient alert and oriented. Mild pharyngeal redness observed via tele-examination. Skin clear with no petechial rash.
- BP: 118/76 mmHg
- Temp: 38.2°C
- HR: 82 bpm
- SpO2: 98%

# Assessment & Diagnosis
**Assessment**: Acute febrile illness consistent with uncomplicated seasonal malaria or viral syndrome.
**Diagnosis**: Provisional: Uncomplicated Acute Febrile Syndrome (Rule out Malaria)

# Care Plan
Maintain high fluid intake (at least 2.5L water daily). Tepid sponging for fever management. Adequate physical rest.

# Medications
- Artemether / Lumefantrine (Coartem) 80/480mg, 1 tablet, Twice daily (after fatty meal), 3 days
- Paracetamol 500mg, 2 tablets, 3 times daily (8-hourly), 5 days

# Tests Requested
- Malaria RDT / Blood Smear
- Full Blood Count (FBC)

# Warning Signs
High fever exceeding 39.5°C, severe vomiting, shortness of breath, extreme lethargy, or yellowing of the eyes.

# Follow-up & Outcome
- Follow-up Date: September 18, 2026 (In 3 days)
- Referral Decision: None Required
- Consultation Outcome: Managed with Care Plan
`,
    });
  }, [consultationRecord, user, isOpen]);

  if (!isOpen || !activeRecord) return null;

  const docRefNo = activeRecord.id;
  const verificationHash = `PT-NDPA-VERIFY-${Math.floor(100000 + Math.random() * 900000)}`;
  const doctorName = activeRecord.doctorName || permission.doctorName || 'Dr. Sarah Johnson';
  const doctorLicense = activeRecord.doctorLicense || permission.doctorLicense || 'MDCN/2019/88492';
  const doctorSpecialty = activeRecord.doctorSpecialty || 'Pediatrician & Family Health Specialist';

  // Lifecycle check:
  // 1. Awaiting Doctor's Approval: status !== 'granted'
  // 2. Payment Wall: status === 'granted' but !isPaid (3k fee)
  // 3. Unlocked: status === 'granted' and isPaid === true
  const isDoctorApproved = permission.status === 'granted';
  const isPaid = Boolean(permission.isPaid);

  const handlePrint = () => {
    triggerHaptic('medium');
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      triggerHaptic('success');
      window.print();
    }, 800);
  };

  const handleCopyHash = () => {
    triggerHaptic('selection');
    navigator.clipboard?.writeText?.(verificationHash);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 2500);
  };

  const handleSimulateDoctorApproval = () => {
    triggerHaptic('success');
    grantPermission(doctorName, doctorLicense);
    showToast(`${doctorName} has digitally signed & approved session export!`);
  };

  const handleSendDoctorReminder = () => {
    triggerHaptic('selection');
    sendReminder();
    showToast(`Urgent reminder dispatched to ${doctorName}'s clinical pager.`);
  };

  const handlePay3kToUnlock = () => {
    triggerHaptic('medium');
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      payForSession({ amount: 3000, method: paymentMethod });
      triggerHaptic('success');
      showToast('Payment of ₦3,000 confirmed! Clinical session PDF unlocked.');
    }, 750);
  };

  const handleResetForTesting = () => {
    triggerHaptic('light');
    resetFlow();
    showToast('Session export reset to: Awaiting Doctor Approval.');
  };

  let notesToRender = activeRecord.markdownNotes;

  if (!notesToRender) {
    notesToRender = `
# Chief Complaint
${activeRecord.patientComplaint || 'N/A'}

# Relevant History
${activeRecord.relevantHistory || 'N/A'}

# Observations & Vitals
${activeRecord.observations || 'N/A'}
${
  activeRecord.vitals
    ? `- BP: ${activeRecord.vitals.bloodPressure || 'N/A'}, Temp: ${
        activeRecord.vitals.temperature || 'N/A'
      }, HR: ${activeRecord.vitals.heartRate || 'N/A'}, SpO2: ${
        activeRecord.vitals.oxygenSaturation || 'N/A'
      }`
    : ''
}

# Assessment & Diagnosis
**Assessment**: ${activeRecord.assessment || 'N/A'}
**Diagnosis**: ${activeRecord.diagnosis || 'N/A'}

# Care Plan
${activeRecord.carePlan || 'N/A'}

# Medications
${
  activeRecord.medications
    ? activeRecord.medications
        .map((m) => `- ${m.drugName}, ${m.dosage}, ${m.frequency}, ${m.duration}`)
        .join('\n')
    : 'N/A'
}

# Tests Requested
${activeRecord.testsRequested ? activeRecord.testsRequested.map((t) => `- ${t}`).join('\n') : 'N/A'}

# Warning Signs
${activeRecord.warningSigns || 'N/A'}

# Follow-up & Outcome
- Follow-up Date: ${activeRecord.followUpDate || 'N/A'}
- Referral Decision: ${activeRecord.referralDecision || 'N/A'}
- Consultation Outcome: ${activeRecord.consultationOutcome || 'N/A'}
`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 font-nunito">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#022434] via-[#1c3a4a] to-[#004830] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-400/20 text-[#77daa4] border border-emerald-400/30 rounded-2xl shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-outfit text-base text-white">
                  Official Patient Consultation Summary
                </h3>
                {!isDoctorApproved ? (
                  <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Awaiting Approval</span>
                  </span>
                ) : !isPaid ? (
                  <span className="bg-amber-300 text-[#022434] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Pay ₦3,000</span>
                  </span>
                ) : (
                  <span className="bg-[#77daa4] text-[#022434] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Verified EHR</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-nunito">
                Ref: {docRefNo} • {activeRecord.patientName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: AWAITING DOCTOR'S APPROVAL VIEW                        */}
        {/* ------------------------------------------------------------- */}
        {!isDoctorApproved && (
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 font-nunito text-[#171c1f]">
            {/* Status Hero Card */}
            <div className="bg-amber-500/10 border-2 border-amber-300/80 rounded-3xl p-6 text-center space-y-3 relative overflow-hidden">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center border border-amber-300 shadow-xs">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 font-extrabold text-[11px] rounded-full uppercase tracking-wider font-outfit mb-2">
                  Clinical Governance Hold
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-[#022434]">
                  Awaiting Doctor's Approval
                </h2>
                <p className="text-xs sm:text-sm text-amber-900/90 max-w-md mx-auto mt-1 leading-relaxed">
                  Your last session PDF requires clinical sign-off from{' '}
                  <strong className="text-[#022434]">{doctorName}</strong> before official release.
                </p>
              </div>
            </div>

            {/* Session & Attending Physician Meta Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Session Encounter Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Attending Physician:</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <Stethoscope className="w-4 h-4 text-[#006c44]" />
                    <strong className="text-sm text-[#022434]">{doctorName}</strong>
                  </div>
                  <span className="text-slate-500 text-[11px] block">{doctorSpecialty}</span>
                  <span className="text-emerald-700 font-mono text-[11px] font-bold block">
                    License: {doctorLicense}
                  </span>
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-slate-500 block">Encounter Reference:</span>
                  <strong className="text-sm text-[#022434] font-mono block mt-0.5">
                    #{docRefNo}
                  </strong>
                  <span className="text-slate-500 text-[11px] block">
                    Recorded Date: {activeRecord.dateStr}
                  </span>
                  <span className="text-amber-800 font-semibold text-[11px] block mt-0.5">
                    Sign-off Status: Pending Attending Doctor Digital Signature
                  </span>
                </div>
              </div>
            </div>

            {/* NDPA & Telemedicine Regulatory Protocol Note */}
            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start space-x-3 text-xs text-blue-900 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">
                  Medical & Dental Council of Nigeria (MDCN) Compliance:
                </strong>
                Under NDPA medical governance rules, consultation dossiers containing provisional
                diagnoses and e-prescriptions cannot be released until the consulting physician
                signs off. Once approved, you will proceed to the ₦3,000 release payment wall.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* 1. Simulate Doctor Sign-off / Instant Approval */}
                <button
                  type="button"
                  onClick={handleSimulateDoctorApproval}
                  className="w-full sm:flex-1 py-3.5 px-5 bg-[#006c44] hover:bg-[#005536] text-white font-extrabold font-outfit text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#77daa4]" />
                  <span>Doctor Approves Session (Sign-Off Now)</span>
                </button>

                {/* 2. Send Urgent Reminder */}
                <button
                  type="button"
                  onClick={handleSendDoctorReminder}
                  className="w-full sm:w-auto py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold font-outfit text-xs rounded-2xl transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-slate-600" />
                  <span>
                    Send Reminder to Doctor
                    {(permission.remindedCount || 0) > 0 ? ` (${permission.remindedCount})` : ''}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Next step: ₦3,000 Payment Wall to have session</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-800 underline font-semibold"
                >
                  Close & Check Back Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: PAYMENT WALL VIEW (3k TO HAVE THE SESSION)            */}
        {/* ------------------------------------------------------------- */}
        {isDoctorApproved && !isPaid && (
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 font-nunito text-[#171c1f]">
            {/* Doctor Approval Verified Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-900">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-emerald-950 font-bold">
                    Doctor's Sign-Off Approved!
                  </strong>
                  <span className="text-emerald-800">
                    {doctorName} ({doctorLicense}) has authorized clinical release.
                  </span>
                </div>
              </div>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                Authorized
              </span>
            </div>

            {/* Payment Wall Hero Card */}
            <div className="bg-gradient-to-br from-[#022434] via-[#09354d] to-[#01412b] text-white rounded-3xl p-6 text-center space-y-3 relative overflow-hidden shadow-xl">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 text-[#77daa4] shadow-inner">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-[#77daa4] text-[#022434] font-extrabold text-[11px] rounded-full uppercase tracking-wider font-outfit mb-2">
                  Session Payment Wall
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-white">
                  Pay ₦3,000 to Have the Session
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto mt-1 leading-relaxed">
                  Complete your ₦3,000 release fee to unlock and permanently download your full
                  clinical notes, e-prescription, and verifiable PDF dossier.
                </p>
              </div>

              {/* Price Banner */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center space-x-2">
                <span className="text-xs text-slate-300 font-semibold uppercase">Total Fee:</span>
                <span className="text-3xl sm:text-4xl font-extrabold font-outfit text-[#77daa4]">
                  ₦3,000
                </span>
                <span className="text-xs text-emerald-200 font-mono">(3k)</span>
              </div>
            </div>

            {/* Fee Breakdown Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Fee Breakdown
              </span>
              <div className="flex items-center justify-between text-slate-600">
                <span>Clinical Consultation Dossier & Notes Release</span>
                <span className="font-semibold text-slate-900">₦3,000</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>MDCN Attending Doctor Clinical Authorization</span>
                <span className="font-semibold text-emerald-700">Included (₦0)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>NDPA Cryptographic Seal & E-Prescription Archival</span>
                <span className="font-semibold text-emerald-700">Included (₦0)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm text-[#022434]">
                <span>Total Amount Due</span>
                <span className="font-outfit text-base text-[#006c44]">₦3,000</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 font-outfit block">
                Select Payment Method:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Method 1: Debit Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'card'
                      ? 'border-[#006c44] bg-emerald-50/60 ring-2 ring-[#006c44]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    {paymentMethod === 'card' && <Check className="w-3.5 h-3.5 text-[#006c44]" />}
                  </div>
                  <div className="mt-2">
                    <strong className="text-xs font-bold text-slate-800 block">
                      Debit/Credit Card
                    </strong>
                    <span className="text-[11px] text-slate-500">Paystack / Flutterwave</span>
                  </div>
                </button>

                {/* Method 2: Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'transfer'
                      ? 'border-[#006c44] bg-emerald-50/60 ring-2 ring-[#006c44]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Building className="w-4 h-4 text-purple-600" />
                    {paymentMethod === 'transfer' && (
                      <Check className="w-3.5 h-3.5 text-[#006c44]" />
                    )}
                  </div>
                  <div className="mt-2">
                    <strong className="text-xs font-bold text-slate-800 block">Bank Transfer</strong>
                    <span className="text-[11px] text-slate-500">Instant NUBAN transfer</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Pay 3k Button */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handlePay3kToUnlock}
                disabled={isProcessingPayment}
                className="w-full py-4 px-6 bg-[#006c44] hover:bg-[#005536] text-white font-extrabold font-outfit text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing ₦3,000 Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#77daa4]" />
                    <span>Pay ₦3,000 to Have Session</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit encrypted • NDPA compliant</span>
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-800 underline font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 3: UNLOCKED OFFICIAL PDF DOSSIER VIEW (PAID & APPROVED)  */}
        {/* ------------------------------------------------------------- */}
        {isDoctorApproved && isPaid && (
          <>
            {/* Top Success Banner */}
            <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 flex items-center justify-between gap-3 text-xs text-emerald-900 shrink-0">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#006c44] shrink-0" />
                <span>
                  <strong>Clinical Release Verified:</strong> Signed by {doctorName} • ₦3,000 paid.
                  Session unlocked!
                </span>
              </div>
            </div>

            {/* Printable PDF Document Body */}
            <div
              className="p-5 sm:p-7 overflow-y-auto space-y-5 font-nunito text-[#171c1f]"
              id="printable-consultation-summary"
            >
              {/* Header Banner */}
              <div className="border-b-2 border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-[#022434] text-[#77daa4] flex items-center justify-center font-bold text-base font-outfit">
                      P
                    </div>
                    <span className="text-xl font-extrabold font-outfit text-[#022434]">
                      PRIME TELECARE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Medical & Dental Council of Nigeria Verified Telehealth Service
                  </p>
                  <p className="text-[11px] text-slate-400">
                    NDPA Data Protection Compliant EHR Summary
                  </p>
                </div>

                <div className="sm:text-right bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Session Reference
                  </span>
                  <span className="text-sm font-bold font-mono text-[#022434]">{docRefNo}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">{activeRecord.dateStr}</span>
                </div>
              </div>

              {/* Patient & Doctor Two-Column Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-xs">
                {/* Patient Column */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Patient Details
                  </span>
                  <h4 className="text-sm font-extrabold text-[#022434]">
                    {activeRecord.patientName}
                  </h4>
                  <p className="text-slate-600">Gender/Age: {activeRecord.patientAgeGender}</p>
                  <p className="text-slate-600">Patient ID: {activeRecord.patientId}</p>
                </div>

                {/* Doctor Column */}
                <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Attending Physician
                  </span>
                  <h4 className="text-sm font-extrabold text-[#022434]">{doctorName}</h4>
                  <p className="text-slate-600">{doctorSpecialty}</p>
                  <p className="text-slate-600 font-mono">License: {doctorLicense}</p>
                  <p className="text-emerald-700 font-bold flex items-center space-x-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>MDCN Verified & Released (₦3,000 Paid)</span>
                  </p>
                </div>
              </div>

              {/* CLINICAL NOTES (MARKDOWN) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="prose prose-sm prose-emerald max-w-none font-nunito text-slate-800">
                  <Markdown>{notesToRender}</Markdown>
                </div>
              </div>

              {/* Statutory Security & NDPA Stamp */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#006c44] shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700">Cryptographically Sealed EHR Record</p>
                    <p className="text-[10px] font-mono text-slate-400">{verificationHash}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>{showCopiedToast ? 'Hash Copied!' : 'Copy Verification Hash'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-slate-500 font-nunito text-center sm:text-left">
                Official medical summary ready for patient records, insurance & hospital sharing.
              </p>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold font-outfit text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#006c44] hover:bg-emerald-800 text-white font-bold font-outfit text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isGenerating ? 'Preparing PDF...' : 'Download / Print Summary'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
