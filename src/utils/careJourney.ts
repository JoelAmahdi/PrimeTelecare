import { CareJourneyItem, CareJourneyPlan } from '../types';

export const DEFAULT_CARE_JOURNEY_ITEMS: CareJourneyItem[] = [
  {
    id: 'item-rx',
    title: 'Adhere strictly to prescribed medications',
    description: 'Take medications at scheduled intervals with meals as indicated in your digital prescription.',
    category: 'medication',
    checkedByDoctor: true,
    completedByPatient: false,
  },
  {
    id: 'item-vitals',
    title: 'Monitor daily morning & evening vitals',
    description: 'Check and record body temperature and resting pulse rate twice daily to track recovery.',
    category: 'vitals',
    checkedByDoctor: true,
    completedByPatient: false,
  },
  {
    id: 'item-fluids',
    title: 'Hydration & restorative rest protocol',
    description: 'Drink at least 2.5 litres of clean fluids daily. Avoid heavy physical exertion.',
    category: 'lifestyle',
    checkedByDoctor: true,
    completedByPatient: false,
  },
  {
    id: 'item-lab',
    title: 'Complete recommended laboratory diagnostic check',
    description: 'Upload pathology or diagnostic lab report for your attending physician to evaluate.',
    category: 'diagnostic',
    checkedByDoctor: false,
    completedByPatient: false,
  },
  {
    id: 'item-followup',
    title: 'Attend 3-day recovery follow-up consultation',
    description: 'Meet with your doctor to review symptom resolution and finalize clinical discharge.',
    category: 'followup',
    checkedByDoctor: true,
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

export function createInitialCareJourneyDraft(patientName = 'Patient', doctorName = 'Attending Physician'): CareJourneyPlan {
  return {
    id: `cjp-${Date.now()}`,
    patientId: 'pat-1',
    patientName,
    doctorId: 'doc-1',
    doctorName,
    status: 'draft_pending_doctor',
    items: DEFAULT_CARE_JOURNEY_ITEMS.map((item) => ({ ...item })),
    doctorNotes: '',
  };
}
