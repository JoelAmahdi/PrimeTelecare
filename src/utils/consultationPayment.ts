import { BookingSummary, ScreenId } from '../types';
import { triggerHaptic } from './haptics';

const PAID_CONSULTATIONS_STORAGE_KEY = 'prime_telecare_paid_consultations_v1';
const LAST_PAID_TYPE_STORAGE_KEY = 'prime_telecare_last_paid_type_v1';

// Initial default paid consultations (e.g. 'app-1' start unpaid so user can test payment flow if desired, or 'c-1' is live)
const DEFAULT_PAID_CONSULTATIONS: Record<string, boolean> = {
  'c-1': true,  // Live session
  'c-5': true,  // Completed
  'c-6': true,  // Completed
  'c-7': true,  // Completed
  'c-8': true,  // Completed
  'c-9': true,  // Completed
  'app-1': false, // Upcoming demo appointment (starts unpaid so user can test join -> pay -> consultation flow)
  'c-2': false, // Upcoming chat (unpaid)
  'c-3': false, // Upcoming video (unpaid)
  'c-4': false, // Upcoming video (unpaid)
};

export function getPaidConsultationsMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PAID_CONSULTATIONS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PAID_CONSULTATIONS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to read paid consultations', e);
  }
  return { ...DEFAULT_PAID_CONSULTATIONS };
}

export function isConsultationPaid(id?: string): boolean {
  if (!id) return false;
  const map = getPaidConsultationsMap();
  return map[id] === true;
}

export function markConsultationAsPaid(id: string, type?: string): void {
  try {
    const map = getPaidConsultationsMap();
    map[id] = true;
    localStorage.setItem(PAID_CONSULTATIONS_STORAGE_KEY, JSON.stringify(map));
    if (type) {
      localStorage.setItem(LAST_PAID_TYPE_STORAGE_KEY, type);
    }
    window.dispatchEvent(new CustomEvent('consultation-payment-updated', { detail: { id, type } }));
  } catch (e) {
    console.error('Failed to save paid consultation', e);
  }
}

export function getLastPaidType(): string | null {
  try {
    return localStorage.getItem(LAST_PAID_TYPE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export interface JoinConsultationOptions {
  id: string;
  type: 'Video' | 'Voice' | 'Chat' | 'Text' | 'Audio';
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorAvatar?: string;
  price?: number;
  onNavigate: (screen: ScreenId) => void;
  onSaveBookingSummary?: (summary: BookingSummary) => void;
}

/**
 * Centralized Join / Pay Router
 * - If paid: routes straight to consultation room ('active-chat' or 'video-call').
 * - If not paid: saves booking summary & routes to payment first!
 */
export function processJoinOrPayConsultation(opts: JoinConsultationOptions) {
  const {
    id,
    type,
    doctorId = 'doc-anya',
    doctorName = 'Dr. Anya Sharma',
    doctorSpecialty = 'Pediatrician',
    doctorAvatar = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    price = 10000,
    onNavigate,
    onSaveBookingSummary,
  } = opts;

  const isPaid = isConsultationPaid(id);

  if (isPaid) {
    triggerHaptic('success');
    if (type === 'Chat' || type === 'Text') {
      onNavigate('active-chat');
    } else {
      onNavigate('video-call');
    }
  } else {
    // Not paid yet -> direct to Payment screen first
    triggerHaptic('medium');
    const normType = (type === 'Text' ? 'Chat' : type === 'Audio' ? 'Voice' : type) as 'Video' | 'Voice' | 'Chat';
    
    if (onSaveBookingSummary) {
      onSaveBookingSummary({
        doctorId,
        consultationType: normType,
        date: 'Today',
        timeSlot: '10:30 AM',
        duration: '30 Minutes',
        baseFee: price,
        serviceFee: 500,
        totalFee: price + 500,
        connectionMethod: 'Encrypted In-App Stream',
        uploadedFiles: [],
        reminderPreferences: { sms: true, email: true, push: true, whatsapp: false },
        timeZone: 'WAT (GMT+1)',
        cancellationPolicy: '100% full refund up to 2 hours before start.',
        reschedulePolicy: 'Free instant reschedule.',
        consultationId: id,
      });
    }

    onNavigate('payment');
  }
}
