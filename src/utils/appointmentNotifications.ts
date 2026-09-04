import { triggerHaptic } from './haptics';

export interface AppointmentAlert {
  id: string;
  appointmentId: string;
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
}

const STORAGE_KEY = 'prime_telecare_appointment_alerts';

/**
 * Creates a default upcoming appointment alert set to 12 minutes from current time
 * so the 15-minute notification banner triggers automatically on load.
 */
function createDefaultAlert(): AppointmentAlert {
  const now = Date.now();
  // Set default appointment to start in 12 minutes
  const startTime = now + 12 * 60 * 1000;
  
  const timeStr = new Date(startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: 'alert-default-15m',
    appointmentId: 'app-1',
    doctorName: 'Dr. Anya Sharma',
    doctorSpecialty: 'General Practitioner',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    patientName: 'Ada Okonkwo',
    scheduledTime: timeStr,
    scheduledDate: 'Today',
    type: 'Video',
    startTimeTimestamp: startTime,
    dismissed: false,
  };
}

export function getStoredAppointmentAlerts(): AppointmentAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = [createDefaultAlert()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: AppointmentAlert[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = [createDefaultAlert()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch (e) {
    return [createDefaultAlert()];
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
 * Returns an active appointment alert that starts within 15 minutes (or in progress)
 */
export function getActive15MinAppointmentAlert(): AppointmentAlert | null {
  const alerts = getStoredAppointmentAlerts();
  const now = Date.now();

  for (const alert of alerts) {
    if (alert.dismissed) continue;
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
      doctorName: 'Dr. Anya Sharma',
      doctorSpecialty: 'General Practitioner',
      doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      patientName: 'Ada Okonkwo',
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
 * Triggers a native system browser notification if allowed
 */
export function requestAndTriggerWebNotification(title: string, body: string): void {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        }
      });
    }
  }
}
