import { Doctor, Appointment, Prescription, MedicalRecordFile, ChatMessage, User, HealthRecordAuditLog } from '../types';

export const currentUserPatient: User = {
  id: '',
  name: '',
  email: '',
  role: 'patient',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
  phone: '',
  walletBalance: 0,
  onboarded: false,
  hasCompletedOnboarding: false,
};

export const currentUserDoctor: User = {
  id: '',
  name: '',
  email: '',
  role: 'doctor',
  avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
  phone: '',
  walletBalance: 0,
  onboarded: false,
  hasCompletedOnboarding: false,
};

export const currentUserAdmin: User = {
  id: 'admin-1',
  name: 'System Administrator',
  email: 'admin@primetelecare.com',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
  phone: '',
  onboarded: true,
  hasCompletedOnboarding: true,
};

export const mockDoctors: Doctor[] = [];

export const mockUpcomingAppointment: Appointment | null = null;

export const mockDoctorPatients: Array<{
  id: string;
  name: string;
  type: string;
  time: string;
  avatar: string;
}> = [];

export const mockPrescriptions: Prescription[] = [];

export const mockMedicalFiles: MedicalRecordFile[] = [];

export const mockChatMessages: ChatMessage[] = [];

export const mockHealthRecordAuditLogs: HealthRecordAuditLog[] = [];
