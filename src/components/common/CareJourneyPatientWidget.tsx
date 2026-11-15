import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CareJourneyItem, CareJourneyPlan, ScreenId } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import {
  getStoredCareJourneyPlan,
  toggleStoredCareJourneyTask,
} from '../../utils/careJourney';

interface CareJourneyPatientWidgetProps {
  onNavigate: (screen: ScreenId) => void;
  patientId?: string;
}

export const CareJourneyPatientWidget: React.FC<CareJourneyPatientWidgetProps> = ({
  onNavigate,
  patientId = 'pat-1',
}) => {
  const [plan, setPlan] = useState<CareJourneyPlan | null>(() => getStoredCareJourneyPlan(patientId));

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setPlan(e.detail);
      } else {
        setPlan(getStoredCareJourneyPlan(patientId));
      }
    };

    window.addEventListener('care-journey-updated', handleUpdate);

    // BroadcastChannel cross-tab listener
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
      const target = updated.items.find((i) => i.id === itemId);
      if (target?.completedByPatient) {
        showToast('Recovery task marked as complete!', 'success');
      }
    }
  };

  // If there's no plan or if the doctor hasn't approved the plan yet:
  if (!plan || plan.status !== 'approved_by_doctor') {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                Care Journey Tracker
              </h3>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Awaiting Doctor Decision
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-100/70 text-amber-800 text-xs font-bold font-mono">
            Pending Review
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-xs text-amber-950 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-bold">
            <Stethoscope className="w-4 h-4 text-[#006c44]" />
            <span>Doctor deciding your recovery plan</span>
          </div>
          <p className="text-slate-600 font-nunito leading-relaxed">
            Your attending physician ({plan?.doctorName || 'Dr. Attending'}) is reviewing and checking the recovery to-do list for your condition.
            The care plan will appear here automatically as soon as your doctor publishes it.
          </p>
        </div>
      </div>
    );
  }

  // Doctor HAS approved the plan:
  const activeItems = plan.items.filter((i) => i.checkedByDoctor);
  const completedCount = activeItems.filter((i) => i.completedByPatient).length;
  const progressPercent = activeItems.length > 0 ? Math.round((completedCount / activeItems.length) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-emerald-200/90 space-y-4 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-[#006c44] flex items-center justify-center shrink-0 shadow-2xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold font-outfit text-base sm:text-lg text-[#022434]">
                Care Journey Tracker
              </h3>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[#006c44] text-[10px] font-extrabold border border-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                <span>Doctor Approved</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-nunito">
              Decided by <span className="font-bold text-slate-700">{plan.doctorName}</span> • Patient Recovery To-Do List
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onNavigate('post-consultation-journey');
          }}
          className="text-xs font-bold text-[#006c44] hover:underline flex items-center space-x-1 shrink-0"
        >
          <span>Full Journey</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#022434] font-outfit">Recovery Tasks Completed</span>
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

      {/* Interactive To-Do Checklist */}
      <div className="space-y-2">
        {activeItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggleTask(item.id)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
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
              <p
                className={`text-xs sm:text-sm font-bold font-outfit ${
                  item.completedByPatient ? 'line-through text-slate-400' : 'text-[#022434]'
                }`}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
            {item.completedByPatient && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 self-center">
                Completed
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Doctor Notes if present */}
      {plan.doctorNotes && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
          <span className="font-bold text-[#022434] block mb-0.5">Doctor's Clinical Advice:</span>
          <span>{plan.doctorNotes}</span>
        </div>
      )}
    </div>
  );
};
