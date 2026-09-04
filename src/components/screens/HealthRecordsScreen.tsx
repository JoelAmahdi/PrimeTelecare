import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { BottomNav } from '../common/BottomNav';
import { MessageSquare, Video, Download, FileText, CheckCircle2, ShieldCheck, Lock, ScanFace, Fingerprint, RefreshCw, X, Bell } from 'lucide-react';
import { ScreenId, User } from '../../types';
import { mockPrescriptions, mockMedicalFiles } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';

interface HealthRecordsScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
}

export const HealthRecordsScreen: React.FC<HealthRecordsScreenProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'consultations' | 'prescriptions' | 'files'>('consultations');
  const [isBiometricVerified, setIsBiometricVerified] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'scanning' | 'success'>('scanning');

  const handleVerifyBiometrics = () => {
    triggerHaptic('medium');
    setShowVerifyModal(true);
    setBiometricStatus('scanning');

    setTimeout(() => {
      triggerHaptic('success');
      setBiometricStatus('success');
      setTimeout(() => {
        setShowVerifyModal(false);
        setIsBiometricVerified(true);
      }, 900);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6" />
      {/* Top Header */}
      <Header
        title="Health Records"
        showBack
        onBack={() => onNavigate('patient-home')}
        showFilter
        onFilterClick={() => alert('Filter records by date or doctor')}
      />

      <div className="px-5 space-y-4 mt-2">
        {/* Biometric Health Records Protection Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-[#006c44]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#006c44]" />
            <span className="font-semibold font-outfit">Biometric Health Records Protection Active</span>
          </div>
          {isBiometricVerified ? (
            <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified</span>
            </span>
          ) : (
            <button
              onClick={handleVerifyBiometrics}
              className="bg-[#1c3a4a] text-white px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center space-x-1 hover:bg-[#022434]"
            >
              <Fingerprint className="w-3 h-3" />
              <span>Unlock</span>
            </button>
          )}
        </div>

        {/* Segmented Filter Tabs Bar */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('consultations');
            }}
            className={`py-2.5 rounded-xl font-bold font-outfit text-xs transition-all ${
              activeTab === 'consultations'
                ? 'bg-[#1c3a4a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Consultations
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('prescriptions');
            }}
            className={`py-2.5 rounded-xl font-bold font-outfit text-xs transition-all ${
              activeTab === 'prescriptions'
                ? 'bg-[#1c3a4a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('files');
            }}
            className={`py-2.5 rounded-xl font-bold font-outfit text-xs transition-all ${
              activeTab === 'files'
                ? 'bg-[#1c3a4a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Files
          </button>
        </div>

        {/* TAB 1: CONSULTATIONS */}
        {activeTab === 'consultations' && (
          <div className="space-y-3.5">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-[#022434] text-base">Text Session</h3>
                  <p className="text-xs text-slate-500 font-nunito">Dr. Anya Sharma, Pediatrician</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Today, 10:30 AM</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('active-chat')}
                className="text-xs font-bold text-[#006c44] hover:underline block pt-1"
              >
                View Summary
              </button>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-[#022434] text-base">Video Session</h3>
                  <p className="text-xs text-slate-500 font-nunito">Dr. David Chen, General Practitioner</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Yesterday, 2:00 PM</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('active-chat')}
                className="text-xs font-bold text-[#006c44] hover:underline block pt-1"
              >
                View Summary
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-3">
            {mockPrescriptions.map((rx) => (
              <div
                key={rx.id}
                onClick={() => onNavigate('prescription-detail')}
                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm cursor-pointer hover:border-[#006c44] transition-all flex items-center justify-between min-w-0 overflow-hidden group"
              >
                <div className="min-w-0 flex-1 mr-3 overflow-hidden">
                  <h3 className="font-bold font-outfit text-[#022434] text-base truncate">{rx.doctorName}</h3>
                  <p className="text-xs text-slate-500 font-nunito truncate">{rx.date} • Ref: {rx.referenceNo}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold bg-emerald-100 text-[#006c44] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {rx.medications.length} medications
                    </span>

                    <span className="text-[10px] font-bold bg-[#006c44] text-white px-2.5 py-0.5 rounded-full flex items-center space-x-1 whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>VERIFIED</span>
                    </span>

                    <span className="text-[10px] font-bold bg-slate-100 text-[#022434] group-hover:bg-[#1c3a4a] group-hover:text-white px-2.5 py-0.5 rounded-full flex items-center space-x-1 transition-colors whitespace-nowrap">
                      <Bell className="w-3 h-3 shrink-0" />
                      <span>Set Reminders</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('prescription-detail');
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-[#006c44] hover:text-white text-slate-700 rounded-2xl transition-colors shrink-0"
                  title="View Prescription & Set Reminders"
                >
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: MY FILES GRID */}
        {activeTab === 'files' && (
          <div className="grid grid-cols-2 gap-3">
            {mockMedicalFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => alert(`Opening file ${file.title}`)}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xs cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {file.type === 'jpg' ? (
                    <img src={file.url} alt={file.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <FileText className="w-10 h-10 text-red-500" />
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-md">PDF</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-bold font-outfit text-xs text-[#022434] truncate">{file.title}</h4>
                  <p className="text-[10px] text-slate-400 font-nunito">{file.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Biometric Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative border border-slate-100 space-y-5">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-outfit text-[#022434]">Confirm Biometrics</h3>
              <p className="text-xs text-slate-500 font-nunito">
                Scan Face ID / Touch ID to unlock confidential medical files
              </p>
            </div>

            <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-4">
              {biometricStatus === 'scanning' && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-[#77daa4] animate-ping opacity-30"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-[#006c44] animate-spin border-t-transparent"></div>
                  <ScanFace className="w-14 h-14 text-[#1c3a4a] animate-pulse" />
                </>
              )}

              {biometricStatus === 'success' && (
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-[#006c44] animate-bounce">
                  <CheckCircle2 className="w-14 h-14" />
                </div>
              )}
            </div>

            <div>
              {biometricStatus === 'scanning' && (
                <div className="flex items-center justify-center space-x-2 text-slate-700 text-sm font-semibold font-outfit">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#006c44]" />
                  <span>Verifying identity...</span>
                </div>
              )}

              {biometricStatus === 'success' && (
                <div className="text-emerald-700 text-sm font-bold font-outfit">
                  Access Granted!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
