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
  currentUserPatient,
  currentUserDoctor,
  currentUserAdmin,
  mockDoctors,
  mockPrescriptions,
  mockHealthRecordAuditLogs,
  mockChatMessages,
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
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Initial seed appointments
const seedAppointments: Appointment[] = [
  {
    id: 'apt-seed-1',
    doctorId: 'doc-anya',
    doctorName: 'Dr. Anya Sharma',
    doctorSpecialty: 'Pediatrician & Childhood Immunology',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    patientName: 'Ada Okonkwo',
    scheduledDate: 'Today',
    timeSlot: '02:30 PM - 03:00 PM',
    type: 'Video',
    status: 'upcoming',
    notes: 'Follow up on mild asthma flare-up and review allergy action plan.',
    price: 10000,
  },
  {
    id: 'apt-seed-2',
    doctorId: 'doc-chike',
    doctorName: 'Dr. Chike Obi',
    doctorSpecialty: 'General Practice & Internal Medicine',
    doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e410f624c427?auto=format&fit=crop&w=400',
    patientName: 'Ada Okonkwo',
    scheduledDate: 'October 15, 2026',
    timeSlot: '11:00 AM',
    type: 'Video',
    status: 'completed',
    notes: 'Routine blood pressure assessment & lifestyle review.',
    price: 15000,
  },
];

// Initial seed dependents
const seedDependents: DependentProfile[] = [
  {
    id: 'dep-1',
    name: 'Kemi Okonkwo',
    relationship: 'Child',
    dob: '2020-04-12',
    age: 6,
    gender: 'Female',
    allergies: ['Peanuts'],
    existingConditions: ['Mild Eczema'],
    bloodGroup: 'O+',
    isMinor: true,
    guardianConsent: true,
    accessLevel: 'Full Authority',
    clinicalRecordsConsent: true,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'dep-2',
    name: 'Pa Johnson Okonkwo',
    relationship: 'Elderly Dependent',
    dob: '1952-08-20',
    age: 74,
    gender: 'Male',
    allergies: ['Penicillin'],
    existingConditions: ['Hypertension', 'Type 2 Diabetes'],
    bloodGroup: 'B+',
    isMinor: false,
    accessLevel: 'Full Authority',
    clinicalRecordsConsent: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  },
];

class MemoryStore {
  private state: ServerState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private getDefaultState(): ServerState {
    return {
      users: [currentUserPatient, currentUserDoctor, currentUserAdmin],
      doctors: mockDoctors,
      appointments: seedAppointments,
      prescriptions: mockPrescriptions,
      auditLogs: mockHealthRecordAuditLogs,
      triageCases: [],
      payments: [
        {
          id: 'pay-seed-1',
          reference: 'PRIME-TXN-2026-901',
          userId: 'pat-1',
          patientName: 'Ada Okonkwo',
          amount: 10000,
          purpose: 'consultation',
          method: 'paystack',
          status: 'successful',
          consultationId: 'apt-seed-1',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      chatMessages: {
        'default': mockChatMessages,
        'c-1': mockChatMessages,
      },
      dependents: {
        'pat-1': seedDependents,
      },
      exportAuthorizations: {
        'app-1': {
          status: 'pending_doctor_approval',
          purpose: 'Second Medical Opinion & Personal Health Archive',
          doctorName: 'Dr. Sarah Johnson',
          doctorLicense: 'MDCN/2019/88492',
          requestedAt: 'October 24, 2026 at 10:30 AM',
          isPaid: false,
          paymentAmount: 3000,
        },
      },
    };
  }

  private loadFromDisk(): ServerState {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log('[Store] Loaded state from disk (' + Object.keys(parsed).length + ' collections)');
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
      this.state.doctors[idx] = doc;
    } else {
      this.state.doctors.push(doc);
    }
    this.saveToDisk();
    return doc;
  }

  // --- Appointments ---
  getAppointments(filter?: { patientName?: string; doctorId?: string }): Appointment[] {
    let list = this.state.appointments;
    if (filter?.patientName) {
      list = list.filter((a) => a.patientName.toLowerCase().includes(filter.patientName!.toLowerCase()));
    }
    if (filter?.doctorId) {
      list = list.filter((a) => a.doctorId === filter.doctorId);
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
}

export const store = new MemoryStore();

