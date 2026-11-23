import { useState, useEffect } from 'react';
import { primeApi } from '../services/apiClient';

export interface HealthRecordExportPermission {
  sessionId: string;
  patientName: string;
  doctorName: string;
  doctorLicense?: string;
  status: 'not_requested' | 'pending_doctor_approval' | 'granted' | 'rejected';
  purpose: string;
  requestedAt: string;
  grantedAt?: string;
  notes?: string;
  remindedCount?: number;
  lastReminderAt?: string;
  isPaid?: boolean;
  paymentAmount?: number;
  paidAt?: string;
  paymentMethod?: string;
}

const STORAGE_KEY = 'prime_telecare_export_permissions_v1';
const REQUESTS_LIST_KEY = 'prime_telecare_clinical_note_requests_v2';
const EVENT_NAME = 'health-record-permission-change';

const DEFAULT_PERMISSION: HealthRecordExportPermission = {
  sessionId: 'SESS-2026-9948',
  patientName: 'Adaeze Okonkwo',
  doctorName: 'Dr. Emeka Nnamdi',
  doctorLicense: 'MDCN/2019/68421',
  status: 'pending_doctor_approval',
  purpose: 'Official Medical Record & Clinical Notes Release',
  requestedAt: 'Nov 23, 2026, 09:30 AM',
  remindedCount: 0,
  isPaid: false,
  paymentAmount: 3000,
};

export function getClinicalNoteRequests(): HealthRecordExportPermission[] {
  if (typeof window === 'undefined') return [DEFAULT_PERMISSION];
  try {
    const raw = localStorage.getItem(REQUESTS_LIST_KEY);
    if (!raw) {
      const initial = [DEFAULT_PERMISSION];
      localStorage.setItem(REQUESTS_LIST_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_PERMISSION];
  } catch (e) {
    console.error('Error reading clinical note requests', e);
    return [DEFAULT_PERMISSION];
  }
}

export function saveClinicalNoteRequestsList(requests: HealthRecordExportPermission[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REQUESTS_LIST_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: requests[0] }));
  } catch (e) {
    console.error('Error saving clinical note requests list', e);
  }
}

export function approveClinicalNoteRequest(
  sessionId: string,
  doctorName: string = 'Dr. Emeka Nnamdi',
  doctorLicense: string = 'MDCN/2019/68421'
): HealthRecordExportPermission {
  const list = getClinicalNoteRequests();
  const grantedAt = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let matched: HealthRecordExportPermission | null = null;
  const updatedList = list.map((item) => {
    if (item.sessionId === sessionId || (!sessionId && item.status === 'pending_doctor_approval')) {
      matched = {
        ...item,
        status: 'granted' as const,
        doctorName: doctorName || item.doctorName,
        doctorLicense: doctorLicense || item.doctorLicense,
        grantedAt,
      };
      return matched;
    }
    return item;
  });

  if (!matched) {
    matched = {
      sessionId: sessionId || `SESS-${Date.now().toString().slice(-4)}`,
      patientName: 'Adaeze Okonkwo',
      doctorName,
      doctorLicense,
      status: 'granted',
      purpose: 'Official Medical Record Release',
      requestedAt: grantedAt,
      grantedAt,
      isPaid: false,
      paymentAmount: 3000,
    };
    updatedList.unshift(matched);
  }

  saveClinicalNoteRequestsList(updatedList);
  saveExportPermission(matched);
  primeApi.authorizeExportRelease(sessionId, 'grant', doctorName, doctorLicense).catch(() => {});
  return matched;
}

export function declineClinicalNoteRequest(
  sessionId: string,
  doctorName: string = 'Dr. Emeka Nnamdi'
): HealthRecordExportPermission {
  const list = getClinicalNoteRequests();
  let matched: HealthRecordExportPermission | null = null;
  const updatedList = list.map((item) => {
    if (item.sessionId === sessionId) {
      matched = {
        ...item,
        status: 'rejected' as const,
        doctorName: doctorName || item.doctorName,
      };
      return matched;
    }
    return item;
  });

  if (matched) {
    saveClinicalNoteRequestsList(updatedList);
    saveExportPermission(matched);
  }
  primeApi.authorizeExportRelease(sessionId, 'reject', doctorName).catch(() => {});
  return matched || list[0];
}

export function getExportPermissions(): HealthRecordExportPermission {
  if (typeof window === 'undefined') return DEFAULT_PERMISSION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PERMISSION));
      return DEFAULT_PERMISSION;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading export permissions', e);
    return DEFAULT_PERMISSION;
  }
}

export function saveExportPermission(permission: HealthRecordExportPermission): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permission));
    // Also sync to requests list
    const list = getClinicalNoteRequests();
    const existingIndex = list.findIndex((r) => r.sessionId === permission.sessionId);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...permission };
    } else if (permission.sessionId) {
      list.unshift(permission);
    }
    localStorage.setItem(REQUESTS_LIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: permission }));
  } catch (e) {
    console.error('Error saving export permission', e);
  }
}

export function requestExportPermission(params: {
  sessionId?: string;
  patientName?: string;
  doctorName?: string;
  doctorLicense?: string;
  purpose?: string;
}): HealthRecordExportPermission {
  const current = getExportPermissions();
  const updated: HealthRecordExportPermission = {
    ...current,
    sessionId: params.sessionId || current.sessionId || `SESS-${Date.now().toString().slice(-4)}`,
    patientName: params.patientName || current.patientName,
    doctorName: params.doctorName || current.doctorName,
    doctorLicense: params.doctorLicense || current.doctorLicense,
    status: 'pending_doctor_approval',
    purpose: params.purpose || current.purpose || 'Clinical Review & Second Opinion',
    requestedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  saveExportPermission(updated);
  primeApi.requestExportRelease(updated.sessionId, updated.purpose).catch(() => {});
  return updated;
}

export function grantDoctorExportPermission(doctorName?: string, doctorLicense?: string): HealthRecordExportPermission {
  const current = getExportPermissions();
  const updated: HealthRecordExportPermission = {
    ...current,
    status: 'granted',
    doctorName: doctorName || current.doctorName || '',
    doctorLicense: doctorLicense || current.doctorLicense || '',
    grantedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  saveExportPermission(updated);
  primeApi.requestExportRelease(updated.sessionId, updated.purpose).catch(() => {});
  return updated;
}

export function revokeDoctorExportPermission(): HealthRecordExportPermission {
  const current = getExportPermissions();
  const updated: HealthRecordExportPermission = {
    ...current,
    status: 'pending_doctor_approval',
    grantedAt: undefined,
  };
  saveExportPermission(updated);
  primeApi.requestExportRelease(updated.sessionId, updated.purpose).catch(() => {});
  return updated;
}

export function sendDoctorReminder(): HealthRecordExportPermission {
  const current = getExportPermissions();
  const updated: HealthRecordExportPermission = {
    ...current,
    remindedCount: (current.remindedCount || 0) + 1,
    lastReminderAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  saveExportPermission(updated);
  primeApi.requestExportRelease(updated.sessionId, updated.purpose).catch(() => {});
  return updated;
}

export function payForSessionExport(params?: { amount?: number; method?: string }): HealthRecordExportPermission {
  const current = getExportPermissions();
  const updated: HealthRecordExportPermission = {
    ...current,
    isPaid: true,
    paymentAmount: params?.amount || 3000,
    paymentMethod: params?.method || 'Health Wallet',
    paidAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  saveExportPermission(updated);
  primeApi.requestExportRelease(updated.sessionId, updated.purpose).catch(() => {});
  return updated;
}

export function resetExportFlowDemo(): HealthRecordExportPermission {
  const resetState: HealthRecordExportPermission = {
    ...DEFAULT_PERMISSION,
    status: 'pending_doctor_approval',
    isPaid: false,
    paymentAmount: 3000,
    remindedCount: 0,
    requestedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  saveExportPermission(resetState);
  return resetState;
}

export function useHealthRecordPermission(_sessionId?: string) {
  const [permission, setPermission] = useState<HealthRecordExportPermission>(getExportPermissions());

  useEffect(() => {
    setPermission(getExportPermissions());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<HealthRecordExportPermission>;
      if (customEvent.detail) {
        setPermission(customEvent.detail);
      } else {
        setPermission(getExportPermissions());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    permission,
    grantPermission: (docName?: string, docLicense?: string) => grantDoctorExportPermission(docName, docLicense),
    revokePermission: () => revokeDoctorExportPermission(),
    sendReminder: () => sendDoctorReminder(),
    requestPermission: (params: Parameters<typeof requestExportPermission>[0]) => requestExportPermission(params),
    payForSession: (params?: { amount?: number; method?: string }) => payForSessionExport(params),
    resetFlow: () => resetExportFlowDemo(),
  };
}
