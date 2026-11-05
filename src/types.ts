export type UserRole = 'patient' | 'doctor' | 'admin';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface GuardianDetails {
  name: string;
  relationship: string;
  phone: string;
  consentGiven: boolean;
}

export interface CommunicationPreferences {
  smsAlerts: boolean;
  emailSummaries: boolean;
  whatsappPrescriptions: boolean;
  promotionalHealthTips: boolean;
}

export interface OptionalConsents {
  marketingConsent: boolean;
  anonymizedResearchConsent: boolean;
}

export interface DependentProfile {
  id: string;
  name: string;
  relationship: 'Child' | 'Parent' | 'Spouse' | 'Sibling' | 'Ward' | 'Elderly Dependent' | 'Other';
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  avatarUrl?: string;
  allergies?: string[];
  existingConditions?: string[];
  bloodGroup?: string;
  isMinor?: boolean;
  guardianConsent?: boolean;
  accessLevel?: 'Full Authority' | 'View Only' | 'Emergency Only';
  clinicalRecordsConsent?: boolean;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  phone?: string;
  gender?: string;
  age?: number;
  dob?: string;
  walletBalance?: number;
  
  // Structured Location Fields
  stateOfResidence?: string;
  lga?: string;
  address?: string;
  
  // Structured Emergency & Clinical Profile Fields
  emergencyContact?: EmergencyContact;
  allergies?: string[];
  existingConditions?: string[];
  currentMedications?: string;
  previousSurgeries?: string;
  pregnancyStatus?: 'not_pregnant' | 'trimester_1' | 'trimester_2' | 'trimester_3' | 'postpartum' | 'na';
  preferredPharmacyHospital?: string;
  bloodGroup?: string;
  
  // Minor & Guardian Protection
  isMinor?: boolean;
  guardian?: GuardianDetails;
  
  // NDPA Compliance Audit Trail
  ndpaConsent?: {
    acceptedAt: string;
    ipAddress?: string;
    telehealthConsentGiven: boolean;
  };

  // Communication & Optional Consent Settings
  communicationPreferences?: CommunicationPreferences;
  optionalConsents?: OptionalConsents;

  // Professional Metadata
  staffCount?: number;
  doctorLicenseNo?: string;
  doctorSpecialty?: string;

  // Dependents & Family Profile Management
  dependents?: DependentProfile[];
  activeDependentId?: string | null;
}

export interface HealthRecordAuditLog {
  id: string;
  timestamp: string;
  accessedBy: string;
  accessorRole: 'Doctor' | 'System Administrator' | 'Lab Technician';
  accessorTitle?: string;
  accessorLicenseOrDept?: string;
  recordAccessed: string;
  accessReason: string;
  actionType: 'Viewed' | 'Exported' | 'Updated' | 'Shared for Referral';
  ipAddress?: string;
  accessLocation?: string;
  isFlagged?: boolean;
}

export interface DoctorReview {
  id: string;
  patientName: string;
  patientAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  verifiedConsultation: boolean;
}

export interface DoctorVerification {
  isVerified: boolean;
  licenseNumber: string;
  boardName: string;
  verifiedBadgeText: string;
  verificationDate: string;
}

export interface ReviewPolicy {
  policyText: string;
  verifiedOnly: boolean;
  auditEnforced: boolean;
}

export interface RecordExportAuthorization {
  requested: boolean;
  purpose?: string;
  status: 'pending_doctor_approval' | 'granted' | 'rejected' | 'not_requested';
  doctorGrantedAt?: string;
  doctorLicense?: string;
  grantedByDoctorName?: string;
  consentAcknowledged: boolean;
}

export interface BookingSummary {
  doctorId: string;
  consultationType: 'Video' | 'Voice' | 'Chat';
  bookingMode?: 'instant' | 'scheduled';
  symptomsDescription?: string;
  date: string;
  timeSlot: string;
  duration: string;
  baseFee: number;
  serviceFee: number;
  totalFee: number;
  connectionMethod: string;
  uploadedFiles: { id: string; name: string; size: string }[];
  reminderPreferences: { sms: boolean; email: boolean; push: boolean; whatsapp: boolean };
  timeZone: string;
  cancellationPolicy: string;
  reschedulePolicy: string;
  consultationId?: string;
  exportAuthorization?: RecordExportAuthorization;
}

export interface Doctor {
  id: string;
  name: string;
  fullNameWithTitle?: string;
  specialty: string;
  title: string;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  isOnline: boolean;
  isActive?: boolean;
  practiceStatus?: 'active' | 'inactive' | 'pending' | 'suspended';
  hospitalAffiliation?: string;
  yearsExperience: number;
  patientsCount: number;
  about: string;
  qualifications?: string[];
  languagesSpoken?: string[];
  consultationFee?: {
    chat: number;
    voice: number;
    video: number;
    base: number;
  };
  availabilityStatus?: {
    isOnline: boolean;
    statusText: string;
    nextAvailableSlot: string;
    workingDays: string;
  };
  verification?: DoctorVerification;
  reviewPolicy?: ReviewPolicy;
  reviewsList?: DoctorReview[];
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
  strength?: string;         // e.g. "500 mg", "80/480 mg"
  dosage: string;           // e.g. "1 tablet", "2 capsules"
  frequency: string;        // e.g. "Twice daily (12-hourly)"
  duration: string;         // e.g. "5 days"
  instructions?: string;    // e.g. "Take with food & plenty of water"
  isRestricted?: boolean;   // Restricted from telehealth issuance
  restrictionReason?: string;
  allergyWarning?: string;
  interactionWarning?: string;
}

export interface PrescriptionChangeRecord {
  id: string;
  version: string; // e.g., "v1.0", "v1.1"
  timestamp: string;
  authorName: string;
  authorLicense?: string;
  changeType: 'Created' | 'Dosage Adjusted' | 'Medication Removed' | 'Instruction Updated' | 'Signed & Sealed';
  description: string;
  reason?: string;
}

export interface Prescription {
  id: string;
  referenceNo: string;
  date: string;
  patientName: string;
  patientDob: string;
  patientId: string;
  patientAgeGender?: string;
  patientAllergies?: string[];
  doctorName: string;
  doctorLicense: string;
  doctorSpecialty?: string;
  doctorClinic: string;
  doctorSignature: string;
  authSealToken?: string; // Cryptographic Prescriber Token
  authVerificationDate?: string;
  status?: 'active' | 'expired' | 'past';
  medications: Medication[];
  doctorNotes: string;
  isVerified: boolean;
  chiefComplaint?: string;
  consultationId?: string;
  consultationType?: 'Video' | 'Voice' | 'Chat';
  consultationDate?: string;
  consultationTime?: string;
  consultationDuration?: string;
  diagnosis?: string;
  versionHistory?: PrescriptionChangeRecord[];
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
  instructions?: string;
  enabled: boolean;
  isDueNow?: boolean;
  takenToday?: boolean;
  lastTakenTime?: string;
  doctorName?: string;
}

export interface StructuredClinicalRecord {
  id: string;
  consultationId?: string;
  patientId: string;
  patientName: string;
  patientAgeGender?: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
  dateStr: string;
  timestamp: number;
  
  // 12 Mandatory Structured Clinical Documentation Fields
  patientComplaint?: string; // 1. Patient Complaint
  markdownNotes?: string; // Markdown formatted notes
  relevantHistory?: string;  // 2. Relevant History
  observations?: string;     // 3. Observations & Examination
  assessment?: string;       // 4. Assessment
  diagnosis?: string;        // 5. Diagnosis / Provisional Diagnosis
  carePlan?: string;         // 6. Care Plan
  medications?: Medication[];// 7. Medication
  testsRequested?: string[]; // 8. Tests Requested
  warningSigns?: string;     // 9. Warning Signs & Red Flags
  followUpDate?: string;     // 10. Follow-up Date
  referralDecision?: 'None Required' | 'In-Person Specialist Referral' | 'Secondary Diagnostic Lab' | 'Hospital Emergency Admission'; // 11. Referral Decision
  consultationOutcome?: 'Resolved Remotely' | 'Managed with Care Plan' | 'Awaiting Investigation Results' | 'Referred for In-Person Care'; // 12. Consultation Outcome
  
  // Doctor Permission for Health Record Export
  exportPermissionStatus?: 'pending_doctor_approval' | 'granted' | 'rejected' | 'not_requested';
  exportGrantedBy?: string;
  exportGrantedAt?: string;
  exportPurpose?: string;
  
  vitals?: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    weight?: string;
    oxygenSaturation?: string;
  };
}

export type ScreenId = 
  | 'welcome'
  | 'terms'
  | 'login'
  | 'signup'
  | 'patient-home'
  | 'doctor-home'
  | 'book-consultation'
  | 'doctor-discovery'
  | 'payment'
  | 'active-chat'
  | 'video-call'
  | 'upload-media'
  | 'new-prescription'
  | 'prescription-detail'
  | 'health-records'
  | 'doctor-profile'
  | 'settings'
  | 'security-center'
  | 'account-details'
  | 'withdrawal'
  | 'admin-dashboard'
  | 'service-router'
  | 'post-consultation-journey'
  | 'family-account';
