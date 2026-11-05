import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { ShieldCheck, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { ScreenId } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface TermsScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onAcceptTerms?: () => void;
  hasAcceptedTerms?: boolean;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({
  onNavigate,
  onAcceptTerms,
  hasAcceptedTerms = false,
}) => {
  const [isChecked, setIsChecked] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    '01': true,
    '02': true,
    '03': true,
    '04': true,
    '05': true,
    '06': true,
  });

  const toggleSection = (id: string) => {
    triggerHaptic('light');
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAccept = () => {
    if (!isChecked) return;
    triggerHaptic('medium');
    if (onAcceptTerms) {
      onAcceptTerms();
    } else {
      onNavigate(hasAcceptedTerms ? 'settings' : 'signup');
    }
  };

  const sections = [
    {
      id: '01',
      title: 'Acceptance of Terms',
      content:
        'By using Prime Telecare, you agree to these Terms and Agreement. These Terms govern your access to and use of our telemedicine platform, virtual consultation services, health records management, and mobile application. Please read them carefully before using our services.',
    },
    {
      id: '02',
      title: 'Use of Services',
      content:
        'The app usage is provided for healthcare access and virtual consultations with licensed medical professionals. Telehealth services are not intended for life-threatening medical emergencies. If you are experiencing a severe health emergency, please contact your local emergency services immediately.',
    },
    {
      id: '03',
      title: 'Privacy & Health Data',
      content:
        'HIPAA & GDPR compliance of services ensures health data security and privacy. All medical records, video consultations, doctor prescriptions, and health messages are encrypted end-to-end. We do not sell or disclose your private health information to third parties without your explicit consent.',
    },
    {
      id: '04',
      title: 'Payments & Refunds',
      hasTable: true,
      tableData: [
        { service: 'Consultation', duration: '30 Mins', price: '₦8,500' },
        { service: 'Follow-up', duration: '15 Mins', price: '₦4,500' },
        { service: 'Subscription', duration: 'Monthly', price: '₦15,000' },
      ],
      footerNote:
        'Refund policies apply to cancelled appointments up to 2 hours prior to scheduled consultation times.',
    },
    {
      id: '05',
      title: 'Limitation of Liability',
      content:
        'Prime Telecare acts as a platform connecting users with independent licensed healthcare practitioners. Any medical diagnosis, treatment plan, or advice provided during consultations is the sole professional responsibility of the attending practitioner.',
    },
    {
      id: '06',
      title: 'Operational SLA & Clinical Contingencies',
      content: (
        <div className="space-y-2.5 text-xs text-slate-600 font-nunito">
          <p className="font-semibold text-[#022434]">
            Prime Telecare enforces strict operational service level agreements (SLAs) for all virtual consultations:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>When Doctor Does Not Join (Doctor No-Show):</strong> Doctors have a 10-minute entry window. If the doctor fails to join within 10 minutes, the session is auto-cancelled, and the patient receives a 100% instant wallet refund, a ₦2,000 compensation goodwill credit, and priority specialist rebooking.
            </li>
            <li>
              <strong>When Patient Cannot Connect:</strong> A 15-minute connection grace period is provided with SMS reminder alerts. Low-Bandwidth Audio-Only or Text Chat fallback modes activate automatically. If un-connectable, patient gets 1 free instant reschedule within 48 hours.
            </li>
            <li>
              <strong>When Consultation is Interrupted:</strong> Real-time WebRTC re-handshake runs for 5 minutes. All chat messages and EHR notes are saved continuously. If un-restorable, doctor converts session to async text follow-up or issues a free continuation call voucher.
            </li>
            <li>
              <strong>When Clinical Emergency Occurs:</strong> Attending doctor triggers Emergency Referral Mode, generating an Urgent Clinical Referral Slip with patient NIN/Blood group, pre-notifying tertiary hospital ERs (e.g. LUTH/FMC/Lagoon), and unlocking 112 dispatch guidance.
            </li>
            <li>
              <strong>When Patient Cancels:</strong> 100% full refund for cancellations &gt;2 hours prior to scheduled start time; 50% partial refund for cancellations &lt;2 hours prior. Rescheduling is 100% free with no cancellation penalty.
            </li>
            <li>
              <strong>When Doctor Reschedules:</strong> Immediate SMS/Push alert allows patient to accept proposed new slot, choose an alternative slot, re-assign to another top specialist in the same field at no cost, or claim 100% refund + 10% apology voucher.
            </li>
            <li>
              <strong>When Payment Debited but Booking Fails:</strong> Automated webhook reconciliation engine detects unlinked debits within 60 seconds and auto-credits Telecare Wallet (or initiates NUBAN bank reversal within 15 mins).
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-36 w-full max-w-2xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" />

      {/* Header */}
      <Header
        title="Terms and Agreement"
        showBack
        onBack={() => onNavigate(hasAcceptedTerms ? 'patient-home' : 'signup')}
      />

      <div className="mt-2 space-y-3.5">
        {/* Banner Card */}
        <div className="bg-[#1c3a4a] text-white rounded-[26px] p-6 text-center flex flex-col items-center justify-center shadow-md relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#77daa4]/20 border border-[#77daa4]/40 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-[#77daa4]" />
          </div>
          <h2 className="font-bold font-outfit text-xl text-white tracking-wide">
            Prime Telecare Terms
          </h2>
          {hasAcceptedTerms && (
            <span className="mt-2 inline-flex items-center space-x-1 bg-[#77daa4]/20 border border-[#77daa4]/50 text-[#77daa4] text-[11px] font-bold px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" />
              <span>Terms Agreed & On File</span>
            </span>
          )}
        </div>

        {/* Date Tag */}
        <div className="flex items-center justify-center space-x-2 text-xs font-medium text-slate-500 py-0.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Last updated: October 27, 2023</span>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-xs p-5">
          <h3 className="font-bold font-outfit text-[#022434] text-base mb-3.5">
            Table of Contents
          </h3>
          <div className="space-y-2.5">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => toggleSection(sec.id)}
                className="w-full flex items-center space-x-3 text-left group hover:opacity-80 transition-opacity"
              >
                <span className="w-6 h-6 rounded-full bg-[#77daa4] text-[#022434] text-[11px] font-extrabold flex items-center justify-center shrink-0">
                  {sec.id}
                </span>
                <span className="font-bold font-outfit text-[#022434] text-sm group-hover:text-[#006c44] transition-colors">
                  {sec.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-3 pt-1">
          {sections.map((sec) => {
            const isOpen = openSections[sec.id];
            return (
              <div
                key={sec.id}
                className="bg-white rounded-[22px] border border-slate-100 shadow-xs overflow-hidden transition-all"
              >
                {/* Section Accordion Header */}
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-[#77daa4] text-[#022434] text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      {sec.id}
                    </span>
                    <span className="font-bold font-outfit text-[#022434] text-sm">
                      {sec.title}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Section Content */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-50 text-xs font-nunito text-slate-600 leading-relaxed">
                    {sec.content && (
                      typeof sec.content === 'string' ? (
                        <p className="mb-2">{sec.content}</p>
                      ) : (
                        <div className="mb-2">{sec.content}</div>
                      )
                    )}

                    {/* Table View for Payments & Refunds */}
                    {sec.hasTable && sec.tableData && (
                      <div className="my-3 overflow-hidden rounded-xl border border-slate-200/90 shadow-2xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100/90 font-bold font-outfit text-[#022434]">
                            <tr>
                              <th className="p-2.5 border-b border-r border-slate-200">
                                Service
                              </th>
                              <th className="p-2.5 border-b border-r border-slate-200 text-center">
                                Duration
                              </th>
                              <th className="p-2.5 border-b border-slate-200 text-right">
                                Price (₦)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sec.tableData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2.5 border-r border-slate-200/80 font-medium text-slate-800">
                                  {row.service}
                                </td>
                                <td className="p-2.5 border-r border-slate-200/80 text-center text-slate-600">
                                  {row.duration}
                                </td>
                                <td className="p-2.5 text-right font-bold text-[#022434]">
                                  {row.price}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {sec.footerNote && (
                      <p className="text-[11px] text-slate-500 mt-2 italic">
                        {sec.footerNote}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Agreement Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl z-40">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Checkbox */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setIsChecked(!isChecked);
            }}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                isChecked
                  ? 'bg-[#77daa4] border-[#77daa4] text-[#022434]'
                  : 'bg-white border-slate-300 group-hover:border-slate-400'
              }`}
            >
              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span className="text-xs font-semibold text-slate-700 font-nunito">
              I have read and agree to the Terms and Agreement.
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAccept}
            disabled={!isChecked}
            className="w-full py-3.5 bg-[#1c3a4a] text-white font-bold font-outfit text-base rounded-2xl shadow-lg hover:bg-[#022434] transition-all transform active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Accept and Continue
          </button>
        </div>
      </div>
    </div>
  );
};
