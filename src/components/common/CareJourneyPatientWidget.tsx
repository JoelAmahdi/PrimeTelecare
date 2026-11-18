import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Calendar,
  Pill,
  TestTube,
  FileText,
} from 'lucide-react';
import { CareJourneyPlan, ScreenId } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import {
  getStoredCareJourneyPlan,
  saveStoredCareJourneyPlan,
  toggleStoredCareJourneyTask,
} from '../../utils/careJourney';
import { primeApi } from '../../services/apiClient';

interface CareJourneyPatientWidgetProps {
  onNavigate: (screen: ScreenId) => void;
  patientId?: string;
}

function formatFollowUpDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const CareJourneyPatientWidget: React.FC<CareJourneyPatientWidgetProps> = ({
  onNavigate,
  patientId = 'pat-1',
}) => {
  const [plan, setPlan] = useState<CareJourneyPlan | null>(() => getStoredCareJourneyPlan(patientId));

  useEffect(() => {
    let isMounted = true;

    const syncFromServer = async () => {
      try {
        const remotePlan = await primeApi.getCareJourneyPlan(patientId || 'pat-1');
        if (isMounted && remotePlan && remotePlan.items) {
          setPlan(remotePlan);
          saveStoredCareJourneyPlan(remotePlan);
        }
      } catch {
        // fallback to local plan
      }
    };

    syncFromServer();
    const pollId = window.setInterval(syncFromServer, 12000);

    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setPlan(e.detail);
      } else {
        setPlan(getStoredCareJourneyPlan(patientId));
      }
    };

    window.addEventListener('care-journey-updated', handleUpdate);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('prime_care_journey_channel');
      channel.onmessage = (event) => {
        if (event.data) {
          setPlan(event.data);
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'prime_telecare_care_journey_plan') {
        setPlan(getStoredCareJourneyPlan(patientId));
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
      window.removeEventListener('care-journey-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [patientId]);

  const handleToggleTask = (itemId: string) => {
    triggerHaptic('medium');
    const updated = toggleStoredCareJourneyTask(itemId);
    if (updated) {
      setPlan(updated);
      primeApi.saveCareJourneyPlan?.(updated).catch(() => {});
      const target = updated.items.find((i) => i.id === itemId);
      if (target?.completedByPatient) {
        showToast('Care journey item marked as complete!', 'success');
      }
    }
  };

  // Only show Care Journey post-consultation once decided & approved by the doctor
  if (!plan || plan.status !== 'approved_by_doctor') {
    return null;
  }

  const activeItems = plan.items.filter((i) => i.checkedByDoctor);
  const completedCount = activeItems.filter((i) => i.completedByPatient).length;
  const progressPercent = activeItems.length > 0 ? Math.round((completedCount / activeItems.length) * 100) : 0;
  const planNote = plan.followUpPlanNote || plan.doctorNotes;

  const getItemBadge = (category: string) => {
    switch (category) {
      case 'medication':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">
            <Pill className="w-3 h-3" />
            <span>Drug Prescription</span>
          </span>
        );
      case 'diagnostic':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold">
            <TestTube className="w-3 h-3" />
            <span>Lab Investigation</span>
          </span>
        );
      case 'followup':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold">
            <Calendar className="w-3 h-3" />
            <span>Follow-Up Visit</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-emerald-200/90 space-y-4 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-[#006c44] flex items-center justify-center shrink-0 shadow-2xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                Care Journey Tracker
              </h3>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[#006c44] text-[10px] font-extrabold border border-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                <span>Doctor Approved</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-nunito">
              Decided by <span className="font-bold text-slate-700">{plan.doctorName}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onNavigate('post-consultation-journey');
          }}
          className="text-xs font-bold text-[#006c44] hover:underline flex items-center space-x-1 shrink-0 cursor-pointer"
        >
          <span>Full Journey</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      {activeItems.length > 0 && (
        <div className="space-y-1.5 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#022434] font-outfit">Care Checklist Progress</span>
            <span className="text-[#006c44] font-mono">
              {completedCount} of {activeItems.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#006c44] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Interactive To-Do Checklist */}
      <div className="space-y-2">
        {activeItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggleTask(item.id)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
              item.completedByPatient
                ? 'bg-slate-50 border-slate-200 opacity-75'
                : 'bg-white hover:bg-emerald-50/40 border-slate-200/90 shadow-2xs'
            }`}
          >
            <button
              type="button"
              className="mt-0.5 text-[#006c44] shrink-0"
              aria-label={item.completedByPatient ? 'Mark task as incomplete' : 'Mark task as complete'}
            >
              {item.completedByPatient ? (
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-1.5">
                <p
                  className={`text-xs sm:text-sm font-bold font-outfit ${
                    item.completedByPatient ? 'line-through text-slate-400' : 'text-[#022434]'
                  }`}
                >
                  {item.title}
                </p>
                {getItemBadge(item.category)}
              </div>
              {item.description && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.id === 'item-lab' && plan.labInvestigationDetails && (
                <p className="text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg mt-1.5">
                  Lab Tests: {plan.labInvestigationDetails}
                </p>
              )}
            </div>
            {item.completedByPatient && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 self-center">
                Done
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Follow-Up Date Card (if set by Doctor) */}
      {plan.followUpDate && (
        <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                Recommended Follow-Up Date
              </span>
              <span className="text-xs sm:text-sm font-extrabold font-outfit text-[#022434]">
                {formatFollowUpDate(plan.followUpDate)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('book-consultation');
            }}
            className="px-3.5 py-2 bg-[#006c44] hover:bg-[#022434] text-white text-xs font-bold font-outfit rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
          >
            Schedule Follow-Up
          </button>
        </div>
      )}

      {/* Follow-Up Plan Note */}
      {planNote && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-1">
          <div className="flex items-center space-x-1.5 font-extrabold text-[#022434] font-outfit">
            <FileText className="w-3.5 h-3.5 text-[#006c44]" />
            <span>Follow-Up Plan Note</span>
          </div>
          <p className="leading-relaxed whitespace-pre-line">{planNote}</p>
        </div>
      )}
    </div>
  );
};
