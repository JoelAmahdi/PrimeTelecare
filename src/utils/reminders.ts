import { MedicationReminder, DrugPurchaseNotification } from '../types';

export const INITIAL_REMINDERS: MedicationReminder[] = [];

const LOCAL_STORAGE_KEY = 'prime_telecare_medication_reminders_v2';
const DRUG_PURCHASE_STORAGE_KEY = 'prime_telecare_drug_purchase_notifications_v1';

export function getStoredReminders(): MedicationReminder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredReminders(reminders: MedicationReminder[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reminders));
    window.dispatchEvent(new Event('reminders-updated'));
  } catch (e) {
    console.error('Failed to save reminders', e);
  }
}

export function deleteStoredReminder(id: string): MedicationReminder[] {
  const updated = getStoredReminders().filter((r) => r.id !== id);
  saveStoredReminders(updated);
  return updated;
}

export function getStoredDrugPurchaseNotifications(): DrugPurchaseNotification[] {
  try {
    const raw = localStorage.getItem(DRUG_PURCHASE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDrugPurchaseNotifications(list: DrugPurchaseNotification[]): void {
  try {
    localStorage.setItem(DRUG_PURCHASE_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('drug-purchase-notifications-updated'));
  } catch (e) {
    console.error('Failed to save drug purchase notifications', e);
  }
}

export function upsertDrugPurchaseNotification(
  notification: DrugPurchaseNotification
): DrugPurchaseNotification[] {
  const current = getStoredDrugPurchaseNotifications();
  const idx = current.findIndex((n) => n.id === notification.id);
  const updated =
    idx >= 0
      ? current.map((n, i) => (i === idx ? notification : n))
      : [notification, ...current];
  saveDrugPurchaseNotifications(updated);
  return updated;
}

export function deleteDrugPurchaseNotification(id: string): DrugPurchaseNotification[] {
  const updated = getStoredDrugPurchaseNotifications().filter((n) => n.id !== id);
  saveDrugPurchaseNotifications(updated);
  return updated;
}

export function buildDefaultTimesForFrequency(frequency: string): string[] {
  const f = (frequency || '').toLowerCase();
  if (f.includes('every 6') || f.includes('4 times') || f.includes('qds') || f.includes('qid')) {
    return ['06:00 AM', '12:00 PM', '06:00 PM', '11:00 PM'];
  }
  if (f.includes('every 8') || f.includes('3 times') || f.includes('tds') || f.includes('tid') || f.includes('thrice')) {
    return ['08:00 AM', '02:00 PM', '08:00 PM'];
  }
  if (f.includes('twice') || f.includes('2 times') || f.includes('12-hour') || f.includes('bd') || f.includes('bid')) {
    return ['08:00 AM', '08:00 PM'];
  }
  if (f.includes('bedtime') || f.includes('night') || f.includes('nocte')) {
    return ['09:00 PM'];
  }
  return ['08:00 AM'];
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {
      // Ignore browser notification runtime issues on restricted mobile webviews
    }
  }
}
