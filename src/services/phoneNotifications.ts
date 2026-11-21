/**
 * Prime Telecare - Phone & Native Device Push Notification Service
 * Coordinates system notifications, Service Worker actions, mobile device vibration patterns,
 * and zero-dependency synthesized audio ringtones & chimes across Android Chrome, iOS PWA, and desktop.
 */

import { getServiceWorkerRegistration } from '../serviceWorkerRegistration';
import {
  playRingingTone,
  playMessageChime,
  playNotificationChime,
  playPrescriptionChime,
  ensureAudioContext,
} from '../utils/audioTones';

export type PhoneNotificationType =
  | 'call'
  | 'text'
  | 'appointment'
  | 'reschedule'
  | 'prescription'
  | 'medication'
  | 'delivery'
  | 'system';

export interface PhoneNotificationSettings {
  enabled: boolean;
  callsEnabled: boolean;
  textsEnabled: boolean;
  appointmentsEnabled: boolean;
  prescriptionsEnabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

export interface ShowPhoneNotificationOptions {
  title: string;
  body: string;
  type?: PhoneNotificationType;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  silent?: boolean;
  vibrate?: number[];
  playSound?: boolean;
}

const SETTINGS_KEY = 'prime_telecare_phone_notifications_settings_v1';

const DEFAULT_SETTINGS: PhoneNotificationSettings = {
  enabled: true,
  callsEnabled: true,
  textsEnabled: true,
  appointmentsEnabled: true,
  prescriptionsEnabled: true,
  soundEnabled: true,
  vibrateEnabled: true,
};

// Global active call alert state (allows silencing immediately on answer/decline)
let activeCallRingtoneStop: (() => void) | null = null;
let activeCallVibrateInterval: any = null;

/**
 * Reads user notification preferences from local storage
 */
export function getPhoneNotificationSettings(): PhoneNotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Updates user notification preferences
 */
export function updatePhoneNotificationSettings(
  partial: Partial<PhoneNotificationSettings>
): PhoneNotificationSettings {
  const current = getPhoneNotificationSettings();
  const updated = { ...current, ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('phone-notifications-settings-updated', { detail: updated }));
  } catch {}
  return updated;
}

/**
 * Checks if the browser / mobile environment supports native notifications
 */
export function isPhoneNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Checks current browser permission state
 */
export function getPhoneNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPhoneNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests native system notification permission from user
 */
export async function requestPhoneNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPhoneNotificationSupported()) return 'unsupported';

  // Unlock audio context on user click
  ensureAudioContext();

  try {
    const permission = await Notification.requestPermission();
    window.dispatchEvent(new CustomEvent('phone-notification-permission-changed', { detail: permission }));
    return permission;
  } catch {
    return Notification.permission;
  }
}

/**
 * Triggers mobile device vibration pattern safely
 */
export function triggerPhoneVibration(pattern: number | number[]): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.vibrateEnabled) return;

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

/**
 * Halts any ongoing phone vibration
 */
export function stopPhoneVibration(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {}
  }
}

/**
 * Displays a native phone / system notification
 */
export async function showPhoneNotification(options: ShowPhoneNotificationOptions): Promise<boolean> {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled) return false;

  const {
    title,
    body,
    icon = '/icon.svg',
    badge = '/icon.svg',
    tag = `prime-${Date.now()}`,
    data = {},
    requireInteraction = false,
    actions = [],
    silent = false,
    vibrate = [200, 100, 200],
  } = options;

  // Trigger vibration if allowed
  if (settings.vibrateEnabled && vibrate && vibrate.length > 0) {
    triggerPhoneVibration(vibrate);
  }

  if (!isPhoneNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  // 1. Prefer Service Worker Registration (Required on Mobile Android Chrome & iOS PWA for background notifications)
  try {
    const swReg = await getServiceWorkerRegistration();
    if (swReg && 'showNotification' in swReg) {
      await swReg.showNotification(title, {
        body,
        icon,
        badge,
        tag,
        data,
        requireInteraction,
        actions: actions as any,
        silent,
        vibrate: settings.vibrateEnabled ? vibrate : undefined,
      } as any);
      return true;
    }
  } catch (err) {
    console.warn('[PhoneNotifications] Service Worker showNotification failed, falling back to window Notification', err);
  }

  // 2. Fallback to standard window Notification
  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge,
      tag,
      data,
      requireInteraction,
      silent,
    } as any);

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      notification.close();
      window.dispatchEvent(
        new CustomEvent('phone-notification-clicked', {
          detail: { action: 'default', payload: data, tag },
        })
      );
    };

    return true;
  } catch (err) {
    console.warn('[PhoneNotifications] Window Notification construction failed:', err);
    return false;
  }
}

// =========================================================================
// HIGH-LEVEL SPECIALIZED TELEHEALTH PHONE NOTIFIERS
// =========================================================================

/**
 * Starts continuous phone vibration for incoming ringing calls
 */
function startIncomingCallVibrationLoop(): void {
  stopCallVibrationLoop();
  const pattern = [500, 250, 500, 250, 500, 250, 1000];
  triggerPhoneVibration(pattern);
  activeCallVibrateInterval = setInterval(() => {
    triggerPhoneVibration(pattern);
  }, 3000);
}

function stopCallVibrationLoop(): void {
  if (activeCallVibrateInterval) {
    clearInterval(activeCallVibrateInterval);
    activeCallVibrateInterval = null;
  }
  stopPhoneVibration();
}

/**
 * Immediately silences all incoming call sounds and vibration alerts
 */
export function stopCallAlerts(): void {
  if (activeCallRingtoneStop) {
    activeCallRingtoneStop();
    activeCallRingtoneStop = null;
  }
  stopCallVibrationLoop();

  // Close any active call system notifications
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    getServiceWorkerRegistration().then((reg) => {
      if (reg && 'getNotifications' in reg) {
        reg.getNotifications({ tag: 'incoming-telehealth-call' }).then((notifs) => {
          notifs.forEach((n) => n.close());
        });
      }
    }).catch(() => {});
  }
}

/**
 * 1. INCOMING TELEHEALTH CALL NOTIFICATION (AUDIO / VIDEO)
 * Rings device, pulses continuous vibration, and displays system notification with Answer / Decline actions.
 */
export function notifyIncomingCall(opts: {
  callId: string;
  callerName: string;
  callerAvatar?: string;
  modality: 'Video' | 'Voice' | 'Chat';
  role?: 'doctor' | 'patient' | 'admin' | string;
  consultationId?: string;
}): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled || !settings.callsEnabled) return;

  const { callId, callerName, callerAvatar, modality, role } = opts;
  const isVoice = modality === 'Voice';
  const isChat = modality === 'Chat';

  // 1. Play Synthesized Acoustic Ringtone or Invitation Chime
  if (settings.soundEnabled) {
    if (activeCallRingtoneStop) {
      activeCallRingtoneStop();
      activeCallRingtoneStop = null;
    }
    if (isChat) {
      playMessageChime();
    } else {
      activeCallRingtoneStop = playRingingTone();
    }
  }

  // 2. Continuous Telephone Vibration (calls only) or gentle pulse (text invitation)
  if (settings.vibrateEnabled) {
    if (isChat) {
      triggerPhoneVibration([150, 75, 150]);
    } else {
      startIncomingCallVibrationLoop();
    }
  }

  // 3. System Push / Native Phone Notification
  const title = isVoice
    ? `📞 Incoming Audio Call: ${callerName}`
    : isChat
    ? `💬 Consultation Invitation: ${callerName}`
    : `📹 Incoming Video Call: ${callerName}`;

  const body = isChat
    ? role === 'doctor'
      ? `Patient ${callerName} is inviting you to a live text consultation. Tap to accept.`
      : `Dr. ${callerName} is ready for your text consultation. Tap to enter chat.`
    : role === 'doctor'
    ? `Patient ${callerName} is waiting in the encrypted telehealth room. Tap to answer.`
    : `Dr. ${callerName} is calling for your scheduled consultation. Tap to answer.`;

  showPhoneNotification({
    title,
    body,
    type: isChat ? 'text' : 'call',
    icon: callerAvatar || '/icon.svg',
    badge: '/icon.svg',
    tag: 'incoming-telehealth-call',
    requireInteraction: true,
    vibrate: isChat ? [150, 75, 150] : [500, 250, 500, 250, 500, 250, 1000],
    data: {
      url: isChat ? '/#active-chat' : '/#video-call',
      screen: isChat ? 'active-chat' : 'video-call',
      callId,
      modality,
    },
    actions: [
      { action: 'answer', title: isChat ? '💬 Accept & Chat' : '📞 Answer Call' },
      { action: 'decline', title: '✕ Decline' },
    ],
  });
}

/**
 * 2. INCOMING TEXT / CHAT MESSAGE NOTIFICATION
 * Plays a clean message chime, vibrates phone [120, 60, 120], and shows message notification.
 */
export function notifyIncomingMessage(opts: {
  senderName: string;
  messageText: string;
  chatId: string;
  senderAvatar?: string;
}): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled || !settings.textsEnabled) return;

  const { senderName, messageText, chatId, senderAvatar } = opts;

  // 1. Message Sound Chime
  if (settings.soundEnabled) {
    playMessageChime();
  }

  // 2. Native System Notification with Vibration
  showPhoneNotification({
    title: `💬 ${senderName}`,
    body: messageText || 'Sent you a secure message',
    type: 'text',
    icon: senderAvatar || '/icon.svg',
    badge: '/icon.svg',
    tag: `chat-msg-${chatId}-${Date.now()}`,
    vibrate: [120, 60, 120],
    data: {
      url: '/#active-chat',
      screen: 'active-chat',
      chatId,
    },
    actions: [{ action: 'open_chat', title: '💬 Open Chat' }],
  });
}

/**
 * 3. APPOINTMENT REMINDER NOTIFICATION
 * Alerts patient/doctor 15 mins before a session.
 */
export function notifyAppointmentReminder(opts: {
  doctorName: string;
  timeSlot: string;
  dateStr?: string;
  consultationType?: string;
  appointmentId?: string;
}): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled || !settings.appointmentsEnabled) return;

  const { doctorName, timeSlot, consultationType = 'Telehealth', appointmentId } = opts;

  if (settings.soundEnabled) {
    playNotificationChime();
  }

  showPhoneNotification({
    title: `🗓️ Consultation Starting Soon: ${doctorName}`,
    body: `Your ${consultationType} consultation is scheduled for ${timeSlot}. Tap to prepare.`,
    type: 'appointment',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `apt-remind-${appointmentId || Date.now()}`,
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: '/#patient-dashboard',
      screen: 'patient-dashboard',
      appointmentId,
    },
    actions: [{ action: 'view_appointment', title: '🩺 View Session' }],
  });
}

/**
 * 4. APPOINTMENT RESCHEDULED NOTIFICATION
 */
export function notifyAppointmentRescheduled(opts: {
  doctorName: string;
  newDate: string;
  newTime: string;
  reason?: string;
  appointmentId?: string;
}): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled || !settings.appointmentsEnabled) return;

  const { doctorName, newDate, newTime, reason, appointmentId } = opts;

  if (settings.soundEnabled) {
    playNotificationChime();
  }

  showPhoneNotification({
    title: `⚠️ Appointment Rescheduled: ${doctorName}`,
    body: `Your consultation has been rescheduled to ${newDate} at ${newTime}. ${reason ? `Reason: ${reason}` : ''}`,
    type: 'reschedule',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `apt-resched-${appointmentId || Date.now()}`,
    vibrate: [250, 100, 250, 100, 350],
    data: {
      url: '/#patient-dashboard',
      screen: 'patient-dashboard',
      appointmentId,
    },
    actions: [{ action: 'view_reschedule', title: '📅 Review Date' }],
  });
}

/**
 * 5. NEW E-PRESCRIPTION NOTIFICATION
 */
export function notifyPrescriptionIssued(opts: {
  doctorName: string;
  medicationCount: number;
  prescriptionId?: string;
}): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled || !settings.prescriptionsEnabled) return;

  const { doctorName, medicationCount, prescriptionId } = opts;

  if (settings.soundEnabled) {
    playPrescriptionChime();
  }

  showPhoneNotification({
    title: `💊 New E-Prescription Issued`,
    body: `Dr. ${doctorName} issued an encrypted digital prescription (${medicationCount} medication${medicationCount > 1 ? 's' : ''}).`,
    type: 'prescription',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `rx-issued-${prescriptionId || Date.now()}`,
    vibrate: [100, 50, 200],
    data: {
      url: '/#health-records',
      screen: 'health-records',
      prescriptionId,
    },
    actions: [{ action: 'view_rx', title: '💊 View Prescription' }],
  });
}

/**
 * 6. MEDICATION TIME REMINDER
 */
export function notifyMedicationReminder(opts: {
  drugName: string;
  dosage: string;
  instructions?: string;
}): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled || !settings.prescriptionsEnabled) return;

  const { drugName, dosage, instructions } = opts;

  if (settings.soundEnabled) {
    playNotificationChime();
  }

  showPhoneNotification({
    title: `⏰ Medication Time: ${drugName}`,
    body: `Take ${dosage}. ${instructions || 'Follow your prescribed plan.'}`,
    type: 'medication',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `med-${drugName}-${Date.now()}`,
    vibrate: [150, 100, 150],
    data: {
      url: '/#health-records',
      screen: 'health-records',
    },
  });
}

/**
 * 7. PHARMACY DRUG DELIVERY / ORDER UPDATE
 */
export function notifyDrugDeliveryUpdate(opts: {
  drugName: string;
  status: string;
  orderId?: string;
}): void {
  const settings = getPhoneNotificationSettings();
  if (!settings.enabled) return;

  const { drugName, status, orderId } = opts;

  if (settings.soundEnabled) {
    playNotificationChime();
  }

  showPhoneNotification({
    title: `📦 Pharmacy Order: ${status}`,
    body: `Your order for ${drugName} is currently ${status}.`,
    type: 'delivery',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `delivery-${orderId || Date.now()}`,
    vibrate: [150, 100, 150],
    data: {
      url: '/#health-records',
      screen: 'health-records',
      orderId,
    },
  });
}

/**
 * Sends a real test notification to verify sound, vibration, and system display
 */
export async function sendTestPhoneNotification(): Promise<boolean> {
  const perm = await requestPhoneNotificationPermission();
  if (perm !== 'granted') return false;

  playNotificationChime();
  triggerPhoneVibration([150, 80, 150, 80, 250]);

  return await showPhoneNotification({
    title: '🔔 Prime Telecare Phone Notifications Active',
    body: 'Your phone will now receive real-time alerts for incoming doctor calls, chat messages, and appointment updates.',
    type: 'system',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'test-phone-notification',
    vibrate: [150, 80, 150, 80, 250],
    data: { url: '/' },
    actions: [{ action: 'dismiss', title: '✓ Looks Great' }],
  });
}
