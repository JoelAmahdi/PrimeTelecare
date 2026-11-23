import { CareJourneyItem, CareJourneyPlan } from '../types';

export const DEFAULT_CARE_JOURNEY_ITEMS: CareJourneyItem[] = [
  {
    id: 'item-lab',
    title: 'Request or Reviewed Lab Results',
    category: 'diagnostic',
    checkedByDoctor: false,
    completedByPatient: false,
  },
  {
    id: 'item-followup',
    title: 'Follow-Up Visit Set Up Check',
    category: 'followup',
    checkedByDoctor: false,
    completedByPatient: false,
  },
];

const STORAGE_KEY = 'prime_telecare_care_journey_plan';

export function getStoredCareJourneyPlan(patientId?: string): CareJourneyPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const plan = JSON.parse(raw) as CareJourneyPlan;
    if (patientId && plan.patientId && plan.patientId !== patientId && plan.patientId !== 'pat-1') {
      // Return plan if matching or default
      return plan;
    }
    return plan;
  } catch {
    return null;
  }
}

export function saveStoredCareJourneyPlan(plan: CareJourneyPlan): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    window.dispatchEvent(new CustomEvent('care-journey-updated', { detail: plan }));
    try {
      const channel = new BroadcastChannel('prime_care_journey_channel');
      channel.postMessage(plan);
      channel.close();
    } catch {}
  } catch (e) {
    console.warn('Could not save care journey plan to storage:', e);
  }
}

export function toggleStoredCareJourneyTask(itemId: string): CareJourneyPlan | null {
  const currentPlan = getStoredCareJourneyPlan();
  if (!currentPlan) return null;

  const updatedItems = currentPlan.items.map((item) => {
    if (item.id === itemId) {
      return { ...item, completedByPatient: !item.completedByPatient };
    }
    return item;
  });

  const updatedPlan: CareJourneyPlan = {
    ...currentPlan,
    items: updatedItems,
  };

  saveStoredCareJourneyPlan(updatedPlan);
  return updatedPlan;
}

export function createInitialCareJourneyDraft(patientName = 'Patient', doctorName = ''): CareJourneyPlan {
  return {
    id: `cjp-${Date.now()}`,
    patientId: 'pat-1',
    patientName,
    doctorId: 'doc-1',
    doctorName,
    status: 'draft_pending_doctor',
    items: DEFAULT_CARE_JOURNEY_ITEMS.map((item) => ({ ...item, checkedByDoctor: false })),
    drugPrescriptionChecked: false,
    labInvestigationChecked: false,
    labInvestigationDetails: '',
    followUpVisitChecked: false,
    followUpDate: '',
    followUpPlanNote: '',
    doctorNotes: '',
  };
}
