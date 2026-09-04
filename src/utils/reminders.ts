import { MedicationReminder } from '../types';

export const INITIAL_REMINDERS: MedicationReminder[] = [
  {
    id: 'rem-1',
    prescriptionId: 'rx-2',
    drugName: 'Paracetamol',
    dosage: '500mg',
    time: '09:00 AM',
    frequency: '3 times daily',
    enabled: true,
    isDueNow: true,
    takenToday: false,
    doctorName: 'Dr. Sarah Lee',
  },
  {
    id: 'rem-2',
    prescriptionId: 'rx-1',
    drugName: 'Amoxicillin',
    dosage: '500mg',
    time: '08:00 AM',
    frequency: 'Twice daily',
    enabled: true,
    isDueNow: false,
    takenToday: true,
    lastTakenTime: '08:05 AM',
    doctorName: 'Dr. Sarah Lee',
  },
  {
    id: 'rem-3',
    prescriptionId: 'rx-2',
    drugName: 'Vitamin C Syrup',
    dosage: '10ml',
    time: '02:00 PM',
    frequency: 'Once daily',
    enabled: true,
    isDueNow: false,
    takenToday: false,
    doctorName: 'Dr. Sarah Lee',
  },
];

const LOCAL_STORAGE_KEY = 'prime_telecare_medication_reminders';

export function getStoredReminders(): MedicationReminder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_REMINDERS));
      return INITIAL_REMINDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_REMINDERS;
  }
}

export function saveStoredReminders(reminders: MedicationReminder[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reminders));
    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new Event('reminders-updated'));
  } catch (e) {
    console.error('Failed to save reminders', e);
  }
}
