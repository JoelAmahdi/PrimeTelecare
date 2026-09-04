import React, { useState } from 'react';
import { Trash2, Plus, PenTool, ArrowLeft, Eye, Send, CheckCircle2, Pill, User, FileText } from 'lucide-react';
import { ScreenId, Medication, UserRole } from '../../types';
import { StatusBar } from '../common/StatusBar';
import { triggerHaptic } from '../../utils/haptics';

interface NewPrescriptionScreenProps {
  onNavigate: (screen: ScreenId) => void;
  role?: UserRole;
}

export const NewPrescriptionScreen: React.FC<NewPrescriptionScreenProps> = ({ onNavigate, role = 'doctor' }) => {
  const [diagnosis, setDiagnosis] = useState('Acute Tonsillitis / Upper Respiratory Infection');
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', drugName: 'Amoxicillin', dosage: '500 mg', frequency: 'Twice daily', duration: '10 days' },
    { id: '2', drugName: 'Ibuprofen', dosage: '400 mg', frequency: 'Every 6 hours', duration: '5 days' },
  ]);
  const [notes, setNotes] = useState('Drink warm fluids, finish full antibiotic course.');
  const [isSigned, setIsSigned] = useState(true);

  const handleAddMedication = () => {
    triggerHaptic('light');
    const newMed: Medication = {
      id: Date.now().toString(),
      drugName: '',
      dosage: '',
      frequency: '',
      duration: '',
    };
    setMedications([...medications, newMed]);
  };

  const handleRemoveMedication = (id: string) => {
    triggerHaptic('light');
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleMedChange = (id: string, field: keyof Medication, value: string) => {
    setMedications(
      medications.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSaveAndSend = () => {
    triggerHaptic('success');
    onNavigate('prescription-detail');
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-24 w-full max-w-4xl mx-auto px-3 sm:px-6 text-[#171c1f]">
      <StatusBar className="-mx-3 sm:-mx-6" />

      {/* Top Header */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3 border-b border-slate-100 flex items-center justify-between rounded-b-2xl shadow-2xs">
        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('doctor-home');
          }}
          className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-sm sm:text-base font-bold font-outfit text-[#022434]">Issue New E-Prescription</h1>
        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('prescription-detail');
          }}
          className="flex items-center space-x-1 text-xs font-semibold text-[#006c44] hover:text-[#005234] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
      </div>

      <div className="px-1 sm:px-3 space-y-5 mt-4">
        {/* Patient Summary Card */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
            alt="Ada Okonkwo"
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-outfit text-[#022434] text-sm truncate">Ada Okonkwo</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                28 Yrs • Female
              </span>
            </div>
            <p className="text-xs text-slate-500 font-nunito mt-0.5">
              Consultation: May 15, 2024 • 10:00 AM
            </p>
          </div>
        </div>

        {/* Diagnosis / Chief Complaint */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <label className="block text-xs font-semibold font-outfit text-[#022434] flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-[#006c44]" />
            <span>Diagnosis / Chief Complaint</span>
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute Tonsillitis / Fever..."
            className="w-full p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-nunito text-slate-800 focus:outline-none focus:border-[#006c44] focus:bg-white transition-colors"
          />
        </div>

        {/* Medications List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center space-x-1.5">
              <Pill className="w-4 h-4 text-[#006c44]" />
              <h3 className="font-bold font-outfit text-[#022434] text-sm">Prescribed Medications</h3>
            </div>
            <button
              onClick={handleAddMedication}
              className="text-xs font-semibold text-[#006c44] hover:underline flex items-center space-x-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Drug</span>
            </button>
          </div>

          {medications.map((med, index) => (
            <div
              key={med.id}
              className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-semibold text-slate-400 font-outfit">
                  Medication #{index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    onClick={() => handleRemoveMedication(med.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Medication"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Drug Name</label>
                  <input
                    type="text"
                    value={med.drugName}
                    onChange={(e) => handleMedChange(med.id, 'drugName', e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-nunito focus:outline-none focus:border-[#006c44]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Dosage</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(med.id, 'dosage', e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-nunito focus:outline-none focus:border-[#006c44]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Frequency</label>
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) => handleMedChange(med.id, 'frequency', e.target.value)}
                    placeholder="e.g. Twice daily"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-nunito focus:outline-none focus:border-[#006c44]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => handleMedChange(med.id, 'duration', e.target.value)}
                    placeholder="e.g. 10 days"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-nunito focus:outline-none focus:border-[#006c44]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Doctor Notes */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <label className="block text-xs font-semibold font-outfit text-[#022434]">
            Clinical Notes & Dietary Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Drink warm fluids, finish full antibiotic course..."
            rows={3}
            className="w-full p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-nunito text-slate-800 focus:outline-none focus:border-[#006c44] focus:bg-white transition-colors"
          ></textarea>
        </div>

        {/* E-signature Pad */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-2">
          <label className="block text-xs font-semibold font-outfit text-[#022434]">
            Doctor's Digital Signature
          </label>
          <div
            onClick={() => {
              triggerHaptic('light');
              setIsSigned(!isSigned);
            }}
            className="h-20 border-2 border-dashed border-slate-200 hover:border-emerald-500/80 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer transition-all"
          >
            {isSigned ? (
              <div className="text-center">
                <span className="font-outfit text-xl font-bold italic text-[#022434] tracking-widest block">
                  Dr. Sarah Lee, MD
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center space-x-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-[#006c44]" />
                  <span>Click to change signature</span>
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-medium flex items-center space-x-1.5">
                <PenTool className="w-4 h-4 text-slate-400" />
                <span>Tap to apply digital signature</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('prescription-detail');
            }}
            className="py-3 border border-slate-300 text-[#1c3a4a] font-semibold font-outfit text-xs sm:text-sm rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Rx</span>
          </button>
          <button
            onClick={handleSaveAndSend}
            className="py-3 bg-[#1c3a4a] hover:bg-[#022434] text-white font-semibold font-outfit text-xs sm:text-sm rounded-xl transition-all shadow-sm transform active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Sign & Issue Rx</span>
          </button>
        </div>
      </div>
    </div>
  );
};

