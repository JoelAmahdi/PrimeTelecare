import { Prescription, Medication } from '../types';
import { primeApi } from '../services/apiClient';

const STORAGE_KEY = 'prime_telecare_prescriptions_store_v1';

export function getStoredPrescriptions(): Prescription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error reading prescriptions from storage:', err);
    return [];
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
