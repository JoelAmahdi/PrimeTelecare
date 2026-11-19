import { triggerHaptic } from './haptics';
import { showPhoneNotification } from '../services/phoneNotifications';
import { playNotificationChime } from './audioTones';

export interface AppointmentAlert {
  id: string;
  appointmentId: string;
  doctorId?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  patientName: string;
  scheduledTime: string;
  scheduledDate: string;
  type: 'Video' | 'Voice' | 'Chat';
  startTimeTimestamp: number; // Unix timestamp in ms
  dismissed: boolean;
  snoozedUntil?: number;
  bookingMode?: 'instant' | 'scheduled';
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  price?: number;
  rescheduled?: boolean;
  rescheduleReason?: string;
  previousDate?: string;
  previousTime?: string;
}

export interface RescheduleNotice {
  id: string;
  appointmentId: string;
  doctorId?: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorAvatar?: string;
  consultationType: 'Video' | 'Voice' | 'Chat';
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  newTimestamp: number;
  reason?: string;
  rescheduledAt: number;
  acknowledged?: boolean;
}

const STORAGE_KEY = 'prime_telecare_appointment_alerts';
const RESCHEDULE_STORAGE_KEY = 'prime_telecare_reschedule_notices';

export function getRescheduleNotices(): RescheduleNotice[] {
  try {
    const raw = localStorage.getItem(RESCHEDULE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRescheduleNotice(notice: RescheduleNotice): void {
  try {
    const list = getRescheduleNotices().filter((n) => n.id !== notice.id && n.appointmentId !== notice.appointmentId);
    localStorage.setItem(RESCHEDULE_STORAGE_KEY, JSON.stringify([notice, ...list]));
    window.dispatchEvent(new CustomEvent('appointment-rescheduled', { detail: notice }));
    window.dispatchEvent(new Event('reschedule-notices-updated'));
  } catch {}
}

export function acknowledgeRescheduleNotice(id: string): void {
  try {
    const list = getRescheduleNotices().map((n) =>
      n.id === id || n.appointmentId === id ? { ...n, acknowledged: true } : n
    );
    localStorage.setItem(RESCHEDULE_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('reschedule-notices-updated'));
  } catch {}
}

export function getStoredAppointmentAlerts(): AppointmentAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: AppointmentAlert[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (e) {
    return [];
  }
}

export function saveAppointmentAlerts(alerts: AppointmentAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    window.dispatchEvent(new Event('appointment-alerts-updated'));
  } catch (e) {
    console.error('Failed to save appointment alerts', e);
  }
}

/**
 * Returns all active or booked upcoming consultations
 */
export function getActiveOrUpcomingConsultations(): AppointmentAlert[] {
  const alerts = getStoredAppointmentAlerts();
  return alerts.filter(
    (a) => !a.dismissed && a.status !== 'cancelled' && a.status !== 'completed'
  );
}

/**
 * Returns all concluded/completed consultations
 */
export function getCompletedConsultations(): AppointmentAlert[] {
  const alerts = getStoredAppointmentAlerts();
  return alerts.filter((a) => a.status === 'completed');
}

/**
 * Converts human readable scheduled date & slot to accurate Unix timestamp in ms
 */
export function parseScheduledTimeToTimestamp(dateStr?: string, timeStr?: string): number {
  const now = new Date();
  let targetDate = new Date();

  const lower = (dateStr || '').toLowerCase();
  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (!lower.includes('today')) {
    const cleaned = (dateStr || '').replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/i, '').trim();
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  const match = (timeStr || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 10;
  let minutes = 30;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }

  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate.getTime();
}

/**
 * Books a new consultation into the persistent appointments store
 */
export function bookNewConsultation(booking: {
  appointmentId?: string;
  doctorId?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  patientName?: string;
  scheduledTime: string;
  scheduledDate: string;
  type: 'Video' | 'Voice' | 'Chat';
  bookingMode?: 'instant' | 'scheduled';
  startTimeTimestamp?: number;
  price?: number;
}): AppointmentAlert {
  const alerts = getStoredAppointmentAlerts();
  const now = Date.now();

  let startTime = booking.startTimeTimestamp;
  if (!startTime) {
    if (booking.bookingMode === 'instant') {
      startTime = now + 2 * 60 * 1000; // instant starts in 2 minutes
    } else {
      startTime = parseScheduledTimeToTimestamp(booking.scheduledDate, booking.scheduledTime);
    }
  }

  const newAlert: AppointmentAlert = {
    id: `alert-${Date.now()}`,
    appointmentId: booking.appointmentId || `cns-${Date.now()}`,
    doctorId: booking.doctorId || 'doc-1',
    doctorName: booking.doctorName,
    doctorSpecialty: booking.doctorSpecialty,
    doctorAvatar: booking.doctorAvatar,
    patientName: booking.patientName || 'Patient',
    scheduledTime: booking.scheduledTime,
    scheduledDate: booking.scheduledDate,
    type: booking.type,
    bookingMode: booking.bookingMode || 'scheduled',
    startTimeTimestamp: startTime,
    dismissed: false,
    status: 'upcoming',
    price: booking.price || 10000,
  };

  const updated = [newAlert, ...alerts.filter((a) => !a.dismissed && a.status !== 'cancelled')];
  saveAppointmentAlerts(updated);
  return newAlert;
}

/**
 * Cancels a consultation and notifies subscribers
 */
export function cancelConsultation(id: string): void {
  const alerts = getStoredAppointmentAlerts();
  const updated = alerts.map((a) =>
    a.id === id || a.appointmentId === id ? { ...a, dismissed: true, status: 'cancelled' as const } : a
  );
  saveAppointmentAlerts(updated);
}

/**
 * Marks consultation as completed
 */
export function completeConsultation(id: string): void {
  const alerts = getStoredAppointmentAlerts();
  const updated = alerts.map((a) =>
    a.id === id || a.appointmentId === id ? { ...a, status: 'completed' as const } : a
  );
  saveAppointmentAlerts(updated);
}

/**
 * Reschedules an existing consultation to a new date and time and dispatches notification to patient
 */
export function rescheduleConsultation(
  id: string,
  newDate: string,
  newTime: string,
  reason?: string
): AppointmentAlert | null {
  const alerts = getStoredAppointmentAlerts();
  const index = alerts.findIndex((a) => a.id === id || a.appointmentId === id);

  const newTimestamp = parseScheduledTimeToTimestamp(newDate, newTime);

  if (index === -1) {
    // If not found in local alerts store, create and register notice
    const notice: RescheduleNotice = {
      id,
      appointmentId: id,
      patientName: 'Patient',
      doctorName: 'Attending Clinician',
      consultationType: 'Video',
      oldDate: 'Previous Date',
      oldTime: 'Previous Time',
      newDate,
      newTime,
      newTimestamp,
      reason: reason || 'Clinician schedule update',
      rescheduledAt: Date.now(),
      acknowledged: false,
    };
    saveRescheduleNotice(notice);
    return null;
  }

  const existing = alerts[index];
  const oldDate = existing.scheduledDate;
  const oldTime = existing.scheduledTime;

  const updatedAlert: AppointmentAlert = {
    ...existing,
    scheduledDate: newDate,
    scheduledTime: newTime,
    startTimeTimestamp: newTimestamp,
    status: 'upcoming',
    rescheduled: true,
    rescheduleReason: reason || 'Clinician schedule update',
    previousDate: oldDate,
    previousTime: oldTime,
  };

  alerts[index] = updatedAlert;
  saveAppointmentAlerts(alerts);

  // Create persistent notification for patient
  const noticePayload: RescheduleNotice = {
    id: existing.appointmentId || existing.id,
    appointmentId: existing.appointmentId || existing.id,
    doctorId: existing.doctorId,
    patientName: existing.patientName,
    doctorName: existing.doctorName,
    doctorSpecialty: existing.doctorSpecialty,
    doctorAvatar: existing.doctorAvatar,
    consultationType: existing.type,
    oldDate,
    oldTime,
    newDate,
    newTime,
    newTimestamp,
    reason: reason || 'Clinician schedule update',
    rescheduledAt: Date.now(),
    acknowledged: false,
  };
  saveRescheduleNotice(noticePayload);
  try {
    window.dispatchEvent(new CustomEvent('appointment-rescheduled', { detail: noticePayload }));
  } catch {}

  return updatedAlert;
}

/**
 * Clears all consultations (useful for testing zero-appointment state)
 */
export function clearAllConsultations(): void {
  saveAppointmentAlerts([]);
}

/**
 * Returns an active appointment alert that starts within 15 minutes (or in progress)
 */
export function getActive15MinAppointmentAlert(): AppointmentAlert | null {
  const alerts = getStoredAppointmentAlerts();
  const now = Date.now();

  for (const alert of alerts) {
    if (alert.dismissed) continue;
    if (alert.status === 'completed' || alert.status === 'cancelled') continue;
    if (alert.snoozedUntil && now < alert.snoozedUntil) continue;

    const diffMs = alert.startTimeTimestamp - now;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Active if starts in <= 15 mins AND is not older than 30 mins past start time
    if (diffMinutes <= 15 && diffMinutes >= -30) {
      return alert;
    }
  }

  return null;
}

export function dismissAppointmentAlert(id: string): void {
  const alerts = getStoredAppointmentAlerts();
  const updated = alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a));
  saveAppointmentAlerts(updated);
}

export function snoozeAppointmentAlert(id: string, snoozeMinutes: number = 5): void {
  const alerts = getStoredAppointmentAlerts();
  const snoozedUntil = Date.now() + snoozeMinutes * 60 * 1000;
  const updated = alerts.map((a) => (a.id === id ? { ...a, snoozedUntil } : a));
  saveAppointmentAlerts(updated);
}

export function resetDemoAppointment15Min(): void {
  const alerts = getStoredAppointmentAlerts();
  const now = Date.now();
  const newStartTime = now + 14 * 60 * 1000 + 45 * 1000; // 14 mins 45 secs from now
  const timeStr = new Date(newStartTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated: AppointmentAlert[] = [
    {
      id: 'alert-default-15m',
      appointmentId: 'app-1',
      doctorId: '',
      doctorName: 'Doctor',
      doctorSpecialty: 'General Practice',
      doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      patientName: 'Patient',
      scheduledTime: timeStr,
      scheduledDate: 'Today',
      type: 'Video',
      startTimeTimestamp: newStartTime,
      dismissed: false,
      snoozedUntil: undefined,
    },
    ...alerts.filter((a) => a.id !== 'alert-default-15m'),
  ];

  saveAppointmentAlerts(updated);
}

/**
 * Triggers a native system browser notification with sound and mobile vibration
 */
export function requestAndTriggerWebNotification(title: string, body: string): void {
  playNotificationChime();
  showPhoneNotification({
    title,
    body,
    type: 'appointment',
    icon: '/icon.svg',
    vibrate: [200, 100, 200, 100, 300],
  }).catch(() => {});
}
