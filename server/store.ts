import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Doctor,
  Appointment,
  Prescription,
  HealthRecordAuditLog,
  DependentProfile,
  ChatMessage,
  MedicalRecordFile,
} from '../src/types';
import {
  currentUserAdmin,
} from '../src/data/mockData';

export interface TriageCase {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  gender?: string;
  vitals: {
    temp?: string;
    hr?: string;
    spo2?: string;
    systolicBp?: string;
  };
  redFlags: {
    chestPain: boolean;
    breathingDiff: boolean;
    strokeSymptoms: boolean;
    heavyBleeding: boolean;
    anaphylaxis: boolean;
    severeTrauma: boolean;
  };
  severity: 'immediate_emergency' | 'urgent_telehealth' | 'routine_care';
  recommendation: string;
  suggestedSpecialty: string;
  aiNotes?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  reference: string;
  userId: string;
  patientName: string;
  amount: number;
  purpose: 'consultation' | 'records_export' | 'wallet_topup' | 'prescription';
  method: 'card' | 'bank_transfer' | 'wallet' | 'paystack';
  status: 'pending' | 'successful' | 'failed';
  consultationId?: string;
  createdAt: string;
}

export interface ActiveCall {
  id: string;
  consultationId: string;
  doctorId: string;
  doctorName?: string;
  patientName: string;
  patientAvatar?: string;
  type: 'Video' | 'Voice' | 'Chat';
  vitals?: any;
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  startedAt: number;
}

export interface CareJourneyItem {
  id: string;
  title: string;
  description?: string;
  category: 'medication' | 'vitals' | 'diagnostic' | 'lifestyle' | 'followup';
  checkedByDoctor: boolean;
  completedByPatient: boolean;
  requiredDate?: string;
}

export interface CareJourneyPlan {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: 'draft_pending_doctor' | 'approved_by_doctor';
  approvedAt?: string;
  items: CareJourneyItem[];
  doctorNotes?: string;
}

export interface ServerState {
  users: User[];
  doctors: Doctor[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  auditLogs: HealthRecordAuditLog[];
  triageCases: TriageCase[];
  payments: PaymentTransaction[];
  chatMessages: Record<string, ChatMessage[]>; // keyed by sessionId/consultationId
  dependents: Record<string, DependentProfile[]>; // keyed by userId
  exportAuthorizations: Record<string, {
    status: 'pending_doctor_approval' | 'granted' | 'rejected' | 'not_requested';
    purpose: string;
    doctorName?: string;
    doctorLicense?: string;
    requestedAt: string;
    grantedAt?: string;
    isPaid: boolean;
    paymentAmount: number;
  }>;
  activeCalls: Record<string, ActiveCall>;
  careJourneyPlans: Record<string, CareJourneyPlan>;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const LEGACY_PLACEHOLDER_DOCTOR_IDS = new Set([
  'doc-anya',
  'doc-kenji',
  'doc-emeka',
  'doc-sarah',
  'doc-ching',
  'doc-chike',
  'doc-fatima',
  'doc-1',
]);

const LEGACY_PLACEHOLDER_USER_EMAILS = new Set([
  'ada.okonkwo@email.com',
  'dr.emeka@primetelecare.com',
]);

const LEGACY_PLACEHOLDER_RX_REFS = new Set(['RX-789012', 'RX-994102']);
const LEGACY_PLACEHOLDER_AUDIT_IDS = new Set(['audit-1', 'audit-2', 'audit-3', 'audit-4', 'audit-5', 'audit-6']);

class MemoryStore {
  private state: ServerState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private getDefaultState(): ServerState {
    return {
      users: [currentUserAdmin],
      doctors: [],
      appointments: [],
      prescriptions: [],
      auditLogs: [],
      triageCases: [],
      payments: [],
      chatMessages: {},
      dependents: {},
      exportAuthorizations: {},
      activeCalls: {},
      careJourneyPlans: {},
    };
  }

  private loadFromDisk(): ServerState {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log('[Store] Loaded state from disk (' + Object.keys(parsed).length + ' collections)');

        parsed.users = Array.isArray(parsed.users)
          ? parsed.users.filter(
              (u: User) =>
                u.id !== 'pat-1' &&
                u.id !== 'doc-1' &&
                u.name !== 'Ada Okonkwo' &&
                u.name !== 'Dr. Emeka Nnamdi' &&
                !LEGACY_PLACEHOLDER_USER_EMAILS.has((u.email || '').toLowerCase())
            )
          : [currentUserAdmin];

        // Ensure master admin account exists
        if (!parsed.users.some((u: User) => u.id === 'admin-1')) {
          parsed.users.push(currentUserAdmin);
        }

        parsed.doctors = Array.isArray(parsed.doctors)
          ? parsed.doctors.filter((d: Doctor) => !LEGACY_PLACEHOLDER_DOCTOR_IDS.has(d.id))
          : [];

        parsed.appointments = Array.isArray(parsed.appointments)
          ? parsed.appointments.filter(
              (a: Appointment) =>
                a.patientName !== 'Ada Okonkwo' &&
                !LEGACY_PLACEHOLDER_DOCTOR_IDS.has(a.doctorId)
            )
          : [];

        parsed.prescriptions = Array.isArray(parsed.prescriptions)
          ? parsed.prescriptions.filter(
              (p: Prescription) =>
                p.id !== 'rx-1' &&
                p.id !== 'rx-2' &&
                !LEGACY_PLACEHOLDER_RX_REFS.has(p.referenceNo)
            )
          : [];

        parsed.auditLogs = Array.isArray(parsed.auditLogs)
          ? parsed.auditLogs.filter((l: HealthRecordAuditLog) => !LEGACY_PLACEHOLDER_AUDIT_IDS.has(l.id))
          : [];

        parsed.triageCases = Array.isArray(parsed.triageCases) ? parsed.triageCases : [];
        parsed.payments = Array.isArray(parsed.payments) ? parsed.payments : [];
        parsed.chatMessages = parsed.chatMessages || {};
        parsed.dependents = parsed.dependents || {};
        delete parsed.dependents['pat-1'];
        parsed.exportAuthorizations = parsed.exportAuthorizations || {};
        parsed.activeCalls = parsed.activeCalls || {};
        parsed.careJourneyPlans = parsed.careJourneyPlans || {};

        return parsed;
      }
    } catch (e) {
      console.warn('[Store] Could not load persisted store. Initializing default state.', e);
    }
    const fresh = this.getDefaultState();
    this.saveToDisk(fresh);
    return fresh;
  }

  private saveToDisk(state?: ServerState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(state || this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Store] Failed to persist store to disk', e);
    }
  }

  // --- Users & Auth ---
  getUsers(): User[] {
    return this.state.users;
  }

  getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  saveUser(user: User): User {
    const idx = this.state.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.state.users[idx] = { ...this.state.users[idx], ...user };
    } else {
      this.state.users.push(user);
    }
    this.saveToDisk();
    return user;
  }

  // --- Doctors ---
  getDoctors(): Doctor[] {
    return this.state.doctors;
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.state.doctors.find((d) => d.id === id);
  }

  saveDoctor(doc: Doctor): Doctor {
    const idx = this.state.doctors.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      this.state.doctors[idx] = { ...this.state.doctors[idx], ...doc };
    } else {
      this.state.doctors.push(doc);
    }
    this.saveToDisk();
    return idx >= 0 ? this.state.doctors[idx] : doc;
  }

  updateDoctorOnlineStatus(id: string, isOnline: boolean): Doctor | undefined {
    const doc = this.state.doctors.find((d) => d.id === id || d.id === `doc-${id}`);
    if (!doc) return undefined;
    doc.isOnline = isOnline;
    doc.availabilityStatus = {
      ...(doc.availabilityStatus || {
        nextAvailableSlot: 'Today',
        workingDays: 'Mon - Fri (8:00 AM - 6:00 PM)',
      }),
      isOnline,
      statusText: isOnline ? 'Online & Available' : 'Offline',
    };
    this.saveToDisk();
    return doc;
  }

  deleteDoctor(id: string): boolean {
    const initialLen = this.state.doctors.length;
    this.state.doctors = this.state.doctors.filter((d) => d.id !== id);
    if (this.state.doctors.length < initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // --- Appointments ---
  getAppointments(filter?: { patientName?: string; doctorId?: string; status?: string }): Appointment[] {
    let list = this.state.appointments;
    if (filter?.patientName) {
      list = list.filter((a) => a.patientName.toLowerCase().includes(filter.patientName!.toLowerCase()));
    }
    if (filter?.doctorId) {
      list = list.filter((a) => a.doctorId === filter.doctorId);
    }
    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    return list;
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.state.appointments.find((a) => a.id === id);
  }

  createAppointment(apt: Omit<Appointment, 'id'>): Appointment {
    const newApt: Appointment = {
      ...apt,
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.state.appointments.unshift(newApt);
    this.saveToDisk();
    return newApt;
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | undefined {
    const idx = this.state.appointments.findIndex((a) => a.id === id);
    if (idx < 0) return undefined;
    this.state.appointments[idx] = { ...this.state.appointments[idx], ...updates };
    this.saveToDisk();
    return this.state.appointments[idx];
  }

  // --- E-Prescriptions ---
  getPrescriptions(patientName?: string): Prescription[] {
    if (patientName) {
      return this.state.prescriptions.filter((p) =>
        p.patientName.toLowerCase().includes(patientName.toLowerCase())
      );
    }
    return this.state.prescriptions;
  }

  getPrescriptionById(id: string): Prescription | undefined {
    return this.state.prescriptions.find((p) => p.id === id || p.referenceNo === id);
  }

  createPrescription(rxData: Omit<Prescription, 'id' | 'authSealToken' | 'authVerificationDate'>): Prescription {
    const timestamp = Date.now();
    const sealData = `${rxData.doctorLicense || 'MDCN'}-${rxData.referenceNo}-${timestamp}`;
    const authSealToken = 'MDCN-SEAL-' + crypto.createHmac('sha256', 'prime-mdcn-secret').update(sealData).digest('hex').slice(0, 24).toUpperCase();
    
    const newRx: Prescription = {
      ...rxData,
      id: `rx-${timestamp}`,
      authSealToken,
      authVerificationDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isVerified: true,
    };
    this.state.prescriptions.unshift(newRx);
    this.saveToDisk();
    return newRx;
  }

  // --- Audit Logs (NDPA) ---
  getAuditLogs(): HealthRecordAuditLog[] {
    return this.state.auditLogs;
  }

  createAuditLog(log: Omit<HealthRecordAuditLog, 'id' | 'timestamp'>): HealthRecordAuditLog {
    const newLog: HealthRecordAuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    this.state.auditLogs.unshift(newLog);
    this.saveToDisk();
    return newLog;
  }

  // --- Chat Messages ---
  getChatMessages(sessionId: string): ChatMessage[] {
    return this.state.chatMessages[sessionId] || this.state.chatMessages['default'] || [];
  }

  addChatMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    if (!this.state.chatMessages[sessionId]) {
      this.state.chatMessages[sessionId] = [];
    }
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.state.chatMessages[sessionId].push(newMsg);
    this.saveToDisk();
    return newMsg;
  }

  // --- Triage Cases ---
  createTriageCase(triage: Omit<TriageCase, 'id' | 'createdAt'>): TriageCase {
    const newCase: TriageCase = {
      ...triage,
      id: `triage-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.triageCases.unshift(newCase);
    this.saveToDisk();
    return newCase;
  }

  getTriageCases(): TriageCase[] {
    return this.state.triageCases;
  }

  // --- Payments & Wallet ---
  createPayment(payment: Omit<PaymentTransaction, 'id' | 'createdAt'>): PaymentTransaction {
    const newPayment: PaymentTransaction = {
      ...payment,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.payments.unshift(newPayment);

    // If topup or consultation payment, adjust wallet
    if (payment.purpose === 'wallet_topup' && payment.status === 'successful') {
      const user = this.getUserById(payment.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + payment.amount;
        this.saveUser(user);
      }
    } else if (payment.purpose === 'consultation' && payment.status === 'successful') {
      // Credit doctor's wallet with consultation earnings
      const doc = this.getUserById('doc-1') || this.getUserById(payment.userId);
      if (doc) {
        doc.walletBalance = (doc.walletBalance || 0) + payment.amount;
        this.saveUser(doc);
      }
    } else if (payment.method === 'wallet' && payment.status === 'successful') {
      const user = this.getUserById(payment.userId);
      if (user && (user.walletBalance || 0) >= payment.amount) {
        user.walletBalance = (user.walletBalance || 0) - payment.amount;
        this.saveUser(user);
      }
    }

    this.saveToDisk();
    return newPayment;
  }

  getPayments(userId?: string): PaymentTransaction[] {
    if (userId) {
      return this.state.payments.filter((p) => p.userId === userId);
    }
    return this.state.payments;
  }

  // --- Dependents ---
  getDependents(userId: string): DependentProfile[] {
    return this.state.dependents[userId] || [];
  }

  addDependent(userId: string, dep: Omit<DependentProfile, 'id'>): DependentProfile {
    if (!this.state.dependents[userId]) {
      this.state.dependents[userId] = [];
    }
    const newDep: DependentProfile = {
      ...dep,
      id: `dep-${Date.now()}`,
    };
    this.state.dependents[userId].push(newDep);
    this.saveToDisk();
    return newDep;
  }

  deleteDependent(userId: string, depId: string): boolean {
    if (!this.state.dependents[userId]) return false;
    const initialLen = this.state.dependents[userId].length;
    this.state.dependents[userId] = this.state.dependents[userId].filter((d) => d.id !== depId);
    this.saveToDisk();
    return this.state.dependents[userId].length < initialLen;
  }

  // --- Health Record Export Authorizations ---
  getExportAuthorization(key: string) {
    return this.state.exportAuthorizations[key] || {
      status: 'not_requested',
      purpose: '',
      requestedAt: '',
      isPaid: false,
      paymentAmount: 3000,
    };
  }

  saveExportAuthorization(key: string, data: any) {
    this.state.exportAuthorizations[key] = {
      ...this.state.exportAuthorizations[key],
      ...data,
    };
    this.saveToDisk();
    return this.state.exportAuthorizations[key];
  }

  // --- Real-time Active Telehealth Calls ---
  startCall(callData: Omit<ActiveCall, 'id' | 'startedAt' | 'status'> & { id?: string }): ActiveCall {
    const id = callData.id || `call-${Date.now()}`;
    const newCall: ActiveCall = {
      ...callData,
      id,
      status: 'ringing',
      startedAt: Date.now(),
    };
    if (!this.state.activeCalls) {
      this.state.activeCalls = {};
    }
    this.state.activeCalls[newCall.doctorId] = newCall;
    this.state.activeCalls[id] = newCall;
    this.saveToDisk();
    return newCall;
  }

  getActiveCall(userId?: string): ActiveCall | undefined {
    if (!this.state.activeCalls) return undefined;
    const now = Date.now();
    // Match specific doctor or patient if provided
    if (userId) {
      if (this.state.activeCalls[userId]) {
        const c = this.state.activeCalls[userId];
        if (c.status === 'ringing' && now - c.startedAt < 180000) {
          return c;
        }
      }
      const match = Object.values(this.state.activeCalls).find(
        (c) =>
          c.status === 'ringing' &&
          now - c.startedAt < 180000 &&
          (c.doctorId === userId || (c as any).patientId === userId || c.patientName?.toLowerCase() === userId.toLowerCase())
      );
      if (match) return match;
    }
    // Return any active ringing call within the last 3 minutes
    const calls = Object.values(this.state.activeCalls);
    return calls.find((c) => c.status === 'ringing' && now - c.startedAt < 180000);
  }

  respondCall(callId: string, status: 'accepted' | 'declined' | 'ended'): ActiveCall | undefined {
    if (!this.state.activeCalls) return undefined;
    const call = this.state.activeCalls[callId] || Object.values(this.state.activeCalls).find((c) => c.id === callId);
    if (call) {
      call.status = status;
      if (call.doctorId && this.state.activeCalls[call.doctorId]) {
        this.state.activeCalls[call.doctorId].status = status;
      }
      this.saveToDisk();
      return call;
    }
    return undefined;
  }

  // --- Care Journey Plans ---
  getCareJourneyPlan(patientId: string): CareJourneyPlan | null {
    if (!this.state.careJourneyPlans) return null;
    return (
      this.state.careJourneyPlans[patientId] ||
      this.state.careJourneyPlans['default'] ||
      this.state.careJourneyPlans['pat-1'] ||
      null
    );
  }

  saveCareJourneyPlan(plan: CareJourneyPlan): CareJourneyPlan {
    if (!this.state.careJourneyPlans) {
      this.state.careJourneyPlans = {};
    }
    const key = plan.patientId || 'default';
    this.state.careJourneyPlans[key] = plan;
    this.state.careJourneyPlans['default'] = plan;
    this.saveToDisk();
    return plan;
  }
}

export const store = new MemoryStore();

