import React from 'react';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
  Lock,
  CheckCircle2,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export type PolicyType =
  | 'privacy'
  | 'terms'
  | 'consent'
  | 'refund'
  | 'emergency'
  | 'sla';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  policyType: PolicyType;
  onClose: () => void;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  policyType,
  onClose,
}) => {
  if (!isOpen) return null;

  const policyDetails: Record<
    PolicyType,
    { title: string; subtitle: string; icon: any; content: React.ReactNode }
  > = {
    privacy: {
      title: 'NDPA 2023 Data Privacy Notice',
      subtitle: 'Nigeria Data Protection Act (2023) Compliance & Data Rights',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-xs font-nunito text-slate-700 leading-relaxed">
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-[#006c44] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-outfit text-xs text-[#022434] block">
                Official NDPA 2023 Statutory Compliance Notice
              </span>
              <p className="text-[11px] text-emerald-900 mt-0.5">
                Prime Telecare processes your personal and health data in strict accordance with the Nigeria Data Protection Act (NDPA 2023).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">1. Lawful Basis for Processing</h4>
            <p>
              We collect and process personal data (Name, Contact Details, DOB, Sex, Nigerian NIN/Phone, State of Residence) and Sensitive Personal Data (Clinical Medical Records, Diagnoses, Prescriptions, Allergies, Blood Group) based on explicit user consent and legal telemedicine requirements.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">2. Data Subject Rights (NDPA Rights)</h4>
            <p>Under the Nigeria Data Protection Act 2023, you retain full ownership of your health records. You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Right of Access:</strong> Request a complete copy of all stored clinical records and consultation audio/text logs.</li>
              <li><strong>Right to Rectification:</strong> Update or correct inaccurate medical history or guardian records.</li>
              <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of account data, subject to mandatory medical record retention laws.</li>
              <li><strong>Right to Data Portability:</strong> Export structured PDF/JSON clinical summaries to transfer to external Nigerian hospitals.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">3. Protection of Minors & Guardian Consent</h4>
            <p>
              In compliance with Section 31 of the NDPA 2023, personal data of individuals under 18 years of age is only processed with the verified explicit consent of a parent or legal guardian.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">4. Data Security & Breach Notification</h4>
            <p>
              All clinical records are encrypted using AES-256 at rest and TLS 1.3 in transit. In the unlikely event of a security breach affecting personal data, Prime Telecare will notify affected data subjects and the Nigeria Data Protection Commission (NDPC) within 72 hours as mandated by law.
            </p>
          </div>
        </div>
      ),
    },
    terms: {
      title: 'Terms of Use',
      subtitle: 'Platform Operations, User Obligations & Prescriptions',
      icon: FileText,
      content: (
        <div className="space-y-4 text-xs font-nunito text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">1. Acceptance of Terms</h4>
            <p>
              By accessing or creating an account on Prime Telecare, you enter into a binding agreement governing virtual consultations, digital prescriptions, lab test referrals, and wallet management across Nigeria.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">2. Licensed Medical Practitioners</h4>
            <p>
              All doctors on Prime Telecare are verified by the Medical and Dental Council of Nigeria (MDCN). Consultations are conducted by independent licensed medical professionals who maintain clinical autonomy.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">3. Digital Prescriptions & Controlled Substances</h4>
            <p>
              Doctors may issue electronic prescriptions (e-Prescriptions) for valid medications. Controlled substances (e.g. Narcotics, Benzodiazepines, habit-forming sedatives) cannot be prescribed via virtual consultations in accordance with NAFDAC and PCN regulations.
            </p>
          </div>
        </div>
      ),
    },
    consent: {
      title: 'Telemedicine Informed Consent',
      subtitle: 'Understanding Virtual Consultation Scope & Technology',
      icon: Lock,
      content: (
        <div className="space-y-4 text-xs font-nunito text-slate-700 leading-relaxed">
          <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 text-blue-900">
            <p className="font-bold font-outfit text-xs text-[#022434]">Informed Consent Acknowledgment</p>
            <p className="text-[11px] mt-0.5">
              Telemedicine involves the delivery of healthcare services using interactive audio, video, and data communications.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">1. Expected Benefits</h4>
            <p>
              Improved access to specialist care, convenience, reduced travel costs to clinics, and real-time electronic health record sharing.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">2. Limitations of Telehealth</h4>
            <p>
              Virtual consultations do not replace physical in-person examinations when physical palpation, auscultation, or immediate surgical intervention is required. Technical disruptions (e.g. network bandwidth issues) may occasionally delay live video sessions.
            </p>
          </div>
        </div>
      ),
    },
    refund: {
      title: 'Cancellation & Refund Policy',
      subtitle: 'Appointment Cancellation Windows & Wallet Refunds',
      icon: RefreshCw,
      content: (
        <div className="space-y-4 text-xs font-nunito text-slate-700 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">1. Appointment Cancellation Window</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>More than 2 Hours Before Appointment:</strong> 100% full refund credited back to your Prime Telecare Wallet or original payment bank account.</li>
              <li><strong>Within 2 Hours of Appointment:</strong> 50% partial refund to cover physician reservation hold fee.</li>
              <li><strong>Doctor No-Show or Technical Failure:</strong> 100% full instant refund + priority rescheduling voucher.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p>
              Refund balances deposited in your wallet can be withdrawn to any verified Nigerian bank account via NUBAN instant transfer.
            </p>
          </div>
        </div>
      ),
    },
    emergency: {
      title: 'Emergency Triage Disclaimer',
      subtitle: 'Critical Warning on Life-Threatening Medical Emergencies',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4 text-xs font-nunito text-slate-700 leading-relaxed">
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-300 text-rose-900 space-y-2">
            <div className="flex items-center space-x-2 text-rose-700 font-bold font-outfit text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>DO NOT USE TELEMEDICINE FOR EMERGENCIES</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              Prime Telecare is designed for non-emergency primary care, routine consultations, chronic condition follow-ups, and general health advice.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold font-outfit text-sm text-[#022434]">When to Seek Emergency In-Person Care</h4>
            <p>If you or someone in your care experiences any of the following, seek immediate emergency medical care:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-800 font-semibold">
              <li>Severe chest pain, pressure, or symptoms of heart attack</li>
              <li>Acute shortness of breath, severe asthma attack, or choking</li>
              <li>Sudden loss of consciousness, fainting, or stroke symptoms (facial drooping, arm weakness, slurred speech)</li>
              <li>Uncontrollable severe bleeding or major trauma</li>
              <li>Poisoning, severe allergic reaction (anaphylaxis) with throat swelling</li>
              <li>Severe acute abdominal pain or high unyielding fever in infants under 3 months</li>
            </ul>
          </div>

          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold text-center">
            Nigeria Emergency Contact: Dial 112 / 767 or visit nearest Hospital ER
          </div>
        </div>
      ),
    },
    sla: {
      title: 'SLA & Operational Contingency Protocols',
      subtitle: 'Clear rules for Doctor No-Show, Drops, Emergency Referrals & Debits',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-xs font-nunito text-slate-700 leading-relaxed">
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-[#006c44] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-outfit text-xs text-[#022434] block">
                Prime Telecare Guarantees & Operational Rules
              </span>
              <p className="text-[11px] text-emerald-900 mt-0.5">
                Clear clinical and financial contingency protections for patients and medical practitioners across all telehealth sessions.
              </p>
            </div>
          </div>

          {/* 1. Doctor Does Not Join */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold font-outfit text-sm text-[#022434] flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#006c44] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">1</span>
              <span>When the Doctor Does Not Join (No-Show)</span>
            </h4>
            <p className="text-slate-600 pl-7">
              Specialists have a <strong>10-minute entry window</strong> from scheduled start time. If the doctor fails to join within 10 minutes, the session is auto-cancelled. The patient receives an <strong>instant 100% full wallet refund</strong>, a <strong>₦2,000 compensation credit</strong>, and option for priority re-assignment to another top doctor.
            </p>
          </div>

          {/* 2. Patient Cannot Connect */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold font-outfit text-sm text-[#022434] flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#006c44] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">2</span>
              <span>When the Patient Cannot Connect</span>
            </h4>
            <p className="text-slate-600 pl-7">
              A <strong>15-minute connection grace period</strong> is maintained with automated SMS/Push reminder alerts. If HD video connection fails due to poor local bandwidth, the room automatically offers <strong>Low-Bandwidth Audio-Only</strong> or <strong>Text Chat fallback</strong>. If connection cannot be established, the patient receives <strong>1 free instant reschedule</strong> within 48 hours without penalty.
            </p>
          </div>

          {/* 3. Consultation is Interrupted */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold font-outfit text-sm text-[#022434] flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#006c44] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">3</span>
              <span>When the Consultation is Interrupted</span>
            </h4>
            <p className="text-slate-600 pl-7">
              If network connection drops mid-session, the room auto-attempts WebRTC re-handshake for up to <strong>5 minutes</strong>. All chat logs, uploaded records, and preliminary doctor notes are preserved in real-time. If un-restorable, the doctor converts the remaining session to asynchronous text chat or issues a free continuation call voucher.
            </p>
          </div>

          {/* 4. Clinical Emergency Requires Referral */}
          <div className="space-y-1.5 bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
            <h4 className="font-bold font-outfit text-sm text-rose-950 flex items-center space-x-2">
              <span className="w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">4</span>
              <span>Clinical Emergency & Immediate Hospital Referral</span>
            </h4>
            <p className="text-rose-900 pl-7">
              If an attending doctor detects red-flag acute symptoms (e.g., stroke, severe chest pain, acute respiratory distress), the doctor triggers <strong>Emergency Referral Mode</strong>. The system generates an <strong>Urgent Clinical Referral Slip</strong> with patient NIN/blood group, pre-notifies nearest tertiary hospital ER (LUTH/FMC/Lagoon), and unlocks emergency dispatch hotline (112/767).
            </p>
          </div>

          {/* 5. Patient Cancels */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold font-outfit text-sm text-[#022434] flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#006c44] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">5</span>
              <span>When the Patient Cancels</span>
            </h4>
            <p className="text-slate-600 pl-7">
              • <strong>&gt; 2 Hours Before Start:</strong> 100% full refund to original payment source or Telecare Wallet.<br />
              • <strong>&lt; 2 Hours Before Start:</strong> 50% partial refund (covers physician reservation hold fee).<br />
              • <strong>Rescheduling:</strong> 100% free with no cancellation penalty if patient reschedules instead of cancelling.
            </p>
          </div>

          {/* 6. Doctor Reschedules */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold font-outfit text-sm text-[#022434] flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#006c44] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">6</span>
              <span>When the Doctor Reschedules</span>
            </h4>
            <p className="text-slate-600 pl-7">
              The patient receives instant SMS/Push notification with 4 options: (a) Accept doctor's proposed new time, (b) Select a new slot of choice, (c) Re-assign to another top specialist in the same field at no cost, or (d) Decline and receive a <strong>100% full refund + 10% apology discount voucher</strong>.
            </p>
          </div>

          {/* 7. Payment Debited but Booking Fails */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold font-outfit text-sm text-[#022434] flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#006c44] text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0">7</span>
              <span>When Payment is Debited but Booking Fails</span>
            </h4>
            <p className="text-slate-600 pl-7">
              Our automated <strong>Payment Reconciliation Engine</strong> monitors gateway webhooks every 60 seconds. If funds are debited without booking confirmation, the system automatically credits the amount to your Prime Telecare Wallet within 60 seconds (or initiates NUBAN bank reversal within 15 minutes) with SMS transaction reference code.
            </p>
          </div>
        </div>
      ),
    },
  };

  const currentPolicy = policyDetails[policyType];
  const Icon = currentPolicy.icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Header */}
        <div className="bg-[#022434] text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#77daa4]/20 rounded-xl text-[#77daa4] border border-[#77daa4]/30">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-outfit text-base text-white">
                {currentPolicy.title}
              </h3>
              <p className="text-xs text-slate-300 font-nunito">
                {currentPolicy.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {currentPolicy.content}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0 font-outfit text-xs">
          <span className="text-slate-500 font-nunito">
            Prime Telecare Healthcare Governance
          </span>
          <button
            onClick={() => {
              triggerHaptic('medium');
              onClose();
            }}
            className="px-5 py-2 bg-[#006c44] hover:bg-[#022434] text-white font-bold rounded-xl transition-all shadow-xs"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
