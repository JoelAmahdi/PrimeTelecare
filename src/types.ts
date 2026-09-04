export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  phone?: string;
  gender?: string;
  age?: number;
  walletBalance?: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  title: string;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  isOnline: boolean;
  yearsExperience: number;
  patientsCount: number;
  about: string;
  availableDates: string[];
  availableTimeSlots: string[];
  prices: {
    chat: number;
    voice: number;
    video: number;
  };
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  patientName: string;
  patientAvatar?: string;
  date: string;
  timeSlot: string;
  type: 'Chat' | 'Voice' | 'Video';
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
}

export interface Medication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  referenceNo: string;
  date: string;
  patientName: string;
  patientDob: string;
  patientId: string;
  patientAgeGender?: string;
  doctorName: string;
  doctorLicense: string;
  doctorClinic: string;
  doctorSignature: string;
  medications: Medication[];
  doctorNotes: string;
  isVerified: boolean;
  chiefComplaint?: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  senderName: string;
  text?: string;
  imageUrl?: string;
  timestamp: string;
  status?: MessageStatus;
}

export interface MedicalRecordFile {
  id: string;
  title: string;
  type: 'pdf' | 'jpg' | 'png';
  date: string;
  fileSize?: string;
  url: string;
  doctorName?: string;
  medicationCount?: number;
}

export interface MedicationReminder {
  id: string;
  prescriptionId?: string;
  drugName: string;
  dosage: string;
  time: string;
  frequency: string;
  enabled: boolean;
  isDueNow?: boolean;
  takenToday?: boolean;
  lastTakenTime?: string;
  doctorName?: string;
}

export type ScreenId = 
  | 'welcome'
  | 'terms'
  | 'login'
  | 'signup'
  | 'patient-home'
  | 'doctor-home'
  | 'book-consultation'
  | 'payment'
  | 'active-chat'
  | 'video-call'
  | 'upload-media'
  | 'new-prescription'
  | 'prescription-detail'
  | 'health-records'
  | 'doctor-profile'
  | 'settings'
  | 'account-details'
  | 'withdrawal';
