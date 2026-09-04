import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Video,
  MessageSquare,
  Phone,
  Search,
  Filter,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  ChevronRight,
  ArrowUpDown,
  User,
  Sparkles,
  ArrowLeft,
  Send,
  Paperclip,
  Camera,
  MoreHorizontal,
  Pill,
  Check,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import { ScreenId, ChatMessage, Doctor, UserRole } from '../../types';
import { mockDoctors, mockChatMessages } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';

interface ConsultationItem {
  id: string;
  patientName: string;
  patientAvatar: string;
  doctorName: string;
  doctorAvatar: string;
  specialty: string;
  type: 'Video' | 'Chat' | 'Voice';
  dateTimeStr: string;
  rawDate: string;
  sortTimestamp: number; // Higher number = newer
  status: 'live' | 'upcoming' | 'completed' | 'cancelled';
  chiefComplaint: string;
  notes?: string;
  hasPrescription?: boolean;
  price: number;
}

const mockConsultationsList: ConsultationItem[] = [
  {
    id: 'c-1',
    patientName: 'Ngozi Adebayo',
    patientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Anya Sharma',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialty: 'Pediatric Specialist',
    type: 'Video',
    dateTimeStr: 'Today, 09:00 AM',
    rawDate: '2026-09-02T09:00:00',
    sortTimestamp: 1788339600000,
    status: 'live',
    chiefComplaint: 'High Fever (39.2°C), Lethargy & Mild Cough',
    price: 10000,
  },
  {
    id: 'c-2',
    patientName: 'Tunde Bakare',
    patientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Kenji Tanaka',
    doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialty: 'Cardiologist',
    type: 'Chat',
    dateTimeStr: 'Today, 10:30 AM',
    rawDate: '2026-09-02T10:30:00',
    sortTimestamp: 1788345000000,
    status: 'upcoming',
    chiefComplaint: 'Hypertension Follow-up & Daily BP Reading Logs',
    price: 5000,
  },
  {
    id: 'c-3',
    patientName: 'Mama Bose',
    patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Fatima Al-Fayed',
    doctorAvatar: 'https://images.unsplash.com/photo-1594824813566-88855ce78961?auto=format&fit=crop&q=80&w=300',
    specialty: 'Dermatology & Pain Care',
    type: 'Video',
    dateTimeStr: 'Today, 11:45 AM',
    rawDate: '2026-09-02T11:45:00',
    sortTimestamp: 1788349500000,
    status: 'upcoming',
    chiefComplaint: 'Severe Knee Joint Inflammation & Reduced Mobility',
    price: 12000,
  },
  {
    id: 'c-4',
    patientName: 'Ada Okonkwo',
    patientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    doctorName: 'Dr. Sarah Johnson',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialty: 'Pediatrics',
    type: 'Video',
    dateTimeStr: 'Today, 02:30 PM',
    rawDate: '2026-09-02T14:30:00',
    sortTimestamp: 1788359400000,
    status: 'upcoming',
    chiefComplaint: 'Pediatric Wheezing & Allergic Asthma Triage',
    price: 10000,
  },
  {
    id: 'c-5',
    patientName: 'Kelechi Nnamdi',
    patientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Emeka',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialty: 'General Practitioner',
    type: 'Voice',
    dateTimeStr: 'Yesterday, 04:15 PM',
    rawDate: '2026-09-01T16:15:00',
    sortTimestamp: 1788279300000,
    status: 'completed',
    chiefComplaint: 'Acute Sinus Pressure & Facial Soreness',
    notes: 'Prescribed Amoxicillin 500mg and Nasal Decongestant Spray. Advised 5 days rest.',
    hasPrescription: true,
    price: 7000,
  },
  {
    id: 'c-6',
    patientName: 'Amina Yusuf',
    patientAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Fatima Al-Fayed',
    doctorAvatar: 'https://images.unsplash.com/photo-1594824813566-88855ce78961?auto=format&fit=crop&q=80&w=300',
    specialty: 'Dermatology Specialist',
    type: 'Video',
    dateTimeStr: 'Aug 28, 2026, 02:00 PM',
    rawDate: '2026-08-28T14:00:00',
    sortTimestamp: 1787925600000,
    status: 'completed',
    chiefComplaint: 'Eczema Flare-up on Forearm & Itching',
    notes: 'Reviewed skin photos. Hydrocortisone cream prescribed. Symptoms improving.',
    hasPrescription: true,
    price: 12000,
  },
  {
    id: 'c-7',
    patientName: 'Chidi Okafor',
    patientAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Ching Ming Yu',
    doctorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialty: 'Family Medicine',
    type: 'Chat',
    dateTimeStr: 'Aug 24, 2026, 11:30 AM',
    rawDate: '2026-08-24T11:30:00',
    sortTimestamp: 1787571000000,
    status: 'completed',
    chiefComplaint: 'Acid Reflux & Heartburn after meals',
    notes: 'Dietary adjustments recommended. Omeprazole 20mg course provided.',
    hasPrescription: true,
    price: 5000,
  },
  {
    id: 'c-8',
    patientName: 'Grace Danjuma',
    patientAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Anya Sharma',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialty: 'General Practitioner',
    type: 'Video',
    dateTimeStr: 'Aug 19, 2026, 09:15 AM',
    rawDate: '2026-08-19T09:15:00',
    sortTimestamp: 1787130900000,
    status: 'completed',
    chiefComplaint: 'Eye Redness, Irritation & Conjunctivitis',
    notes: 'Antibiotic eye drops prescribed. Cleared to resume normal activities.',
    hasPrescription: true,
    price: 10000,
  },
  {
    id: 'c-9',
    patientName: 'Samuel Oladipo',
    patientAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    doctorName: 'Dr. Kenji Tanaka',
    doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialty: 'Cardiologist',
    type: 'Voice',
    dateTimeStr: 'Aug 12, 2026, 03:45 PM',
    rawDate: '2026-08-12T15:45:00',
    sortTimestamp: 1786549500000,
    status: 'completed',
    chiefComplaint: 'Routine Blood Pressure Check & Med Refill',
    notes: 'BP stable at 122/80. 30-day Lisinopril prescription renewed.',
    hasPrescription: true,
    price: 7000,
  },
];

interface ActiveChatScreenProps {
  doctor?: Doctor;
  onNavigate: (screen: ScreenId) => void;
  role?: UserRole;
}

export const ActiveChatScreen: React.FC<ActiveChatScreenProps> = ({
  doctor,
  onNavigate,
  role = 'patient',
}) => {
  const currentDoctor = doctor || mockDoctors[0];

  // State
  const [activeSession, setActiveSession] = useState<ConsultationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'previous'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Video' | 'Chat' | 'Voice'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Messages state for active chat drawer
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputText, setInputText] = useState('');

  // Always sorted chronologically: Newest to Previous (or Oldest if toggled)
  const sortedConsultations = [...mockConsultationsList].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.sortTimestamp - a.sortTimestamp;
    }
    return a.sortTimestamp - b.sortTimestamp;
  });

  // Filter logic
  const filteredConsultations = sortedConsultations.filter((item) => {
    // Search query filter
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Type filter
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;

    // Tab filter
    if (activeTab === 'new') {
      return item.status === 'live' || item.status === 'upcoming';
    }
    if (activeTab === 'previous') {
      return item.status === 'completed' || item.status === 'cancelled';
    }

    return true;
  });

  // Split into New/Today and Previous for structured headers
  const newConsultations = filteredConsultations.filter(
    (c) => c.status === 'live' || c.status === 'upcoming'
  );
  const previousConsultations = filteredConsultations.filter(
    (c) => c.status === 'completed' || c.status === 'cancelled'
  );

  // Chat simulation
  const simulateStatusProgressionAndReply = (msgId: string) => {
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: 'delivered' } : m))
      );
    }, 600);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: 'read' } : m))
      );
    }, 1300);

    setTimeout(() => {
      const docReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'doctor',
        senderName: activeSession ? activeSession.doctorName : currentDoctor.name,
        text: "Thank you for sharing your update. I have reviewed your clinical notes and prescription details.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };
      setMessages((prev) => [...prev, docReply]);
    }, 2200);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newId = Date.now().toString();
    const newMsg: ChatMessage = {
      id: newId,
      sender: role === 'doctor' ? 'doctor' : 'patient',
      senderName: role === 'doctor' ? currentDoctor.name : 'Ada Okonkwo',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    triggerHaptic('light');

    if (role === 'patient') {
      simulateStatusProgressionAndReply(newId);
    }
  };

  const handleSendPhoto = () => {
    const newId = Date.now().toString();
    const photoMsg: ChatMessage = {
      id: newId,
      sender: role === 'doctor' ? 'doctor' : 'patient',
      senderName: role === 'doctor' ? currentDoctor.name : 'Ada Okonkwo',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages((prev) => [...prev, photoMsg]);
    triggerHaptic('light');

    if (role === 'patient') {
      simulateStatusProgressionAndReply(newId);
    }
  };

  const handleStartConsultationCall = (consultation: ConsultationItem) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
    triggerHaptic('medium');

    if (consultation.type === 'Video') {
      onNavigate('video-call');
    } else {
      setActiveSession(consultation);
    }
  };

  // IF ACTIVE CHAT ROOM IS OPEN
  if (activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6fafd] via-[#eef4f8] to-[#f6fafd] pb-24 flex flex-col justify-between w-full max-w-4xl mx-auto text-[#171c1f]">
        <StatusBar />

        {/* Chat Header */}
        <div className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveSession(null);
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center space-x-1 text-xs font-bold font-outfit"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
              <span className="hidden sm:inline">Sessions List</span>
            </button>

            <div className="relative">
              <img
                src={role === 'doctor' ? activeSession.patientAvatar : activeSession.doctorAvatar}
                alt="Avatar"
                className="w-10 h-10 rounded-2xl object-cover border border-slate-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>

            <div>
              <h3 className="font-bold font-outfit text-sm text-[#022434] leading-tight">
                {role === 'doctor' ? activeSession.patientName : activeSession.doctorName}
              </h3>
              <span className="text-[11px] text-slate-500 font-nunito flex items-center space-x-1">
                <span>{activeSession.type} Consultation</span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">Active Room</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStartConsultationCall(activeSession)}
              className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#006c44] transition-colors"
              title="Launch Video Call"
            >
              <Video className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setActiveSession(null);
              }}
              className="px-3 py-1.5 border border-red-200 text-red-600 font-bold font-outfit text-xs rounded-xl hover:bg-red-50 transition-all active:scale-95"
            >
              Close Chat
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((msg) => {
            const isPatient = msg.sender === 'patient';
            const isOwnMessage = role === 'doctor' ? msg.sender === 'doctor' : msg.sender === 'patient';

            return (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${isPatient ? 'justify-end' : 'justify-start'}`}
              >
                {!isPatient && (
                  <img
                    src={activeSession.doctorAvatar}
                    alt={activeSession.doctorName}
                    className="w-7 h-7 rounded-full object-cover mb-1"
                  />
                )}

                <div
                  className={`max-w-[78%] p-3.5 rounded-3xl text-sm font-nunito shadow-xs ${
                    isPatient
                      ? 'bg-[#77daa4] text-[#022434] rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 rounded-bl-xs border border-slate-100'
                  }`}
                >
                  {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Attached photo" className="rounded-2xl mt-1 max-h-48 object-cover w-full" />
                  )}

                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className="text-[10px] opacity-75">{msg.timestamp}</span>
                    {isOwnMessage && (
                      <span className="inline-flex items-center ml-0.5">
                        {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-[#022434]/50" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-[#022434]/60" />}
                        {(msg.status === 'read' || !msg.status) && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-700 font-bold" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Action Chips */}
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar">
          <button
            onClick={handleSendPhoto}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/90 border border-slate-200 rounded-full text-xs font-bold font-outfit text-slate-700 shadow-xs hover:bg-slate-50 whitespace-nowrap active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>Send Medical Photo</span>
          </button>

          <button
            onClick={() => onNavigate('new-prescription')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/90 border border-slate-200 rounded-full text-xs font-bold font-outfit text-slate-700 shadow-xs hover:bg-slate-50 whitespace-nowrap active:scale-95"
          >
            <Pill className="w-3.5 h-3.5 text-[#006c44]" />
            <span>Digital Rx</span>
          </button>

          <button
            onClick={() => onNavigate('health-records')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/90 border border-slate-200 rounded-full text-xs font-bold font-outfit text-slate-700 shadow-xs hover:bg-slate-50 whitespace-nowrap active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Health EHR</span>
          </button>
        </div>

        {/* Message Input */}
        <div className="p-3 bg-white border-t border-slate-200/80 sticky bottom-14 z-20 shadow-xs">
          <div className="flex items-center space-x-2 bg-slate-100 rounded-full px-4 py-2">
            <button onClick={handleSendPhoto} className="text-slate-500 hover:text-slate-800 p-1">
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-sm font-nunito focus:outline-none text-[#171c1f]"
            />

            <button
              onClick={handleSendMessage}
              className="p-2 bg-[#006c44] text-white rounded-full hover:bg-[#022434] transition-all transform active:scale-90"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN REDESIGNED SESSIONS PAGE (SORTED FROM NEW TO PREVIOUS)
  return (
    <div className="min-h-screen bg-[#f6fafd] pb-28 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-[#171c1f]">
      <StatusBar className="-mx-4 sm:-mx-6 lg:-mx-8" />

      {/* Header */}
      <Header
        title="Consultation Sessions"
        showBack
        onBack={() => onNavigate(role === 'doctor' ? 'doctor-home' : 'patient-home')}
        showBell
        bellCount={3}
      />

      <div className="px-1 sm:px-3 space-y-5 mt-2">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-[#022434] via-[#1c3a4a] to-[#012f45] text-white rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden border border-slate-700/50">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#77daa4]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-outfit tracking-wide">
                  Patient Care Queue
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-outfit tracking-tight text-white mt-1.5">
                Consultations
              </h2>
              <p className="text-xs text-slate-300 font-nunito mt-0.5">
                Active sessions, scheduled appointments, and medical history logs.
              </p>
            </div>

            {role === 'patient' && (
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigate('book-consultation');
                }}
                className="px-3.5 py-2 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-semibold font-outfit text-xs rounded-xl shadow-xs transition-all shrink-0 active:scale-95 whitespace-nowrap self-start sm:self-center"
              >
                + Book New Session
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-xl p-2 border border-white/10">
              <span className="text-[11px] text-slate-300 font-nunito block">Active</span>
              <span className="text-base sm:text-xl font-bold font-outfit text-emerald-300">
                {newConsultations.length}
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/10">
              <span className="text-[11px] text-slate-300 font-nunito block">History</span>
              <span className="text-base sm:text-xl font-bold font-outfit text-blue-300">
                {previousConsultations.length}
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/10">
              <span className="text-[11px] text-slate-300 font-nunito block">Total</span>
              <span className="text-base sm:text-xl font-bold font-outfit text-white">
                {sortedConsultations.length}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filtering Controls */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, doctor, or complaint..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-nunito focus:outline-none focus:border-[#006c44] shadow-xs"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Timeline Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1 rounded-2xl overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold font-outfit transition-all whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white text-[#022434] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({mockConsultationsList.length})
              </button>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('new');
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold font-outfit transition-all whitespace-nowrap flex items-center space-x-1 ${
                  activeTab === 'new'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>New & Live</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('previous');
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold font-outfit transition-all whitespace-nowrap ${
                  activeTab === 'previous'
                    ? 'bg-[#1c3a4a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Previous History
              </button>
            </div>

            {/* Type Filter & Sort Toggle */}
            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white border border-slate-200 text-xs font-medium font-outfit text-slate-700 px-2.5 py-1.5 rounded-xl focus:outline-none shadow-xs cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="Video">Video Calls</option>
                <option value="Chat">Text Chats</option>
                <option value="Voice">Voice Calls</option>
              </select>

              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
                }}
                className="flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium font-outfit text-slate-700 shadow-xs hover:border-slate-300 active:scale-95"
                title="Toggle Sort Order"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#006c44]" />
                <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONSULTATIONS LIST DISPLAY (SORTED CHRONOLOGICALLY FROM NEW TO PREVIOUS) */}
        <div className="space-y-5 mt-3">
          {/* SECTION 1: NEW & TODAY'S CONSULTATIONS */}
          {(activeTab === 'all' || activeTab === 'new') && newConsultations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                    Active & Today's Sessions
                  </h3>
                  <span className="bg-emerald-100 text-[#006c44] text-[11px] font-medium px-2 py-0.5 rounded-full">
                    {newConsultations.length} Active
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-nunito hidden sm:inline">Live Queue</span>
              </div>

              <div className="space-y-3">
                {newConsultations.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white p-3.5 sm:p-4 rounded-2xl border transition-all shadow-xs hover:shadow-md ${
                      item.status === 'live'
                        ? 'border-emerald-400 ring-2 ring-emerald-500/15 bg-gradient-to-r from-emerald-50/30 via-white to-white'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Avatar & Info */}
                      <div className="flex items-start space-x-3 min-w-0">
                        <img
                          src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                          alt={item.patientName}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 shadow-xs"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold font-outfit text-sm text-[#022434] truncate">
                              {role === 'doctor' ? item.patientName : item.doctorName}
                            </h4>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                                item.status === 'live'
                                  ? 'bg-emerald-500 text-white animate-pulse'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              <span>{item.status === 'live' ? '● LIVE' : 'UPCOMING'}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 font-nunito mt-0.5 leading-snug">
                            {role === 'doctor' ? `Complaint: ${item.chiefComplaint}` : `${item.specialty} • ${item.doctorName}`}
                          </p>

                          <div className="flex items-center space-x-2.5 mt-2 text-[11px] font-medium text-slate-600">
                            <span className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-[#006c44]" />
                              <span>{item.dateTimeStr}</span>
                            </span>

                            <span className="flex items-center space-x-1 bg-emerald-50 text-[#006c44] border border-emerald-200/70 px-2 py-0.5 rounded-md">
                              {item.type === 'Video' && <Video className="w-3 h-3" />}
                              {item.type === 'Chat' && <MessageSquare className="w-3 h-3" />}
                              {item.type === 'Voice' && <Phone className="w-3 h-3" />}
                              <span>{item.type}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0 sm:self-center pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 justify-end">
                        <button
                          onClick={() => {
                            triggerHaptic('selection');
                            setActiveSession(item);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-outfit text-xs transition-colors whitespace-nowrap shrink-0"
                        >
                          Open Chat
                        </button>

                        <button
                          onClick={() => handleStartConsultationCall(item)}
                          className="px-3 py-1.5 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-semibold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
                        >
                          Start Call
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: PREVIOUS CONSULTATIONS (COMPLETED / PAST HISTORY) */}
          {(activeTab === 'all' || activeTab === 'previous') && previousConsultations.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                    Completed Consultations
                  </h3>
                  <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-full border border-slate-200">
                    {previousConsultations.length} Logs
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-nunito hidden sm:inline">Clinical History</span>
              </div>

              <div className="space-y-3">
                {previousConsultations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0">
                        <img
                          src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                          alt={item.patientName}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 grayscale-20"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold font-outfit text-sm text-[#022434] truncate">
                              {role === 'doctor' ? item.patientName : item.doctorName}
                            </h4>
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 font-nunito mt-0.5 leading-snug">
                            Complaint: {item.chiefComplaint}
                          </p>

                          {item.notes && (
                            <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-nunito">
                              Note: {item.notes}
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mt-2 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{item.dateTimeStr}</span>
                            </span>
                            <span>•</span>
                            <span className="text-slate-600">{item.type} Session</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 sm:self-center pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 justify-end">
                        <button
                          onClick={() => {
                            triggerHaptic('selection');
                            onNavigate('prescription-detail');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006c44] border border-emerald-200/80 font-semibold font-outfit text-xs rounded-xl transition-all whitespace-nowrap shrink-0"
                        >
                          View Rx
                        </button>

                        <button
                          onClick={() => {
                            triggerHaptic('selection');
                            setActiveSession(item);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-outfit text-xs rounded-xl whitespace-nowrap shrink-0"
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {filteredConsultations.length === 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold font-outfit text-[#022434] text-base">No consultations found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-nunito">
                No consultations match your current search or filter criteria. Try resetting filters or search terms.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                  setTypeFilter('all');
                }}
                className="px-4 py-2 bg-[#1c3a4a] text-white text-xs font-bold font-outfit rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
