import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Bell,
  Stethoscope,
  X,
  FileText,
  UserCheck,
  Lock,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { HealthRecordExportPermission } from '../../utils/healthRecordPermissions';

interface DoctorExportPermissionGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: HealthRecordExportPermission;
  onGrantPermission: (doctorName?: string, doctorLicense?: string) => void;
  onSendReminder: () => void;
  onProceedExport?: () => void;
}

export const DoctorExportPermissionGateModal: React.FC<DoctorExportPermissionGateModalProps> = ({
  isOpen,
  onClose,
  permission,
  onGrantPermission,
  onSendReminder,
  onProceedExport,
}) => {
  const [reminderSent, setReminderSent] = useState(false);
  const isGranted = permission.status === 'granted';

  if (!isOpen) return null;

  const handleReminderClick = () => {
    triggerHaptic('medium');
    onSendReminder();
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 3000);
  };

  const handleDoctorGrantClick = () => {
    triggerHaptic('success');
    onGrantPermission(permission.doctorName, permission.doctorLicense);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto font-nunito">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div
          className={`p-5 text-white flex items-center justify-between border-b ${
            isGranted
              ? 'bg-gradient-to-r from-[#006c44] to-[#022434] border-emerald-700'
              : 'bg-gradient-to-r from-[#022434] via-[#1c3a4a] to-[#2d1b00] border-amber-900/30'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isGranted ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isGranted ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-extrabold font-outfit text-base sm:text-lg text-white">
                {isGranted ? 'Doctor Export Release Authorized' : 'Doctor Permission Required'}
              </h3>
              <p className="text-xs text-slate-300">
                {isGranted
                  ? 'Official clinical release granted & signed'
                  : 'Clinical governance & record release gate'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start space-x-3 ${
              isGranted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            {isGranted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            )}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold font-outfit text-sm">
                  {isGranted ? 'Authorization Status: GRANTED' : 'Authorization Status: PENDING CLINICIAN APPROVAL'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isGranted
                  ? `Your attending physician (${permission.doctorName}) has reviewed, finalized, and electronically signed the release for your session health dossier.`
                  : `Exporting this session's official health record dossier is restricted until your attending physician (${permission.doctorName}) approves and signs the clinical documentation.`}
              </p>
            </div>
          </div>

          {/* Session & Verification Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 font-outfit uppercase">
                Attending Clinician
              </span>
              <span className="font-bold text-[#022434]">{permission.doctorName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 font-outfit uppercase">
                MDCN License Number
              </span>
              <span className="font-mono font-bold text-slate-800">{permission.doctorLicense || 'MDCN/2019/88492'}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 font-outfit uppercase">
                Session Reference
              </span>
              <span className="font-mono font-bold text-[#006c44]">{permission.sessionId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500 font-outfit uppercase">
                Requested Purpose
              </span>
              <span className="font-semibold text-slate-800 text-right">{permission.purpose}</span>
            </div>

            {isGranted && permission.grantedAt && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-emerald-800">
                <span className="text-[11px] font-bold font-outfit uppercase">Date Authorized</span>
                <span className="font-bold">{permission.grantedAt}</span>
              </div>
            )}
          </div>

          {/* Statutory Clinical Notice */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-start space-x-2 text-[11px] text-slate-600">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              Under the National Data Protection Act (NDPA) and Medical & Dental Council of Nigeria (MDCN)
              telemedicine protocols, diagnostic records require clinician sign-off before being exported as
              tamper-evident external PDF documents.
            </p>
          </div>

          {/* Actions depending on status */}
          {!isGranted ? (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleReminderClick}
                className="w-full py-3 px-4 bg-[#022434] hover:bg-[#1c3a4a] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span>
                  {reminderSent
                    ? 'Electronic Reminder Sent to Doctor Queue!'
                    : `Send Release Reminder to ${permission.doctorName}`}
                </span>
              </button>

              {/* Doctor Simulation Sign-Off for Seamless Testing / Clinician Role */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-outfit text-emerald-900 flex items-center space-x-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Clinician Sign-Off Control</span>
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  Doctors can grant permission from their clinical dashboard or right here:
                </p>
                <button
                  type="button"
                  onClick={handleDoctorGrantClick}
                  className="w-full py-2 bg-[#006c44] hover:bg-[#005233] text-white font-extrabold font-outfit text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Sign & Authorize Record Release as Doctor</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  onClose();
                  if (onProceedExport) onProceedExport();
                }}
                className="w-full py-3.5 bg-[#006c44] hover:bg-[#005233] text-white font-extrabold font-outfit text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <FileText className="w-4 h-4" />
                <span>Proceed with PDF Dossier Export</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
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
