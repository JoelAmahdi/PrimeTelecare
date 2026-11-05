import { triggerHaptic } from './haptics';

export interface SlotAlert {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  dateFormatted: string; // e.g. "Wed, Oct 22"
  timeSlot: string; // e.g. "10:30 AM" or "Any Open Slot"
  consultType: 'Video' | 'Voice' | 'Chat';
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: number;
  triggeredAt?: number;
}

const STORAGE_KEY = 'prime_telecare_slot_alerts';

/**
 * Default mock alert for demo purposes
 */
export function getDefaultSlotAlert(): SlotAlert {
  return {
    id: 'slot-alert-demo-1',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialty: 'Pediatric Specialist',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    dateFormatted: 'Wed, Oct 22',
    timeSlot: '10:30 AM',
    consultType: 'Video',
    status: 'active',
    createdAt: Date.now() - 3600000,
  };
}

export function getStoredSlotAlerts(): SlotAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = [getDefaultSlotAlert()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: SlotAlert[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const initial = [getDefaultSlotAlert()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch (e) {
    return [getDefaultSlotAlert()];
  }
}

export function saveSlotAlerts(alerts: SlotAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    window.dispatchEvent(new Event('slot-alerts-updated'));
  } catch (e) {
    console.error('Failed to save slot alerts', e);
  }
}

export function addSlotAlert(data: {
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  dateFormatted: string;
  timeSlot: string;
  consultType?: 'Video' | 'Voice' | 'Chat';
}): SlotAlert {
  triggerHaptic('success');
  const existing = getStoredSlotAlerts();
  
  // Check if identical active alert already exists
  const duplicate = existing.find(
    (a) =>
      a.doctorId === data.doctorId &&
      a.dateFormatted === data.dateFormatted &&
      a.timeSlot === data.timeSlot &&
      a.status === 'active'
  );

  if (duplicate) return duplicate;

  const newAlert: SlotAlert = {
    id: `alert-${Date.now()}`,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    doctorSpecialty: data.doctorSpecialty,
    doctorAvatar: data.doctorAvatar,
    dateFormatted: data.dateFormatted,
    timeSlot: data.timeSlot,
    consultType: data.consultType || 'Video',
    status: 'active',
    createdAt: Date.now(),
  };

  saveSlotAlerts([newAlert, ...existing]);
  return newAlert;
}

export function removeSlotAlert(id: string): void {
  triggerHaptic('light');
  const existing = getStoredSlotAlerts();
  const updated = existing.filter((a) => a.id !== id);
  saveSlotAlerts(updated);
}

export function hasSlotAlert(doctorId: string, dateFormatted: string, timeSlot?: string): boolean {
  const existing = getStoredSlotAlerts();
  return existing.some(
    (a) =>
      a.doctorId === doctorId &&
      a.dateFormatted === dateFormatted &&
      (timeSlot ? a.timeSlot === timeSlot : true) &&
      a.status === 'active'
  );
}

export function getActiveTriggeredSlotAlert(): SlotAlert | null {
  const alerts = getStoredSlotAlerts();
  const triggered = alerts.find((a) => a.status === 'triggered');
  return triggered || null;
}

/**
 * Simulate a doctor schedule change where a slot opens up
 */
export function triggerSlotOpeningDemo(alertId?: string): SlotAlert {
  triggerHaptic('heavy');
  const alerts = getStoredSlotAlerts();

  let targetAlert = alertId ? alerts.find((a) => a.id === alertId) : alerts[0];

  if (!targetAlert) {
    targetAlert = getDefaultSlotAlert();
  }

  const updatedTarget: SlotAlert = {
    ...targetAlert,
    status: 'triggered',
    triggeredAt: Date.now(),
  };

  const updatedAlerts = alerts.map((a) => (a.id === updatedTarget.id ? updatedTarget : a));
  if (!alerts.some((a) => a.id === updatedTarget.id)) {
    updatedAlerts.unshift(updatedTarget);
  }

  saveSlotAlerts(updatedAlerts);
  return updatedTarget;
}

/**
 * Dismiss a triggered slot alert
 */
export function dismissTriggeredSlotAlert(id: string): void {
  triggerHaptic('light');
  const alerts = getStoredSlotAlerts();
  const updated = alerts.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a));
  saveSlotAlerts(updated);
}
