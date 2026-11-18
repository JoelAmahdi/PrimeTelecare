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
    upcomingAppointment: null as any,
    doctors: [],
    reminders: [],
    walletBalance: 0,
    stats: {
      completedVisits: 0,
      prescriptionsCount: 0,
      labTestsCount: 0,
      healthScore: '—',
    },
    lastSyncedAt: new Date().toISOString(),
  };
}

export function generateInitialHealthRecordsData(): HealthRecordsCache {
  return {
    id: 'health_records_primary',
    consultations: [],
    prescriptions: [],
    labResults: [],
    referrals: [],
    certificates: [],
    receipts: [],
    auditLogs: [],
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
