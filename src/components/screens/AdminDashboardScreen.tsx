import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Video,
  Phone,
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  AlertTriangle,
  FileText,
  Lock,
  Eye,
  RefreshCw,
  Plus,
  Sliders,
  Bell,
  Sparkles,
  ArrowUpRight,
  User as UserIcon,
  Shield,
  Zap,
  Check,
  X,
  CreditCard,
  Building2,
  HeartPulse,
  LogOut,
  Menu,
  ExternalLink,
  Filter,
  CheckSquare,
  Award,
  LifeBuoy,
  HelpCircle,
  Send,
} from 'lucide-react';
import { ScreenId, UserRole, User, PatientComplaint } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { StatusBar } from '../common/StatusBar';
import { primeApi } from '../../services/apiClient';

interface AdminDashboardScreenProps {
  user: User;
  onNavigate: (screen: ScreenId) => void;
  onSetRolePreview?: (role: UserRole, targetScreen: ScreenId) => void;
}

interface AdminDoctor {
  id: string;
  name: string;
  specialty: string;
  licenseNo: string;
  mdcnStatus: 'verified' | 'unverified';
  hospitalAffiliation: string;
  graduatedFrom: string;
  status: 'verified' | 'pending' | 'suspended';
  rating: number;
  patients: number;
  earnings: number;
  avatar: string;
  availability?: string;
}

interface PayoutRequest {
  id: string;
  doctorName: string;
  amount: number;
  date: string;
  bankName: string;
  accountNo: string;
  nubanVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

interface LiveSession {
  id: string;
  doctorName: string;
  doctorAvatar: string;
  patientName: string;
  patientAvatar: string;
  modality: 'Video' | 'Voice' | 'Chat';
  topic: string;
  durationMinutes: number;
  connectionQuality: 'Optimal' | 'Fair' | 'Poor';
  packetLoss: string;
  latencyMs: number;
  bitrateKbps: number;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  user,
  onNavigate,
  onSetRolePreview,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'settings'>('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Complaints & Grievances State
  const [complaintsList, setComplaintsList] = useState<PatientComplaint[]>([
    {
      id: 'cmp-101',
      patientName: 'Ada Okonkwo',
      patientEmail: 'ada.o@example.com',
      doctorName: 'Dr. Anya Sharma',
      consultationId: 'CNS-2026-9482',
      category: 'technical',
      subject: 'Video Connection Dropped in Minute 18',
      description: 'The video feed froze for 4 minutes during our pediatric consultation. Requesting review or grace minutes.',
      createdAt: '2 hours ago',
      status: 'pending',
      severity: 'medium',
    },
    {
      id: 'cmp-102',
      patientName: 'Emeka Eze',
      patientEmail: 'emeka.eze@example.com',
      doctorName: 'Dr. Kenji Tanaka',
      consultationId: 'CNS-2026-8812',
      category: 'clinical',
      subject: 'Prescription Dosage Clarification Needed',
      description: 'The prescribed Amoxicillin dosage says 500mg TDS, but pharmacy required clarification on pediatric suspension equivalence.',
      createdAt: 'Yesterday',
      status: 'in_review',
      severity: 'high',
    },
    {
      id: 'cmp-103',
      patientName: 'Fatima Bello',
      patientEmail: 'fatima.b@example.com',
      doctorName: 'Dr. Sarah Johnson',
      consultationId: 'CNS-2026-7731',
      category: 'billing',
      subject: 'Double Deduction on Card Gateway',
      description: 'My card was debited twice during checkout for appointment scheduling. Bank transaction reference: TR-884920.',
      createdAt: '2 days ago',
      status: 'resolved',
      severity: 'high',
      resolutionNotes: 'Refund of ₦10,000 processed via Paystack. Patient notified via SMS.',
    },
  ]);
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'pending' | 'in_review' | 'resolved'>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<PatientComplaint | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  // Modal states
  const [selectedLiveSession, setSelectedLiveSession] = useState<LiveSession | null>(null);
  const [selectedDoctorDossier, setSelectedDoctorDossier] = useState<AdminDoctor | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSpecialty, setInviteSpecialty] = useState('General Practice');

  // Filter state for doctors
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<'all' | 'pending' | 'verified' | 'suspended'>('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Doctors State
  const [doctorsList, setDoctorsList] = useState<AdminDoctor[]>([
    {
      id: 'doc-anya',
      name: 'Dr. Anya Sharma',
      specialty: 'Pediatric Specialist',
      licenseNo: 'MDCN-78912-A',
      mdcnStatus: 'verified',
      hospitalAffiliation: 'Lagos Island Maternity Hospital',
      graduatedFrom: 'Univ. of Ibadan College of Medicine',
      status: 'verified',
      rating: 4.9,
      patients: 1840,
      earnings: 425000,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      availability: 'Active In Video Room 2',
    },
    {
      id: 'doc-kenji',
      name: 'Dr. Kenji Tanaka',
      specialty: 'Cardiologist',
      licenseNo: 'MDCN-66201-B',
      mdcnStatus: 'verified',
      hospitalAffiliation: 'National Hospital Abuja',
      graduatedFrom: 'Kyoto University Faculty of Medicine',
      status: 'verified',
      rating: 4.9,
      patients: 2100,
      earnings: 680000,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      availability: 'Online (Accepting Calls)',
    },
    {
      id: 'doc-fatima',
      name: 'Dr. Fatima Al-Fayed',
      specialty: 'Consultant Dermatologist',
      licenseNo: 'MDCN-99214-C',
      mdcnStatus: 'verified',
      hospitalAffiliation: 'Lagos University Teaching Hospital (LUTH)',
      graduatedFrom: 'Ahmadu Bello University',
      status: 'pending',
      rating: 4.8,
      patients: 1400,
      earnings: 310000,
      avatar: 'https://images.unsplash.com/photo-1594824813566-88855ce78961?auto=format&fit=crop&q=80&w=300',
      availability: 'Credentials Submitted',
    },
    {
      id: 'doc-ching',
      name: 'Dr. Ching Ming Yu',
      specialty: 'Family Physician',
      licenseNo: 'MDCN-55410-D',
      mdcnStatus: 'verified',
      hospitalAffiliation: 'Reddington Multi-Specialist Hospital',
      graduatedFrom: 'National University of Singapore',
      status: 'verified',
      rating: 4.9,
      patients: 2500,
      earnings: 890000,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      availability: 'Active In Chat Refills',
    },
    {
      id: 'doc-emeka',
      name: 'Dr. Emeka Nnamdi',
      specialty: 'General Practitioner',
      licenseNo: 'MDCN-33129-E',
      mdcnStatus: 'verified',
      hospitalAffiliation: 'University of Nigeria Teaching Hospital (UNTH)',
      graduatedFrom: 'University of Nigeria, Nsukka',
      status: 'pending',
      rating: 4.7,
      patients: 950,
      earnings: 180000,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      availability: 'Awaiting Final Review',
    },
  ]);

  // Live Active Consultations
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([
    {
      id: 'sess-8821',
      doctorName: 'Dr. Anya Sharma',
      doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      patientName: 'Ada Okonkwo',
      patientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      modality: 'Video',
      topic: 'Pediatric Fever & Dehydration Triage',
      durationMinutes: 14,
      connectionQuality: 'Optimal',
      packetLoss: '0.1%',
      latencyMs: 18,
      bitrateKbps: 1850,
    },
    {
      id: 'sess-8822',
      doctorName: 'Dr. Kenji Tanaka',
      doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      patientName: 'Tunde Bakare',
      patientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      modality: 'Voice',
      topic: 'Post-Hypertension Medication Review',
      durationMinutes: 8,
      connectionQuality: 'Optimal',
      packetLoss: '0.0%',
      latencyMs: 24,
      bitrateKbps: 128,
    },
    {
      id: 'sess-8823',
      doctorName: 'Dr. Ching Ming Yu',
      doctorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      patientName: 'Mama Bose',
      patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      modality: 'Chat',
      topic: 'Metformin & Glimepiride Refill Request',
      durationMinutes: 21,
      connectionQuality: 'Optimal',
      packetLoss: '0.0%',
      latencyMs: 12,
      bitrateKbps: 64,
    },
    {
      id: 'sess-8824',
      doctorName: 'Dr. Sarah Johnson',
      doctorAvatar: 'https://images.unsplash.com/photo-1594824813566-88855ce78961?auto=format&fit=crop&q=80&w=300',
      patientName: 'Ngozi Adebayo',
      patientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      modality: 'Video',
      topic: 'Allergic Contact Dermatitis Follow-up',
      durationMinutes: 5,
      connectionQuality: 'Optimal',
      packetLoss: '0.2%',
      latencyMs: 22,
      bitrateKbps: 1920,
    },
  ]);

  // Payout requests state
  const [payoutsList, setPayoutsList] = useState<PayoutRequest[]>([
    {
      id: 'po-101',
      doctorName: 'Dr. Anya Sharma',
      amount: 120000,
      date: 'Today, 09:15 AM',
      bankName: 'First National Bank',
      accountNo: '•••• 8829',
      nubanVerified: true,
      status: 'pending',
    },
    {
      id: 'po-102',
      doctorName: 'Dr. Kenji Tanaka',
      amount: 250000,
      date: 'Yesterday, 04:30 PM',
      bankName: 'Access Bank Nigeria',
      accountNo: '•••• 1920',
      nubanVerified: true,
      status: 'approved',
    },
    {
      id: 'po-103',
      doctorName: 'Dr. Fatima Al-Fayed',
      amount: 85000,
      date: 'Sep 12, 2026',
      bankName: 'Standard Chartered',
      accountNo: '•••• 4410',
      nubanVerified: true,
      status: 'pending',
    },
  ]);

  // Platform governance switches
  const [settings, setSettings] = useState({
    hipaaCompliance: true,
    autoReminders: true,
    maintenanceMode: false,
    requireDoctorVerification: true,
    platformFeePercentage: 15,
  });

  const pendingDoctorsCount = doctorsList.filter((d) => d.status === 'pending').length;
  const pendingPayoutsCount = payoutsList.filter((p) => p.status === 'pending').length;
  const liveSessionsCount = liveSessions.length;

  // Handlers
  const handleApproveDoctor = (id: string, name: string) => {
    triggerHaptic('success');
    setDoctorsList((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'verified', availability: 'Practice License Active' } : d))
    );
    showToast(`Approved medical license for ${name}! Clinician is now active.`);
    if (selectedDoctorDossier?.id === id) {
      setSelectedDoctorDossier(null);
    }
  };

  const handleToggleSuspendDoctor = (id: string) => {
    triggerHaptic('medium');
    setDoctorsList((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'suspended' ? 'verified' : 'suspended';
          return {
            ...d,
            status: nextStatus,
            availability: nextStatus === 'suspended' ? 'Suspended by Admin' : 'Online (Walk-ins)',
          };
        }
        return d;
      })
    );
    showToast('Clinician practice authorization updated');
  };

  const handleApprovePayout = (id: string, doctorName: string, amount: number) => {
    triggerHaptic('success');
    setPayoutsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    );
    showToast(`Approved disbursement of ₦${amount.toLocaleString()} to ${doctorName}`);
  };

  const handleRejectPayout = (id: string) => {
    triggerHaptic('light');
    setPayoutsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
    );
    showToast('Payout request flagged and returned to clinician');
  };

  const handleEndLiveSession = (id: string) => {
    triggerHaptic('medium');
    setLiveSessions((prev) => prev.filter((s) => s.id !== id));
    setSelectedLiveSession(null);
    showToast('Live consultation concluded by platform supervisor');
  };

  const pendingComplaintsCount = complaintsList.filter((c) => c.status === 'pending' || c.status === 'in_review').length;

  const handleResolveComplaint = (id: string, notes?: string) => {
    triggerHaptic('success');
    setComplaintsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'resolved', resolutionNotes: notes || 'Complaint resolved by Platform Administrator.' } : c))
    );
    setSelectedComplaint(null);
    setResolutionInput('');
    showToast('Complaint marked as resolved. Patient notified via SMS & Email!');
  };

  const handleIssueRefundComplaint = (id: string, patientName: string) => {
    triggerHaptic('success');
    setComplaintsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'resolved', resolutionNotes: '100% full consultation fee refunded to patient.' } : c))
    );
    setSelectedComplaint(null);
    setResolutionInput('');
    showToast(`100% full refund approved and issued for ${patientName}!`);
  };

  const handleInviteDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    triggerHaptic('success');
    showToast(`Credentials invitation sent to ${inviteEmail}`);
    setShowInviteModal(false);
    setInviteEmail('');
  };

  const filteredDoctors = doctorsList.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(globalSearch.toLowerCase()) ||
      doc.licenseNo.toLowerCase().includes(globalSearch.toLowerCase()) ||
      doc.hospitalAffiliation.toLowerCase().includes(globalSearch.toLowerCase());
    const matchesStatus =
      doctorStatusFilter === 'all' || doc.status === doctorStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredComplaints = complaintsList.filter((c) => {
    if (complaintFilter !== 'all' && c.status !== complaintFilter) return false;
    if (!globalSearch.trim()) return true;
    const q = globalSearch.toLowerCase();
    return (
      c.patientName.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.doctorName && c.doctorName.toLowerCase().includes(q))
    );
  });

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Dashboard',
      icon: Activity,
      badge: `${liveSessionsCount} Live`,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'complaints' as const,
      label: 'Grievance & Complaints',
      icon: LifeBuoy,
      badge: pendingComplaintsCount > 0 ? `${pendingComplaintsCount} Active` : undefined,
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    {
      id: 'settings' as const,
      label: 'Settings & Compliance',
      icon: Sliders,
    },
  ];

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard & Live Operations';
      case 'complaints':
        return 'Patient & Clinician Grievance Handling';
      case 'settings':
        return 'Administrator Profile & Governance';
      default:
        return 'Dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center text-slate-800">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold font-outfit text-slate-500">
          Loading Telecare Admin Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col lg:flex-row antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <StatusBar className="bg-white text-slate-900 border-b border-slate-100 lg:hidden" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#022434] text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/30 text-xs font-bold font-outfit flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-[#77daa4]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MODERN RESPONSIVE LEFT SIDEBAR (Desktop >= 1024px)                     */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-screen sticky top-0 h-screen z-20">
        {/* Brand & Portal Identity */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#006c44] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold font-outfit text-base text-[#0f172a]">Telecare</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-nunito">Clinical Governance</p>
            </div>
          </div>
        </div>

        {/* Administrator Profile Card */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                alt="SysAdmin Profile"
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold font-outfit text-xs text-[#0f172a] truncate">
                {user.name || 'Admin Joel'}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-nunito">
                {user.email || 'admin@telecare.ng'}
              </p>
              <span className="text-[9px] font-semibold text-emerald-700 block mt-0.5">
                System Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation Pages
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-outfit transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#006c44] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Telehealth Cluster Health & Exit Controls */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-nunito">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">WebRTC Gateways</span>
              <span className="flex items-center space-x-1 text-emerald-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>99.98%</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Lagos, Abuja & London nodes synced</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-outfit">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigate('doctor-discovery');
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors text-center cursor-pointer truncate"
            >
              All Doctors
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigate('security-center');
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors text-center cursor-pointer truncate"
            >
              Security Center
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onNavigate('settings');
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold font-outfit text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Administrator Settings</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP BAR & SLIDE-OUT DRAWER (< 1024px)                          */}
      {/* ========================================================================= */}
      <div className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#006c44] flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold font-outfit text-sm text-[#0f172a]">Telecare Admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate(user.role === 'doctor' ? 'doctor-home' : 'patient-home')}
            className="px-3 py-1.5 text-xs font-semibold font-outfit text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Exit
          </button>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="pt-4 pb-2 border-t border-slate-100 mt-3 space-y-2 animate-in fade-in duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-outfit ${
                    isActive ? 'bg-[#006c44] text-white' : 'text-slate-700 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT CANVAS                                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Breadcrumb & Action Bar */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 lg:static z-10 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-nunito text-slate-500">
                <span>Admin Portal</span>
                <span>/</span>
                <span className="font-semibold text-slate-700">{getBreadcrumbTitle()}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-outfit text-[#0f172a] mt-0.5">
                {getBreadcrumbTitle()}
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search doctors, licenses, tx..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-nunito focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Actions */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  showToast('Telemetry refreshed from WebRTC and banking gateways');
                }}
                title="Refresh Metrics"
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowInviteModal(true);
                }}
                className="px-3.5 py-2 bg-[#006c44] hover:bg-[#005837] text-white text-xs font-semibold font-outfit rounded-xl transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite Doctor</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE DASHBOARD & LIVE OPERATIONS                             */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-nunito">
                    <span>Active Tele-Consultations</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-bold font-outfit text-[#0f172a] tabular-nums">
                      {liveSessionsCount}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">Live Now</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-nunito mt-1">
                    10 Video · 3 Voice · 1 Chat
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-nunito">
                    <span>Pending Licensures</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-bold font-outfit text-[#0f172a] tabular-nums">
                      {pendingDoctorsCount}
                    </span>
                    <span className="text-xs font-semibold text-amber-700">Awaiting MDCN Audit</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-nunito mt-1">
                    Requires admin verification
                  </p>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-nunito">
                    <span>Monthly Gross Booking</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-bold font-outfit text-[#0f172a] tabular-nums">
                      ₦4.85M
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 font-mono">+18% MoM</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-nunito mt-1">
                    Platform 15% Take: <strong className="text-slate-700 font-mono">₦727,500</strong>
                  </p>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-nunito">
                    <span>Platform Uptime</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-bold font-outfit text-[#0f172a] tabular-nums">
                      99.98%
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">Nominal</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-nunito mt-1">
                    WebRTC media clusters green
                  </p>
                </div>
              </div>

              {/* Action Attention Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-outfit text-amber-900">
                        {pendingDoctorsCount} Doctor Applications Awaiting Review
                      </h4>
                      <p className="text-[11px] text-amber-800 font-nunito">
                        MDCN credentials and medical diplomas pending verification
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      const firstPending = doctorsList.find((d) => d.status === 'pending');
                      if (firstPending) setSelectedDoctorDossier(firstPending);
                      else showToast('All pending clinician applications reviewed');
                    }}
                    className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold font-outfit rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Review Now
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-outfit text-sky-900">
                        {pendingPayoutsCount} Clinician NUBAN Payouts Pending
                      </h4>
                      <p className="text-[11px] text-sky-800 font-nunito">
                        Total pending disbursements: ₦205,000
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      const el = document.getElementById('dashboard-payouts-triage');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 bg-sky-800 hover:bg-sky-900 text-white text-xs font-semibold font-outfit rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Review Payouts
                  </button>
                </div>

                {/* Grievances / Complaints Attention Banner */}
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-between md:col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-800 shrink-0">
                      <LifeBuoy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-outfit text-rose-900">
                        {pendingComplaintsCount} Patient Grievances & Disputes Awaiting Action
                      </h4>
                      <p className="text-[11px] text-rose-800 font-nunito">
                        Connection drop reviews, dosage queries, and billing refund requests
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab('complaints');
                    }}
                    className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold font-outfit rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Triage Complaints
                  </button>
                </div>
              </div>

              {/* Dual-Column Operational View */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 Cols): Real-Time Live Consultations */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                            Live Clinical Encounters
                          </h3>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs text-slate-500 font-nunito">
                          Active encrypted sessions streamed over WebRTC
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {liveSessions.length} Active
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 mt-2">
                      {liveSessions.map((session) => (
                        <div
                          key={session.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={session.doctorAvatar}
                                alt={session.doctorName}
                                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#006c44] text-white flex items-center justify-center absolute -bottom-1 -right-1 text-[8px]">
                                {session.modality === 'Video' ? (
                                  <Video className="w-2 h-2" />
                                ) : session.modality === 'Voice' ? (
                                  <Phone className="w-2 h-2" />
                                ) : (
                                  <MessageSquare className="w-2 h-2" />
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-[#0f172a]">
                                  {session.doctorName}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="text-xs text-slate-700">{session.patientName}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-nunito">
                                {session.topic}
                              </p>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>{session.modality} Call</span>
                                <span>·</span>
                                <span>Duration: {session.durationMinutes}m</span>
                                <span>·</span>
                                <span className="text-emerald-700">Loss: {session.packetLoss}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setSelectedLiveSession(session);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-outfit rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span>Inspect Call</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Consult Settlement Logs */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                          Recent Consultation Settlements
                        </h3>
                        <p className="text-xs text-slate-500 font-nunito">
                          Completed visits routed through Nigerian banking settlement
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-nunito">Automated</span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs font-nunito mt-2">
                      {[
                        {
                          id: 'TX-9901',
                          patient: 'Ada Okonkwo',
                          doctor: 'Dr. Anya Sharma',
                          gross: 12500,
                          fee: 1875,
                          net: 10625,
                          time: '12m ago',
                        },
                        {
                          id: 'TX-9900',
                          patient: 'Tunde Bakare',
                          doctor: 'Dr. Kenji Tanaka',
                          gross: 8500,
                          fee: 1275,
                          net: 7225,
                          time: '34m ago',
                        },
                        {
                          id: 'TX-9899',
                          patient: 'Mama Bose',
                          doctor: 'Dr. Ching Ming Yu',
                          gross: 5000,
                          fee: 750,
                          net: 4250,
                          time: '1h ago',
                        },
                      ].map((tx) => (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-800">{tx.id}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600">
                                {tx.patient} → {tx.doctor}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{tx.time}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold font-mono text-[#0f172a] block">
                              ₦{tx.gross.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-700 block">
                              Net Clinician: ₦{tx.net.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right (1 Col): Quick Triage & System Infrastructure */}
                <div className="space-y-4">
                  {/* Quick Doctor Licensure Triage */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                        Pending Clinicians ({pendingDoctorsCount})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          const firstPending = doctorsList.find((d) => d.status === 'pending');
                          if (firstPending) setSelectedDoctorDossier(firstPending);
                          else showToast('All pending clinician applications reviewed');
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold font-outfit cursor-pointer"
                      >
                        Review
                      </button>
                    </div>

                    <div className="space-y-3">
                      {doctorsList
                        .filter((d) => d.status === 'pending')
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2 text-xs"
                          >
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={doc.avatar}
                                alt={doc.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-bold font-outfit text-slate-900 truncate">
                                  {doc.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {doc.licenseNo} · {doc.specialty}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleApproveDoctor(doc.id, doc.name)}
                                className="flex-1 py-1.5 bg-[#006c44] hover:bg-[#005837] text-white font-semibold font-outfit text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                Quick Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedDoctorDossier(doc)}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold font-outfit text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                Dossier
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pending Clinician Payouts Triage Card */}
                  <div
                    id="dashboard-payouts-triage"
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                        Pending NUBAN Disbursements ({pendingPayoutsCount})
                      </h3>
                      <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md font-mono">
                        ₦205,000 Total
                      </span>
                    </div>

                    <div className="space-y-3">
                      {payoutsList
                        .filter((p) => p.status === 'pending')
                        .map((po) => (
                          <div
                            key={po.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 font-outfit">{po.doctorName}</span>
                              <span className="font-mono font-bold text-slate-800">₦{po.amount.toLocaleString()}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-nunito">
                              {po.bankName} · {po.accountNo} (NUBAN)
                            </div>
                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleApprovePayout(po.id, po.doctorName, po.amount)}
                                className="flex-1 py-1.5 bg-[#006c44] hover:bg-[#005837] text-white font-semibold font-outfit text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                Approve Payout
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectPayout(po.id)}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold font-outfit text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                Flag
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Infrastructure Status */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h3 className="font-bold font-outfit text-sm text-[#0f172a] pb-2 border-b border-slate-100">
                      Telecare Health Infrastructure
                    </h3>
                    <div className="space-y-2 text-xs font-nunito">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">WebRTC Video Mesh (Lagos)</span>
                        <span className="text-emerald-700 font-bold font-mono">Optimal</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">HIPAA Encryption Vault</span>
                        <span className="text-emerald-700 font-bold font-mono">Enforced</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">NUBAN Banking Relays</span>
                        <span className="text-emerald-700 font-bold font-mono">Connected</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">WhatsApp / SMS Dispatch</span>
                        <span className="text-emerald-700 font-bold font-mono">99.9% Deliv.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: COMPLAINTS & GRIEVANCE RESOLUTION PORTAL                           */}
          {/* ========================================================================= */}
          {activeTab === 'complaints' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Title & Counters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold font-outfit text-[#0f172a] flex items-center space-x-2">
                    <LifeBuoy className="w-5 h-5 text-rose-600" />
                    <span>Patient & Clinician Complaints Portal</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-nunito mt-0.5">
                    Triage grievances, issue consultation refunds, investigate clinical disputes, and maintain regulatory compliance.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl font-outfit">
                    {pendingComplaintsCount} Active Issues
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
                {[
                  { id: 'all', label: 'All Tickets', count: complaintsList.length },
                  { id: 'pending', label: 'Pending Review', count: complaintsList.filter((c) => c.status === 'pending').length },
                  { id: 'in_review', label: 'In Investigation', count: complaintsList.filter((c) => c.status === 'in_review').length },
                  { id: 'resolved', label: 'Resolved & Closed', count: complaintsList.filter((c) => c.status === 'resolved').length },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setComplaintFilter(f.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-outfit transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      complaintFilter === f.id
                        ? 'bg-[#006c44] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      complaintFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Complaints List */}
              <div className="space-y-3">
                {filteredComplaints.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-bold font-outfit text-slate-800 text-sm">All Complaints Resolved</h4>
                    <p className="text-xs text-slate-400 font-nunito">No tickets currently match the selected filter.</p>
                  </div>
                ) : (
                  filteredComplaints.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            c.severity === 'high' ? 'bg-rose-500' : c.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs font-outfit text-[#0f172a]">{c.patientName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({c.patientEmail})</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              Target Clinician: <strong className="text-slate-600">{c.doctorName || 'General Platform'}</strong> • Session #{c.consultationId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-outfit border ${
                            c.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : c.status === 'in_review'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-nunito">{c.createdAt}</span>
                        </div>
                      </div>

                      {/* Complaint Details */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold font-outfit text-[#0f172a] mb-1">
                          {c.subject}
                        </h4>
                        <p className="text-xs text-slate-600 font-nunito leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      {/* Resolution Notes (if resolved) */}
                      {c.resolutionNotes && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-xs space-y-0.5">
                          <span className="font-bold font-outfit text-emerald-950 block text-[11px]">Resolution Recorded:</span>
                          <p className="text-emerald-800 text-[11px] font-nunito">{c.resolutionNotes}</p>
                        </div>
                      )}

                      {/* Administrator Action Bar */}
                      {c.status !== 'resolved' && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold font-outfit text-slate-400">
                            Category: <span className="uppercase text-slate-600">{c.category}</span>
                          </span>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleIssueRefundComplaint(c.id, c.patientName)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold font-outfit transition-colors cursor-pointer"
                            >
                              Issue 100% Refund
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveComplaint(c.id)}
                              className="px-3 py-1.5 bg-[#006c44] hover:bg-[#005837] text-white rounded-xl text-xs font-bold font-outfit shadow-2xs transition-colors cursor-pointer"
                            >
                              Mark Resolved & Notify
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SETTINGS & ADMINISTRATOR PROFILE PAGE                              */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div>
                <h2 className="text-lg font-bold font-outfit text-[#0f172a]">
                  Settings & Administrator Profile
                </h2>
                <p className="text-xs text-slate-500 font-nunito">
                  Administrative identity, telehealth regulatory compliance, and audit logs
                </p>
              </div>

              {/* 1. Administrator Profile Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                        alt="Admin Profile"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold font-outfit text-base text-[#0f172a]">
                          {user.name || 'Admin Joel'}
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold font-outfit">
                          SysAdmin / Root
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-nunito mt-0.5">
                        {user.email || 'admin@telecare.ng'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => showToast('Admin profile & WebAuthn keys refreshed')}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-[#0f172a] border border-slate-200 font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Update Profile
                    </button>
                  </div>
                </div>

                {/* Profile Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-nunito">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[11px] block">Role Designation</span>
                    <strong className="text-[#0f172a] block mt-0.5">Platform Medical Director</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[11px] block">Privilege Scope</span>
                    <strong className="text-emerald-700 block mt-0.5">Full System Access</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[11px] block">MFA Status</span>
                    <strong className="text-[#0f172a] block mt-0.5">Hardware YubiKey Enforced</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[11px] block">Session Authentication</span>
                    <strong className="text-[#0f172a] block mt-0.5">TLS 1.3 · Lagos IP</strong>
                  </div>
                </div>
              </div>

              {/* 2. Platform Governance Policies */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="font-bold font-outfit text-base text-[#0f172a]">
                    Platform Governance & Telehealth Compliance
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito">
                    Global regulatory configuration for consultations, doctor onboarding, and NDPR privacy
                  </p>
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold font-outfit text-sm text-[#0f172a]">
                        HIPAA & NDPR Data Compliance Verification
                      </h4>
                      <p className="text-xs text-slate-500 font-nunito">
                        Enforce end-to-end encryption for all video calls and digital prescriptions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSettings((prev) => ({ ...prev, hipaaCompliance: !prev.hipaaCompliance }));
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${
                        settings.hipaaCompliance ? 'bg-[#006c44] justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-xs" />
                    </button>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold font-outfit text-sm text-[#0f172a]">
                        Automated 15-Minute Appointment Reminders
                      </h4>
                      <p className="text-xs text-slate-500 font-nunito">
                        Trigger automated notification cards 15 minutes before scheduled appointments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSettings((prev) => ({ ...prev, autoReminders: !prev.autoReminders }));
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${
                        settings.autoReminders ? 'bg-[#006c44] justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-xs" />
                    </button>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold font-outfit text-sm text-[#0f172a]">
                        Require Doctor License Manual Verification
                      </h4>
                      <p className="text-xs text-slate-500 font-nunito">
                        New doctor accounts must be verified in the Doctors Approval tab before appearing in patient searches.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSettings((prev) => ({
                          ...prev,
                          requireDoctorVerification: !prev.requireDoctorVerification,
                        }));
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${
                        settings.requireDoctorVerification ? 'bg-[#006c44] justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-xs" />
                    </button>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold font-outfit text-sm text-[#0f172a]">
                        System Maintenance Mode
                      </h4>
                      <p className="text-xs text-slate-500 font-nunito">
                        Temporarily restrict new bookings while conducting clinical tele-infrastructure upgrades.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSettings((prev) => ({
                          ...prev,
                          maintenanceMode: !prev.maintenanceMode,
                        }));
                        showToast(settings.maintenanceMode ? 'Maintenance Mode Disabled' : 'Maintenance Mode Enabled');
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${
                        settings.maintenanceMode ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Forensic Security Audit Logs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                    Administrative Audit Trail & Access Logs
                  </h3>
                  <span className="text-xs text-slate-400 font-nunito">Read-Only Forensic Log</span>
                </div>

                <div className="space-y-2 text-xs font-nunito">
                  {[
                    {
                      event: 'Doctor credential approved (Dr. Anya Sharma)',
                      admin: 'sysadmin_joel',
                      time: '12m ago',
                      status: 'SUCCESS',
                    },
                    {
                      event: 'NUBAN payout dispatched: ₦250,000 to Access Bank',
                      admin: 'sysadmin_joel',
                      time: '35m ago',
                      status: 'SETTLED',
                    },
                    {
                      event: 'HIPAA end-to-end encryption heartbeat passed',
                      admin: 'automated_daemon',
                      time: '1h ago',
                      status: 'VERIFIED',
                    },
                    {
                      event: 'Administrator session authenticated with WebAuthn',
                      admin: 'sysadmin_joel',
                      time: '2h ago',
                      status: 'SUCCESS',
                    },
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#0f172a]">{log.event}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 font-mono text-[11px]">{log.admin}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {log.status}
                        </span>
                        <span className="text-[11px] text-slate-400">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. MODALS & DRAWERS                                                       */}
      {/* ========================================================================= */}

      {/* Live Call Diagnostics Modal */}
      {selectedLiveSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                    Live Telemetry: {selectedLiveSession.id}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-nunito">
                    Encrypted WebRTC Session Diagnostics
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLiveSession(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs font-nunito">
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Physician:</span>
                <strong className="text-slate-800">{selectedLiveSession.doctorName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <strong className="text-slate-800">{selectedLiveSession.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clinical Focus:</span>
                <span className="text-slate-700">{selectedLiveSession.topic}</span>
              </div>
            </div>

            {/* Real-time Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 block">Packet Loss</span>
                <strong className="text-emerald-950 font-bold block mt-0.5">
                  {selectedLiveSession.packetLoss}
                </strong>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 block">Latency</span>
                <strong className="text-emerald-950 font-bold block mt-0.5">
                  {selectedLiveSession.latencyMs}ms
                </strong>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 block">Bitrate</span>
                <strong className="text-emerald-950 font-bold block mt-0.5">
                  {selectedLiveSession.bitrateKbps} kbps
                </strong>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => handleEndLiveSession(selectedLiveSession.id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
              >
                Conclude Session Remotely
              </button>
              <button
                type="button"
                onClick={() => setSelectedLiveSession(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Licensure Dossier Modal */}
      {selectedDoctorDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedDoctorDossier.avatar}
                  alt={selectedDoctorDossier.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div>
                  <h3 className="font-bold font-outfit text-base text-[#0f172a]">
                    {selectedDoctorDossier.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito">
                    {selectedDoctorDossier.specialty}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctorDossier(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-nunito">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-500">MDCN Registration:</span>
                  <strong className="font-mono text-slate-800">
                    {selectedDoctorDossier.licenseNo}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Council Verification:</span>
                  <span className="text-emerald-700 font-semibold">Active & Good Standing</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary Hospital:</span>
                  <span className="text-slate-800">{selectedDoctorDossier.hospitalAffiliation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Medical Degree:</span>
                  <span className="text-slate-800">{selectedDoctorDossier.graduatedFrom}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                <strong className="block font-semibold">Verified Credentials Checklist:</strong>
                <p>✓ National Medical Council license verified via live registry</p>
                <p>✓ Indemnity insurance coverage active</p>
                <p>✓ Criminal & disciplinary background audit cleared</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              {selectedDoctorDossier.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() =>
                    handleApproveDoctor(selectedDoctorDossier.id, selectedDoctorDossier.name)
                  }
                  className="flex-1 py-2.5 bg-[#006c44] hover:bg-[#005837] text-white font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Approve & Grant Practice
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleSuspendDoctor(selectedDoctorDossier.id)}
                  className={`flex-1 py-2.5 font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer text-white ${
                    selectedDoctorDossier.status === 'suspended'
                      ? 'bg-[#006c44] hover:bg-[#005837]'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {selectedDoctorDossier.status === 'suspended' ? 'Reactivate License' : 'Suspend License'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDoctorDossier(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Doctor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                    Invite Telehealth Clinician
                  </h3>
                  <p className="text-[11px] text-slate-500 font-nunito">
                    Send onboarding invite with credential upload link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteDoctor} className="space-y-4 text-xs font-nunito">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Doctor Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dr.nwachukwu@hospital.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Medical Specialty
                </label>
                <select
                  value={inviteSpecialty}
                  onChange={(e) => setInviteSpecialty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="General Practice">General Practice</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                <p>The invited physician will receive a secure portal link to:</p>
                <p>1. Complete identity verification</p>
                <p>2. Upload MDCN license and university diplomas</p>
                <p>3. Submit NUBAN bank account for consultation payouts</p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c44] hover:bg-[#005837] text-white font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
