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
} from 'lucide-react';
import { ScreenId, User as UserType } from '../../types';
import { StatusBar } from '../common/StatusBar';
import { currentUserPatient } from '../../data/mockData';
import { getActiveProfileInfo } from '../../utils/dependents';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { ConnectionRecoveryModal } from '../common/ConnectionRecoveryModal';
import { PrescriptionComposerModal } from '../common/PrescriptionComposerModal';
import { primeApi } from '../../services/apiClient';
import { playRingingTone, playConnectedTone, playHangupTone } from '../../utils/audioTones';
import { requestUserMedia, setupAudioAnalyser, startScreenShare, createDoctorCanvasStream } from '../../utils/liveMedia';

interface VideoCallScreenProps {
  onNavigate: (screen: ScreenId) => void;
  user?: UserType;
  doctorName?: string;
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
  doctorName = 'Dr. Sarah Johnson',
}) => {
  // Active Patient Profile Info (Primary or Family Dependent)
  const activeProfile = getActiveProfileInfo(user);

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
  const [elapsedSeconds, setElapsedSeconds] = useState(384); // Starts at 06:24
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
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  useEffect(() => {
    primeApi.getVideoToken('c-1', 'patient').catch(() => {});
  }, []);
  const [messages, setMessages] = useState<InCallMessage[]>([
    {
      id: 'm-1',
      sender: 'doctor',
      senderName: 'Dr. Sarah Johnson',
      text: 'Hello! I am reviewing the pediatric history notes. How is the fever progressing?',
      timestamp: '10:52 AM',
    },
    {
      id: 'm-2',
      sender: 'patient',
      senderName: activeProfile.displayName,
      text: 'Good morning Doctor. Temperature peaked at 38.8°C earlier today after paracetamol.',
      timestamp: '10:53 AM',
    },
  ]);
  const [newMessageText, setNewMessageText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; type: 'image' | 'document' } | null>(null);

  // Support Drawer & End Consultation Modal
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [showEndConsultationModal, setShowEndConsultationModal] = useState(false);

  // Live Media Hardware Streams & Devices
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMicrophone, setHasMicrophone] = useState<boolean>(false);
  const [isConnectingCall, setIsConnectingCall] = useState<boolean>(false);
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [swappedPiP, setSwappedPiP] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionId = 'consultation-live-room';
  const myRole = user?.role === 'doctor' ? 'doctor' : 'patient';

  // Live Mic Waveform activity pulse
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Call Timer Loop
  useEffect(() => {
    if (!hasConfirmedConsent || isReconnecting) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasConfirmedConsent, isReconnecting]);

  // Live WebRTC PeerConnection & Media Device Lifecycle
  useEffect(() => {
    if (!hasConfirmedConsent) return;

    let stopAudioAnalyser: (() => void) | null = null;
    let cancelRing: (() => void) | null = null;
    let signalPollTimer: any = null;

    setIsConnectingCall(true);
    cancelRing = playRingingTone();

    const initCall = async () => {
      if (cancelRing) cancelRing();
      playConnectedTone();
      setIsConnectingCall(false);

      // 1. Request real device camera & microphone
      const media = await requestUserMedia(!isVideoOff, !isMuted, facingMode);
      if (media.stream) {
        setLocalStream(media.stream);
        setHasCamera(media.hasCamera);
        setHasMicrophone(media.hasMicrophone);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = media.stream;
          localVideoRef.current.play().catch(() => {});
        }

        stopAudioAnalyser = setupAudioAnalyser(media.stream, (lvl) => {
          setAudioLevel(lvl);
        });

        // 2. Initialize RTCPeerConnection for real 2-way WebRTC video/audio
        try {
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          });
          peerConnectionRef.current = pc;

          // Add local tracks to peer connection
          media.stream.getTracks().forEach((track) => pc.addTrack(track, media.stream!));

          // Listen for remote peer audio and video tracks
          pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote peer stream:', event.streams);
            if (remoteVideoRef.current && event.streams[0]) {
              remoteVideoRef.current.srcObject = event.streams[0];
              remoteVideoRef.current.play().catch(() => {});
              setIsPeerConnected(true);
              showToast('Peer connected via live WebRTC!');
            }
          };

          // Send ICE candidates to signaling hub
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              primeApi.sendVideoSignal(sessionId, {
                sender: myRole,
                type: 'candidate',
                data: event.candidate,
              });
            }
          };

          // If caller, generate offer
          if (myRole === 'patient') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await primeApi.sendVideoSignal(sessionId, {
              sender: myRole,
              type: 'offer',
              data: offer,
            });
          }

          // 3. Poll signaling messages to exchange offer, answer, and ICE candidates
          let lastCheck = Date.now() - 5000;
          signalPollTimer = setInterval(async () => {
            try {
              const signals = await primeApi.getVideoSignals(sessionId, lastCheck, myRole);
              for (const sig of signals) {
                lastCheck = Math.max(lastCheck, sig.timestamp);
                if (sig.type === 'offer' && pc.signalingState !== 'closed') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await primeApi.sendVideoSignal(sessionId, {
                    sender: myRole,
                    type: 'answer',
                    data: answer,
                  });
                } else if (sig.type === 'answer' && pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
                  setIsPeerConnected(true);
                } else if (sig.type === 'candidate' && pc.remoteDescription) {
                  await pc.addIceCandidate(new RTCIceCandidate(sig.data)).catch(() => {});
                }
              }
            } catch (err) {
              // Non-blocking poll error
            }
          }, 1500);

        } catch (webrtcErr) {
          console.warn('[WebRTC] PeerConnection notice:', webrtcErr);
        }
      }
    };

    const timer = setTimeout(initCall, 1200);

    return () => {
      clearTimeout(timer);
      if (cancelRing) cancelRing();
      if (signalPollTimer) clearInterval(signalPollTimer);
      if (stopAudioAnalyser) stopAudioAnalyser();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [hasConfirmedConsent, facingMode]);

  const handleSwitchCamera = async () => {
    triggerHaptic('medium');
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    const media = await requestUserMedia(!isVideoOff, !isMuted, nextFacing);
    if (media.stream) {
      setLocalStream(media.stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = media.stream;
        localVideoRef.current.play().catch(() => {});
      }
      if (peerConnectionRef.current) {
        const videoTrack = media.stream.getVideoTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
        }
      }
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

  const handleToggleVideo = () => {
    triggerHaptic('light');
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = !nextVideoOff;
      });
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

  const handleHangup = () => {
    triggerHaptic('heavy');
    playHangupTone();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setShowEndConsultationModal(false);
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

  // Handle Sending In-Call Message
  const handleSendMessage = () => {
    if (!newMessageText.trim() && !attachedFile) return;
    triggerHaptic('light');

    const msg: InCallMessage = {
      id: `m-${Date.now()}`,
      sender: 'patient',
      senderName: activeProfile.displayName,
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachedFile ? { ...attachedFile } : undefined,
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessageText('');
    setAttachedFile(null);

    // Auto Doctor Response simulation
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-doc-${Date.now()}`,
          sender: 'doctor',
          senderName: 'Dr. Sarah Johnson',
          text: 'Thank you for sharing that information. I am noting it down in the electronic medical prescription record.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 2000);
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
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-[#77daa4] border-2 border-[#77daa4] mx-auto flex items-center justify-center shadow-lg animate-pulse">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="text-xs font-extrabold font-outfit text-[#77daa4] uppercase tracking-wider block">
                Secure Telehealth Session Entry
              </span>
              <h2 className="text-2xl font-extrabold font-outfit text-white">
                Clinical Pre-Session Consent & Verification
              </h2>
              <p className="text-xs text-slate-300">
                Please verify practitioner identity and confirm informed patient consent prior to video consultation.
              </p>
            </div>

            {/* Identity Confirmation Card */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/15 space-y-3">
              <span className="text-[10px] font-extrabold font-outfit text-emerald-400 uppercase tracking-wider block">
                Identity & Credentials Confirmation
              </span>

              {/* Doctor Details */}
              <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"
                  alt="Dr. Sarah Johnson"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#77daa4]"
                />
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold font-outfit text-sm text-white">Dr. Sarah Johnson</span>
                    <span className="text-[10px] font-extrabold bg-emerald-500/30 text-[#77daa4] px-2 py-0.5 rounded-full border border-emerald-400/40">
                      Verified Practitioner
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Pediatrics • MD License #NG-MD-88392</p>
                  <p className="text-[10px] text-slate-400">Lagos University Teaching Hospital Affiliate</p>
                </div>
              </div>

              {/* Patient Details */}
              <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold font-outfit text-xs text-white">
                      Patient: {activeProfile.displayName}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">
                      {activeProfile.relationshipLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {activeProfile.ageGenderLabel} • Primary Account: {user.name}
                  </p>
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
                  I consent to encrypted video/audio medical examination and clinical data logging for this session.
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
              disabled={!consentCheck1 || !consentCheck2 || !consentCheck3}
              onClick={() => {
                triggerHaptic('heavy');
                setHasConfirmedConsent(true);
              }}
              className="w-full py-4 bg-[#77daa4] disabled:bg-slate-700 disabled:text-slate-500 hover:bg-emerald-300 text-[#022434] font-extrabold font-outfit text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <Video className="w-5 h-5" />
              <span>Confirm & Enter Consultation Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONSULTATION CANVAS (LIVE WEBRTC VIDEO OR AUDIO FALLBACK)         */}
      {/* ========================================================================= */}
      {!isAudioOnlyMode ? (
        /* Video Mode Stream */
        <div className="absolute inset-0 z-0 bg-slate-950">
          <video
            ref={swappedPiP ? localVideoRef : remoteVideoRef}
            autoPlay
            playsInline
            muted={swappedPiP}
            className={`w-full h-full object-cover object-center filter brightness-95 ${
              swappedPiP ? 'scale-x-[-1]' : ''
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

          {/* Waiting for Peer / Multi-device join banner */}
          {!isPeerConnected && (
            <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 max-w-md bg-black/75 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 text-white shadow-2xl text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold font-outfit text-emerald-300 uppercase tracking-wider">
                  Live Consultation Room Active
                </span>
              </div>
              <p className="text-xs text-slate-200 font-nunito">
                Your device camera & microphone are active. Waiting for {doctorName} to connect...
              </p>
              <button
                type="button"
                onClick={handleCopyCallLink}
                className="mt-1 px-4 py-2 bg-[#006c44] hover:bg-[#007a4d] text-white text-xs font-bold font-outfit rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Room Link to Test on 2nd Device'}</span>
              </button>
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
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"
                alt="Dr. Sarah Johnson Audio Stream"
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
              Low Bandwidth Audio Fallback Active
            </span>
            <h2 className="text-2xl font-extrabold font-outfit text-white">Dr. Sarah Johnson</h2>
            <p className="text-xs text-slate-300">Pediatrician • Medical Audio Consultation</p>
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

          <p className="text-[11px] text-slate-400 max-w-xs">
            Audio mode saves up to 85% bandwidth while keeping crystal clear voice communication with your doctor.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FLOATING PIP SELF PREVIEW & VISUAL MIC/CAM STATUS                      */}
      {/* ========================================================================= */}
      <div
        onClick={() => {
          triggerHaptic('selection');
          setSwappedPiP(!swappedPiP);
        }}
        className="absolute top-18 sm:top-20 right-3 sm:right-5 z-20 w-24 h-36 sm:w-28 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-900 group cursor-pointer hover:border-emerald-400 transition-colors"
        title="Tap to swap main and preview cameras"
      >
        {!isVideoOff && !isAudioOnlyMode ? (
          <div className="relative w-full h-full">
            <video
              ref={swappedPiP ? remoteVideoRef : localVideoRef}
              autoPlay
              playsInline
              muted={!swappedPiP}
              className={`w-full h-full object-cover ${!swappedPiP ? 'scale-x-[-1]' : ''}`}
            />
            {/* Visual Green Camera Active Dot */}
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black" title="Camera Streaming" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-slate-900/90 text-center space-y-1">
            <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
            <span className="text-[9px] sm:text-[10px] text-slate-300 font-extrabold font-outfit">
              {isAudioOnlyMode ? 'Audio Only' : 'Camera Off'}
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

      {/* Calling Doctor Overlay */}
      {isConnectingCall && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in duration-200">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"
              alt={doctorName}
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
            <h3 className="font-outfit font-extrabold text-2xl text-white">Calling {doctorName}...</h3>
            <p className="text-xs text-slate-300">
              Connecting audio/video channels
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TOP BAR: PRACTITIONER NAME AT TOP ONLY                                 */}
      {/* ========================================================================= */}
      <div className="relative z-20 px-5 pt-3 pb-2 flex items-center justify-center">
        <div className="bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-lg flex items-center justify-center">
          <span className="text-sm sm:text-base font-extrabold font-outfit text-white tracking-wide">
            {doctorName}
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
              Reconnecting to {doctorName}...
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
              <span>Open Connection Recovery Assistant</span>
            </button>
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
        {isAudioOnlyMode && (
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
        )}

        <div className="bg-white/95 backdrop-blur-xl rounded-full p-2 sm:p-2.5 shadow-2xl flex items-center justify-between sm:justify-around border border-white/40 max-w-md mx-auto px-2.5 sm:px-4 gap-1 sm:gap-2">
          {/* Audio Fallback / Low Bandwidth Voice Mode Toggle Button */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsAudioOnlyMode(!isAudioOnlyMode);
            }}
            className={`p-2.5 sm:p-3.5 rounded-full border transition-all ${
              isAudioOnlyMode
                ? 'bg-emerald-500 text-[#022434] border-emerald-400 font-bold'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title="Switch Low Bandwidth / HD Video Mode"
          >
            {isAudioOnlyMode ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />}
          </button>

          {/* Camera Mute Toggle */}
          <button
            disabled={isAudioOnlyMode}
            onClick={handleToggleVideo}
            className={`p-2.5 sm:p-3.5 rounded-full border transition-all ${
              isVideoOff || isAudioOnlyMode
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title="Toggle Live Camera"
          >
            {isVideoOff || isAudioOnlyMode ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Switch Front / Back Camera (Mobile Devices) */}
          <button
            disabled={isAudioOnlyMode || isVideoOff}
            onClick={handleSwitchCamera}
            className="p-2.5 sm:p-3.5 rounded-full border bg-white text-[#022434] border-slate-300 hover:bg-slate-100 transition-all shrink-0 cursor-pointer"
            title="Switch Front / Rear Camera"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Microphone Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2.5 sm:p-3.5 rounded-full border transition-all relative ${
              isMuted
                ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-400/50'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title="Toggle Live Mic"
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-2.5 sm:p-3.5 rounded-full border transition-all ${
              isScreenSharing
                ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title="Share Screen"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* End Consultation Button */}
          <button
            onClick={() => {
              triggerHaptic('heavy');
              setShowEndConsultationModal(true);
            }}
            className="p-3 sm:p-4 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all transform active:scale-95 border-2 border-red-400 shrink-0"
            title="End Consultation"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* In-Call Secure Chat Toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsChatOpen(!isChatOpen);
            }}
            className={`p-2.5 sm:p-3.5 rounded-full border transition-all relative ${
              isChatOpen
                ? 'bg-[#022434] text-white border-[#022434]'
                : 'bg-white text-[#022434] border-slate-300 hover:bg-slate-100'
            }`}
            title="Open Clinical Chat"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border border-white" />
          </button>

          {/* Issue E-Prescription in Consultation */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsPrescriptionModalOpen(true);
            }}
            className="p-2.5 sm:p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-md transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Issue Clinical Prescription"
          >
            <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Upload Document / Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 sm:p-3.5 rounded-full bg-white text-[#022434] border border-slate-300 hover:bg-slate-100 transition-all shrink-0"
            title="Upload Document or Photo"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <div>
                <h4 className="font-extrabold font-outfit text-white text-sm">In-Call Clinical Chat</h4>
                <p className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>256-Bit Encrypted Medical Records</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
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
                Are you sure you want to end your live session with {doctorName}? Duration: {formatTime(elapsedSeconds)}.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleHangup}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold font-outfit text-xs rounded-2xl shadow-lg transition-all"
              >
                Confirm & View Next Steps
              </button>

              <button
                onClick={() => setShowEndConsultationModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700"
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
        doctorName="Dr. Sarah Johnson"
        doctorSpecialty="Pediatric Specialist"
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

      {/* In-Consultation Prescription Composer Modal */}
      <PrescriptionComposerModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patientInfo={{
          name: activeProfile.displayName || 'Ada Okonkwo',
          allergies: ['Penicillin', 'Sulfa drugs'],
        }}
        consultationType="Video"
        doctorInfo={{
          name: doctorName,
          license: 'MDCN/2019/98765',
          specialty: 'Consultant Telehealth Physician',
          clinic: 'Prime Telecare Clinical Suite',
        }}
        onPrescriptionSaved={(rx) => {
          setIsPrescriptionModalOpen(false);
          triggerHaptic('success');
          showToast(`E-Prescription #${rx.referenceNo} issued successfully for ${rx.patientName}!`, 'success');
          setMessages((prev) => [
            ...prev,
            {
              id: `rx-${Date.now()}`,
              sender: 'doctor',
              senderName: doctorName,
              text: `📄 Official E-Prescription #${rx.referenceNo} issued for ${rx.diagnosis}.\nMedications: ${rx.medications.map((m) => `${m.drugName} (${m.dosage}, ${m.frequency})`).join('; ')}. Instructions: ${rx.doctorNotes || 'Follow regimen.'}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }}
      />
    </div>
  );
};
