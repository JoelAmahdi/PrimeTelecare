import { Prescription, Medication } from '../types';
import { mockPrescriptions } from '../data/mockData';
import { primeApi } from '../services/apiClient';

const STORAGE_KEY = 'prime_telecare_prescriptions_store_v1';

// Seed initial prescriptions with additional clinical examples if none stored
const INITIAL_PRESETS: Prescription[] = [
  ...mockPrescriptions,
  {
    id: 'rx-3',
    referenceNo: 'RX-884190',
    date: 'October 18, 2026',
    patientName: 'Ngozi Adebayo',
    patientDob: 'January 14, 1991',
    patientId: 'PAT-7729104',
    patientAgeGender: '35 Yrs • Female',
    patientAllergies: ['None known'],
    doctorName: 'Dr. Sarah Lee, MD',
    doctorLicense: 'MDCN/2019/98765',
    doctorSpecialty: 'Consultant Family Physician',
    doctorClinic: 'Prime Telecare Specialist Clinic',
    doctorSignature: 'Dr. Sarah Lee, MD',
    authSealToken: 'MDCN-SEAL-VERIFIED-98765-20261018-AUTH-1109',
    authVerificationDate: 'Oct 18, 2026 11:30 AM',
    status: 'active',
    isVerified: true,
    chiefComplaint: 'Acute Gastric Acid Reflux & Dyspepsia',
    consultationId: 'CNS-2026-9042',
    consultationType: 'Video',
    consultationDate: 'October 18, 2026',
    consultationTime: '11:00 AM - 11:25 AM',
    consultationDuration: '25 mins',
    diagnosis: 'Gastroesophageal Reflux Disease (GERD)',
    medications: [
      {
        id: 'm-301',
        drugName: 'Omeprazole Delayed-Release Capsules',
        strength: '20 mg',
        dosage: '1 capsule',
        frequency: 'Once daily (30 mins before breakfast)',
        duration: '14 days',
        instructions: 'Swallow whole with a full glass of water. Do not crush.',
      },
      {
        id: 'm-302',
        drugName: 'Gaviscon Advance Suspension',
        strength: '200ml',
        dosage: '10 ml',
        frequency: 'After meals & bedtime',
        duration: '7 days',
        instructions: 'Shake well before taking. Take for breakthrough burning.',
      },
    ],
    doctorNotes: 'Avoid late meals, caffeine, and spicy triggers. Elevate head of bed.',
  },
  {
    id: 'rx-4',
    referenceNo: 'RX-661204',
    date: 'October 05, 2026',
    patientName: 'Tunde Bakare',
    patientDob: 'March 22, 1988',
    patientId: 'PAT-5510294',
    patientAgeGender: '38 Yrs • Male',
    patientAllergies: ['Aspirin'],
    doctorName: 'Dr. Sarah Lee, MD',
    doctorLicense: 'MDCN/2019/98765',
    doctorSpecialty: 'Consultant Family Physician',
    doctorClinic: 'Prime Telecare Specialist Clinic',
    doctorSignature: 'Dr. Sarah Lee, MD',
    authSealToken: 'MDCN-SEAL-VERIFIED-98765-20261005-AUTH-5521',
    authVerificationDate: 'Oct 05, 2026 09:40 AM',
    status: 'expired',
    isVerified: true,
    chiefComplaint: 'Acute Bacterial Sinusitis',
    consultationId: 'CNS-2026-7781',
    consultationType: 'Chat',
    consultationDate: 'October 05, 2026',
    consultationTime: '09:15 AM',
    consultationDuration: '15 mins',
    diagnosis: 'Acute Maxillary Sinusitis',
    medications: [
      {
        id: 'm-401',
        drugName: 'Cefuroxime Axetil',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'Twice daily (after food)',
        duration: '7 days',
        instructions: 'Complete full antibiotic course.',
      },
      {
        id: 'm-402',
        drugName: 'Normal Saline Nasal Spray',
        strength: '0.9%',
        dosage: '2 sprays per nostril',
        frequency: 'Three times daily',
        duration: '10 days',
        instructions: 'Rinse nasal passages gently.',
      },
    ],
    doctorNotes: 'Patient completed follow up. Symptoms fully resolved.',
  },
];

export function getStoredPrescriptions(): Prescription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESETS));
      return INITIAL_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_PRESETS;
  } catch (err) {
    console.error('Error reading prescriptions from storage:', err);
    return INITIAL_PRESETS;
  }
}

export function savePrescriptions(list: Prescription[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('prescriptions-updated', { detail: list }));
  } catch (err) {
    console.error('Error saving prescriptions:', err);
  }
}

export function addPrescription(
  newRx: Omit<Prescription, 'id'> & { id?: string }
): Prescription {
  const current = getStoredPrescriptions();
  const id = newRx.id || `rx-${Date.now()}`;
  const created: Prescription = {
    ...newRx,
    id,
    isVerified: true,
  };
  const updated = [created, ...current];
  savePrescriptions(updated);
  primeApi.createPrescription(created).catch(() => {});
  return created;
}

export function updatePrescription(
  id: string,
  changes: Partial<Prescription>
): Prescription | null {
  const current = getStoredPrescriptions();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const updatedItem: Prescription = {
    ...existing,
    ...changes,
    id: existing.id, // preserve id
  };

  current[index] = updatedItem;
  savePrescriptions([...current]);
  return updatedItem;
}

export function deletePrescription(id: string): boolean {
  const current = getStoredPrescriptions();
  const filtered = current.filter((p) => p.id !== id);
  if (filtered.length !== current.length) {
    savePrescriptions(filtered);
    return true;
  }
  return false;
}
