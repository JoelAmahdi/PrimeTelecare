import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Pill,
  TestTube,
  Calendar,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { CareJourneyItem, CareJourneyPlan } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import {
  DEFAULT_CARE_JOURNEY_ITEMS,
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

function getDateOffsetIso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizePlanItems(existingItems: CareJourneyItem[] = []): CareJourneyItem[] {
  // Ensure the 3 core clinical checks always exist in order, preserving checked state
  const byId = new Map(existingItems.map((i) => [i.id, i]));
  const coreItems = DEFAULT_CARE_JOURNEY_ITEMS.map((def) => {
    const found = byId.get(def.id);
    return found
      ? {
          ...def,
          checkedByDoctor: found.checkedByDoctor,
          completedByPatient: found.completedByPatient,
          description: found.description || def.description,
          requiredDate: found.requiredDate,
        }
      : { ...def };
  });

  const coreIds = new Set(DEFAULT_CARE_JOURNEY_ITEMS.map((d) => d.id));
  const customItems = existingItems.filter((i) => !coreIds.has(i.id));
  return [...coreItems, ...customItems];
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
    const stored = getStoredCareJourneyPlan(patientId);
    if (stored) {
      return { ...stored, items: normalizePlanItems(stored.items) };
    }
    return createInitialCareJourneyDraft(patientName, doctorName);
  });

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CareJourneyItem['category']>('lifestyle');
  const [labInvestigationDetails, setLabInvestigationDetails] = useState(plan.labInvestigationDetails || '');
  const [followUpDate, setFollowUpDate] = useState(plan.followUpDate || '');
  const [followUpDateNeeded, setFollowUpDateNeeded] = useState(Boolean(plan.followUpDate));
  const [followUpPlanNote, setFollowUpPlanNote] = useState(plan.followUpPlanNote || plan.doctorNotes || '');

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCareJourneyPlan(patientId);
      if (stored) {
        const normalized = { ...stored, items: normalizePlanItems(stored.items) };
        setPlan(normalized);
        setLabInvestigationDetails(stored.labInvestigationDetails || '');
        setFollowUpDate(stored.followUpDate || '');
        setFollowUpDateNeeded(Boolean(stored.followUpDate));
        setFollowUpPlanNote(stored.followUpPlanNote || stored.doctorNotes || '');
      } else {
        const fresh = createInitialCareJourneyDraft(patientName, doctorName);
        setPlan(fresh);
        setLabInvestigationDetails('');
        setFollowUpDate('');
        setFollowUpDateNeeded(false);
        setFollowUpPlanNote('');
      }
    }
  }, [isOpen, patientId, patientName, doctorName]);

  if (!isOpen) return null;

  const isLabChecked = Boolean(plan.items.find((i) => i.id === 'item-lab')?.checkedByDoctor);
  const isRxChecked = Boolean(plan.items.find((i) => i.id === 'item-rx')?.checkedByDoctor);
  const isFollowUpChecked = Boolean(plan.items.find((i) => i.id === 'item-followup')?.checkedByDoctor);

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
    if (checkedCount === 0 && !followUpPlanNote.trim()) {
      showToast('Please check at least one care journey item or add a follow-up plan note.', 'info');
      return;
    }

    const finalFollowUpDate = followUpDateNeeded && followUpDate ? followUpDate : '';
    const trimmedLabDetails = labInvestigationDetails.trim();
    const trimmedFollowUpNote = followUpPlanNote.trim();

    const updatedItems = plan.items.map((item) => {
      if (item.id === 'item-lab' && trimmedLabDetails) {
        return {
          ...item,
          description: `Ordered tests: ${trimmedLabDetails}`,
        };
      }
      if (item.id === 'item-followup' && finalFollowUpDate) {
        return {
          ...item,
          requiredDate: finalFollowUpDate,
          description: `Scheduled follow-up target date: ${finalFollowUpDate}.`,
        };
      }
      return item;
    });

    const updatedPlan: CareJourneyPlan = {
      ...plan,
      patientId,
      doctorName,
      patientName,
      status: 'approved_by_doctor',
      approvedAt: new Date().toISOString(),
      items: updatedItems,
      drugPrescriptionChecked: isRxChecked,
      labInvestigationChecked: isLabChecked,
      labInvestigationDetails: isLabChecked ? trimmedLabDetails : '',
      followUpVisitChecked: isFollowUpChecked,
      followUpDate: finalFollowUpDate || undefined,
      followUpPlanNote: trimmedFollowUpNote,
      doctorNotes: trimmedFollowUpNote,
    };

    saveStoredCareJourneyPlan(updatedPlan);
    primeApi.saveCareJourneyPlan?.(updatedPlan).catch(() => {});

    showToast('Care Journey Plan approved! Now live on the patient dashboard.', 'success');
    if (onPlanPublished) {
      onPlanPublished(updatedPlan);
    }
    onClose();
  };

  const getCategoryIcon = (cat: CareJourneyItem['category']) => {
    switch (cat) {
      case 'medication':
        return <Pill className="w-4 h-4 text-emerald-700 shrink-0" />;
      case 'diagnostic':
        return <TestTube className="w-4 h-4 text-purple-700 shrink-0" />;
      case 'followup':
        return <Calendar className="w-4 h-4 text-teal-700 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  const getCategoryBadge = (cat: CareJourneyItem['category']) => {
    switch (cat) {
      case 'medication':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">Drug Prescription</span>;
      case 'vitals':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">Vitals</span>;
      case 'diagnostic':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold">Lab Investigation</span>;
      case 'lifestyle':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">Care Instruction</span>;
      case 'followup':
        return <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold">Follow-Up Visit</span>;
    }
  };

  const selectedCount = plan.items.filter((i) => i.checkedByDoctor).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-nunito animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#006c44] to-[#022434] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
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
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Checklist Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-outfit uppercase tracking-wider">
            <span>Care Checks ({selectedCount})</span>
          </div>

          <div className="space-y-2.5">
            {plan.items.map((item) => (
              <div key={item.id} className="space-y-2">
                <div
                  onClick={() => toggleItem(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    item.checkedByDoctor
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 opacity-70 hover:opacity-100'
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
                      {getCategoryIcon(item.category)}
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
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Inline Laboratory Investigation Specification when checked */}
                {item.id === 'item-lab' && item.checkedByDoctor && (
                  <div className="ml-6 pl-3 border-l-2 border-purple-200">
                    <label className="block text-[11px] font-bold text-purple-900 font-outfit mb-1">
                      Specify Laboratory Investigation(s) (Optional):
                    </label>
                    <input
                      type="text"
                      value={labInvestigationDetails}
                      onChange={(e) => setLabInvestigationDetails(e.target.value)}
                      placeholder="Lab tests"
                      className="w-full px-3 py-2 text-xs border border-purple-200 bg-purple-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-[#022434]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Follow-Up Date Setting (Optional - If Needed) */}
          <div className="p-4 rounded-2xl border border-teal-200/80 bg-teal-50/40 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-extrabold text-[#022434] font-outfit">
                  Follow-Up Date Setting (If Needed)
                </span>
              </div>
              <label className="inline-flex items-center space-x-2 cursor-pointer text-xs font-bold text-teal-800">
                <input
                  type="checkbox"
                  checked={followUpDateNeeded}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFollowUpDateNeeded(checked);
                    if (checked && !followUpDate) {
                      setFollowUpDate(getDateOffsetIso(7));
                    }
                    if (!checked) {
                      setFollowUpDate('');
                    }
                  }}
                  className="accent-[#006c44] w-4 h-4 rounded"
                />
                <span>Set Date</span>
              </label>
            </div>

            {followUpDateNeeded ? (
              <div className="space-y-2">
                <input
                  type="date"
                  value={followUpDate}
                  min={getDateOffsetIso(0)}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold font-outfit border border-teal-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006c44] text-[#022434]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'In 3 Days', days: 3 },
                    { label: 'In 1 Week', days: 7 },
                    { label: 'In 2 Weeks', days: 14 },
                    { label: 'In 1 Month', days: 30 },
                  ].map((preset) => {
                    const iso = getDateOffsetIso(preset.days);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setFollowUpDate(iso);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-outfit transition-all cursor-pointer ${
                          followUpDate === iso
                            ? 'bg-[#006c44] text-white'
                            : 'bg-white border border-teal-200 text-teal-900 hover:bg-teal-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Follow-Up Plan Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#022434] font-outfit">
              Follow-Up Plan Note
            </label>
            <textarea
              rows={3}
              value={followUpPlanNote}
              onChange={(e) => setFollowUpPlanNote(e.target.value)}
              placeholder="Follow-up plan note"
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006c44] text-[#022434]"
            />
          </div>

          {/* Add Custom Task Form */}
          <form onSubmit={handleAddItem} className="pt-1">
            <label className="block text-xs font-bold text-slate-700 font-outfit mb-1.5">
              Add Care Task
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New task"
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006c44]"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CareJourneyItem['category'])}
                className="px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium text-slate-700 focus:outline-none"
              >
                <option value="medication">Drug Rx</option>
                <option value="diagnostic">Lab</option>
                <option value="followup">Follow-Up</option>
                <option value="vitals">Vitals</option>
                <option value="lifestyle">Instruction</option>
              </select>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold font-outfit hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>
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
