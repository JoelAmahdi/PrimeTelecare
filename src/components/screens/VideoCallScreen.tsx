import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Share2,
  ShieldCheck,
  WifiOff,
  AlertTriangle,
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  RefreshCw,
  CheckCircle2,
  Lock,
  Volume2,
  User,
  Info,
  ChevronRight,
  PhoneCall,
  Activity,
  UserCheck,
  ShieldAlert,
  Pill,
  Copy,
  Check,
  Speaker,
  Headphones,
  Bluetooth,
} from 'lucide-react';
import { ScreenId, User as UserType } from '../../types';
import { StatusBar } from '../common/StatusBar';
import { currentUserPatient } from '../../data/mockData';
import { getActiveProfileInfo } from '../../utils/dependents';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { ConnectionRecoveryModal } from '../common/ConnectionRecoveryModal';
import { PrescriptionComposerModal } from '../common/PrescriptionComposerModal';
import { ConsultationSummaryModal } from '../common/ConsultationSummaryModal';
import { primeApi } from '../../services/apiClient';
import { completeConsultation, getActiveOrUpcomingConsultations } from '../../utils/appointmentNotifications';
import { notifyIncomingMessage } from '../../services/phoneNotifications';
import { playRingingTone, playConnectedTone, playHangupTone } from '../../utils/audioTones';
import { ConsultationSummaryData } from '../../types';
import {
  requestUserMedia,
  setupAudioAnalyser,
  startScreenShare,
  createDoctorCanvasStream,
  getAudioOutputDevices,
  setAudioOutputSink,
  requestSystemAudioOutput,
  AudioOutputDeviceInfo,
} from '../../utils/liveMedia';

interface VideoCallScreenProps {
  onNavigate: (screen: ScreenId) => void;
  user?: UserType;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorAvatar?: string;
  patientName?: string;
  consultationType?: 'Video' | 'Voice' | 'Chat';
}

interface InCallMessage {
  id: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    type: 'image' | 'document';
    url: string;
  };
}

export const VideoCallScreen: React.FC<VideoCallScreenProps> = ({
  onNavigate,
  user = currentUserPatient,
  doctorName = '',
  doctorSpecialty = '',
  doctorAvatar = '',
  patientName = '',
  consultationType,
}) => {
  // Determine if this session is strictly an audio / voice consultation (NO camera access)
  const [resolvedConsultationType, setResolvedConsultationType] = useState<'Video' | 'Voice' | 'Chat'>(() => {
    if (consultationType) return consultationType;
    try {
      const savedSession = localStorage.getItem('prime_telecare_active_call_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.type === 'Voice' || parsed.type === 'voice' || parsed.type === 'Audio' || parsed.type === 'audio') return 'Voice';
        if (parsed.type === 'Video' || parsed.type === 'video') return 'Video';
      }
      const savedBooking = localStorage.getItem('prime_telecare_current_booking_summary');
      if (savedBooking) {
        const parsed = JSON.parse(savedBooking);
        if (parsed.consultationType === 'Voice' || parsed.consultationType === 'voice' || parsed.consultationType === 'Audio' || parsed.consultationType === 'audio') return 'Voice';
        if (parsed.consultationType === 'Video' || parsed.consultationType === 'video') return 'Video';
      }
      const savedCall = localStorage.getItem('prime_telecare_active_call') || localStorage.getItem('prime_telecare_incoming_call');
      if (savedCall) {
        const parsed = JSON.parse(savedCall);
        if (parsed.type === 'Voice' || parsed.type === 'voice' || parsed.type === 'Audio' || parsed.type === 'audio') return 'Voice';
        if (parsed.type === 'Video' || parsed.type === 'video') return 'Video';
      }
    } catch {}
    return 'Video';
  });

  const isStrictlyAudio = resolvedConsultationType === 'Voice';

  // Active Patient Profile Info (Primary or Family Dependent)
  const activeProfile = getActiveProfileInfo(user);

  const isDoctorAccount = user?.role === 'doctor';
  const ownFormattedDoctorName = isDoctorAccount && user?.name
    ? user.name.trim().startsWith('Dr.')
      ? user.name.trim()
      : `Dr. ${user.name.trim()}`
    : '';
  const initialCleanDoctorName =
    ownFormattedDoctorName ||
    (doctorName && doctorName !== 'Attending Physician' ? doctorName : '');
  const [resolvedDoctorName, setResolvedDoctorName] = useState<string>(initialCleanDoctorName);
  const [resolvedPatientName, setResolvedPatientName] = useState<string>(
    isDoctorAccount
      ? patientName || ''
      : patientName || activeProfile.displayName || user?.name || ''
  );
  const [resolvedDoctorAvatar, setResolvedDoctorAvatar] = useState<string>(
    isDoctorAccount ? user?.avatarUrl || '' : doctorAvatar || ''
  );

  useEffect(() => {
    if (isDoctorAccount) {
      if (ownFormattedDoctorName) setResolvedDoctorName(ownFormattedDoctorName);
      if (patientName) setResolvedPatientName(patientName);
    } else {
      if (doctorName && doctorName !== 'Attending Physician') {
        setResolvedDoctorName(doctorName);
      }
      if (doctorAvatar) setResolvedDoctorAvatar(doctorAvatar);
    }
    // Hydrate from persisted session or active call if either party name is missing
    try {
      const savedRaw = localStorage.getItem('prime_telecare_active_call_session');
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (!isDoctorAccount && !initialCleanDoctorName && saved.doctorName && saved.doctorName !== 'Attending Physician') {
          setResolvedDoctorName(saved.doctorName);
          if (saved.doctorAvatar) setResolvedDoctorAvatar(saved.doctorAvatar);
        }
        if (isDoctorAccount && !patientName && saved.patientName) {
          setResolvedPatientName(saved.patientName);
        }
      }
    } catch {}

    primeApi
      .getActiveCall()
      .then((call) => {
        if (!call) return;
        if (!isDoctorAccount && !initialCleanDoctorName && call.doctorName && call.doctorName !== 'Attending Physician') {
          setResolvedDoctorName(call.doctorName);
        }
        if (isDoctorAccount && !patientName && call.patientName) {
          setResolvedPatientName(call.patientName);
        }
        if (call.type) {
          if (call.type === 'Voice' || call.type === 'voice' || call.type === 'Audio' || call.type === 'audio') {
            setResolvedConsultationType('Voice');
          }
        }
      })
      .catch(() => {});
  }, [doctorName, doctorAvatar, patientName, isDoctorAccount, ownFormattedDoctorName]);

  useEffect(() => {
    if (consultationType) {
      setResolvedConsultationType(consultationType);
    }
  }, [consultationType]);

  const displayDoctorName = resolvedDoctorName || 'Doctor';
  const displayPatientName = resolvedPatientName || 'Patient';

  // Pre-Session Consent & Identity Verification Modal State
  const [hasConfirmedConsent, setHasConfirmedConsent] = useState(false);
  const [consentCheck1, setConsentCheck1] = useState(true);
  const [consentCheck2, setConsentCheck2] = useState(true);
  const [consentCheck3, setConsentCheck3] = useState(true);

  // Call Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isAudioOnlyMode, setIsAudioOnlyMode] = useState(false); // Easy Switch from Video to Audio

  // Timer State (30 mins session)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const totalAllocatedMins = 30;

  // Network & Connection Quality State
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'weak'>('excellent');
  const [latencyMs, setLatencyMs] = useState(24);
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);

  // Reconnection & Connection Recovery State
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showConnectionRecoveryModal, setShowConnectionRecoveryModal] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(1);
  const [reconnectCountdown, setReconnectCountdown] = useState(5);

  // In-Call Messaging Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isChatOpenRef = useRef(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [showConsultationSummaryModal, setShowConsultationSummaryModal] = useState(false);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) {
      setUnreadChatCount(0);
    }
  }, [isChatOpen]);

  const [messages, setMessages] = useState<InCallMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; type: 'image' | 'document' } | null>(null);
  const hasLoadedInitialChatRef = useRef(false);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());

  // Real-time two-way synchronization of in-call messages between doctor and patient
  useEffect(() => {
    let isMounted = true;
    const roomChatSession = 'consultation-live-room';
    const currentSenderRole = user?.role === 'doctor' ? 'doctor' : 'patient';

    const ingestIncomingMessages = (incomingList: InCallMessage[], isInitialLoad: boolean) => {
      const fresh = incomingList.filter((m) => {
        const sigKey = `${m.sender}::${m.text}::${m.timestamp}`;
        return !seenMsgIdsRef.current.has(m.id) && !seenMsgIdsRef.current.has(sigKey);
      });
      if (fresh.length === 0) return;

      fresh.forEach((m) => {
        seenMsgIdsRef.current.add(m.id);
        seenMsgIdsRef.current.add(`${m.sender}::${m.text}::${m.timestamp}`);
      });
      setMessages((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const existingSigs = new Set(prev.map((p) => `${p.sender}::${p.text}::${p.timestamp}`));
        const toAppend = fresh.filter(
          (m) => !existingIds.has(m.id) && !existingSigs.has(`${m.sender}::${m.text}::${m.timestamp}`)
        );
        return toAppend.length > 0 ? [...prev, ...toAppend] : prev;
      });

      if (!isInitialLoad && !isChatOpenRef.current) {
        const fromOther = fresh.filter((m) => m.sender !== currentSenderRole);
        if (fromOther.length > 0) {
          setUnreadChatCount((c) => c + fromOther.length);
          triggerHaptic('medium');
          const latest = fromOther[fromOther.length - 1];
          showToast(`New message from ${latest.senderName}`, 'info');
          notifyIncomingMessage({
            senderName: latest.senderName,
            messageText: latest.text || 'Sent an attachment',
            chatId: roomChatSession,
          });
        }
      }
    };

    const syncMessages = async () => {
      try {
        const serverMsgs = await primeApi.getChatMessages(roomChatSession);
        if (serverMsgs && isMounted) {
          const mapped: InCallMessage[] = serverMsgs.map((m) => ({
            id: m.id,
            sender: m.sender,
            senderName: m.senderName,
            text: m.text || '',
            timestamp: m.timestamp,
            attachment: m.imageUrl ? { name: 'Attachment', type: 'image', url: m.imageUrl } : undefined,
          }));
          const isInitial = !hasLoadedInitialChatRef.current;
          hasLoadedInitialChatRef.current = true;
          ingestIncomingMessages(mapped, isInitial);
        }
      } catch {}
    };

    syncMessages();
    const pollTimer = setInterval(syncMessages, 1500);

    // Cross-tab / cross-window instant broadcast listener
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('prime_consultation_chat');
      channel.onmessage = (event) => {
        if (event.data && isMounted) {
          ingestIncomingMessages([event.data as InCallMessage], false);
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'prime_consultation_last_chat' && e.newValue && isMounted) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.msg) {
            ingestIncomingMessages([parsed.msg as InCallMessage], false);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.role]);

  // Support Drawer & End Consultation Modal
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [showEndConsultationModal, setShowEndConsultationModal] = useState(false);

  // Live Media Hardware Streams & Devices
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMicrophone, setHasMicrophone] = useState<boolean>(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState<boolean>(false);
  const [audioBlocked, setAudioBlocked] = useState<boolean>(false);
  const [isAcquiringMedia, setIsAcquiringMedia] = useState<boolean>(false);
  const [isConnectingCall, setIsConnectingCall] = useState<boolean>(false);
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const isPeerConnectedRef = useRef<boolean>(false);
  const [iceStatus, setIceStatus] = useState<string>('waiting');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [swappedPiP, setSwappedPiP] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Audio Output Routing State (Phone Speaker, Bluetooth, Headset, Earpiece)
  const [audioOutputDevices, setAudioOutputDevices] = useState<AudioOutputDeviceInfo[]>([]);
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState<string>('speaker');
  const [selectedAudioRouteType, setSelectedAudioRouteType] = useState<'speaker' | 'bluetooth' | 'headset' | 'default'>('speaker');
  const [isAudioRouteModalOpen, setIsAudioRouteModalOpen] = useState<boolean>(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const activeHandshakeIdRef = useRef<string | null>(null);
  const activeRemotePeerIdRef = useRef<string | null>(null);
  const pendingCandidatesByHandshakeRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const requestReconnectRef = useRef<(() => void) | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ]);
  const sessionId = 'consultation-live-room';
  const myRole = user?.role === 'doctor' ? 'doctor' : 'patient';
  const peerIdRef = useRef<string>(`${myRole}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const lastOfferSentAtRef = useRef<number>(0);

  // Live Mic Waveform activity pulse
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep video/audio DOM elements reliably bound whenever streams or layout swap
  // Keep <video> muted so Chrome/Safari/iOS NEVER block autoplay; <audio> element handles unmuted voice
  useEffect(() => {
    const localEl = localVideoRef.current;
    if (localEl && localStream) {
      if (localEl.srcObject !== localStream) {
        localEl.srcObject = localStream;
      }
      localEl.muted = true;
      localEl.play().catch(() => {});
    }

    const remoteEl = remoteVideoRef.current;
    if (remoteEl && remoteStream) {
      if (remoteEl.srcObject !== remoteStream) {
        remoteEl.srcObject = remoteStream;
      }
      remoteEl.muted = true;
      remoteEl.play().catch(() => {});
    }

    const audioEl = remoteAudioRef.current;
    if (audioEl && remoteStream) {
      if (audioEl.srcObject !== remoteStream) {
        audioEl.srcObject = remoteStream;
      }
      audioEl.muted = false;
      audioEl
        .play()
        .then(() => setAudioBlocked(false))
        .catch(() => setAudioBlocked(true));
    }

    setHasRemoteVideo(
      !!remoteStream && remoteStream.getVideoTracks().some((t) => t.readyState === 'live')
    );
  }, [localStream, remoteStream, swappedPiP, isVideoOff, isAudioOnlyMode, hasConfirmedConsent, hasCamera]);

  // Discover and refresh audio output devices (phone speaker, bluetooth, headsets)
  useEffect(() => {
    let isMounted = true;
    const fetchOutputs = async () => {
      const devs = await getAudioOutputDevices();
      if (!isMounted) return;
      setAudioOutputDevices(devs);

      // Auto-detect bluetooth or speaker if present
      const bluetoothDevice = devs.find((d) => d.type === 'bluetooth');
      if (bluetoothDevice) {
        setSelectedAudioOutputId(bluetoothDevice.deviceId);
        setSelectedAudioRouteType('bluetooth');
      } else {
        const speakerDevice = devs.find((d) => d.type === 'speaker');
        if (speakerDevice) {
          setSelectedAudioOutputId(speakerDevice.deviceId);
          setSelectedAudioRouteType('speaker');
        }
      }
    };

    fetchOutputs();

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', fetchOutputs);
      return () => {
        isMounted = false;
        navigator.mediaDevices.removeEventListener('devicechange', fetchOutputs);
      };
    }
  }, []);

  const handleSelectAudioRoute = async (device: AudioOutputDeviceInfo) => {
    triggerHaptic('medium');
    setSelectedAudioOutputId(device.deviceId);
    setSelectedAudioRouteType(device.type);
    setIsAudioRouteModalOpen(false);

    const audioEl = remoteAudioRef.current;
    const videoEl = remoteVideoRef.current;

    await setAudioOutputSink(audioEl, device.deviceId);
    if (videoEl) {
      await setAudioOutputSink(videoEl, device.deviceId);
    }

    if (device.type === 'bluetooth') {
      showToast(`Audio output routed to Bluetooth: ${device.label}`, 'success');
    } else if (device.type === 'speaker') {
      showToast('Audio output routed to Phone Speaker (Loudspeaker)', 'success');
    } else {
      showToast(`Audio output routed to ${device.label || 'Default Audio Device'}`, 'success');
    }
  };

  const handleSystemAudioPicker = async () => {
    triggerHaptic('medium');
    const deviceId = await requestSystemAudioOutput();
    if (deviceId) {
      const audioEl = remoteAudioRef.current;
      const videoEl = remoteVideoRef.current;
      await setAudioOutputSink(audioEl, deviceId);
      if (videoEl) await setAudioOutputSink(videoEl, deviceId);

      const devs = await getAudioOutputDevices();
      setAudioOutputDevices(devs);
      const chosen = devs.find((d) => d.deviceId === deviceId);
      if (chosen) {
        setSelectedAudioOutputId(chosen.deviceId);
        setSelectedAudioRouteType(chosen.type);
        showToast(`Connected to ${chosen.label}`, 'success');
      } else {
        setSelectedAudioOutputId(deviceId);
        showToast('System audio output connected', 'success');
      }
      setIsAudioRouteModalOpen(false);
    }
  };

  // Active Call Timer Loop
  useEffect(() => {
    if (!hasConfirmedConsent || isReconnecting) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasConfirmedConsent, isReconnecting]);

  // Acquire local camera/mic (can be triggered directly inside user click gesture for iOS Safari)
  const acquireLocalMedia = async (mode: 'user' | 'environment' = facingMode) => {
    setIsAcquiringMedia(true);
    setMediaError(null);
    try {
      const shouldRequestVideo = !isStrictlyAudio && !isAudioOnlyMode;
      const media = await requestUserMedia(shouldRequestVideo, true, mode);
      if (media.stream) {
        if (localStreamRef.current && localStreamRef.current !== media.stream) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        // Apply current mute/video toggles cleanly
        media.stream.getAudioTracks().forEach((t) => {
          t.enabled = !isMuted;
        });
        media.stream.getVideoTracks().forEach((t) => {
          t.enabled = !isVideoOff && shouldRequestVideo;
        });

        localStreamRef.current = media.stream;
        setLocalStream(media.stream);
        setHasCamera(shouldRequestVideo ? media.hasCamera : false);
        setHasMicrophone(media.hasMicrophone);
        if (media.error) {
          setMediaError(media.error);
        }

        // If peer connection already exists, hot-swap or upgrade recvonly -> sendrecv and renegotiate
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState !== 'closed') {
          let needsRenegotiation = false;
          const transceivers = pc.getTransceivers();

          for (const track of media.stream.getTracks()) {
            if (isStrictlyAudio && track.kind === 'video') continue;
            const matchingTransceiver = transceivers.find(
              (t) =>
                t.sender?.track?.kind === track.kind ||
                t.receiver?.track?.kind === track.kind
            );

            if (matchingTransceiver) {
              if (matchingTransceiver.direction === 'recvonly' || matchingTransceiver.direction === 'inactive') {
                matchingTransceiver.direction = 'sendrecv';
                needsRenegotiation = true;
              }
              try {
                await matchingTransceiver.sender.replaceTrack(track);
              } catch {
                needsRenegotiation = true;
              }
            } else {
              pc.addTrack(track, media.stream);
              needsRenegotiation = true;
            }
          }

          if (needsRenegotiation && requestReconnectRef.current) {
            requestReconnectRef.current();
          }
        }
        return media.stream;
      } else {
        setHasCamera(false);
        setHasMicrophone(false);
        setMediaError(media.error || (isStrictlyAudio ? 'Microphone permission denied. Tap to retry.' : 'Camera/microphone permission denied. Tap Enable Camera to retry.'));
        return null;
      }
    } finally {
      setIsAcquiringMedia(false);
    }
  };

  // Live WebRTC PeerConnection & Zero-Glare Handshake-Scoped 2-Way Signaling Lifecycle
  useEffect(() => {
    if (!hasConfirmedConsent) return;

    let isMounted = true;
    let stopAudioAnalyser: (() => void) | null = null;
    let signalPollTimer: ReturnType<typeof setInterval> | null = null;
    let readyHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let signalChannel: BroadcastChannel | null = null;
    let lastSeq = 0;

    const myPeerId = peerIdRef.current;

    const sendSignal = async (
      type: 'ready' | 'offer' | 'answer' | 'candidate' | 'leave',
      data?: any,
      handshakeId?: string
    ) => {
      const payload = { sender: myRole, peerId: myPeerId, handshakeId, type, data };
      try {
        signalChannel?.postMessage({ sessionId, ...payload });
      } catch {}
      await primeApi.sendVideoSignal(sessionId, payload);
    };

    const drainPendingCandidates = async (pc: RTCPeerConnection, handshakeId: string) => {
      if (!pc.remoteDescription) return;
      const queued = pendingCandidatesByHandshakeRef.current[handshakeId];
      if (!queued || queued.length === 0) return;
      delete pendingCandidatesByHandshakeRef.current[handshakeId];
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      }
    };

    const buildPeerConnection = (handshakeId: string): RTCPeerConnection => {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.ontrack = null;
          peerConnectionRef.current.onicecandidate = null;
          peerConnectionRef.current.oniceconnectionstatechange = null;
          peerConnectionRef.current.onconnectionstatechange = null;
          peerConnectionRef.current.close();
        } catch {}
      }

      activeHandshakeIdRef.current = handshakeId;
      remoteStreamRef.current = new MediaStream();

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
        iceCandidatePoolSize: 6,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      });
      peerConnectionRef.current = pc;

      // Attach local camera & mic tracks; fallback to recvonly transceiver ONLY if device track is missing
      const stream = localStreamRef.current;
      let hasVideoSender = false;
      let hasAudioSender = false;
      if (stream) {
        stream.getTracks().forEach((track) => {
          if (track.readyState !== 'live') return;
          if (track.kind === 'video') hasVideoSender = true;
          if (track.kind === 'audio') hasAudioSender = true;
          pc.addTrack(track, stream);
        });
      }
      if (!isStrictlyAudio && !hasVideoSender) {
        pc.addTransceiver('video', { direction: 'recvonly' });
      }
      if (!hasAudioSender) {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      const publishRemoteStream = () => {
        if (!isMounted || peerConnectionRef.current !== pc) return;
        const liveTracks = remoteStreamRef.current
          .getTracks()
          .filter((t) => t.readyState === 'live');
        const freshStream = new MediaStream(liveTracks);
        setRemoteStream(freshStream);
        setHasRemoteVideo(liveTracks.some((t) => t.kind === 'video'));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = freshStream;
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = freshStream;
          remoteAudioRef.current.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
        }
      };

      // Accumulate incoming remote tracks safely across Chrome, Edge, Android, and iOS Safari
      pc.ontrack = (event) => {
        if (!isMounted || peerConnectionRef.current !== pc) return;
        const incomingTracks: MediaStreamTrack[] = [];
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((t) => incomingTracks.push(t));
        }
        if (event.track) {
          incomingTracks.push(event.track);
        }

        incomingTracks.forEach((track) => {
          // Remove any stale/ended track of the same kind before adding the live one
          remoteStreamRef.current.getTracks().forEach((existing) => {
            if (existing.id !== track.id && existing.kind === track.kind && existing.readyState === 'ended') {
              remoteStreamRef.current.removeTrack(existing);
            }
          });
          const alreadyAdded = remoteStreamRef.current.getTracks().some((t) => t.id === track.id);
          if (!alreadyAdded) {
            remoteStreamRef.current.addTrack(track);
          }
          // Chrome/Safari often fire ontrack while track.muted=true before first RTP packet arrives
          track.onunmute = () => publishRemoteStream();
          track.onended = () => publishRemoteStream();
        });

        publishRemoteStream();
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && peerConnectionRef.current === pc) {
          sendSignal('candidate', event.candidate.toJSON(), handshakeId);
        }
      };

      const handleStateUpdate = () => {
        if (!isMounted || peerConnectionRef.current !== pc) return;
        const state = pc.iceConnectionState || pc.connectionState;
        setIceStatus(state);
        if (state === 'connected' || state === 'completed') {
          isPeerConnectedRef.current = true;
          setIsPeerConnected(true);
          playConnectedTone();
          publishRemoteStream();
        } else if (state === 'failed') {
          isPeerConnectedRef.current = false;
          setIsPeerConnected(false);
          setTimeout(() => {
            if (isMounted && peerConnectionRef.current === pc && pc.iceConnectionState === 'failed') {
              if (myRole === 'patient') {
                createAndSendOffer(true);
              } else {
                sendSignal('ready', { role: myRole, restart: true });
              }
            }
          }, 1200);
        } else if (state === 'disconnected') {
          setTimeout(() => {
            if (isMounted && peerConnectionRef.current === pc && pc.iceConnectionState === 'disconnected') {
              isPeerConnectedRef.current = false;
              setIsPeerConnected(false);
              if (myRole === 'patient') {
                createAndSendOffer(true);
              } else {
                sendSignal('ready', { role: myRole, restart: true });
              }
            }
          }, 5000);
        }
      };

      pc.oniceconnectionstatechange = handleStateUpdate;
      pc.onconnectionstatechange = handleStateUpdate;

      return pc;
    };

    const createAndSendOffer = async (force: boolean = false) => {
      const now = Date.now();
      if (!force && now - lastOfferSentAtRef.current < 4000) return;
      lastOfferSentAtRef.current = now;

      const handshakeId = `hs-${now}-${Math.random().toString(36).slice(2, 7)}`;
      try {
        setIceStatus('checking');
        const pc = buildPeerConnection(handshakeId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        await sendSignal('offer', { type: offer.type, sdp: offer.sdp, handshakeId }, handshakeId);
      } catch (err) {
        console.warn('[WebRTC] Offer creation error:', err);
      }
    };

    // Expose manual/renegotiation reconnect trigger
    requestReconnectRef.current = () => {
      if (!isMounted) return;
      isPeerConnectedRef.current = false;
      setIsPeerConnected(false);
      setIceStatus('checking');
      if (myRole === 'patient') {
        createAndSendOffer(true);
      } else {
        sendSignal('ready', {
          role: myRole,
          restart: true,
          hasVideo: !!localStreamRef.current?.getVideoTracks().length,
          hasAudio: !!localStreamRef.current?.getAudioTracks().length,
        });
      }
    };

    const handleIncomingSignal = async (sig: {
      sender: string;
      peerId?: string;
      handshakeId?: string;
      type: string;
      data: any;
    }) => {
      if (!isMounted) return;
      if (sig.peerId && sig.peerId === myPeerId) return;
      if (!sig.peerId && sig.sender === myRole) return;

      const sigHandshakeId: string | undefined = sig.handshakeId || sig.data?.handshakeId;

      try {
        if (sig.type === 'ready') {
          // Patient is the deterministic Offerer whenever Doctor joins or requests restart
          if (myRole === 'patient') {
            const pc = peerConnectionRef.current;
            const sameRemotePeer = activeRemotePeerIdRef.current === (sig.peerId || sig.sender);
            const isConnectingOrLive =
              pc &&
              sameRemotePeer &&
              !sig.data?.restart &&
              (pc.iceConnectionState === 'connected' ||
                pc.iceConnectionState === 'completed' ||
                pc.iceConnectionState === 'checking' ||
                (pc.signalingState === 'have-local-offer' &&
                  Date.now() - lastOfferSentAtRef.current < 12000));

            if (!isConnectingOrLive) {
              activeRemotePeerIdRef.current = sig.peerId || sig.sender;
              await createAndSendOffer(!!sig.data?.restart);
            }
          } else {
            // Doctor received Patient's ready -> re-announce ready once if not already connected/checking
            const pc = peerConnectionRef.current;
            const doctorAlreadyWorking =
              pc &&
              (pc.iceConnectionState === 'connected' ||
                pc.iceConnectionState === 'completed' ||
                pc.iceConnectionState === 'checking');
            if (!doctorAlreadyWorking) {
              await sendSignal('ready', {
                role: myRole,
                hasVideo: !!localStreamRef.current?.getVideoTracks().length,
                hasAudio: !!localStreamRef.current?.getAudioTracks().length,
              });
            }
          }
        } else if (sig.type === 'offer' && sig.data?.sdp) {
          // Answerer (Doctor) handles incoming Offer without wiping candidates for this handshakeId
          const offerHsId = sigHandshakeId || `hs-legacy-${Date.now()}`;
          if (
            offerHsId === activeHandshakeIdRef.current &&
            peerConnectionRef.current &&
            peerConnectionRef.current.signalingState !== 'closed'
          ) {
            return;
          }

          // Ensure Doctor's local camera & mic are ready before creating the Answer SDP
          if (!localStreamRef.current) {
            await acquireLocalMedia(facingMode);
          }

          activeRemotePeerIdRef.current = sig.peerId || sig.sender;
          setIceStatus('checking');
          const pc = buildPeerConnection(offerHsId);
          await pc.setRemoteDescription(new RTCSessionDescription({ type: sig.data.type, sdp: sig.data.sdp }));
          await drainPendingCandidates(pc, offerHsId);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal('answer', { type: answer.type, sdp: answer.sdp, handshakeId: offerHsId }, offerHsId);
        } else if (sig.type === 'answer' && sig.data?.sdp) {
          const pc = peerConnectionRef.current;
          const matchesHandshake = !sigHandshakeId || sigHandshakeId === activeHandshakeIdRef.current;
          if (pc && matchesHandshake && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: sig.data.type, sdp: sig.data.sdp }));
            if (activeHandshakeIdRef.current) {
              await drainPendingCandidates(pc, activeHandshakeIdRef.current);
            }
          }
        } else if (sig.type === 'candidate' && sig.data) {
          const pc = peerConnectionRef.current;
          const candHsId = sigHandshakeId || activeHandshakeIdRef.current || 'default';
          if (
            pc &&
            pc.remoteDescription &&
            (!sigHandshakeId || sigHandshakeId === activeHandshakeIdRef.current)
          ) {
            await pc.addIceCandidate(new RTCIceCandidate(sig.data)).catch(() => {});
          } else {
            if (!pendingCandidatesByHandshakeRef.current[candHsId]) {
              pendingCandidatesByHandshakeRef.current[candHsId] = [];
            }
            pendingCandidatesByHandshakeRef.current[candHsId].push(sig.data);
          }
        } else if (sig.type === 'leave') {
          if (sig.peerId && activeRemotePeerIdRef.current && sig.peerId !== activeRemotePeerIdRef.current) {
            return;
          }
          isPeerConnectedRef.current = false;
          setIsPeerConnected(false);
          setHasRemoteVideo(false);
          setRemoteStream(null);
          activeRemotePeerIdRef.current = null;
          setIceStatus('waiting');
          showToast('The other participant left the call room.', 'info');
        }
      } catch (err) {
        console.warn('[WebRTC] Signal handling error:', err);
      }
    };

    const initCall = async () => {
      setIsConnectingCall(false);

      // 1. Fetch fresh STUN + TURN ICE servers from backend
      try {
        const tokenRes = await primeApi.getVideoToken(sessionId, myRole);
        if (tokenRes?.iceServers && tokenRes.iceServers.length > 0) {
          iceServersRef.current = tokenRes.iceServers;
        }
      } catch {}

      // 2. Ensure local media is acquired BEFORE signaling so video track is included in initial SDP
      let activeLocalStream = localStreamRef.current;
      if (!activeLocalStream) {
        activeLocalStream = await acquireLocalMedia(facingMode);
      }

      if (activeLocalStream && isMounted) {
        stopAudioAnalyser = setupAudioAnalyser(activeLocalStream, (lvl) => {
          setAudioLevel(lvl);
        });
      }

      if (!isMounted) return;

      // 3. Open same-browser BroadcastChannel for instant local/same-device signaling
      try {
        signalChannel = new BroadcastChannel('prime_webrtc_signal');
        signalChannel.onmessage = (event) => {
          if (event.data?.sessionId === sessionId) {
            handleIncomingSignal(event.data);
          }
        };
      } catch {}

      // 4. Poll server signaling queue every 700ms using monotonic server seq
      const pollSignals = async () => {
        if (!isMounted) return;
        try {
          const { signals, latestSeq } = await primeApi.getVideoSignals(sessionId, lastSeq, myPeerId);
          if (latestSeq > lastSeq) {
            lastSeq = latestSeq;
          }
          for (const sig of signals) {
            await handleIncomingSignal(sig);
          }
        } catch {}
      };

      // 5. Announce presence FIRST, then immediately poll so either join order handshakes cleanly
      await sendSignal('ready', {
        role: myRole,
        hasVideo: !!localStreamRef.current?.getVideoTracks().length,
        hasAudio: !!localStreamRef.current?.getAudioTracks().length,
      });

      await pollSignals();
      signalPollTimer = setInterval(pollSignals, 700);

      // 6. Gentle 10-second discovery heartbeat ONLY when idle (never interrupts in-flight ICE checking!)
      readyHeartbeatTimer = setInterval(() => {
        if (!isMounted || isPeerConnectedRef.current) return;
        const pc = peerConnectionRef.current;
        const inFlight =
          pc &&
          (pc.iceConnectionState === 'checking' ||
            pc.iceConnectionState === 'connected' ||
            pc.iceConnectionState === 'completed');
        if (!inFlight) {
          sendSignal('ready', {
            role: myRole,
            hasVideo: !!localStreamRef.current?.getVideoTracks().length,
            hasAudio: !!localStreamRef.current?.getAudioTracks().length,
          });
        }
      }, 10000);
    };

    initCall();

    return () => {
      isMounted = false;
      isPeerConnectedRef.current = false;
      requestReconnectRef.current = null;
      if (signalPollTimer) clearInterval(signalPollTimer);
      if (readyHeartbeatTimer) clearInterval(readyHeartbeatTimer);
      if (signalChannel) {
        try {
          signalChannel.postMessage({ sessionId, sender: myRole, peerId: myPeerId, type: 'leave' });
          signalChannel.close();
        } catch {}
      }
      primeApi.sendVideoSignal(sessionId, { sender: myRole, peerId: myPeerId, type: 'leave' }).catch(() => {});
      if (stopAudioAnalyser) stopAudioAnalyser();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [hasConfirmedConsent]);

  const handleSwitchCamera = async () => {
    triggerHaptic('medium');
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    const stream = await acquireLocalMedia(nextFacing);
    if (stream) {
      showToast(`Switched to ${nextFacing === 'user' ? 'Front' : 'Back'} Camera`);
    }
  };

  const handleCopyCallLink = () => {
    triggerHaptic('light');
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    showToast('Room link copied! Open on another device or tab to join.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRingDoctorAgain = async () => {
    triggerHaptic('heavy');
    showToast('Ringing doctor on their device...', 'info');
    try {
      const callData = {
        id: 'call-' + Date.now(),
        appointmentId: 'apt-live-' + Date.now(),
        patientId: user?.id || 'patient-1',
        patientName: activeProfile.displayName || user?.name || 'Patient',
        patientAvatar: user?.avatarUrl,
        doctorId: 'all',
        doctorName: displayDoctorName,
        type: 'Video' as const,
        status: 'ringing' as const,
        timestamp: Date.now(),
        vitals: {
          temp: '36.8',
          spo2: '99',
          systolicBp: '120',
          diastolicBp: '80',
          hr: '72',
        },
      };
      localStorage.setItem('prime_telecare_incoming_call', JSON.stringify(callData));
      window.dispatchEvent(new CustomEvent('incoming-doctor-call', { detail: callData }));
      await primeApi.startCall(callData);
      showToast("Doctor's device is ringing! They can join room now.", 'success');
    } catch {
      showToast('Doctor call alert dispatched locally.', 'info');
    }
  };

  const handleToggleMute = () => {
    triggerHaptic('light');
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }
  };

  const handleToggleVideo = async () => {
    triggerHaptic('light');
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    if (!nextVideoOff && (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0)) {
      await acquireLocalMedia(facingMode);
      return;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !nextVideoOff;
      });
    }
  };

  const handleForceReconnect = () => {
    triggerHaptic('medium');
    showToast('Reconnecting live video stream...', 'info');
    requestReconnectRef.current?.();
  };

  const handleUnblockAudio = () => {
    const audioEl = remoteAudioRef.current;
    if (audioEl) {
      audioEl.muted = false;
      if (selectedAudioOutputId && selectedAudioOutputId !== 'default' && selectedAudioOutputId !== 'speaker' && selectedAudioOutputId !== 'bluetooth') {
        setAudioOutputSink(audioEl, selectedAudioOutputId).catch(() => {});
      }
      audioEl
        .play()
        .then(() => setAudioBlocked(false))
        .catch(() => {});
    }
  };

  const handleToggleScreenShare = async () => {
    triggerHaptic('medium');
    if (isScreenSharing) {
      setIsScreenSharing(false);
      if (remoteVideoRef.current) {
        const doc = createDoctorCanvasStream(doctorName, 'Pediatric Telehealth');
        remoteVideoRef.current.srcObject = doc.stream;
        remoteVideoRef.current.play().catch(() => {});
      }
    } else {
      const screen = await startScreenShare();
      if (screen && remoteVideoRef.current) {
        setIsScreenSharing(true);
        remoteVideoRef.current.srcObject = screen;
        remoteVideoRef.current.play().catch(() => {});
        screen.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      }
    }
  };

  const handleHangup = (summaryData?: ConsultationSummaryData) => {
    triggerHaptic('heavy');
    playHangupTone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setShowEndConsultationModal(false);
    setShowConsultationSummaryModal(false);

    // Conclude consultation: mark appointment as completed so it reflects under Completed
    try {
      const savedRaw = localStorage.getItem('prime_telecare_active_call_session');
      let aptId = '';
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        aptId = parsed.appointmentId || parsed.consultationId || parsed.id || '';
      }
      const targetId = aptId || sessionId;
      const consultationModality = isStrictlyAudio || isAudioOnlyMode ? 'Voice' : 'Video';

      if (targetId) {
        completeConsultation(targetId, summaryData, {
          doctorName: displayDoctorName,
          patientName: displayPatientName,
          type: consultationModality,
        });
        primeApi.completeAppointment(targetId, summaryData).catch(() => {});
      } else {
        const upcoming = getActiveOrUpcomingConsultations();
        if (upcoming.length > 0) {
          completeConsultation(upcoming[0].id, summaryData, {
            doctorName: displayDoctorName,
            patientName: displayPatientName,
            type: consultationModality,
          });
          if (upcoming[0].appointmentId) {
            completeConsultation(upcoming[0].appointmentId, summaryData, {
              doctorName: displayDoctorName,
              patientName: displayPatientName,
              type: consultationModality,
            });
            primeApi.completeAppointment(upcoming[0].appointmentId, summaryData).catch(() => {});
          }
        }
      }
      localStorage.removeItem('prime_telecare_incoming_call');
      localStorage.removeItem('prime_telecare_active_call');
      window.dispatchEvent(new Event('appointment-alerts-updated'));
    } catch {}

    if (summaryData) {
      showToast('Consultation concluded & clinical summary saved for patient!', 'success');
    }

    onNavigate('post-consultation-journey');
  };

  // Reconnection Countdown Effect
  useEffect(() => {
    if (!isReconnecting) return;
    const countdown = setInterval(() => {
      setReconnectCountdown((prev) => {
        if (prev <= 1) {
          setIsReconnecting(false);
          setReconnectCountdown(5);
          triggerHaptic('success');
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [isReconnecting]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingSeconds = totalAllocatedMins * 60 - elapsedSeconds;
  const isNearEnd = remainingSeconds <= 300 && remainingSeconds > 0; // <= 5 mins

  // Handle Simulating Connection Degradation
  const toggleSimulateNetworkDegradation = () => {
    triggerHaptic('medium');
    if (connectionQuality === 'excellent') {
      setConnectionQuality('weak');
      setLatencyMs(210);
      setIsAudioOnlyMode(true); // Auto fallback to audio mode for weak network
    } else {
      setConnectionQuality('excellent');
      setLatencyMs(24);
      setIsAudioOnlyMode(false);
    }
  };

  // Handle Simulating Connection Drop
  const handleSimulateCallDrop = () => {
    triggerHaptic('heavy');
    setIsReconnecting(true);
    setShowConnectionRecoveryModal(true);
    setReconnectAttempt((prev) => (prev % 3) + 1);
  };

  // Handle Sending In-Call Message with Real 2-Way Synchronization
  const handleSendMessage = async () => {
    if (!newMessageText.trim() && !attachedFile) return;
    triggerHaptic('light');

    const isDoctor = user?.role === 'doctor';
    const senderRole: 'doctor' | 'patient' = isDoctor ? 'doctor' : 'patient';
    const mySenderName = isDoctor
      ? displayDoctorName
      : displayPatientName;

    const msg: InCallMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: senderRole,
      senderName: mySenderName,
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachedFile ? { ...attachedFile } : undefined,
    };

    seenMsgIdsRef.current.add(msg.id);
    seenMsgIdsRef.current.add(`${msg.sender}::${msg.text}::${msg.timestamp}`);
    setMessages((prev) => [...prev, msg]);
    setNewMessageText('');
    setAttachedFile(null);

    // 1. Send to server via API for remote cross-device peer
    try {
      await primeApi.sendChatMessage(sessionId, {
        sender: senderRole,
        senderName: mySenderName,
        text: msg.text,
        imageUrl: msg.attachment?.url,
      });
    } catch {}

    // 2. Broadcast via BroadcastChannel and localStorage for instant same-browser cross-tab reflection
    try {
      const channel = new BroadcastChannel('prime_consultation_chat');
      channel.postMessage(msg);
      channel.close();
    } catch {}

    try {
      localStorage.setItem(
        'prime_consultation_last_chat',
        JSON.stringify({ sessionId, msg, timestamp: Date.now() })
      );
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic('medium');
    const isImg = file.type.startsWith('image/');
    
    // Simulate Document Compression for low-data mode
    const isLowData = connectionQuality === 'weak' || isAudioOnlyMode;
    const sizeReduction = isLowData ? " (Compressed 80% for Low Data Mode)" : "";

    setAttachedFile({
      name: file.name + sizeReduction,
      type: isImg ? 'image' : 'document',
      url: URL.createObjectURL(file),
    });
  };

  return (
    <div className="relative h-[100dvh] w-full bg-slate-950 overflow-hidden text-white flex flex-col justify-between font-nunito select-none">
      <StatusBar dark className="relative z-20 w-full" />

      {/* Hidden Remote Audio Element (ensures clear voice playback across all modes & iOS Safari) */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Hidden File Input for Document & Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* ========================================================================= */}
      {/* 1. PRE-SESSION CONSENT & IDENTITY CONFIRMATION MODAL                      */}
      {/* ========================================================================= */}
      {!hasConfirmedConsent && (
        <div className="absolute inset-0 z-50 bg-[#022434]/95 backdrop-blur-xl p-5 flex flex-col justify-between overflow-y-auto font-nunito">
          <div className="max-w-md mx-auto w-full space-y-5 my-auto py-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-[#77daa4] border-2 border-[#77daa4] mx-auto flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold font-outfit text-white">
                Session Consent
              </h2>
            </div>

            {/* Identity Confirmation Card */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/15 space-y-3">
              <span className="text-[10px] font-extrabold font-outfit text-emerald-400 uppercase tracking-wider block">
                Identity & Credentials Confirmation
              </span>

              {/* Doctor Details */}
              <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                {resolvedDoctorAvatar ? (
                  <img
                    src={resolvedDoctorAvatar}
                    alt={displayDoctorName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#77daa4]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-[#77daa4] flex items-center justify-center text-[#77daa4] font-extrabold font-outfit text-sm shrink-0">
                    {displayDoctorName.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold font-outfit text-sm text-white">{displayDoctorName}</span>
                    <span className="text-[10px] font-extrabold bg-emerald-500/30 text-[#77daa4] px-2 py-0.5 rounded-full border border-emerald-400/40">
                      Verified
                    </span>
                  </div>
                  {doctorSpecialty && (
                    <p className="text-xs text-slate-300">{doctorSpecialty}</p>
                  )}
                </div>
              </div>

              {/* Patient Details */}
              <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                {!isDoctorAccount && activeProfile.avatarUrl ? (
                  <img
                    src={activeProfile.avatarUrl}
                    alt={displayPatientName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center text-white font-extrabold font-outfit text-xs shrink-0">
                    {displayPatientName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold font-outfit text-xs text-white">
                      Patient: {displayPatientName}
                    </span>
                    {!isDoctorAccount && (
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">
                        {activeProfile.relationshipLabel}
                      </span>
                    )}
                  </div>
                  {!isDoctorAccount && (
                    <p className="text-[11px] text-slate-300">
                      {activeProfile.ageGenderLabel}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/10 text-xs">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentCheck1}
                  onChange={(e) => setConsentCheck1(e.target.checked)}
                  className="mt-0.5 accent-[#77daa4] w-4 h-4 rounded"
                />
                <span className="text-slate-200 leading-tight">
                  I consent to encrypted {isStrictlyAudio ? 'audio' : 'video/audio'} medical examination and clinical data logging for this session.
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentCheck2}
                  onChange={(e) => setConsentCheck2(e.target.checked)}
                  className="mt-0.5 accent-[#77daa4] w-4 h-4 rounded"
                />
                <span className="text-slate-200 leading-tight">
                  I grant permission to upload and share diagnostic images, lab reports, and medication histories during the call.
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentCheck3}
                  onChange={(e) => setConsentCheck3(e.target.checked)}
                  className="mt-0.5 accent-[#77daa4] w-4 h-4 rounded"
                />
                <span className="text-slate-200 leading-tight">
                  I understand that in case of severe life-threatening emergencies, I should dial 112 or visit an ER.
                </span>
              </label>
            </div>

            {/* Entry Button */}
            <button
              disabled={!consentCheck1 || !consentCheck2 || !consentCheck3 || isAcquiringMedia}
              onClick={async () => {
                triggerHaptic('heavy');
                await acquireLocalMedia(facingMode);
                setHasConfirmedConsent(true);
              }}
              className="w-full py-4 bg-[#77daa4] disabled:bg-slate-700 disabled:text-slate-500 hover:bg-emerald-300 text-[#022434] font-extrabold font-outfit text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
            >
              {isStrictlyAudio ? <PhoneCall className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              <span>
                {isAcquiringMedia
                  ? isStrictlyAudio
                    ? 'Connecting Audio...'
                    : 'Starting Camera & Mic...'
                  : isStrictlyAudio
                  ? 'Join Audio Consultation'
                  : 'Join Consultation'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONSULTATION CANVAS (LIVE WEBRTC VIDEO OR AUDIO FALLBACK)         */}
      {/* ========================================================================= */}
      {!isAudioOnlyMode && !isStrictlyAudio ? (
        /* Video Mode Stream */
        <div className="absolute inset-0 z-0 bg-slate-950" onClick={audioBlocked ? handleUnblockAudio : undefined}>
          <video
            ref={swappedPiP ? localVideoRef : remoteVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover object-center filter brightness-95 ${
              swappedPiP ? 'scale-x-[-1]' : ''
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

          {/* Audio Autoplay Unblock Pill (only if browser blocked unmuted remote audio) */}
          {audioBlocked && isPeerConnected && (
            <button
              type="button"
              onClick={handleUnblockAudio}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#022434] font-extrabold font-outfit text-xs rounded-full shadow-xl flex items-center space-x-2 animate-bounce cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Tap to Enable Call Audio</span>
            </button>
          )}

          {/* Waiting for Peer / Reconnect Banner */}
          {(!isPeerConnected || (!hasRemoteVideo && !swappedPiP)) && (
            <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 max-w-sm bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/40 text-white shadow-2xl text-center space-y-2.5">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold font-outfit text-emerald-300 uppercase tracking-wider">
                  {isPeerConnected && !hasRemoteVideo
                    ? myRole === 'patient'
                      ? 'Waiting for Doctor Camera...'
                      : 'Waiting for Patient Camera...'
                    : iceStatus === 'checking'
                    ? 'Connecting Live Video...'
                    : myRole === 'patient'
                    ? `Calling ${displayDoctorName}...`
                    : 'Waiting for Patient...'}
                </span>
              </div>
              {mediaError && (
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-[11px] text-amber-200 space-y-1.5">
                  <p>{mediaError}</p>
                  <button
                    type="button"
                    onClick={() => acquireLocalMedia(facingMode)}
                    className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Enable Camera & Mic
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleForceReconnect}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-outfit rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reconnect Video</span>
                </button>
                {myRole === 'patient' && !isPeerConnected && (
                  <button
                    type="button"
                    onClick={handleRingDoctorAgain}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-outfit rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Ring Doctor</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyCallLink}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-outfit rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Audio Visualizer Waveform Overlay over Video */}
          {!isMuted && (
            <div className="absolute bottom-28 left-6 z-10 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
              <div className="flex items-end space-x-1 h-3.5">
                <div className="w-1 bg-[#77daa4] rounded-full transition-all duration-100" style={{ height: `${Math.max(25, audioLevel)}%` }} />
                <div className="w-1 bg-[#77daa4] rounded-full transition-all duration-100" style={{ height: `${Math.max(15, audioLevel * 0.8)}%` }} />
                <div className="w-1 bg-[#77daa4] rounded-full transition-all duration-100" style={{ height: `${Math.max(35, audioLevel * 1.3)}%` }} />
                <div className="w-1 bg-[#77daa4] rounded-full transition-all duration-100" style={{ height: `${Math.max(10, audioLevel * 0.5)}%` }} />
              </div>
              <span className="text-[10px] font-bold text-[#77daa4] ml-1 uppercase font-mono">Live Mic</span>
            </div>
          )}
        </div>
      ) : (
        /* Audio Fallback Mode Canvas (Data Saver for weak connectivity) */
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#022434] via-[#011621] to-[#000d14] flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-emerald-400/40 p-1 shadow-2xl relative">
              <img
                src={resolvedDoctorAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                alt={displayDoctorName}
                className="w-full h-full rounded-full object-cover"
              />
              <span className="absolute bottom-1 right-1 bg-emerald-500 text-[#022434] p-2 rounded-full border-2 border-[#022434]">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </span>
            </div>
            {/* Pulsing Audio Wave Halo */}
            <div className="absolute -inset-4 rounded-full border border-emerald-400/20 animate-ping pointer-events-none" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-extrabold font-outfit text-[#77daa4] uppercase tracking-wider bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
              {isStrictlyAudio ? 'Strictly Audio Consultation' : 'Audio Mode'}
            </span>
            <h2 className="text-2xl font-extrabold font-outfit text-white">
              {myRole === 'doctor' ? displayPatientName : displayDoctorName}
            </h2>
            <p className="text-xs text-slate-400">
              {isStrictlyAudio ? 'Encrypted Live Voice Feed' : 'Network-optimized audio channel'}
            </p>
          </div>

          {/* Active Voice Waveform */}
          <div className="flex items-center space-x-1.5 h-10 bg-black/40 px-6 py-2 rounded-2xl border border-white/10">
            {[40, 70, 30, 90, 60, 20, 85, 45, 100, 35, 75, 50].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#77daa4] rounded-full transition-all duration-200"
                style={{ height: `${(h * (audioLevel || 30)) / 100}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FLOATING PIP SELF PREVIEW & VISUAL MIC/CAM STATUS                      */}
      {/* ========================================================================= */}
      {!isStrictlyAudio && (
        <div
          onClick={() => {
            triggerHaptic('selection');
            if (!hasCamera && !swappedPiP) {
              acquireLocalMedia(facingMode);
              return;
            }
            setSwappedPiP(!swappedPiP);
          }}
          className="absolute top-18 sm:top-20 right-3 sm:right-5 z-20 w-24 h-36 sm:w-28 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-900 group cursor-pointer hover:border-emerald-400 transition-colors"
          title={!hasCamera && !swappedPiP ? 'Tap to enable camera' : 'Tap to swap main and preview cameras'}
        >
          {!isVideoOff && !isAudioOnlyMode && (swappedPiP || hasCamera) ? (
            <div className="relative w-full h-full">
              <video
                ref={swappedPiP ? remoteVideoRef : localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!swappedPiP ? 'scale-x-[-1]' : ''}`}
              />
              {/* Visual Green Camera Active Dot */}
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black" title="Camera Streaming" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-slate-900/90 text-center space-y-1">
              <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              <span className="text-[9px] sm:text-[10px] text-slate-200 font-extrabold font-outfit leading-tight">
                {isAudioOnlyMode ? 'Audio Only' : !hasCamera ? 'Tap for Camera' : 'Camera Off'}
              </span>
            </div>
          )}

          {/* Visual Muted Overlay on PIP */}
          {isMuted && (
            <div className="absolute inset-0 bg-red-950/60 backdrop-blur-xs flex items-center justify-center">
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 animate-bounce" />
            </div>
          )}
        </div>
      )}

      {/* Calling Doctor Overlay */}
      {isConnectingCall && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in duration-200">
          <div className="relative">
            <img
              src={resolvedDoctorAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
              alt={displayDoctorName}
              className="w-28 h-28 rounded-full object-cover border-4 border-emerald-400 shadow-2xl ring-8 ring-emerald-400/20 animate-pulse"
            />
            <div className="absolute -bottom-1 -right-1 p-2.5 bg-emerald-500 rounded-full text-[#022434] shadow-lg animate-bounce">
              <PhoneCall className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
              Direct Encrypted WebRTC Link
            </span>
            <h3 className="font-outfit font-extrabold text-2xl text-white">Calling {displayDoctorName}...</h3>
            <p className="text-xs text-slate-300">
              Connecting audio/video channels
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TOP BAR: PRACTITIONER NAME & LIVE STATUS                               */}
      {/* ========================================================================= */}
      <div className="relative z-20 px-5 pt-3 pb-2 flex items-center justify-center">
        <div className="bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-lg flex items-center space-x-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPeerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="text-sm sm:text-base font-extrabold font-outfit text-white tracking-wide">
            {myRole === 'doctor' ? displayPatientName : displayDoctorName}
          </span>
          <span className="text-[11px] font-mono text-emerald-300 font-bold">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RECONNECTION OVERLAY (IF CALL DROPS)                                   */}
      {/* ========================================================================= */}
      {isReconnecting && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-400 flex items-center justify-center animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-extrabold font-outfit text-amber-400 uppercase tracking-wider block">
              Connection Interrupted
            </span>
            <h3 className="text-xl font-extrabold font-outfit text-white">
              Reconnecting to {myRole === 'doctor' ? displayPatientName : displayDoctorName}...
            </h3>
            <p className="text-xs text-slate-300">
              Attempt {reconnectAttempt} of 3 • Rejoining clinical stream in {reconnectCountdown}s
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2 w-full max-w-xs">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                setShowConnectionRecoveryModal(true);
              }}
              className="w-full py-3 bg-[#77daa4] hover:bg-emerald-300 text-[#022434] font-extrabold font-outfit text-xs rounded-xl shadow-lg flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isStrictlyAudio ? 'Reconnect Audio Feed' : 'Reconnect Call Feed'}</span>
            </button>
            {!isStrictlyAudio ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    setIsReconnecting(false);
                  }}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-outfit text-[11px] rounded-xl"
                >
                  Force Rejoin
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setIsAudioOnlyMode(true);
                    setIsReconnecting(false);
                  }}
                  className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold rounded-xl"
                >
                  Audio Mode
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic('success');
                  setIsReconnecting(false);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-outfit text-[11px] rounded-xl"
              >
                Force Rejoin Audio
              </button>
            )}
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onNavigate('active-chat');
              }}
              className="w-full py-3 mt-2 bg-[#022434] text-white border border-slate-600 hover:bg-slate-800 font-extrabold font-outfit text-xs rounded-xl shadow-lg flex items-center justify-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Continue via Secure Text</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BOTTOM TOOLBAR & CONSULTATION CONTROLS                                 */}
      {/* ========================================================================= */}
      <div className="relative z-20 px-4 sm:px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2 space-y-3">
        {/* Visual Warnings / Mode Banners */}
        {isStrictlyAudio ? (
          <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs p-2.5 rounded-2xl flex items-center justify-center max-w-md mx-auto shadow-sm">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span className="font-bold">Strictly Audio Consultation (Voice Only)</span>
            </div>
          </div>
        ) : isAudioOnlyMode ? (
          <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs p-2.5 rounded-2xl flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span>Audio Fallback Mode Active (Weak Connectivity Protected)</span>
            </div>
            <button
              onClick={() => setIsAudioOnlyMode(false)}
              className="text-[10px] font-extrabold underline text-white ml-2 shrink-0"
            >
              Switch to Video
            </button>
          </div>
        ) : null}

        <div className="bg-white/95 backdrop-blur-xl rounded-full p-2.5 sm:p-3 shadow-2xl flex items-center justify-center border border-white/50 max-w-sm sm:max-w-md mx-auto px-4 sm:px-6 gap-3 sm:gap-4">
          {/* Microphone Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-3 sm:p-3.5 rounded-full border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400/50'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Camera Video Toggle — Hidden during Strictly Audio Consultation */}
          {!isStrictlyAudio && (
            <button
              onClick={handleToggleVideo}
              className={`p-3 sm:p-3.5 rounded-full border transition-all cursor-pointer ${
                isVideoOff
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400/50'
                  : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
              }`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-slate-700" />}
            </button>
          )}

          {/* Audio Output Route Switcher (Speakerphone, Bluetooth, Headset) */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsAudioRouteModalOpen(!isAudioRouteModalOpen);
            }}
            className={`p-3 sm:p-3.5 rounded-full border transition-all relative cursor-pointer ${
              isAudioRouteModalOpen
                ? 'bg-[#006c44] text-white border-[#006c44]'
                : selectedAudioRouteType === 'bluetooth'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                : selectedAudioRouteType === 'speaker'
                ? 'bg-emerald-50 text-[#006c44] border-emerald-300'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title={`Audio Output: ${selectedAudioRouteType.toUpperCase()} (Tap to switch Speaker / Bluetooth)`}
          >
            {selectedAudioRouteType === 'bluetooth' ? (
              <Bluetooth className="w-5 h-5 text-white" />
            ) : selectedAudioRouteType === 'speaker' ? (
              <Speaker className="w-5 h-5 text-[#006c44]" />
            ) : selectedAudioRouteType === 'headset' ? (
              <Headphones className="w-5 h-5 text-purple-600" />
            ) : (
              <Volume2 className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* In-Call Text Chat Toggle — Highlights brightly when new message arrives */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsChatOpen(!isChatOpen);
              setUnreadChatCount(0);
            }}
            className={`p-3 sm:p-3.5 rounded-full border transition-all relative cursor-pointer ${
              isChatOpen
                ? 'bg-[#006c44] text-white border-[#006c44]'
                : unreadChatCount > 0
                ? 'bg-emerald-500 text-white border-emerald-400 ring-4 ring-emerald-400/60 shadow-lg shadow-emerald-500/40 animate-pulse'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title={unreadChatCount > 0 ? `${unreadChatCount} new message(s)` : 'In-Call Chat'}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Doctor Only: Issue E-Prescription */}
          {user?.role === 'doctor' && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsPrescriptionModalOpen(true);
              }}
              className="p-3 sm:p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-sm transition-all cursor-pointer"
              title="Issue Clinical Prescription"
            >
              <Pill className="w-5 h-5" />
            </button>
          )}

          {/* End Consultation Button */}
          <button
            onClick={() => {
              triggerHaptic('heavy');
              if (myRole === 'doctor') {
                setShowConsultationSummaryModal(true);
              } else {
                setShowEndConsultationModal(true);
              }
            }}
            className="p-3 sm:p-3.5 rounded-full bg-rose-600 text-white shadow-lg hover:bg-rose-700 transition-all transform active:scale-95 border-2 border-rose-400 shrink-0 cursor-pointer"
            title="End Consultation"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. IN-CALL SECURE CLINICAL MESSAGING DRAWER                                */}
      {/* ========================================================================= */}
      {isChatOpen && (
        <div className="absolute inset-y-0 right-0 z-40 w-full max-w-sm bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col justify-between font-nunito animate-in slide-in-from-right duration-200">
          {/* Chat Drawer Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[#77daa4]" />
              <h4 className="font-extrabold font-outfit text-white text-sm">Chat</h4>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'patient' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 mb-0.5">{m.senderName} • {m.timestamp}</span>
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    m.sender === 'patient'
                      ? 'bg-[#006c44] text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {m.text}

                  {/* Attached Document or Image Preview */}
                  {m.attachment && (
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center space-x-2">
                      {m.attachment.type === 'image' ? (
                        <img
                          src={m.attachment.url}
                          alt="Attachment"
                          className="w-16 h-16 rounded-xl object-cover border border-white/30"
                        />
                      ) : (
                        <div className="p-2 bg-black/30 rounded-xl flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-[#77daa4]" />
                          <span className="text-[11px] font-bold truncate max-w-[120px]">
                            {m.attachment.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Attachment Preview Bar before sending */}
          {attachedFile && (
            <div className="p-2.5 bg-slate-800 border-t border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-[#77daa4]" />
                <span className="text-slate-200 truncate max-w-[180px]">{attachedFile.name}</span>
              </div>
              <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="Attach document/photo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type clinical note..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#77daa4]"
            />
            <button
              onClick={handleSendMessage}
              className="p-2.5 rounded-xl bg-[#77daa4] text-[#022434] hover:bg-emerald-300 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. END CONSULTATION SAFETY CONFIRMATION MODAL                             */}
      {/* ========================================================================= */}
      {showEndConsultationModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-5 flex items-center justify-center font-nunito">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center">
              <PhoneOff className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold font-outfit text-white">End Consultation?</h3>
              <p className="text-xs text-slate-300">
                End session with {myRole === 'doctor' ? displayPatientName : displayDoctorName}? Duration: {formatTime(elapsedSeconds)}.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {myRole === 'doctor' ? (
                <>
                  <button
                    onClick={() => {
                      setShowEndConsultationModal(false);
                      setShowConsultationSummaryModal(true);
                    }}
                    className="w-full py-3 bg-[#006c44] hover:bg-[#005233] text-white font-extrabold font-outfit text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
                  >
                    Input Consultation Summary & End
                  </button>
                  <button
                    onClick={() => handleHangup()}
                    className="w-full py-2.5 bg-rose-600/80 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
                  >
                    End Call Without Summary
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleHangup()}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold font-outfit text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
                >
                  Confirm & View Next Steps
                </button>
              )}

              <button
                onClick={() => setShowEndConsultationModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700 cursor-pointer"
              >
                Return to Live Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TECHNICAL SUPPORT & FAILSAFE HELP DRAWER                                */}
      {/* ========================================================================= */}
      {isSupportDrawerOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-5 flex items-center justify-center font-nunito">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold font-outfit text-white text-base">
                  Consultation Support & Failsafe
                </h3>
              </div>
              <button onClick={() => setIsSupportDrawerOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              If your video or audio consultation encounters persistent technical issues, our 24/7 medical desk is available immediately.
            </p>

            <div className="space-y-2">
              <a
                href="tel:+234800774632273"
                className="p-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center justify-between text-xs transition-all"
              >
                <div className="flex items-center space-x-3">
                  <PhoneCall className="w-5 h-5 text-[#77daa4]" />
                  <div>
                    <span className="font-extrabold text-white block">Call 24/7 Telehealth Support</span>
                    <span className="text-[11px] text-slate-400">+234 800-PRIME-CARE (Toll-Free)</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setIsAudioOnlyMode(true);
                  setIsSupportDrawerOpen(false);
                }}
                className="w-full p-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center justify-between text-xs transition-all text-left"
              >
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="font-extrabold text-white block">Switch to Audio Fallback</span>
                    <span className="text-[11px] text-slate-400">Low-bandwidth voice connectivity</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              In case of severe medical emergencies, please dial emergency service 112 immediately.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. CONNECTION RECOVERY ASSISTANT MODAL                                   */}
      {/* ========================================================================= */}
      <ConnectionRecoveryModal
        isOpen={showConnectionRecoveryModal}
        onClose={() => setShowConnectionRecoveryModal(false)}
        doctorName={displayDoctorName}
        doctorSpecialty={doctorSpecialty || user?.doctorSpecialty || ''}
        onRecheckConnection={() => {
          setIsReconnecting(false);
          setConnectionQuality('excellent');
          setLatencyMs(28);
        }}
        onSwitchToAudioOnly={() => {
          setIsReconnecting(false);
          setIsAudioOnlyMode(true);
        }}
        onRequestCallback={(phone) => {
          console.log(`Doctor callback requested to: ${phone}`);
        }}
        onSwitchToChat={() => {
          setIsReconnecting(false);
          setIsChatOpen(true);
        }}
        onReschedule={() => {
          setIsReconnecting(false);
          onNavigate('patient-home');
        }}
      />

      {/* ========================================================================= */}
      {/* 11. AUDIO OUTPUT ROUTE PICKER (SPEAKERPHONE, BLUETOOTH, HEADSET)           */}
      {/* ========================================================================= */}
      {isAudioRouteModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-4 font-nunito animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/20 text-[#77daa4] rounded-xl border border-emerald-500/30">
                  <Speaker className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold font-outfit text-white text-base">
                    Audio Output
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Phone Speaker & Bluetooth Connections
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAudioRouteModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Audio Options */}
            <div className="space-y-2">
              {/* Option A: Phone Speaker (Loudspeaker) */}
              <button
                type="button"
                onClick={() => {
                  const spk = audioOutputDevices.find((d) => d.type === 'speaker');
                  handleSelectAudioRoute(spk || { deviceId: 'speaker', label: 'Phone Speaker (Loudspeaker)', type: 'speaker' });
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAudioRouteType === 'speaker'
                    ? 'bg-emerald-950/70 border-emerald-500/80 text-white'
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${selectedAudioRouteType === 'speaker' ? 'bg-emerald-500 text-[#022434]' : 'bg-slate-700 text-slate-300'}`}>
                    <Speaker className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold font-outfit text-sm block">Phone Speaker</span>
                    <span className="text-[10px] text-slate-400">Loudspeaker audio mode</span>
                  </div>
                </div>
                {selectedAudioRouteType === 'speaker' && (
                  <Check className="w-4 h-4 text-[#77daa4]" />
                )}
              </button>

              {/* Option B: Bluetooth Audio / Headset */}
              <button
                type="button"
                onClick={() => {
                  const bt = audioOutputDevices.find((d) => d.type === 'bluetooth');
                  handleSelectAudioRoute(bt || { deviceId: 'bluetooth', label: 'Bluetooth Audio Device', type: 'bluetooth' });
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAudioRouteType === 'bluetooth'
                    ? 'bg-blue-950/70 border-blue-500/80 text-white'
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${selectedAudioRouteType === 'bluetooth' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold font-outfit text-sm block">Bluetooth Audio</span>
                    <span className="text-[10px] text-slate-400">
                      {audioOutputDevices.some((d) => d.type === 'bluetooth')
                        ? audioOutputDevices.find((d) => d.type === 'bluetooth')?.label
                        : 'Connect wireless earbuds / headphones'}
                    </span>
                  </div>
                </div>
                {selectedAudioRouteType === 'bluetooth' && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </button>

              {/* Option C: Device Default / Earpiece */}
              <button
                type="button"
                onClick={() => {
                  const def = audioOutputDevices.find((d) => d.type === 'default');
                  handleSelectAudioRoute(def || { deviceId: 'default', label: 'Default / Earpiece', type: 'default' });
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAudioRouteType === 'default'
                    ? 'bg-teal-950/70 border-teal-500/80 text-white'
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${selectedAudioRouteType === 'default' ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold font-outfit text-sm block">Default / Earpiece</span>
                    <span className="text-[10px] text-slate-400">Standard handset receiver</span>
                  </div>
                </div>
                {selectedAudioRouteType === 'default' && (
                  <Check className="w-4 h-4 text-teal-400" />
                )}
              </button>
            </div>

            {/* System Audio Device Picker (for Chrome / Android supporting selectAudioOutput) */}
            <button
              type="button"
              onClick={handleSystemAudioPicker}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold font-outfit text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
              <span>Pair / Switch Bluetooth Output</span>
            </button>
          </div>
        </div>
      )}

      {/* In-Consultation Prescription Composer Modal */}
      <PrescriptionComposerModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patientInfo={{
          name: displayPatientName,
          allergies: user?.allergies || [],
        }}
        consultationType="Video"
        doctorInfo={{
          name: displayDoctorName,
          license: user?.doctorLicenseNo || 'MDCN Verified',
          specialty: user?.doctorSpecialty || doctorSpecialty || '',
          clinic: 'Prime Telecare',
        }}
        onPrescriptionSaved={(rx) => {
          setIsPrescriptionModalOpen(false);
          triggerHaptic('success');
          showToast(`E-Prescription #${rx.referenceNo} issued for ${rx.patientName}`, 'success');
          const rxMsg: InCallMessage = {
            id: `rx-${Date.now()}`,
            sender: 'doctor',
            senderName: displayDoctorName,
            text: `E-Prescription #${rx.referenceNo}: ${rx.medications.map((m) => `${m.drugName} (${m.dosage}, ${m.frequency})`).join('; ')}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          seenMsgIdsRef.current.add(rxMsg.id);
          seenMsgIdsRef.current.add(`${rxMsg.sender}::${rxMsg.text}::${rxMsg.timestamp}`);
          setMessages((prev) => [...prev, rxMsg]);
          primeApi.sendChatMessage(sessionId, {
            sender: 'doctor',
            senderName: displayDoctorName,
            text: rxMsg.text,
          }).catch(() => {});
        }}
      />

      {/* End-of-Consultation Clinical Summary Modal (Doctor) */}
      <ConsultationSummaryModal
        isOpen={showConsultationSummaryModal}
        onClose={() => setShowConsultationSummaryModal(false)}
        patientName={displayPatientName}
        doctorName={displayDoctorName}
        doctorSpecialty={doctorSpecialty}
        doctorLicense={user?.doctorLicenseNo || 'MDCN Verified'}
        appointmentId={sessionId}
        consultationType={isStrictlyAudio || isAudioOnlyMode ? 'Voice' : 'Video'}
        onSaveSummary={(summary) => {
          handleHangup(summary);
        }}
      />
    </div>
  );
};
