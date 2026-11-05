// IndexedDB Storage Layer for Prime Telecare Offline Resilience
import {
  User,
  Doctor,
  Appointment,
  Prescription,
  MedicalRecordFile,
  HealthRecordAuditLog,
  MedicationReminder,
} from '../types';
import {
  currentUserPatient,
  currentUserDoctor,
  mockDoctors,
  mockUpcomingAppointment,
  mockPrescriptions,
  mockMedicalFiles,
  mockHealthRecordAuditLogs,
} from '../data/mockData';
import {
  mockBloodPressureData,
  mockGlucoseData,
  mockOxygenPulseData,
  BloodPressureReading,
  GlucoseReading,
  OxygenPulseReading,
} from '../data/mockHealthTrends';

const DB_NAME = 'PrimeTelecareOfflineDB';
const DB_VERSION = 1;

export interface DashboardCache {
  id: string; // 'patient_dashboard' | 'doctor_dashboard' | 'admin_dashboard'
  user: User;
  upcomingAppointment?: Appointment | null;
  doctors: Doctor[];
  reminders: MedicationReminder[];
  walletBalance: number;
  stats?: Record<string, any>;
  lastSyncedAt: string;
}

export interface ConsultationRecord {
  id: string;
  type: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorLicense: string;
  doctorAvatar?: string;
  dateStr: string;
  chiefComplaint: string;
  diagnosis: string;
  status: 'Completed' | 'Upcoming' | 'In Progress';
  vitals: {
    bloodPressure: string;
    temperature: string;
    heartRate: string;
    weight: string;
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  doctorNotes: string;
  followUp: string;
}

export interface HealthRecordsCache {
  id: string; // e.g. 'health_records_primary'
  consultations: ConsultationRecord[];
  prescriptions: Prescription[];
  labResults: MedicalRecordFile[];
  referrals: Array<{
    id: string;
    doctor: string;
    specialty: string;
    facility: string;
    date: string;
    reason: string;
    status: string;
  }>;
  certificates: Array<{
    id: string;
    type: string;
    issuedBy: string;
    date: string;
    validUntil: string;
    status: string;
  }>;
  receipts: Array<{
    id: string;
    refNumber: string;
    amount: string;
    service: string;
    date: string;
    paymentMethod: string;
  }>;
  auditLogs: HealthRecordAuditLog[];
  vitalTrends: {
    bloodPressure: BloodPressureReading[];
    glucose: GlucoseReading[];
    oxygenPulse: OxygenPulseReading[];
  };
  lastSyncedAt: string;
}

export interface PendingOfflineAction {
  id: string;
  actionType: 'medication_taken' | 'medication_snooze' | 'draft_prescription' | 'profile_update';
  payload: any;
  createdAt: string;
  synced: boolean;
}

// In-Memory Fallback if IndexedDB is restricted (e.g. strict private browsing or iframe constraints)
const memoryStore: {
  dashboard?: DashboardCache;
  healthRecords?: HealthRecordsCache;
  offlineQueue: PendingOfflineAction[];
  meta: Record<string, string>;
} = {
  offlineQueue: [],
  meta: {},
};

// Open or Create IndexedDB Database
export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for Dashboard Data
        if (!db.objectStoreNames.contains('dashboard')) {
          db.createObjectStore('dashboard', { keyPath: 'id' });
        }

        // Store for Health Records
        if (!db.objectStoreNames.contains('healthRecords')) {
          db.createObjectStore('healthRecords', { keyPath: 'id' });
        }

        // Store for Offline Action Queue
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const actionStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
          actionStore.createIndex('synced', 'synced', { unique: false });
        }

        // Store for Metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[OfflineDB] IndexedDB open error, falling back to memory store:', request.error);
        reject(request.error);
      };
    } catch (e) {
      console.warn('[OfflineDB] Exception opening IndexedDB:', e);
      reject(e);
    }
  });
}

// Initial Seed Data for Instant Offline Readiness
export function generateInitialDashboardData(): DashboardCache {
  return {
    id: 'patient_dashboard',
    user: currentUserPatient,
    upcomingAppointment: mockUpcomingAppointment,
    doctors: mockDoctors,
    reminders: [
      {
        id: 'rem-1',
        drugName: 'Artemether / Lumefantrine (Coartem)',
        dosage: '1 tablet (80/480mg)',
        time: '08:00 AM',
        frequency: 'Twice daily',
        instructions: 'Take immediately after a fatty meal.',
        enabled: true,
        isDueNow: true,
        takenToday: false,
      },
      {
        id: 'rem-2',
        drugName: 'Paracetamol',
        dosage: '2 tablets (500mg)',
        time: '02:00 PM',
        frequency: 'Every 8 hours',
        instructions: 'Take after meals for fever/pain relief.',
        enabled: true,
        isDueNow: false,
        takenToday: true,
        lastTakenTime: '02:15 PM',
      },
      {
        id: 'rem-3',
        drugName: 'Vitamin C Effervescent',
        dosage: '1 tablet (1000mg)',
        time: '09:00 AM',
        frequency: 'Once daily',
        instructions: 'Dissolve in 200ml glass of fresh water.',
        enabled: true,
        isDueNow: false,
        takenToday: false,
      },
    ],
    walletBalance: 25000,
    stats: {
      completedVisits: 14,
      prescriptionsCount: 8,
      labTestsCount: 3,
      healthScore: '94%',
    },
    lastSyncedAt: new Date().toISOString(),
  };
}

export function generateInitialHealthRecordsData(): HealthRecordsCache {
  return {
    id: 'health_records_primary',
    consultations: [
      {
        id: 'CS-2026-9948',
        type: 'Text Tele-Consultation',
        doctorName: 'Dr. Anya Sharma',
        doctorSpecialty: 'Pediatrician & Family Health Specialist',
        doctorLicense: 'MDCN/2019/88492',
        dateStr: 'September 15, 2026 at 10:30 AM',
        chiefComplaint: 'Mild fever (38.2°C), throat soreness, and nasal congestion.',
        diagnosis: 'Acute Upper Respiratory Tract Infection (Viral Rhinopharyngitis)',
        status: 'Completed',
        vitals: {
          bloodPressure: '118/76 mmHg',
          temperature: '37.8°C',
          heartRate: '78 bpm',
          weight: '64.5 kg',
        },
        medications: [
          { name: 'Paracetamol 500mg', dosage: '2 tablets', frequency: '3 times daily', duration: '5 days' },
          { name: 'Vitamin C 1000mg', dosage: '1 tablet', frequency: 'Once daily', duration: '7 days' },
          { name: 'Saline Nasal Spray', dosage: '2 puffs each nostril', frequency: 'TID', duration: '5 days' },
        ],
        doctorNotes: 'Maintain fluid intake (2.5L/day) and adequate bed rest. Re-evaluate if symptoms persist past 72h.',
        followUp: 'Re-evaluate in 3 days if fever persists.',
      },
      {
        id: 'CS-2026-8812',
        type: 'Video Consultation',
        doctorName: 'Dr. Kenji Tanaka',
        doctorSpecialty: 'Consultant Cardiologist',
        doctorLicense: 'MDCN/2016/51209',
        dateStr: 'September 12, 2026 at 02:30 PM',
        chiefComplaint: 'Routine hypertension follow-up & morning dizziness.',
        diagnosis: 'Stage 1 Essential Hypertension (Well Controlled on Therapy)',
        status: 'Completed',
        vitals: {
          bloodPressure: '128/82 mmHg',
          temperature: '36.6°C',
          heartRate: '72 bpm',
          weight: '65.0 kg',
        },
        medications: [
          { name: 'Amlodipine Besylate 5mg', dosage: '1 tablet', frequency: 'Once daily (morning)', duration: '30 days' },
          { name: 'Hydrochlorothiazide 12.5mg', dosage: '1 tablet', frequency: 'Once daily (morning)', duration: '30 days' },
        ],
        doctorNotes: 'Blood pressure well controlled. Reduced dizziness noted after salt reduction. Continue home BP logging.',
        followUp: 'Routine follow-up in 30 days with 7-day BP diary.',
      },
      {
        id: 'CS-2026-7450',
        type: 'Audio Voice Consultation',
        doctorName: 'Dr. Fatima Al-Fayed',
        doctorSpecialty: 'Clinical & Cosmetic Dermatologist',
        doctorLicense: 'MDCN/2019/88301',
        dateStr: 'August 24, 2026 at 11:15 AM',
        chiefComplaint: 'Pruritic erythematous rash on left forearm.',
        diagnosis: 'Contact Dermatitis (Mild Chemical Irritant)',
        status: 'Completed',
        vitals: {
          bloodPressure: '116/74 mmHg',
          temperature: '36.8°C',
          heartRate: '75 bpm',
          weight: '64.8 kg',
        },
        medications: [
          { name: 'Hydrocortisone 1% Cream', dosage: 'Thin layer', frequency: 'Twice daily', duration: '5 days' },
          { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Nightly', duration: '5 days' },
        ],
        doctorNotes: 'Avoid harsh synthetic detergents and wear cotton gloves when handling cleaning agents.',
        followUp: 'Follow up if erythema spreads or develops secondary impetigo.',
      },
    ],
    prescriptions: mockPrescriptions,
    labResults: mockMedicalFiles,
    referrals: [
      {
        id: 'ref-1',
        doctor: 'Dr. Kenji Tanaka',
        specialty: 'Cardiovascular Imaging',
        facility: 'Lagoon Hospital Diagnostic Centre, Ikoyi',
        date: 'September 12, 2026',
        reason: 'Echocardiogram (Transthoracic) & Fasting Lipid Profile screening',
        status: 'Active Referral',
      },
      {
        id: 'ref-2',
        doctor: 'Dr. Sarah Lee',
        specialty: 'Clinical Nutrition & Dietetics',
        facility: 'Prime Telecare Wellness Network',
        date: 'August 10, 2026',
        reason: 'Personalized dietary guidance for low-sodium cardiovascular protection',
        status: 'Completed',
      },
    ],
    certificates: [
      {
        id: 'cert-1',
        type: 'Medical Fitness Certificate (Travel & Work)',
        issuedBy: 'Dr. Anya Sharma, MDCN #74920',
        date: 'September 16, 2026',
        validUntil: 'September 16, 2027',
        status: 'Valid & Verified',
      },
    ],
    receipts: [
      {
        id: 'rcpt-1',
        refNumber: 'TX-PRIME-994821',
        amount: '₦10,000',
        service: 'HD Video Tele-Consultation (30 mins)',
        date: 'Sep 12, 2026',
        paymentMethod: 'Prime Health Wallet (Autopay)',
      },
      {
        id: 'rcpt-2',
        refNumber: 'TX-PRIME-881203',
        amount: '₦5,000',
        service: 'Secure Text Messaging Tele-Consultation',
        date: 'Sep 15, 2026',
        paymentMethod: 'Paystack Card (*4242)',
      },
    ],
    auditLogs: mockHealthRecordAuditLogs,
    vitalTrends: {
      bloodPressure: mockBloodPressureData,
      glucose: mockGlucoseData,
      oxygenPulse: mockOxygenPulseData,
    },
    lastSyncedAt: new Date().toISOString(),
  };
}

// Save Dashboard Cache to IndexedDB
export async function saveDashboardToOfflineDB(data: DashboardCache): Promise<void> {
  memoryStore.dashboard = data;

  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('dashboard', 'readwrite');
      const store = tx.objectStore('dashboard');
      const req = store.put(data);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Failed to save dashboard to IndexedDB, stored in memory:', err);
  }
}

// Get Dashboard Cache from IndexedDB (or fallback to Seed)
export async function getDashboardFromOfflineDB(): Promise<DashboardCache> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction('dashboard', 'readonly');
      const store = tx.objectStore('dashboard');
      const req = store.get('patient_dashboard');

      req.onsuccess = () => {
        if (req.result) {
          memoryStore.dashboard = req.result;
          resolve(req.result);
        } else {
          // Auto-seed initial cache
          const seed = generateInitialDashboardData();
          saveDashboardToOfflineDB(seed);
          resolve(seed);
        }
      };

      req.onerror = () => {
        resolve(memoryStore.dashboard || generateInitialDashboardData());
      };
    });
  } catch {
    return memoryStore.dashboard || generateInitialDashboardData();
  }
}

// Save Health Records to IndexedDB
export async function saveHealthRecordsToOfflineDB(data: HealthRecordsCache): Promise<void> {
  memoryStore.healthRecords = data;

  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('healthRecords', 'readwrite');
      const store = tx.objectStore('healthRecords');
      const req = store.put(data);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Failed to save health records to IndexedDB, stored in memory:', err);
  }
}

// Get Health Records from IndexedDB (or fallback to Seed)
export async function getHealthRecordsFromOfflineDB(): Promise<HealthRecordsCache> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction('healthRecords', 'readonly');
      const store = tx.objectStore('healthRecords');
      const req = store.get('health_records_primary');

      req.onsuccess = () => {
        if (req.result) {
          memoryStore.healthRecords = req.result;
          resolve(req.result);
        } else {
          const seed = generateInitialHealthRecordsData();
          saveHealthRecordsToOfflineDB(seed);
          resolve(seed);
        }
      };

      req.onerror = () => {
        resolve(memoryStore.healthRecords || generateInitialHealthRecordsData());
      };
    });
  } catch {
    return memoryStore.healthRecords || generateInitialHealthRecordsData();
  }
}

// Record an Offline Action for Later Sync
export async function recordOfflineAction(
  actionType: PendingOfflineAction['actionType'],
  payload: any
): Promise<PendingOfflineAction> {
  const action: PendingOfflineAction = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    actionType,
    payload,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  memoryStore.offlineQueue.push(action);

  try {
    const db = await openOfflineDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    tx.objectStore('offlineQueue').put(action);
  } catch (e) {
    console.warn('[OfflineDB] Action recorded in memory:', e);
  }

  // Notify listeners
  window.dispatchEvent(new CustomEvent('prime-offline-action-queued', { detail: action }));
  return action;
}

// Retrieve Pending Offline Actions
export async function getPendingOfflineActions(): Promise<PendingOfflineAction[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction('offlineQueue', 'readonly');
      const store = tx.objectStore('offlineQueue');
      const req = store.getAll();

      req.onsuccess = () => {
        const pending = (req.result || []).filter((a: PendingOfflineAction) => !a.synced);
        resolve(pending.length > 0 ? pending : memoryStore.offlineQueue.filter((a) => !a.synced));
      };
      req.onerror = () => resolve(memoryStore.offlineQueue.filter((a) => !a.synced));
    });
  } catch {
    return memoryStore.offlineQueue.filter((a) => !a.synced);
  }
}

// Clear or Mark Pending Actions as Synced
export async function markOfflineActionsSynced(): Promise<void> {
  memoryStore.offlineQueue.forEach((a) => (a.synced = true));

  try {
    const db = await openOfflineDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');
    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result || [];
      all.forEach((item: PendingOfflineAction) => {
        item.synced = true;
        store.put(item);
      });
    };
  } catch (e) {
    console.warn('[OfflineDB] Error marking actions synced:', e);
  }

  window.dispatchEvent(new CustomEvent('prime-offline-synced'));
}

// Pre-seed and warm up cache immediately on application boot
export async function initializeOfflineStorage(): Promise<{
  dashboard: DashboardCache;
  healthRecords: HealthRecordsCache;
}> {
  try {
    const [dashboard, healthRecords] = await Promise.all([
      getDashboardFromOfflineDB(),
      getHealthRecordsFromOfflineDB(),
    ]);
    return { dashboard, healthRecords };
  } catch (err) {
    console.warn('[OfflineDB] Initializing with fallback seeds:', err);
    const dashboard = generateInitialDashboardData();
    const healthRecords = generateInitialHealthRecordsData();
    return { dashboard, healthRecords };
  }
}
