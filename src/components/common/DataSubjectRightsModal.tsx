import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Download,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import { User as UserType, OptionalConsents } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface DataSubjectRightsModalProps {
  isOpen: boolean;
  user: UserType;
  initialMode?: 'access' | 'consent' | 'deletion';
  onClose: () => void;
  onUpdateOptionalConsents?: (newConsents: OptionalConsents) => void;
}

export const DataSubjectRightsModal: React.FC<DataSubjectRightsModalProps> = ({
  isOpen,
  user,
  initialMode = 'access',
  onClose,
  onUpdateOptionalConsents,
}) => {
  const [activeTab, setActiveTab] = useState<'access' | 'consent' | 'deletion'>(initialMode);

  // Optional Consents State
  const [consents, setConsents] = useState<OptionalConsents>(
    user.optionalConsents || {
      marketingConsent: false,
      anonymizedResearchConsent: true,
    }
  );

  // Deletion Request State
  const [deletionReason, setDeletionReason] = useState('privacy');
  const [deletionComments, setDeletionComments] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionTicket, setDeletionTicket] = useState<string | null>(null);

  // Data Access Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const handleToggleConsent = (key: keyof OptionalConsents) => {
    triggerHaptic('selection');
    const updated = { ...consents, [key]: !consents[key] };
    setConsents(updated);
    if (onUpdateOptionalConsents) {
      onUpdateOptionalConsents(updated);
    }
  };

  const handleDownloadDataAccess = (format: 'json' | 'pdf') => {
    triggerHaptic('medium');
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      triggerHaptic('success');

      if (format === 'json') {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(
            {
              ndpaExportVersion: '1.0',
              exportedAt: new Date().toISOString(),
              dataSubject: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                dob: user.dob,
                gender: user.gender,
                address: user.address,
                bloodGroup: user.bloodGroup,
                allergies: user.allergies,
                conditions: user.existingConditions,
                medications: user.currentMedications,
              },
              ndpaConsentTrail: user.ndpaConsent,
              activeConsents: consents,
            },
            null,
            2
          )
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `NDPA_Data_Access_Package_${user.id}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else {
        window.print();
      }
    }, 1200);
  };

  const handleSubmitDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type "DELETE" to confirm your erasure request.', 'error');
      return;
    }

    triggerHaptic('medium');
    setIsDeleting(true);

    setTimeout(() => {
      setIsDeleting(false);
      triggerHaptic('success');
      const ticketId = `NDPA-DEL-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setDeletionTicket(ticketId);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#022434]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#022434] via-[#1c3a4a] to-[#004830] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-400/20 text-[#77daa4] border border-emerald-400/30 rounded-2xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-outfit text-base text-white">
                  NDPA 2023 Data Subject Rights
                </h3>
                <span className="bg-[#77daa4] text-[#022434] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Statutory Rights
                </span>
              </div>
              <p className="text-xs text-slate-300 font-nunito">
                Manage data access, optional consent, and right to erasure
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-100 border-b border-slate-200 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('access');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-outfit transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'access'
                ? 'bg-[#1c3a4a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Request Access</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('consent');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-outfit transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'consent'
                ? 'bg-[#1c3a4a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Optional Consent</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('deletion');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-outfit transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'deletion'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>3. Request Deletion</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 font-nunito text-[#171c1f]">
          {/* TAB 1: REQUEST ACCESS TO RECORDS */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/90 space-y-2">
                <div className="flex items-center space-x-2 text-[#006c44]">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <h4 className="font-bold font-outfit text-sm">
                    Right of Access (NDPA 2023 Section 34)
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  You have the legal right to receive a readable, complete copy of all personal data, health records, consultation logs, prescriptions, and consent audit trails maintained by Prime Telecare.
                </p>
              </div>

              {/* Data Inventory Items Box */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold font-outfit text-slate-500 block uppercase tracking-wider">
                  Data Access Package Contents:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#006c44] shrink-0" />
                    <span>Personal Profile & Demographics</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#006c44] shrink-0" />
                    <span>Clinical History & Vitals</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#006c44] shrink-0" />
                    <span>Consultation Summaries & Notes</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#006c44] shrink-0" />
                    <span>E-Prescription & Pharmacy Audit</span>
                  </div>
                </div>
              </div>

              {exportComplete && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Data Access Package exported successfully!</span>
                </div>
              )}

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownloadDataAccess('json')}
                  disabled={isExporting}
                  className="p-3.5 bg-[#022434] hover:bg-[#003853] text-white font-bold font-outfit text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4 text-[#77daa4]" />
                  <span>{isExporting ? 'Generating Package...' : 'Download JSON Data File'}</span>
                </button>

                <button
                  onClick={() => handleDownloadDataAccess('pdf')}
                  disabled={isExporting}
                  className="p-3.5 bg-[#006c44] hover:bg-emerald-800 text-white font-bold font-outfit text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isExporting ? 'Generating Package...' : 'Print / Download PDF Summary'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: OPTIONAL CONSENT MANAGEMENT */}
          {activeTab === 'consent' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <h4 className="font-bold font-outfit text-sm text-[#022434]">
                  Right to Withdraw Consent (NDPA Section 27)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Core medical treatment requires mandatory healthcare processing. You may freely give or withdraw consent for optional processing activities below at any time without affecting your clinical care.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Marketing Consent */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold font-outfit text-sm text-[#022434] block">
                      Marketing & Promotional Communications
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Receive wellness offers, health newsletter tips, and service updates.
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleConsent('marketingConsent')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold font-outfit transition-all shrink-0 ${
                      consents.marketingConsent
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {consents.marketingConsent ? 'Consent Active' : 'Withdrawn'}
                  </button>
                </div>

                {/* 2. Research Consent */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold font-outfit text-sm text-[#022434] block">
                      Anonymized Health Data for Medical Research
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Allow non-identifiable, aggregated clinical trends to improve public health insights in Nigeria.
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleConsent('anonymizedResearchConsent')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold font-outfit transition-all shrink-0 ${
                      consents.anonymizedResearchConsent
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {consents.anonymizedResearchConsent ? 'Consent Active' : 'Withdrawn'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: REQUEST ERASURE / DELETION */}
          {activeTab === 'deletion' && (
            <div className="space-y-4">
              {deletionTicket ? (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-300 text-center space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold font-outfit text-lg text-emerald-900">
                      Erasure Request Submitted
                    </h4>
                    <p className="text-xs text-slate-600 font-nunito mt-1">
                      Your statutory right-to-erasure request has been logged under NDPA Section 34 compliance.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-mono font-bold text-[#022434]">
                    Ticket Reference: {deletionTicket}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Non-essential personal contact data will be purged within 30 days. Pursuant to Medical & Dental Council of Nigeria regulations, clinical prescription logs remain securely archived in an anonymized vault for statutory audit periods.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitDeletion} className="space-y-4">
                  {/* Statutory Medical Disclaimer */}
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/90 space-y-2 text-xs text-amber-900">
                    <div className="flex items-center space-x-2 font-bold font-outfit text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Statutory Medical Retention Disclaimer</span>
                    </div>
                    <p className="leading-relaxed">
                      Under the Nigeria Data Protection Act (NDPA) and Medical & Dental Council guidelines, requesting account deletion will purge your login credentials and contact profiles. However, <strong>verified clinical consultation summaries and e-prescriptions</strong> must legally be retained in encrypted, access-restricted archives for mandatory statutory retention periods.
                    </p>
                  </div>

                  {/* Select Deletion Reason */}
                  <div>
                    <label className="text-xs font-bold font-outfit text-slate-700 block mb-1">
                      Reason for Erasure Request
                    </label>
                    <select
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#022434] focus:outline-none"
                    >
                      <option value="privacy">Privacy concerns under NDPA</option>
                      <option value="unused">No longer need telemedicine services</option>
                      <option value="duplicate">Created duplicate account</option>
                      <option value="other">Other reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold font-outfit text-slate-700 block mb-1">
                      Additional Comments (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={deletionComments}
                      onChange={(e) => setDeletionComments(e.target.value)}
                      placeholder="Specify any details for the Data Protection Officer..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#022434] focus:outline-none"
                    />
                  </div>

                  {/* Confirmation Input */}
                  <div>
                    <label className="text-xs font-bold font-outfit text-slate-700 block mb-1">
                      Type <span className="text-rose-700 font-extrabold">"DELETE"</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-bold font-outfit text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Processing Request...' : 'Submit Deletion Request'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 font-nunito">
            Prime Telecare Data Protection Officer: <span className="font-bold">dpo@primetelecare.ng</span>
          </p>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
