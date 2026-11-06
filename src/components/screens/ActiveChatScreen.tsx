import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Video, MessageSquare, Phone, Search, Filter, Clock, Calendar, CheckCircle2, FileText, ChevronRight,
  ChevronDown, ChevronUp, ArrowUpDown, User, Sparkles, ArrowLeft, Send, Paperclip, Camera, MoreHorizontal,
  Check, CheckCheck, AlertCircle, Stethoscope, Plus, Mic, Pill
} from 'lucide-react';
import { ScreenId, ChatMessage, Doctor, UserRole, BookingSummary } from '../../types';
import { mockDoctors, currentUserPatient, currentUserDoctor } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { ConsultationSummaryPDFModal } from '../common/ConsultationSummaryPDFModal';
import { ClinicalDocumentationModal } from '../common/ClinicalDocumentationModal';
import { PrescriptionComposerModal } from '../common/PrescriptionComposerModal';
import { NotificationsDrawer } from '../common/NotificationsDrawer';
import { processJoinOrPayConsultation, isConsultationPaid } from '../../utils/consultationPayment';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { primeApi } from '../../services/apiClient';

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
  sortTimestamp: number;
  status: 'live' | 'upcoming' | 'completed' | 'cancelled';
  chiefComplaint: string;
  notes?: string;
  hasPrescription?: boolean;
  price: number;
}

export interface ActiveChatScreenProps {
  onNavigate: (screen: ScreenId) => void;
  role?: UserRole;
  onSaveBookingSummary?: (summary: BookingSummary) => void;
  onActiveSessionChange?: (hasSession: boolean) => void;
}

export const ActiveChatScreen: React.FC<ActiveChatScreenProps> = ({
  onNavigate,
  role = 'patient',
  onSaveBookingSummary,
  onActiveSessionChange,
}) => {
  const [activeSession, setActiveSession] = useState<ConsultationItem | null>(null);
  const [consultationsList, setConsultationsList] = useState<ConsultationItem[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);

  // Load live appointments from backend
  const loadConsultations = async () => {
    try {
      const apts = await primeApi.getAppointments();
      const mapped: ConsultationItem[] = (apts || []).map((a) => ({
        id: a.id,
        patientName: a.patientName || 'Ada Okonkwo',
        patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        doctorName: a.doctorName,
        doctorAvatar: a.doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
        specialty: a.doctorSpecialty || 'General Practice',
        type: (a.type as any) || 'Chat',
        dateTimeStr: `${a.scheduledDate}, ${a.timeSlot}`,
        rawDate: new Date().toISOString(),
        sortTimestamp: Date.now(),
        status: (a.status as any) || 'upcoming',
        chiefComplaint: a.notes || 'General Telehealth Consult',
        price: a.price || 10000,
      }));
      setConsultationsList(mapped);
    } catch {
      setConsultationsList([]);
    } finally {
      setIsLoadingConsultations(false);
    }
  };

  useEffect(() => {
    loadConsultations();
    window.addEventListener('appointment-alerts-updated', loadConsultations);
    return () => window.removeEventListener('appointment-alerts-updated', loadConsultations);
  }, []);

  useEffect(() => {
    onActiveSessionChange?.(Boolean(activeSession));
  }, [activeSession, onActiveSessionChange]);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'previous'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Video' | 'Chat' | 'Voice'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isActiveSessionsExpanded, setIsActiveSessionsExpanded] = useState(true);
  const [isCompletedSessionsExpanded, setIsCompletedSessionsExpanded] = useState(false);
  
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedPatientForDoc, setSelectedPatientForDoc] = useState('');
  const [selectedConsultationForPDF, setSelectedConsultationForPDF] = useState<any>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedPatientForRx, setSelectedPatientForRx] = useState('');

  // Real-time Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real device microphone recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live polling for two-way chat messages
  useEffect(() => {
    if (!activeSession) return;

    const fetchMessages = () => {
      primeApi.getChatMessages(activeSession.id).then((fetched) => {
        if (Array.isArray(fetched)) {
          setMessages(fetched);
        }
      }).catch(() => {});
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (activeSession) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSession]);

  const handleStartConsultationCall = (item: ConsultationItem) => {
    triggerHaptic('selection');
    const isPaid = isConsultationPaid(item.id);
    
    if (isPaid || item.status === 'live' || item.status === 'completed') {
      if (item.type === 'Video' || item.type === 'Voice') {
        onNavigate('video-call');
      } else {
        setActiveSession(item);
      }
    } else {
      processJoinOrPayConsultation({
        id: item.id,
        type: item.type,
        doctorId: 'doc-anya',
        doctorName: item.doctorName,
        doctorSpecialty: item.specialty,
        doctorAvatar: item.doctorAvatar,
        price: item.price,
        onNavigate,
        onSaveBookingSummary,
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeSession) return;
    
    triggerHaptic('light');
    const textToSend = chatMessage.trim();
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: role === 'doctor' ? 'doctor' : 'patient',
      senderName: role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setChatMessage('');

    try {
      await primeApi.sendChatMessage(activeSession.id, {
        sender: newMessage.sender,
        senderName: newMessage.senderName,
        text: newMessage.text,
      });
    } catch (err) {
      console.warn('Failed to send live message to server', err);
    }
  };

  // Real device microphone recording for voice notes
  const handleToggleVoiceRecording = async () => {
    if (isRecordingAudio) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecordingAudio(false);
        triggerHaptic('success');
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        if (audioBlob.size > 0 && activeSession) {
          const voiceMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: role === 'doctor' ? 'doctor' : 'patient',
            senderName: role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
            text: `🎤 Voice Note (${Math.round(audioBlob.size / 1024) || 1} KB)`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
          };
          setMessages((prev) => [...prev, voiceMsg]);
          await primeApi.sendChatMessage(activeSession.id, {
            sender: voiceMsg.sender,
            senderName: voiceMsg.senderName,
            text: voiceMsg.text,
          }).catch(() => {});
          showToast('Voice note sent to consultation');
        }
      };

      recorder.start();
      setIsRecordingAudio(true);
      triggerHaptic('medium');
      showToast('Recording voice note... Tap microphone again to send');
    } catch {
      showToast('Microphone access denied or unavailable on this device');
    }
  };

  // Real device photo / file attachment
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const imgMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: role === 'doctor' ? 'doctor' : 'patient',
        senderName: role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
        text: `📷 Shared photo: ${file.name}`,
        imageUrl: base64,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      setMessages((prev) => [...prev, imgMsg]);
      await primeApi.sendChatMessage(activeSession.id, {
        sender: imgMsg.sender,
        senderName: imgMsg.senderName,
        text: imgMsg.text,
        imageUrl: imgMsg.imageUrl,
      }).catch(() => {});
      showToast('Attachment uploaded to consultation');
    };
    reader.readAsDataURL(file);
  };

  const filteredConsultations = consultationsList
    .filter(c => {
      if (activeTab === 'new') return c.status === 'live' || c.status === 'upcoming';
      if (activeTab === 'previous') return c.status === 'completed' || c.status === 'cancelled';
      return true;
    })
    .filter(c => typeFilter === 'all' || c.type === typeFilter)
    .filter(c => {
      const searchLower = searchQuery.toLowerCase();
      return (
        c.patientName.toLowerCase().includes(searchLower) ||
        c.doctorName.toLowerCase().includes(searchLower) ||
        c.chiefComplaint.toLowerCase().includes(searchLower) ||
        c.specialty.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      return sortOrder === 'newest' ? b.sortTimestamp - a.sortTimestamp : a.sortTimestamp - b.sortTimestamp;
    });

  const newConsultations = filteredConsultations.filter(c => c.status === 'live' || c.status === 'upcoming');
  const previousConsultations = filteredConsultations.filter(c => c.status === 'completed' || c.status === 'cancelled');

  if (activeSession) {
    return (
      <div className="flex flex-col h-[100dvh] bg-slate-100/70 font-outfit relative overflow-hidden">
        <StatusBar className="md:hidden" />
        {/* Chat Container */}
        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto bg-white shadow-sm border-x border-slate-200 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveSession(null);
                }}
                className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={role === 'doctor' ? activeSession.patientAvatar : activeSession.doctorAvatar}
                    alt={role === 'doctor' ? activeSession.patientName : activeSession.doctorName}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-200 shadow-xs"
                  />
                  {activeSession.status === 'live' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-[#022434] leading-tight">
                    {role === 'doctor' ? activeSession.patientName : activeSession.doctorName}
                  </h2>
                  <p className="text-xs text-slate-500 font-nunito flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Online</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {role === 'doctor' && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedPatientForRx(activeSession.patientName);
                    setIsPrescriptionModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#006c44] hover:bg-[#005233] text-white rounded-xl text-xs font-bold font-outfit flex items-center space-x-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Issue E-Prescription in Consultation"
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Issue Rx</span>
                </button>
              )}
              <button 
                onClick={() => onNavigate('video-call')}
                className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                title="Start Video Consultation"
              >
                <Video className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onNavigate('video-call')}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Start Voice Consultation"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/70 font-nunito">
            <div className="text-center my-4">
              <span className="bg-slate-200/60 text-slate-600 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {activeSession.dateTimeStr}
              </span>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 max-w-sm mx-auto text-center space-y-2 shadow-xs">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm text-blue-900 font-medium">
                This session is end-to-end encrypted.
              </p>
              <p className="text-[10px] sm:text-xs text-blue-700/80">
                Only you and the {role === 'doctor' ? 'patient' : 'doctor'} can read these messages.
              </p>
            </div>

            {messages.map((msg, idx) => {
              const isMe = msg.sender === (role === 'doctor' ? 'doctor' : 'patient');
              const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender !== msg.sender);

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`flex max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    {!isMe && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                        {showAvatar && (
                          <img
                            src={role === 'doctor' ? activeSession.patientAvatar : activeSession.doctorAvatar}
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl sm:rounded-3xl shadow-sm text-sm sm:text-base ${
                          isMe
                            ? 'bg-[#006c44] text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-[#022434] rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Attached file"
                            className="mt-2 rounded-xl max-w-[240px] max-h-[200px] object-cover border border-white/20 shadow-xs"
                          />
                        )}
                      </div>
                      <div className="flex items-center space-x-1 mt-1 px-1">
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        {isMe && (
                          msg.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-500" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3 h-3 text-slate-400" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Hidden File Input for Device Photos & Medical Documents */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileAttachment}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {/* Input Area */}
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  fileInputRef.current?.click();
                }}
                className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0 cursor-pointer"
                title="Attach Document or Image from Device"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  fileInputRef.current?.click();
                }}
                className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0 hidden sm:block cursor-pointer"
                title="Capture Photo with Device Camera"
              >
                <Camera className="w-5 h-5" />
              </button>
              {role === 'doctor' && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedPatientForRx(activeSession.patientName);
                    setIsPrescriptionModalOpen(true);
                  }}
                  className="p-2 sm:p-2.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-full transition-colors shrink-0 cursor-pointer"
                  title="Issue Prescription"
                >
                  <Pill className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1 bg-slate-100 rounded-full flex items-center px-4 py-1 sm:py-2 border border-slate-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={isRecordingAudio ? "Recording live microphone audio..." : "Type your message..."}
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm sm:text-base text-[#022434] py-2 placeholder-slate-400 font-nunito"
                />
              </div>
              {chatMessage.trim() ? (
                <button
                  type="submit"
                  className="p-3 sm:p-3.5 bg-[#77daa4] hover:bg-[#006c44] text-[#022434] hover:text-white rounded-full transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleVoiceRecording}
                  className={`p-3 sm:p-3.5 rounded-full transition-all shrink-0 cursor-pointer ${
                    isRecordingAudio
                      ? 'bg-red-500 text-white animate-pulse shadow-md ring-4 ring-red-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  title={isRecordingAudio ? "Tap to Stop & Send Voice Note" : "Record Voice Note with Microphone"}
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 font-outfit relative overflow-hidden pb-20 sm:pb-0">
      <StatusBar />
      <Header
        title="Consultations"
        showBell
        bellCount={2}
        onBellClick={() => setIsNotificationsOpen(true)}
        rightElement={
          <button
            onClick={() => onNavigate('settings')}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-xs"
          >
            <img
              src={role === 'doctor' ? currentUserDoctor.avatarUrl : currentUserPatient.avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#022434] tracking-tight">
                Consultations
              </h1>
              <p className="text-sm text-slate-500 font-nunito mt-1">
                Manage your active, upcoming, and completed sessions.
              </p>
            </div>
            {role !== 'doctor' && (
              <button
                onClick={() => onNavigate('doctor-discovery')}
                className="px-4 py-3 sm:py-2.5 bg-[#022434] hover:bg-[#006c44] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Booking</span>
              </button>
            )}
          </div>

          {/* SEARCH & FILTERS */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/70 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, symptom, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#77daa4] focus:ring-2 focus:ring-[#77daa4]/20 font-nunito transition-all"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                {(['all', 'new', 'previous'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab(tab);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-outfit transition-all whitespace-nowrap shrink-0 ${
                      activeTab === tab
                        ? 'bg-[#1c3a4a] text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'all'
                      ? 'All Sessions'
                      : tab === 'new'
                      ? (role === 'doctor' ? 'Patient Queue' : 'Active & Upcoming')
                      : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-1 hide-scrollbar">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 mr-1">Type:</span>
                {(['all', 'Video', 'Chat', 'Voice'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      triggerHaptic('selection');
                      setTypeFilter(type);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-outfit transition-colors whitespace-nowrap shrink-0 flex items-center space-x-1 ${
                      typeFilter === type
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'Video' && <Video className="w-3.5 h-3.5" />}
                    {type === 'Chat' && <MessageSquare className="w-3.5 h-3.5" />}
                    {type === 'Voice' && <Phone className="w-3.5 h-3.5" />}
                    <span>{type === 'all' ? 'All Types' : type}</span>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
                }}
                className="flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold font-outfit text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shrink-0 ml-4"
                title="Toggle Sort Order"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6 mt-4">
            {/* SECTION 1: NEW & TODAY'S CONSULTATIONS / PATIENT QUEUE */}
            {(activeTab === 'all' || activeTab === 'new') && newConsultations.length > 0 && (
              <CollapsibleSection
                title={role === 'doctor' ? "Patient Queue" : "Active & Upcoming"}
                subtitle={role === 'doctor' ? "Live triage queue & waiting consultations" : "Live consultations & scheduled appointments"}
                icon={<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30" />}
                badge={role === 'doctor' ? `${newConsultations.length} In Queue` : `${newConsultations.length} Queue`}
                isOpen={isActiveSessionsExpanded}
                onToggle={setIsActiveSessionsExpanded}
                maxHeight="max-h-[450px]"
                variant="minimal"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
                  {newConsultations.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all shadow-xs hover:shadow-md ${
                        item.status === 'live'
                          ? 'border-[#77daa4] ring-2 ring-[#77daa4]/20 bg-gradient-to-br from-emerald-50/40 via-white to-white'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        {/* Avatar */}
                        <img
                          src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                          alt={item.patientName}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-xs mt-0.5"
                        />
                        
                        {/* Content & Actions */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434] truncate">
                              {role === 'doctor' ? item.patientName : item.doctorName}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center space-x-1.5 tracking-wider uppercase shrink-0 ${
                                item.status === 'live'
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                              }`}
                            >
                              {item.status === 'live' && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                              <span>{item.status === 'live' ? 'Live Now' : 'Upcoming'}</span>
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 font-nunito mt-1 leading-snug">
                            {role === 'doctor' ? `Complaint: ${item.chiefComplaint}` : `${item.specialty} • ${item.doctorName}`}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="flex items-center space-x-1.5 text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200/60">
                              <Clock className="w-3 h-3 text-[#006c44]" />
                              <span>{item.dateTimeStr}</span>
                            </span>
                            <span className="flex items-center space-x-1.5 bg-emerald-50 text-[#006c44] border border-emerald-200/60 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                              {item.type === 'Video' && <Video className="w-3 h-3" />}
                              {item.type === 'Chat' && <MessageSquare className="w-3 h-3" />}
                              {item.type === 'Voice' && <Phone className="w-3 h-3" />}
                              <span>{item.type}</span>
                            </span>
                          </div>

                          {/* Actions aligned to text */}
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                            <button
                              onClick={() => {
                                if (isConsultationPaid(item.id) || item.status === 'live' || item.status === 'completed') {
                                  triggerHaptic('selection');
                                  setActiveSession(item);
                                } else {
                                  handleStartConsultationCall(item);
                                }
                              }}
                              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs transition-colors shrink-0"
                            >
                              Open Chat
                            </button>
                            <button
                              onClick={() => handleStartConsultationCall(item)}
                              className="px-5 py-2.5 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-bold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                            >
                              Start Call
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* SECTION 2: PREVIOUS CONSULTATIONS (COMPLETED / PAST HISTORY) */}
            {(activeTab === 'all' || activeTab === 'previous') && previousConsultations.length > 0 && (
              <CollapsibleSection
                title="Completed Sessions"
                subtitle="Clinical history and consultation archives"
                icon={<Clock className="w-4 h-4 text-slate-500" />}
                badge={`${previousConsultations.length} Logs`}
                isOpen={isCompletedSessionsExpanded}
                onToggle={setIsCompletedSessionsExpanded}
                maxHeight="max-h-[450px]"
                variant="minimal"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
                  {previousConsultations.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        {/* Avatar */}
                        <img
                          src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                          alt={item.patientName}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 grayscale-[0.2] mt-0.5 opacity-90"
                        />
                        
                        {/* Content & Actions */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold font-outfit text-sm sm:text-base text-[#022434] truncate opacity-90">
                              {role === 'doctor' ? item.patientName : item.doctorName}
                            </h4>
                            <span className="bg-slate-100 text-slate-600 border border-slate-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center space-x-1.5 tracking-wider uppercase shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 font-nunito mt-1 leading-snug">
                            Complaint: {item.chiefComplaint}
                          </p>
                          
                          {item.notes && (
                            <div className="mt-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-600 font-nunito">
                              <span className="font-semibold text-slate-700">Note: </span>{item.notes}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] font-medium text-slate-500 bg-slate-100/50 w-fit px-2.5 py-1 rounded-lg border border-slate-200/50">
                            <span className="flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.dateTimeStr}</span>
                            </span>
                            <span>•</span>
                            <span className="text-slate-600">{item.type} Session</span>
                          </div>

                          {/* Actions aligned to text */}
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                            {role === 'doctor' && (
                              <button
                                onClick={() => {
                                  triggerHaptic('selection');
                                  setSelectedPatientForDoc(item.patientName);
                                  setIsDocModalOpen(true);
                                }}
                                className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#006c44] border border-emerald-200/80 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1.5 shrink-0"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Document Encounter</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                triggerHaptic('selection');
                                setSelectedConsultationForPDF(item);
                                setIsSummaryModalOpen(true);
                              }}
                              className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 font-bold font-outfit text-xs rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center space-x-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-700" />
                              <span>EHR Summary</span>
                            </button>

                            <button
                              onClick={() => {
                                triggerHaptic('selection');
                                onNavigate('prescription-detail');
                              }}
                              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl whitespace-nowrap shrink-0"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* EMPTY STATE */}
            {filteredConsultations.length === 0 && (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center mx-auto text-[#006c44]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h4 className="font-bold font-outfit text-[#022434] text-lg">
                  {consultationsList.length === 0 ? 'No consultations booked yet' : 'No consultations match your search'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-nunito leading-relaxed">
                  {consultationsList.length === 0
                    ? 'Connect with verified Nigerian doctors for real-time video, voice, and encrypted chat consultations.'
                    : 'No consultations match your current search or filter criteria. Try resetting your active filters.'}
                </p>
                {consultationsList.length === 0 ? (
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      onNavigate('doctor-discovery');
                    }}
                    className="px-6 py-3 bg-[#006c44] hover:bg-[#005233] text-white text-sm font-bold font-outfit rounded-xl transition-all shadow-md active:scale-95 inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Find & Book a Doctor</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('all');
                      setTypeFilter('all');
                    }}
                    className="px-5 py-2.5 bg-[#1c3a4a] hover:bg-[#022434] text-white text-xs font-bold font-outfit rounded-xl transition-all"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Consultation Summary PDF Modal */}
      <ConsultationSummaryPDFModal
        isOpen={isSummaryModalOpen}
        user={currentUserPatient}
        consultationRecord={selectedConsultationForPDF}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      {/* Clinician Structured Documentation Modal */}
      <ClinicalDocumentationModal
        isOpen={isDocModalOpen}
        patientName={selectedPatientForDoc}
        doctorUser={currentUserDoctor}
        onClose={() => setIsDocModalOpen(false)}
      />

      {/* In-Consultation Prescription Composer Modal */}
      <PrescriptionComposerModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patientInfo={{
          name: activeSession?.patientName || selectedPatientForRx || 'Ada Okonkwo',
          allergies: ['Penicillin', 'Sulfa drugs'],
        }}
        consultationId={activeSession?.id}
        consultationType="Chat"
        onPrescriptionSaved={(rx) => {
          setIsPrescriptionModalOpen(false);
          triggerHaptic('success');
          showToast(`E-Prescription #${rx.referenceNo} issued for ${rx.patientName}!`, 'success');
          if (activeSession) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-rx-${Date.now()}`,
                sender: 'doctor',
                senderName: 'Dr. Sarah Lee, MD',
                text: `📄 Official E-Prescription Issued (#${rx.referenceNo}) for ${rx.diagnosis}.\nMedications: ${rx.medications.map((m) => `${m.drugName} (${m.dosage}, ${m.frequency})`).join('; ')}. Instructions: ${rx.doctorNotes || 'Follow treatment regimen.'}`,
                timestamp: 'Just now',
                status: 'sent',
              },
            ]);
          }
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};
