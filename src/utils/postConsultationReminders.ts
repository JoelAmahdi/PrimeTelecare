import { triggerHaptic } from './haptics';

export interface PostConsultationReminder {
  id: string;
  consultationId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  patientName: string;
  chiefComplaint: string;
  prescribedPlan: {
    id: string;
    label: string;
    category: 'medication' | 'lifestyle' | 'vitals';
    followed: boolean;
  }[];
  completedAtTimestamp: number; // Unix timestamp in ms when consultation ended
  dueAtTimestamp: number; // completedAtTimestamp + 24 hours
  status: 'pending' | 'triggered' | 'confirmed' | 'snoozed' | 'dismissed';
  snoozedUntil?: number;
  patientFeedback?: {
    recoveryState: 'Fully Recovered' | 'Improving' | 'No Change' | 'Worse';
    planFollowed: boolean;
    itemsFollowed: string[];
    symptomNotes?: string;
    submittedAt: string;
  };
}

const STORAGE_KEY = 'prime_telecare_post_consultation_reminders';

/**
 * Helper to create a default 24-hour follow-up reminder.
 * By default, set `completedAtTimestamp` to 23.95 hours ago so it triggers on load!
 */
export function createDefaultRecoveryReminder(): PostConsultationReminder {
  const now = Date.now();
  // 24 hours ago minus 2 minutes = due 2 minutes ago (triggers immediately)
  const completedAt = now - 24 * 60 * 60 * 1000 + 2 * 60 * 1000;
  const dueAt = completedAt + 24 * 60 * 60 * 1000;

  return {
    id: 'rem-24h-default',
    consultationId: 'c-pediatric-101',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialty: 'Pediatric Specialist',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    patientName: 'Ada Okonkwo',
    chiefComplaint: 'Acute High Fever (38.8°C) & Pediatric Cough',
    prescribedPlan: [
      {
        id: 'p-1',
        label: 'Take Paracetamol Syrup 5ml every 8 hours for fever',
        category: 'medication',
        followed: true,
      },
      {
        id: 'p-2',
        label: 'Administer Amoxicillin 250mg Suspension twice daily',
        category: 'medication',
        followed: true,
      },
      {
        id: 'p-3',
        label: 'Maintain oral rehydration fluids (at least 1.5L daily)',
        category: 'lifestyle',
        followed: true,
      },
      {
        id: 'p-4',
        label: 'Record body temperature every 6 hours',
        category: 'vitals',
        followed: false,
      },
    ],
    completedAtTimestamp: completedAt,
    dueAtTimestamp: dueAt,
    status: 'triggered',
  };
}

export function getStoredPostConsultationReminders(): PostConsultationReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: PostConsultationReminder[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (e) {
    return [];
  }
}

export function savePostConsultationReminders(reminders: PostConsultationReminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    window.dispatchEvent(new Event('post-consultation-reminders-updated'));
  } catch (e) {
    console.error('Failed to save post-consultation reminders', e);
  }
}

/**
 * Returns an active 24-hour recovery check-in reminder that is due
 */
export function getActive24HourRecoveryReminder(): PostConsultationReminder | null {
  const reminders = getStoredPostConsultationReminders();
  const now = Date.now();

  for (const item of reminders) {
    if (item.status === 'confirmed' || item.status === 'dismissed') continue;
    if (item.status === 'snoozed' && item.snoozedUntil && now < item.snoozedUntil) continue;

    // Due if current time >= dueAtTimestamp
    if (now >= item.dueAtTimestamp) {
      return item;
    }
  }

  return null;
}

/**
 * Submit Recovery Check-in Feedback
 */
export function submitRecoveryFeedback(
  id: string,
  feedback: PostConsultationReminder['patientFeedback']
): void {
  triggerHaptic('success');
  const reminders = getStoredPostConsultationReminders();
  const updated = reminders.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        status: 'confirmed' as const,
        patientFeedback: feedback,
      };
    }
    return r;
  });
  savePostConsultationReminders(updated);
}

/**
 * Snooze recovery reminder for X minutes (default 60 mins)
 */
export function snoozeRecoveryReminder(id: string, minutes = 60): void {
  triggerHaptic('medium');
  const reminders = getStoredPostConsultationReminders();
  const now = Date.now();
  const updated = reminders.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        status: 'snoozed' as const,
        snoozedUntil: now + minutes * 60 * 1000,
      };
    }
    return r;
  });
  savePostConsultationReminders(updated);
}

/**
 * Dismiss recovery reminder
 */
export function dismissRecoveryReminder(id: string): void {
  triggerHaptic('light');
  const reminders = getStoredPostConsultationReminders();
  const updated = reminders.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        status: 'dismissed' as const,
      };
    }
    return r;
  });
  savePostConsultationReminders(updated);
}

/**
 * Trigger immediate test 24-hour recovery notification
 */
export function resetDemo24HourRecoveryReminder(): PostConsultationReminder {
  triggerHaptic('heavy');
  const newReminder = createDefaultRecoveryReminder();
  // Ensure dueAtTimestamp is right now
  newReminder.dueAtTimestamp = Date.now() - 1000;
  newReminder.status = 'triggered';
  newReminder.id = `rem-24h-${Date.now()}`;

  const existing = getStoredPostConsultationReminders();
  const filtered = existing.filter((r) => r.id !== newReminder.id);
  savePostConsultationReminders([newReminder, ...filtered]);
  return newReminder;
}
