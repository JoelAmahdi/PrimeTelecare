import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Search,
  Filter,
  Clock,
  UserCheck,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  Info,
  ShieldAlert,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  X,
  Sparkles,
} from 'lucide-react';
import { HealthRecordAuditLog } from '../../types';
import { mockHealthRecordAuditLogs } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';

interface HealthRecordAuditTrailProps {
  patientName?: string;
  isEmbedded?: boolean;
  auditLogs?: HealthRecordAuditLog[];
}

export const HealthRecordAuditTrail: React.FC<HealthRecordAuditTrailProps> = ({
  patientName = 'Ada Okonkwo',
  isEmbedded = false,
  auditLogs,
}) => {
  const [logs] = useState<HealthRecordAuditLog[]>(auditLogs || mockHealthRecordAuditLogs);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Doctor' | 'System Administrator'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedDetailLog, setSelectedDetailLog] = useState<HealthRecordAuditLog | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportingLog, setReportingLog] = useState<HealthRecordAuditLog | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtering
  const filteredLogs = logs.filter((log) => {
    const matchesRole =
      roleFilter === 'All'
        ? true
        : log.accessorRole === roleFilter;

    const matchesSearch =
      searchQuery.trim() === '' ||
      log.accessedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordAccessed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.accessReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.accessorTitle && log.accessorTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.accessorLicenseOrDept && log.accessorLicenseOrDept.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRole && matchesSearch;
  });

  // Metrics
  const totalCount = logs.length;
  const doctorCount = logs.filter((l) => l.accessorRole === 'Doctor').length;
  const adminCount = logs.filter((l) => l.accessorRole === 'System Administrator').length;
  const lastAccessTime = logs[0]?.timestamp || 'None';

  const handleToggleExpand = (id: string) => {
    triggerHaptic('selection');
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const handleDownloadAuditReport = (format: 'PDF' | 'CSV') => {
    triggerHaptic('medium');
    showToast(`Downloading Official Health Record Audit Ledger (${format})...`);
  };

  const handleOpenReportModal = (log: HealthRecordAuditLog, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    setReportingLog(log);
    setReportReason('');
    setReportSubmitted(false);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    setReportSubmitted(true);
    setTimeout(() => {
      setIsReportModalOpen(false);
      showToast(`Security Report submitted to NDPA Data Protection Officer for Log #${reportingLog?.id}`);
    }, 1800);
  };

  return (
    <div className={`space-y-4 ${isEmbedded ? '' : 'bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs'}`}>
      {/* 1. SECTION HEADER & LEGAL COMPLIANCE BANNER */}
      <div className="bg-gradient-to-r from-[#022434] via-[#0f3c54] to-[#012d42] text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold font-outfit uppercase tracking-wider flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Read-Only Audit Trail</span>
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold font-outfit uppercase tracking-wider">
                NDPA 2023 Sec 38 Compliant
              </span>
            </div>
            <h3 className="font-extrabold font-outfit text-base sm:text-lg text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Health Record Access Log</span>
            </h3>
            <p className="text-xs text-slate-300 font-nunito leading-relaxed">
              Complete, unmodifiable record of every time doctors, specialists, or system administrators accessed your medical files, e-prescriptions, and EHR profiles.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleDownloadAuditReport('PDF')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#022434] font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 shrink-0"
              title="Download PDF Audit Log"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Log (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATISTICAL METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold font-outfit text-slate-500 uppercase tracking-wider block">
            Total Accesses
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black font-outfit text-[#022434]">{totalCount}</span>
            <span className="text-[10px] text-slate-500 font-nunito">Events</span>
          </div>
          <span className="text-[10px] text-slate-500 font-nunito block mt-1">
            Last: {lastAccessTime.split(' at ')[0]}
          </span>
        </div>

        <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
          <span className="text-[11px] font-bold font-outfit text-blue-700 uppercase tracking-wider block">
            Doctor Accesses
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black font-outfit text-[#0284c7]">{doctorCount}</span>
            <span className="text-[10px] text-blue-600 font-nunito">Consultations</span>
          </div>
          <span className="text-[10px] text-blue-600 font-nunito block mt-1">
            Clinical reviews
          </span>
        </div>

        <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100">
          <span className="text-[11px] font-bold font-outfit text-purple-700 uppercase tracking-wider block">
            System Admin Access
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black font-outfit text-purple-800">{adminCount}</span>
            <span className="text-[10px] text-purple-600 font-nunito">Audits</span>
          </div>
          <span className="text-[10px] text-purple-600 font-nunito block mt-1">
            Privacy & security
          </span>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
          <span className="text-[11px] font-bold font-outfit text-[#006c44] uppercase tracking-wider block">
            Security Status
          </span>
          <div className="flex items-center space-x-1.5 mt-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#006c44]" />
            <span className="text-xs font-bold font-outfit text-[#006c44]">100% Authorized</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-nunito block mt-1">
            NDPA Encrypted Ledger
          </span>
        </div>
      </div>

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div className="space-y-2.5 pt-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name, reason, or record type..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-[#022434] focus:outline-none focus:border-[#006c44] placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => handleDownloadAuditReport('CSV')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>


      </div>

      {/* 4. READ-ONLY AUDIT TRAIL LOG LIST */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold font-outfit text-sm text-[#022434]">No matching access log entries</h4>
            <p className="text-xs text-slate-500 font-nunito mt-1">
              Try adjusting your role filter or search keywords.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isDoctor = log.accessorRole === 'Doctor';
            const isAdmin = log.accessorRole === 'System Administrator';

            return (
              <div
                key={log.id}
                onClick={() => handleToggleExpand(log.id)}
                className={`bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  isExpanded
                    ? 'border-[#006c44] shadow-md ring-1 ring-[#006c44]/20'
                    : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Log Header Row */}
                <div className="p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      {/* Avatar / Icon Badge */}
                      <div
                        className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                          isDoctor
                            ? 'bg-blue-50 text-[#0284c7] border border-blue-100'
                            : isAdmin
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-teal-50 text-teal-700 border border-teal-100'
                        }`}
                      >
                        {isDoctor ? (
                          <UserCheck className="w-4 h-4" />
                        ) : isAdmin ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        {/* Name & Role Pill */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold font-outfit text-sm text-[#022434]">
                            {log.accessedBy}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-outfit border ${
                              isDoctor
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : isAdmin
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-teal-100 text-teal-800 border-teal-200'
                            }`}
                          >
                            {log.accessorRole}
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                            {log.actionType}
                          </span>
                        </div>

                        {/* Subtitle / License / Department */}
                        <p className="text-xs text-slate-500 font-nunito mt-0.5">
                          {log.accessorTitle} {log.accessorLicenseOrDept ? `• ${log.accessorLicenseOrDept}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp & Expand Arrow */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center space-x-1 text-slate-500 text-xs font-nunito">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        Log #{log.id}
                      </span>
                    </div>
                  </div>

                  {/* Record Accessed Line */}
                  <div className="flex items-center space-x-2 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <FileText className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                    <span className="font-semibold text-slate-600">Record Category:</span>
                    <span className="font-bold font-outfit text-[#022434] truncate">
                      {log.recordAccessed}
                    </span>
                  </div>

                  {/* Purpose / Why Explanation Box */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/80">
                    <div className="flex items-start space-x-2">
                      <Info className="w-3.5 h-3.5 text-[#006c44] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-extrabold font-outfit text-[#006c44] uppercase tracking-wider block">
                          Stated Access Purpose / Rationale
                        </span>
                        <p className="text-xs font-medium text-emerald-950 font-nunito leading-relaxed mt-0.5">
                          "{log.accessReason}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200/80 p-3.5 sm:p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-nunito">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-bold block uppercase text-[10px]">
                          Access Terminal / Portal
                        </span>
                        <span className="font-semibold text-[#022434] font-outfit mt-0.5 block">
                          {log.accessLocation || 'Prime Telecare Encrypted Node'}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-bold block uppercase text-[10px]">
                          IP Address & Security Method
                        </span>
                        <span className="font-semibold text-[#022434] font-mono mt-0.5 block">
                          {log.ipAddress || '197.210.64.12'} • TLS v1.3 AES-256
                        </span>
                      </div>
                    </div>

                    {/* Legal Read-only Guard & Flag Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Read-only NDPA Immutable Record</span>
                      </div>

                      <button
                        onClick={(e) => handleOpenReportModal(log, e)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center space-x-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Report Suspicious Access</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#022434] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-outfit font-semibold flex items-center space-x-2 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Report Suspicious Access Modal */}
      {isReportModalOpen && reportingLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-extrabold font-outfit text-base text-[#022434]">
                  Report Unauthorized Access
                </h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-[#006c44] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold font-outfit text-base text-[#022434]">
                  Security Report Logged
                </h4>
                <p className="text-xs text-slate-500 font-nunito leading-relaxed">
                  Your report regarding access by <strong>{reportingLog.accessedBy}</strong> has been transmitted to the NDPA Data Protection Officer.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
                <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-100 space-y-1">
                  <span className="font-bold font-outfit text-rose-800 block">
                    Access Event to Flag: Log #{reportingLog.id}
                  </span>
                  <p className="text-slate-600 font-nunito">
                    Accessed by <strong>{reportingLog.accessedBy}</strong> ({reportingLog.accessorRole}) on {reportingLog.timestamp}.
                  </p>
                </div>

                <div>
                  <label className="font-bold font-outfit text-slate-700 block mb-1">
                    Describe Why You suspect This Access Was Unauthorized:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="e.g. I did not schedule a consultation with this doctor or grant consent for file review..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-[#022434] focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold font-outfit rounded-xl shadow-xs"
                  >
                    Submit Flag to Data Protection Officer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
