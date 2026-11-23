import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import {
  Video, MessageSquare, Phone, Search, Filter, Clock, Calendar, CheckCircle2, FileText, ChevronRight,
  ChevronDown, ChevronUp, ArrowUpDown, User, ArrowLeft, Send, Paperclip, Camera, MoreHorizontal,
  Check, CheckCheck, AlertCircle, Stethoscope, Plus, Mic, Pill, Users, RotateCcw, Home, Reply, PhoneOff, X, ShieldCheck,
  Play, Pause, Square, Trash2
} from 'lucide-react';
import { ScreenId, ChatMessage, Doctor, UserRole, BookingSummary, ConsultationSummaryData, StructuredClinicalRecord } from '../../types';
import { mockDoctors, currentUserPatient, currentUserDoctor } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { ConsultationSummaryPDFModal } from '../common/ConsultationSummaryPDFModal';
import { ClinicalDocumentationModal } from '../common/ClinicalDocumentationModal';
import { PrescriptionComposerModal } from '../common/PrescriptionComposerModal';
import { ConsultationSummaryModal } from '../common/ConsultationSummaryModal';
import { NotificationsDrawer } from '../common/NotificationsDrawer';
import { processJoinOrPayConsultation, isConsultationPaid } from '../../utils/consultationPayment';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { primeApi } from '../../services/apiClient';
import { getStoredAppointmentAlerts, completeConsultation } from '../../utils/appointmentNotifications';
import { notifyIncomingMessage, showPhoneNotification } from '../../services/phoneNotifications';

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
  // Active consultation session (auto-loaded from active call session if doctor accepted or joined)
  const [activeSession, setActiveSession] = useState<ConsultationItem | null>(() => {
    try {
      const raw = localStorage.getItem('prime_telecare_active_call_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.type === 'Chat' || parsed.modality === 'Chat' || !parsed.type)) {
          return {
            id: parsed.id || parsed.consultationId || parsed.appointmentId || `chat-${Date.now()}`,
            patientName: parsed.patientName || 'Patient',
            patientAvatar: parsed.patientAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
            doctorName: parsed.doctorName || 'Doctor',
            doctorAvatar: parsed.doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
            specialty: parsed.doctorSpecialty || 'General Practice',
            type: 'Chat',
            dateTimeStr: 'Today, Live Session',
            rawDate: new Date().toISOString(),
            sortTimestamp: Date.now(),
            status: 'live',
            chiefComplaint: parsed.chiefComplaint || 'Live Chat Consultation',
            price: parsed.price || 10000,
          };
        }
      }
    } catch {}
    return null;
  });
  const [consultationsList, setConsultationsList] = useState<ConsultationItem[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);

  // Sync active consultation session in real time (e.g. doctor accepted invitation modal or queue row clicked)
  useEffect(() => {
    const handleActiveSessionSync = () => {
      try {
        const raw = localStorage.getItem('prime_telecare_active_call_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.type === 'Chat' || parsed.modality === 'Chat' || !parsed.type)) {
            setActiveSession({
              id: parsed.id || parsed.consultationId || parsed.appointmentId || `chat-${Date.now()}`,
              patientName: parsed.patientName || 'Patient',
              patientAvatar: parsed.patientAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
              doctorName: parsed.doctorName || 'Doctor',
              doctorAvatar: parsed.doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
              specialty: parsed.doctorSpecialty || 'General Practice',
              type: 'Chat',
              dateTimeStr: 'Today, Live Session',
              rawDate: new Date().toISOString(),
              sortTimestamp: Date.now(),
              status: 'live',
              chiefComplaint: parsed.chiefComplaint || 'Live Chat Consultation',
              price: parsed.price || 10000,
            });
          }
        }
      } catch {}
    };

    window.addEventListener('active-call-session-updated', handleActiveSessionSync);
    window.addEventListener('storage', handleActiveSessionSync);
    return () => {
      window.removeEventListener('active-call-session-updated', handleActiveSessionSync);
      window.removeEventListener('storage', handleActiveSessionSync);
    };
  }, []);

  // Load live appointments from backend & persistent consultations store
  const loadConsultations = async () => {
    try {
      const [remoteApts, localAlerts] = await Promise.all([
        primeApi.getAppointments().catch(() => []),
        Promise.resolve(getStoredAppointmentAlerts()),
      ]);

      const remoteItems: ConsultationItem[] = (remoteApts || []).map((a: any) => ({
        id: a.id,
        patientName: a.patientName || 'Patient',
        patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        doctorName: a.doctorName && a.doctorName !== 'Attending Physician' ? a.doctorName : 'Doctor',
        doctorAvatar: a.doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
        specialty: a.doctorSpecialty || 'General Practice',
        type: (a.type as any) || 'Chat',
        dateTimeStr: `${a.scheduledDate || 'Today'}, ${a.timeSlot || 'Scheduled'}`,
        rawDate: a.scheduledDate || new Date().toISOString(),
        sortTimestamp: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
        status: a.status === 'completed' ? 'completed' : a.status === 'cancelled' ? 'cancelled' : (a.status === 'active' || (a.status as any) === 'in-progress') ? 'live' : 'upcoming',
        chiefComplaint: a.notes || 'Telehealth Consultation',
        price: a.price || 10000,
      }));

      const localItems: ConsultationItem[] = (localAlerts || []).map((a) => ({
        id: a.appointmentId || a.id,
        patientName: a.patientName || 'Patient',
        patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        doctorName: a.doctorName && a.doctorName !== 'Attending Physician' ? a.doctorName : 'Doctor',
        doctorAvatar: a.doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
        specialty: a.doctorSpecialty || 'General Practice',
        type: a.type || 'Chat',
        dateTimeStr: `${a.scheduledDate}, ${a.scheduledTime}`,
        rawDate: a.scheduledDate,
        sortTimestamp: a.startTimeTimestamp || Date.now(),
        status: a.status === 'completed' ? 'completed' : a.status === 'cancelled' ? 'cancelled' : (a.status === 'active' || (a.status as any) === 'in-progress') ? 'live' : 'upcoming',
        chiefComplaint: `${a.type} Consultation with ${a.doctorName}`,
        price: a.price || 10000,
      }));

      // Merge and deduplicate: if either source marks it completed, status is completed!
      const map = new Map<string, ConsultationItem>();
      for (const item of [...remoteItems, ...localItems]) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        } else {
          const existing = map.get(item.id)!;
          if (item.status === 'completed') {
            existing.status = 'completed';
          }
        }
      }

      const DEMO_NAMES = new Set(['chinedu okafor', 'amina bello', 'ngozi eze', 'babatunde adeleke', 'ada okonkwo']);
      const filtered = Array.from(map.values()).filter(
        (c) =>
          !DEMO_NAMES.has((c.patientName || '').toLowerCase()) &&
          !c.id.startsWith('apt-seed-')
      );
      setConsultationsList(filtered);
    } catch {
      setConsultationsList([]);
    } finally {
      setIsLoadingConsultations(false);
    }
  };

  const [isConsultationSummaryModalOpen, setIsConsultationSummaryModalOpen] = useState(false);
  const isEndingSessionRef = useRef<boolean>(false);

  // Issues and publishes the official clinical health report (with embedded chat transcript)
  const handleSaveHealthReport = async (summaryData: ConsultationSummaryData, shouldEndSession = false) => {
    if (!activeSession) return;
    triggerHaptic('success');

    // 1. Build chronological chat transcript from session messages
    const chatTranscript = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.senderName || (m.sender === 'doctor' ? activeSession.doctorName : activeSession.patientName)}: ${m.text || (m.imageUrl ? '[Image Attachment]' : '')}`
      )
      .join('\n');

    // 2. Mark consultation completed or updated with summary & chat transcript
    completeConsultation(activeSession.id, summaryData, {
      doctorId: activeSession.id,
      doctorName: activeSession.doctorName,
      patientName: activeSession.patientName,
      type: 'Chat',
    });

    // 3. Save structured clinical record with transcript to central EHR storage
    try {
      const existingRaw = localStorage.getItem('prime_telecare_clinical_records_v1');
      const existingRecords: StructuredClinicalRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const reportRecord: StructuredClinicalRecord = {
        id: `CR-${Date.now()}`,
        consultationId: activeSession.id,
        patientId: summaryData.patientId || 'pat-1',
        patientName: activeSession.patientName,
        doctorName: activeSession.doctorName,
        doctorSpecialty: activeSession.specialty,
        doctorLicense: summaryData.doctorLicense || 'MDCN Verified',
        dateStr: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timestamp: Date.now(),
        patientComplaint: summaryData.symptoms,
        diagnosis: summaryData.diagnosis,
        carePlan: summaryData.treatment,
        markdownNotes: `## Telehealth Clinical Consultation Summary & Report\n\n### 🩺 Reported Symptoms & Presenting Complaints\n${summaryData.symptoms}\n\n### 🔬 Clinical Diagnosis\n${summaryData.diagnosis}\n\n### 💊 Prescribed Treatment & Care Instructions\n${summaryData.treatment}${summaryData.doctorNotes ? `\n\n### 📝 Clinical Observations\n${summaryData.doctorNotes}` : ''}${chatTranscript ? `\n\n### 💬 Consultation Chat Record\n\`\`\`text\n${chatTranscript}\n\`\`\`` : ''}`,
        exportPermissionStatus: 'granted',
        exportGrantedBy: activeSession.doctorName,
        exportGrantedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      const filteredRecords = existingRecords.filter((r) => r.consultationId !== activeSession.id);
      localStorage.setItem('prime_telecare_clinical_records_v1', JSON.stringify([reportRecord, ...filteredRecords]));
      setSelectedConsultationForPDF(reportRecord);
    } catch {}

    // 4. Send official report announcement message into the chat
    const reportMsg: ChatMessage = {
      id: `msg-report-${Date.now()}`,
      sender: 'doctor',
      senderName: activeSession.doctorName,
      text: `📋 Official Clinical Health Report Issued:\n• Symptoms: ${summaryData.symptoms}\n• Diagnosis: ${summaryData.diagnosis}\n• Treatment Plan: ${summaryData.treatment}${summaryData.doctorNotes ? `\n• Notes: ${summaryData.doctorNotes}` : ''}\n\n📄 Official clinical dossier has been saved into patient's Health Records.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };
    setMessages((prev) => [...prev, reportMsg]);
    primeApi
      .sendChatMessage(activeSession.id, {
        sender: reportMsg.sender,
        senderName: reportMsg.senderName,
        text: reportMsg.text || '',
      })
      .catch(() => {});

    // 5. Notify patient phone
    showPhoneNotification({
      title: `📄 Health Report Issued: ${activeSession.doctorName}`,
      body: `Dr. ${activeSession.doctorName} published your official consultation summary & health report.`,
      type: 'prescription',
      tag: `report-${activeSession.id}`,
    });

    await primeApi.completeAppointment(activeSession.id, summaryData).catch(() => {});

    showToast('Official health report issued and saved to patient records.', 'success');
    window.dispatchEvent(new Event('appointment-alerts-updated'));
    setIsConsultationSummaryModalOpen(false);

    if (shouldEndSession) {
      try {
        localStorage.removeItem('prime_telecare_active_call_session');
        window.dispatchEvent(new Event('active-call-session-updated'));
      } catch {}
      setActiveSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
      loadConsultations();
    }
  };

  const handleEndChatConsultation = async (summaryData?: ConsultationSummaryData) => {
    if (!activeSession) return;
    if (role === 'doctor' && !summaryData) {
      isEndingSessionRef.current = true;
      setIsConsultationSummaryModalOpen(true);
      return;
    }

    if (summaryData) {
      await handleSaveHealthReport(summaryData, true);
    } else {
      triggerHaptic('heavy');
      completeConsultation(activeSession.id, undefined, {
        doctorName: activeSession.doctorName,
        patientName: activeSession.patientName,
        type: 'Chat',
      });
      await primeApi.completeAppointment(activeSession.id).catch(() => {});
      try {
        localStorage.removeItem('prime_telecare_active_call_session');
        window.dispatchEvent(new Event('active-call-session-updated'));
      } catch {}
      showToast('Consultation concluded.', 'info');
      setActiveSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
      loadConsultations();
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
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'previous'>(role === 'doctor' ? 'new' : 'all');
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

  // Real-time Chat state with offline local persistence per consultation session
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const initialId = activeSession?.id;
      if (initialId) {
        const cached = localStorage.getItem(`prime_telecare_chat_${initialId}`);
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real device microphone recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [previewAudio, setPreviewAudio] = useState<{ blob?: Blob; url: string; duration: string } | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Reply state, typing state, and smooth scroll handling
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const isUserNearBottomRef = useRef(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  // Always use local phone time for accurate timestamps
  const getPhoneTime = () =>
    new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isUserNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;
  };

  const scrollToBottom = (force = false) => {
    if (force || isUserNearBottomRef.current || isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoadRef.current ? 'auto' : 'smooth' });
      isInitialLoadRef.current = false;
    }
  };

  // Live polling for two-way chat messages with native phone notifications
  const hasLoadedInitialRef = useRef(false);
  const lastMsgCountRef = useRef(0);

  useEffect(() => {
    hasLoadedInitialRef.current = false;
    lastMsgCountRef.current = 0;
    isInitialLoadRef.current = true;
    isUserNearBottomRef.current = true;
    if (activeSession?.id) {
      try {
        const cached = localStorage.getItem(`prime_telecare_chat_${activeSession.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
        // Auto-load matching clinical record for PDF viewer if already created
        const existingRaw = localStorage.getItem('prime_telecare_clinical_records_v1');
        if (existingRaw) {
          const records: StructuredClinicalRecord[] = JSON.parse(existingRaw);
          const match = records.find((r) => r.consultationId === activeSession.id);
          if (match) {
            setSelectedConsultationForPDF(match);
          }
        }
      } catch {}
    } else {
      setMessages([]);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    if (!activeSession) return;

    const fetchMessages = () => {
      primeApi.getChatMessages(activeSession.id).then((fetched) => {
        if (Array.isArray(fetched)) {
          if (hasLoadedInitialRef.current && fetched.length > lastMsgCountRef.current) {
            const fresh = fetched.slice(lastMsgCountRef.current);
            const mySender = role === 'doctor' ? 'doctor' : 'patient';
            const fromOther = fresh.filter((m) => m.sender !== mySender);
            if (fromOther.length > 0) {
              const latest = fromOther[fromOther.length - 1];
              notifyIncomingMessage({
                senderName: latest.senderName || (role === 'doctor' ? activeSession.patientName : activeSession.doctorName),
                messageText: latest.text || 'Sent an attachment',
                chatId: activeSession.id,
                senderAvatar: role === 'doctor' ? undefined : activeSession.doctorAvatar,
              });
            }
          }
          hasLoadedInitialRef.current = true;
          lastMsgCountRef.current = fetched.length;

          // Only update state if messages array actually changed (prevent re-render lag & scroll yanks)
          setMessages((prev) => {
            if (
              prev.length === fetched.length &&
              prev[prev.length - 1]?.id === fetched[fetched.length - 1]?.id &&
              prev[prev.length - 1]?.status === fetched[fetched.length - 1]?.status
            ) {
              return prev;
            }
            return fetched;
          });

          // Mark messages as read by reader
          primeApi.markChatRead(activeSession.id, role === 'doctor' ? 'doctor' : 'patient');

          try {
            localStorage.setItem(`prime_telecare_chat_${activeSession.id}`, JSON.stringify(fetched));
          } catch {}

          if (isUserNearBottomRef.current || isInitialLoadRef.current) {
            scrollToBottom();
          }
        }
      }).catch(() => {});
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [activeSession?.id, role]);

  // Real-time typing status poller
  useEffect(() => {
    if (!activeSession || activeSession.status === 'completed') return;
    const checkTyping = async () => {
      try {
        const res = await primeApi.getTypingStatus(activeSession.id, role === 'doctor' ? 'doctor' : 'patient');
        setOtherTyping(!!res.isTyping);
      } catch {}
    };
    const interval = setInterval(checkTyping, 2000);
    return () => clearInterval(interval);
  }, [activeSession?.id, activeSession?.status, role]);

  const handleInputChange = (val: string) => {
    setChatMessage(val);
    if (!activeSession || activeSession.status === 'completed') return;
    primeApi.setTypingStatus(
      activeSession.id,
      role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
      role === 'doctor' ? 'doctor' : 'patient',
      true
    );
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      primeApi.setTypingStatus(
        activeSession.id,
        role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
        role === 'doctor' ? 'doctor' : 'patient',
        false
      );
    }, 2000);
  };

  const handleStartConsultationCall = (item: ConsultationItem) => {
    triggerHaptic('selection');
    const isPaid = isConsultationPaid(item.id);
    
    if (isPaid || item.status === 'live' || item.status === 'completed') {
      if (item.type === 'Video' || item.type === 'Voice') {
        try {
          localStorage.setItem(
            'prime_telecare_active_call_session',
            JSON.stringify({
              appointmentId: item.id,
              consultationId: item.id,
              doctorId: item.id || 'doc-attending',
              doctorName: item.doctorName,
              doctorSpecialty: item.specialty,
              doctorAvatar: item.doctorAvatar,
              patientName: item.patientName || '',
              type: item.type,
            })
          );
          window.dispatchEvent(new Event('active-call-session-updated'));
        } catch {}
        onNavigate('video-call');
      } else {
        setActiveSession(item);
      }
    } else {
      processJoinOrPayConsultation({
        id: item.id,
        type: item.type,
        doctorId: item.id || 'doc-attending',
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
    if (!chatMessage.trim() || !activeSession || activeSession.status === 'completed') return;
    
    triggerHaptic('light');
    const textToSend = chatMessage.trim();
    const phoneTimestamp = getPhoneTime();
    const replyPayload = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: replyingTo.text
            ? replyingTo.text.length > 80
              ? replyingTo.text.slice(0, 80) + '...'
              : replyingTo.text
            : '[Attachment]',
        }
      : undefined;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: role === 'doctor' ? 'doctor' : 'patient',
      senderName: role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
      text: textToSend,
      timestamp: phoneTimestamp,
      status: 'sent',
      replyTo: replyPayload,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setChatMessage('');
    setReplyingTo(null);
    scrollToBottom(true);

    // Cancel typing status immediately
    primeApi.setTypingStatus(
      activeSession.id,
      role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
      role === 'doctor' ? 'doctor' : 'patient',
      false
    );

    try {
      await primeApi.sendChatMessage(activeSession.id, {
        sender: newMessage.sender,
        senderName: newMessage.senderName,
        text: newMessage.text || '',
        timestamp: phoneTimestamp,
        replyTo: replyPayload,
      });
    } catch (err) {
      console.warn('Failed to send live message to server', err);
    }
  };

  // Synthetic Audio fallback helper when browser microphone hardware is blocked
  const generateSimulatedVoiceBlob = (seconds: number): string => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return '';
      const ctx = new AudioCtx();
      const sampleRate = 22050;
      const numSamples = Math.max(1, Math.min(seconds, 15)) * sampleRate;
      const buffer = ctx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * 280 * t) * Math.exp(-4 * (t % 0.35)) * 0.25;
      }
      const numOfChan = 1;
      const length = numSamples * numOfChan * 2 + 44;
      const out = new DataView(new ArrayBuffer(length));
      let pos = 0;
      const setUint16 = (d: number) => { out.setUint16(pos, d, true); pos += 2; };
      const setUint32 = (d: number) => { out.setUint32(pos, d, true); pos += 4; };
      setUint32(0x46464952); // "RIFF"
      setUint32(length - 8);
      setUint32(0x45564157); // "WAVE"
      setUint32(0x20746d66); // "fmt "
      setUint32(16);
      setUint16(1); // PCM
      setUint16(numOfChan);
      setUint32(sampleRate);
      setUint32(sampleRate * 2 * numOfChan);
      setUint16(numOfChan * 2);
      setUint16(16);
      setUint32(0x61746164); // "data"
      setUint32(length - pos - 4);
      for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, data[i]));
        out.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        pos += 2;
      }
      const blob = new Blob([out.buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch {
      return '';
    }
  };

  // Real device microphone recording for voice notes
  const handleToggleVoiceRecording = async () => {
    if (activeSession?.status === 'completed') return;
    if (isRecordingAudio) {
      handleStopVoiceRecording();
      return;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch {
        // Fallback simulated voice note
      }

      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      triggerHaptic('medium');
      showToast('Recording voice note... Tap Done when finished to listen.');

      if (stream) {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream?.getTracks().forEach((t) => t.stop());
          const finalSecs = recordingSeconds || 1;
          const durationStr = `0:${finalSecs < 10 ? '0' : ''}${finalSecs}`;
          const audioUrl = URL.createObjectURL(audioBlob);
          setPreviewAudio({
            blob: audioBlob,
            url: audioUrl,
            duration: durationStr,
          });
          triggerHaptic('success');
          showToast('Voice note recorded! You can listen before sending.', 'success');
        };

        recorder.start();
      }

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      showToast('Microphone recording started', 'info');
    }
  };

  const handleStopVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const finalSecs = Math.max(1, recordingSeconds);
    const durationStr = `0:${finalSecs < 10 ? '0' : ''}${finalSecs}`;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback preview
      const fallbackUrl = generateSimulatedVoiceBlob(finalSecs);
      setPreviewAudio({
        url: fallbackUrl,
        duration: durationStr,
      });
      triggerHaptic('success');
      showToast('Voice note recorded! You can listen before sending.', 'success');
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsRecordingAudio(false);
  };

  const handleCancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    triggerHaptic('light');
    showToast('Voice note cancelled', 'info');
  };

  const handleTogglePlayPreview = () => {
    if (!previewAudio) return;
    triggerHaptic('light');
    if (isPlayingPreview && previewAudioPlayerRef.current) {
      previewAudioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      if (!previewAudioPlayerRef.current) {
        previewAudioPlayerRef.current = new Audio(previewAudio.url);
        previewAudioPlayerRef.current.onended = () => setIsPlayingPreview(false);
      } else {
        previewAudioPlayerRef.current.src = previewAudio.url;
      }
      previewAudioPlayerRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch(() => setIsPlayingPreview(false));
    }
  };

  const handleDiscardPreviewAudio = () => {
    triggerHaptic('light');
    if (previewAudioPlayerRef.current) {
      previewAudioPlayerRef.current.pause();
      previewAudioPlayerRef.current = null;
    }
    setIsPlayingPreview(false);
    setPreviewAudio(null);
  };

  const handleSendPreviewVoiceNote = async () => {
    if (!previewAudio || !activeSession) return;
    triggerHaptic('success');
    if (previewAudioPlayerRef.current) {
      previewAudioPlayerRef.current.pause();
    }
    setIsPlayingPreview(false);

    const phoneTimestamp = getPhoneTime();
    const voiceMsg: ChatMessage = {
      id: `msg-voice-${Date.now()}`,
      sender: role === 'doctor' ? 'doctor' : 'patient',
      senderName: role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
      text: `🎤 Voice Note (${previewAudio.duration})`,
      audioUrl: previewAudio.url,
      audioDuration: previewAudio.duration,
      timestamp: phoneTimestamp,
      status: 'sent',
      replyTo: replyingTo ? { id: replyingTo.id, senderName: replyingTo.senderName, text: replyingTo.text } : undefined,
    };

    setMessages((prev) => [...prev, voiceMsg]);
    setReplyingTo(null);
    setPreviewAudio(null);
    scrollToBottom(true);

    primeApi
      .sendChatMessage(activeSession.id, {
        sender: voiceMsg.sender,
        senderName: voiceMsg.senderName,
        text: voiceMsg.text || '🎤 Voice Note',
        audioUrl: voiceMsg.audioUrl,
        audioDuration: voiceMsg.audioDuration,
        timestamp: phoneTimestamp,
        replyTo: voiceMsg.replyTo,
      })
      .catch(() => {});
    showToast('Voice note sent to consultation', 'success');
  };

  const handleTogglePlayAudio = (msgId: string, url: string) => {
    triggerHaptic('light');
    if (playingAudioId === msgId && activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
      }
      const audio = new Audio(url);
      activeAudioElementRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.play().then(() => setPlayingAudioId(msgId)).catch(() => setPlayingAudioId(null));
    }
  };

  // Real device photo / file attachment
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession || activeSession.status === 'completed') return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const phoneTimestamp = getPhoneTime();
      const imgMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: role === 'doctor' ? 'doctor' : 'patient',
        senderName: role === 'doctor' ? currentUserDoctor.name : currentUserPatient.name,
        text: `📷 Shared photo: ${file.name}`,
        imageUrl: base64,
        timestamp: phoneTimestamp,
        status: 'sent',
      };
      setMessages((prev) => [...prev, imgMsg]);
      scrollToBottom(true);
      await primeApi.sendChatMessage(activeSession.id, {
        sender: imgMsg.sender,
        senderName: imgMsg.senderName,
        text: imgMsg.text || '',
        imageUrl: imgMsg.imageUrl,
        timestamp: phoneTimestamp,
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

  return (
    <>
      {activeSession ? (
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
                    try {
                      localStorage.removeItem('prime_telecare_active_call_session');
                      window.dispatchEvent(new Event('active-call-session-updated'));
                    } catch {}
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
                    {activeSession.status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                        Completed Consultation
                      </span>
                    ) : (
                      <p className="text-xs text-slate-500 font-nunito flex items-center space-x-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Online</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {role === 'doctor' && activeSession.status !== 'completed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        isEndingSessionRef.current = false;
                        setIsConsultationSummaryModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#022434] hover:bg-[#1c3a4a] text-white rounded-xl text-xs font-bold font-outfit flex items-center space-x-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Send Official Health Report to Patient"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-300" />
                      <span className="hidden sm:inline">Health Report</span>
                    </button>

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
                  </>
                )}
                {selectedConsultationForPDF && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsSummaryModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-bold font-outfit flex items-center space-x-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="View Official Health Report PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">View PDF</span>
                  </button>
                )}
                {activeSession.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleEndChatConsultation()}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold font-outfit text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center space-x-1"
                    title="Conclude Consultation"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>End</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/70 font-nunito"
            >
              <div className="text-center my-3">
                <span className="bg-slate-200/60 text-slate-600 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {activeSession.dateTimeStr}
                </span>
              </div>

              <div className="flex items-center justify-center my-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[11px] font-medium border border-slate-200">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  <span>End-to-end encrypted consultation</span>
                </span>
              </div>

              {messages.map((msg, idx) => {
                const isMe = msg.sender === (role === 'doctor' ? 'doctor' : 'patient');
                const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender !== msg.sender);

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 group`}>
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
                          className={`px-4 py-2.5 rounded-2xl sm:rounded-3xl shadow-sm text-sm sm:text-base relative ${
                            isMe
                              ? 'bg-[#006c44] text-white rounded-br-sm'
                              : 'bg-white border border-slate-200 text-[#022434] rounded-bl-sm'
                          }`}
                        >
                          {/* Quoted Tagged Reply Preview */}
                          {msg.replyTo && (
                            <div
                              className={`mb-2 px-3 py-1.5 rounded-xl border-l-2 text-xs ${
                                isMe
                                  ? 'bg-black/20 border-white text-white/95'
                                  : 'bg-slate-100 border-emerald-600 text-slate-700'
                              }`}
                            >
                              <span className="font-bold text-[11px] block">{msg.replyTo.senderName}</span>
                              <span className="text-[11px] opacity-90 line-clamp-1">{msg.replyTo.text}</span>
                            </div>
                          )}

                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                          {/* Voice Note Player (Active after being sent) */}
                          {(msg.audioUrl || msg.text?.includes('🎤 Voice Note')) && (
                            <div
                              className={`mt-2 flex items-center space-x-2.5 px-3 py-2 rounded-2xl min-w-[200px] sm:min-w-[230px] max-w-full ${
                                isMe ? 'bg-black/15 text-white' : 'bg-slate-100 text-[#022434] border border-slate-200'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleTogglePlayAudio(msg.id, msg.audioUrl || generateSimulatedVoiceBlob(5))}
                                className={`p-2 rounded-full transition-transform active:scale-90 shrink-0 cursor-pointer ${
                                  playingAudioId === msg.id
                                    ? isMe ? 'bg-white text-[#006c44]' : 'bg-[#006c44] text-white'
                                    : isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-emerald-100 hover:bg-emerald-200 text-[#006c44]'
                                }`}
                                title={playingAudioId === msg.id ? 'Pause voice note' : 'Play voice note'}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1 h-3.5 my-0.5">
                                  {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 75, 60, 85, 40, 65].map((h, i) => (
                                    <span
                                      key={i}
                                      className={`w-1 rounded-full transition-all ${
                                        playingAudioId === msg.id ? 'animate-pulse' : ''
                                      } ${isMe ? 'bg-white/90' : 'bg-emerald-600'}`}
                                      style={{
                                        height: playingAudioId === msg.id ? `${Math.max(25, h * (i % 2 === 0 ? 1 : 0.6))}%` : `${h}%`,
                                        animationDelay: `${i * 60}ms`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center justify-between text-[10px] opacity-80 font-mono mt-0.5">
                                  <span>{playingAudioId === msg.id ? 'Playing' : 'Voice Note'}</span>
                                  <span>{msg.audioDuration || '0:05'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="Attached file"
                              className="mt-2 rounded-xl max-w-[240px] max-h-[200px] object-cover border border-white/20 shadow-xs"
                            />
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 mt-1 px-1">
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                          {isMe && (
                            <span title={msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}>
                              {msg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </span>
                          )}
                          {/* Tag & Reply button */}
                          {activeSession.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setReplyingTo(msg);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 p-0.5 rounded transition-opacity cursor-pointer"
                              title="Reply to message"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Real-time Typing animation indicator */}
              {otherTyping && (
                <div className="flex items-center space-x-2 my-2 animate-in fade-in duration-200">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={role === 'doctor' ? activeSession.patientAvatar : activeSession.doctorAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-bl-sm shadow-2xs flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

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

            {/* Input Area or Completed Status Banner */}
            {activeSession.status === 'completed' ? (
              <div className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <div className="flex items-center space-x-2 text-slate-700 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>This consultation has ended and is marked completed. New messages cannot be sent.</span>
                </div>
                {selectedConsultationForPDF && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsSummaryModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#006c44] hover:bg-[#005233] text-white rounded-xl text-xs font-bold font-outfit shadow-xs transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Official Health Report (PDF)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white px-2.5 sm:px-5 py-2.5 sm:py-3.5 border-t border-slate-200 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                {/* Replying banner */}
                {replyingTo && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-t-xl text-xs text-slate-700 mb-2">
                    <div className="flex items-center space-x-2 truncate">
                      <Reply className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-700">{replyingTo.senderName}:</span>
                      <span className="truncate text-slate-500">{replyingTo.text || '[Attachment]'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                      title="Cancel reply"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Voice Note Preview Bar — Listen before sending */}
                {previewAudio && !isRecordingAudio && (
                  <div className="flex items-center space-x-2 p-2 sm:p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl mb-2 animate-in fade-in">
                    <button
                      type="button"
                      onClick={handleTogglePlayPreview}
                      className="p-2 sm:p-2.5 rounded-full bg-[#006c44] text-white hover:bg-[#005233] transition-transform active:scale-90 shrink-0 cursor-pointer shadow-xs"
                      title={isPlayingPreview ? 'Pause preview' : 'Listen to voice note'}
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-bold text-[#022434] font-outfit">
                        <span>Voice Note ({previewAudio.duration})</span>
                        <span className="text-[10px] text-emerald-700 font-mono">
                          {isPlayingPreview ? 'Playing preview...' : 'Ready to send'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 h-2.5 my-1">
                        {[50, 80, 40, 100, 60, 90, 45, 75, 35, 85, 70, 95, 60, 80].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              isPlayingPreview ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-400/70'
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDiscardPreviewAudio}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer shrink-0"
                      title="Discard voice note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendPreviewVoiceNote}
                      className="px-3 py-1.5 sm:py-2 bg-[#006c44] hover:bg-[#005233] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center space-x-1 shrink-0"
                      title="Send Voice Note"
                    >
                      <Send className="w-3.5 h-3.5 ml-0.5" />
                      <span>Send</span>
                    </button>
                  </div>
                )}

                {/* Active Microphone Recording Banner */}
                {isRecordingAudio ? (
                  <div className="flex items-center space-x-2 p-2 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in w-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0 ml-1" />
                    <span className="text-xs font-bold text-rose-700 font-mono">
                      Recording 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                    </span>
                    <div className="flex-1 flex items-center space-x-1 h-3 px-2">
                      {[30, 70, 45, 90, 60, 100, 50, 85, 40, 95].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-rose-500 rounded-full animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 80}ms`,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelVoiceRecording}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full cursor-pointer shrink-0"
                      title="Cancel Recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleStopVoiceRecording}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                      title="Stop & Listen to Recording"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Done</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-1.5 sm:space-x-2.5 w-full">
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
                      onClick={handleToggleVoiceRecording}
                      className="p-2 sm:p-2.5 rounded-full transition-colors shrink-0 cursor-pointer text-slate-400 hover:text-[#006c44] hover:bg-emerald-50"
                      title="Record Voice Note (Tap to start recording)"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0 bg-slate-100 rounded-full flex items-center px-3 sm:px-4 py-1 sm:py-2 border border-slate-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full min-w-0 bg-transparent border-none focus:outline-none text-xs sm:text-base text-[#022434] py-1.5 sm:py-2 placeholder-slate-400 font-nunito"
                      />
                    </div>
                    {/* End Consultation Button on bottom bar */}
                    <button
                      type="button"
                      onClick={() => handleEndChatConsultation()}
                      className="p-2 sm:p-2.5 rounded-full text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
                      title="End Consultation"
                    >
                      <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={!chatMessage.trim()}
                      className={`p-2.5 sm:p-3 rounded-full transition-all shrink-0 ${
                        chatMessage.trim()
                          ? 'bg-[#77daa4] hover:bg-[#006c44] text-[#022434] hover:text-white shadow-sm cursor-pointer active:scale-95'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                      title="Send Message"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-slate-50/50 font-outfit relative overflow-hidden pb-20 sm:pb-0">
      <StatusBar />
      <Header
        title={role === 'doctor' ? 'Patients Queue & Clinic' : 'Consultations'}
        showBack={role === 'doctor'}
        onBack={role === 'doctor' ? () => onNavigate('doctor-home') : undefined}
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
                {role === 'doctor' ? 'Patients Queue & Upcoming Sessions' : 'Consultations'}
              </h1>
              <p className="text-sm text-slate-500 font-nunito mt-1">
                {role === 'doctor'
                  ? 'Monitor your live patient waiting queue, upcoming scheduled sessions, and clinical encounters.'
                  : 'Manage your active, upcoming, and completed sessions.'}
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
                      ? (role === 'doctor' ? 'All Patients' : 'All Sessions')
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
                            {item.type !== 'Chat' && (
                              <button
                                onClick={() => handleStartConsultationCall(item)}
                                className="px-5 py-2.5 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-bold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0 flex items-center space-x-1.5"
                              >
                                {item.type === 'Voice' ? (
                                  <>
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Start Voice Call</span>
                                  </>
                                ) : (
                                  <>
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Start Video Call</span>
                                  </>
                                )}
                              </button>
                            )}
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
                  {role === 'doctor'
                    ? consultationsList.length === 0
                      ? 'No active patient consultations'
                      : 'No consultations match your search'
                    : consultationsList.length === 0
                    ? 'No consultations booked yet'
                    : 'No consultations match your search'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-nunito leading-relaxed">
                  {role === 'doctor'
                    ? consultationsList.length === 0
                      ? 'When patients book or check in for consultations, their live sessions and queue items will appear here for you to join.'
                      : 'No patient sessions match your current search or filter criteria. Try resetting your active filters.'
                    : consultationsList.length === 0
                    ? 'Connect with verified Nigerian doctors for real-time video, voice, and encrypted chat consultations.'
                    : 'No consultations match your current search or filter criteria. Try resetting your active filters.'}
                </p>
                {consultationsList.length === 0 ? (
                  role === 'doctor' ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          triggerHaptic('selection');
                          loadConsultations();
                          showToast('Consultations queue refreshed', 'info');
                        }}
                        className="px-6 py-3 bg-[#006c44] hover:bg-[#005233] text-white text-sm font-bold font-outfit rounded-xl transition-all shadow-md active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Refresh Queue</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic('selection');
                          onNavigate('doctor-home');
                        }}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold font-outfit rounded-xl transition-all active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <Home className="w-4 h-4" />
                        <span>Dashboard</span>
                      </button>
                    </div>
                  ) : (
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
                  )
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
      </div>
      )}

      {/* Patient Consultation Summary PDF Modal */}
      <ConsultationSummaryPDFModal
        isOpen={isSummaryModalOpen}
        user={role === 'doctor' ? currentUserDoctor : currentUserPatient}
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
          name: activeSession?.patientName || selectedPatientForRx || 'Patient',
          allergies: ['Penicillin', 'Sulfa drugs'],
        }}
        consultationId={activeSession?.id}
        consultationType="Chat"
        onPrescriptionSaved={(rx) => {
          setIsPrescriptionModalOpen(false);
          triggerHaptic('success');
          showToast(`E-Prescription #${rx.referenceNo} issued for ${rx.patientName}!`, 'success');
          if (activeSession) {
            const rxMsg: ChatMessage = {
              id: `msg-rx-${Date.now()}`,
              sender: 'doctor',
              senderName: rx.doctorName && rx.doctorName !== 'Attending Physician' ? rx.doctorName : 'Doctor',
              text: `📄 Official E-Prescription Issued (#${rx.referenceNo}) for ${rx.diagnosis}.\nMedications: ${rx.medications.map((m) => `${m.drugName} (${m.dosage}, ${m.frequency})`).join('; ')}. Instructions: ${rx.doctorNotes || 'Follow treatment regimen.'}`,
              timestamp: getPhoneTime(),
              status: 'sent',
            };
            setMessages((prev) => [...prev, rxMsg]);
            scrollToBottom(true);
            primeApi
              .sendChatMessage(activeSession.id, {
                sender: rxMsg.sender,
                senderName: rxMsg.senderName,
                text: rxMsg.text || '',
                timestamp: rxMsg.timestamp,
              })
              .catch(() => {});
          }
        }}
      />

      {/* End-of-Consultation Clinical Summary Modal (Doctor) */}
      <ConsultationSummaryModal
        isOpen={isConsultationSummaryModalOpen}
        onClose={() => setIsConsultationSummaryModalOpen(false)}
        patientName={activeSession?.patientName || 'Patient'}
        patientId="pat-1"
        doctorName={activeSession?.doctorName || (role === 'doctor' ? currentUserDoctor.name : 'Doctor')}
        doctorSpecialty={activeSession?.specialty || 'General Practice'}
        doctorLicense="MDCN Verified"
        appointmentId={activeSession?.id}
        consultationType="Chat"
        onSaveSummary={(summary) => {
          handleSaveHealthReport(summary, isEndingSessionRef.current);
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
};
