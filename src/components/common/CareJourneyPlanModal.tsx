import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Stethoscope,
  Pill,
  Activity,
  HeartPulse,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { CareJourneyItem, CareJourneyPlan } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import {
  getStoredCareJourneyPlan,
  saveStoredCareJourneyPlan,
  createInitialCareJourneyDraft,
} from '../../utils/careJourney';
import { primeApi } from '../../services/apiClient';

interface CareJourneyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
  patientName?: string;
  patientId?: string;
  onPlanPublished?: (plan: CareJourneyPlan) => void;
}

export const CareJourneyPlanModal: React.FC<CareJourneyPlanModalProps> = ({
  isOpen,
  onClose,
  doctorName = 'Attending Physician',
  patientName = 'Patient',
  patientId = 'pat-1',
  onPlanPublished,
}) => {
  const [plan, setPlan] = useState<CareJourneyPlan>(() => {
    return getStoredCareJourneyPlan(patientId) || createInitialCareJourneyDraft(patientName, doctorName);
  });

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CareJourneyItem['category']>('lifestyle');
  const [doctorNotes, setDoctorNotes] = useState(plan.doctorNotes || '');

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCareJourneyPlan(patientId);
      if (stored) {
        setPlan(stored);
        setDoctorNotes(stored.doctorNotes || '');
      } else {
        const fresh = createInitialCareJourneyDraft(patientName, doctorName);
        setPlan(fresh);
      }
    }
  }, [isOpen, patientId, patientName, doctorName]);

  if (!isOpen) return null;

  const toggleItem = (itemId: string) => {
    triggerHaptic('selection');
    setPlan((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, checkedByDoctor: !item.checkedByDoctor } : item
      ),
    }));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    triggerHaptic('light');

    const newItem: CareJourneyItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      checkedByDoctor: true,
      completedByPatient: false,
    };

    setPlan((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setNewTitle('');
  };

  const handleRemoveItem = (itemId: string) => {
    triggerHaptic('light');
    setPlan((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const handlePublishPlan = async () => {
    triggerHaptic('success');
    const checkedCount = plan.items.filter((i) => i.checkedByDoctor).length;
    if (checkedCount === 0) {
      showToast('Please check at least one care plan item before publishing.', 'info');
      return;
    }

    const updatedPlan: CareJourneyPlan = {
      ...plan,
      doctorName,
      patientName,
      status: 'approved_by_doctor',
      approvedAt: new Date().toISOString(),
      doctorNotes: doctorNotes.trim(),
    };

    saveStoredCareJourneyPlan(updatedPlan);
    primeApi.saveCareJourneyPlan?.(updatedPlan).catch(() => {});

    showToast('Care Journey Plan approved! Now visible on the patient dashboard.', 'success');
    if (onPlanPublished) {
      onPlanPublished(updatedPlan);
    }
    onClose();
  };

  const getCategoryBadge = (cat: CareJourneyItem['category']) => {
    switch (cat) {
      case 'medication':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">Medication</span>;
      case 'vitals':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">Vitals Check</span>;
      case 'diagnostic':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold">Laboratory</span>;
      case 'lifestyle':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">Lifestyle & Rest</span>;
      case 'followup':
        return <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold">Follow-Up</span>;
    }
  };

  const selectedCount = plan.items.filter((i) => i.checkedByDoctor).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-nunito animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#006c44] to-[#022434] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold font-outfit text-base sm:text-lg">Care Journey Plan</h3>
                {plan.status === 'approved_by_doctor' ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                    Live on Patient App
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold border border-amber-400/30">
                    Pending Doctor Decision
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 font-nunito">
                Patient: <span className="font-bold text-white">{patientName}</span> • Attending: {doctorName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Instructions Banner */}
        <div className="px-5 py-3 bg-emerald-50/80 border-b border-emerald-100 text-xs text-emerald-950 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#006c44] shrink-0 mt-0.5" />
          <p>
            <strong>Doctor Clinical Decision:</strong> Check the to-do items to include in this patient's recovery journey.
            The care plan will only appear on the patient's dashboard once you approve and publish it below.
          </p>
        </div>

        {/* Scrollable Checklist Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-outfit uppercase tracking-wider">
            <span>Recovery Plan To-Do Items ({selectedCount} Selected)</span>
            <span>Check to Include</span>
          </div>

          <div className="space-y-2.5">
            {plan.items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  item.checkedByDoctor
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-[#006c44] shrink-0"
                  aria-label={item.checkedByDoctor ? 'Uncheck task' : 'Check task'}
                >
                  {item.checkedByDoctor ? (
                    <CheckSquare className="w-5 h-5 text-[#006c44]" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <p className={`text-xs sm:text-sm font-bold font-outfit ${item.checkedByDoctor ? 'text-[#022434]' : 'text-slate-600'}`}>
                      {item.title}
                    </p>
                    {getCategoryBadge(item.category)}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.id.startsWith('custom-') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Custom Task Form */}
          <form onSubmit={handleAddItem} className="pt-2">
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1.5">
              Add Specific Patient Instruction / Milestone:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Avoid driving or heavy machinery for 48 hours"
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006c44]"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium text-slate-700 focus:outline-none"
              >
                <option value="lifestyle">Lifestyle</option>
                <option value="medication">Medication</option>
                <option value="vitals">Vitals</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="followup">Follow-up</option>
              </select>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold font-outfit hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Doctor Advisory Notes */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1">
              Physician Recovery Note (Optional):
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g., Contact clinic immediately if fever exceeds 38.5°C or rash develops."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006c44]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold font-outfit text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublishPlan}
            className="px-5 py-2.5 rounded-xl bg-[#006c44] hover:bg-[#005533] text-white font-extrabold font-outfit text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Approve & Publish to Patient Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
