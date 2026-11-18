import { Router, Request, Response } from 'express';
import crypto from 'crypto';

export const videoRouter = Router();

function getIceServers() {
  const servers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Public OpenRelay / Metered TURN relays for cellular & symmetric NAT traversal
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
  ];

  // Optional custom TURN relay from environment variables
  if (process.env.TURN_URL) {
    servers.unshift({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME || undefined,
      credential: process.env.TURN_CREDENTIAL || undefined,
    });
  }

  return servers;
}

// GET /api/video/:sessionId/token
videoRouter.get('/:sessionId/token', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const role = (req.query.role as string) || 'patient';

  const roomToken = crypto
    .createHmac('sha256', 'prime-video-secret')
    .update(`${sessionId}-${role}-${Date.now()}`)
    .digest('hex');

  return res.json({
    success: true,
    sessionId,
    roomToken,
    iceServers: getIceServers(),
    allocatedDurationMinutes: 30,
    mediaConstraints: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    },
  });
});

// POST /api/video/:sessionId/quality
videoRouter.post('/:sessionId/quality', (req: Request, res: Response) => {
  const { latencyMs, packetLoss, audioOnlyMode } = req.body;
  let status: 'excellent' | 'good' | 'poor' = 'excellent';

  if (audioOnlyMode || (latencyMs && latencyMs > 250) || (packetLoss && packetLoss > 5)) {
    status = 'poor';
  } else if ((latencyMs && latencyMs > 120) || (packetLoss && packetLoss > 2)) {
    status = 'good';
  }

  return res.json({
    success: true,
    connectionQuality: status,
    adaptiveRecommendation:
      status === 'poor'
        ? 'Network congestion detected. Audio-only mode recommended to preserve voice clarity.'
        : 'Connection stable. HD video enabled.',
  });
});

// POST /api/video/:sessionId/reconnect
videoRouter.post('/:sessionId/reconnect', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const reconnectionToken = `reconnect-${sessionId}-${Date.now()}`;
  return res.json({
    success: true,
    message: 'Session signaling link restored',
    reconnectionToken,
  });
});

// In-memory WebRTC signaling hub with server-side monotonic sequence numbers (zero clock skew!)
interface WebRTCSignal {
  id: string;
  seq: number;
  sender: string;
  peerId: string;
  handshakeId?: string;
  type: 'ready' | 'offer' | 'answer' | 'candidate' | 'leave';
  data: any;
  timestamp: number;
}

interface RoomState {
  nextSeq: number;
  signals: WebRTCSignal[];
}

const rooms: Record<string, RoomState> = {};

function getRoom(sessionId: string): RoomState {
  if (!rooms[sessionId]) {
    rooms[sessionId] = { nextSeq: 1, signals: [] };
  }
  return rooms[sessionId];
}

// POST /api/video/:sessionId/signal
videoRouter.post('/:sessionId/signal', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { sender, peerId, handshakeId, type, data } = req.body;

  if (!sender || !type) {
    return res.status(400).json({ success: false, error: 'Sender and signal type required' });
  }

  const room = getRoom(sessionId);
  const resolvedPeerId = peerId || sender;
  const resolvedHandshakeId: string | undefined = handshakeId || data?.handshakeId || undefined;
  const now = Date.now();

  // Prune signals older than 2 minutes so dead prior calls never poison new calls
  room.signals = room.signals.filter((s) => now - s.timestamp < 120_000);

  // If a peer sends a fresh 'offer' for a NEW handshakeId, prune only signals from OLDER handshakes
  // (never delete 'ready' signals or signals belonging to this same handshakeId)
  if (type === 'offer') {
    room.signals = room.signals.filter(
      (s) =>
        s.type === 'ready' ||
        (resolvedHandshakeId && s.handshakeId === resolvedHandshakeId)
    );
  }

  // Keep only the latest 'ready' heartbeat per peerId so room doesn't fill up
  if (type === 'ready') {
    room.signals = room.signals.filter(
      (s) => !(s.peerId === resolvedPeerId && s.type === 'ready')
    );
  }

  // When a peer leaves, remove their stale 'ready' so future peers don't offer to a dead peer
  if (type === 'leave') {
    room.signals = room.signals.filter(
      (s) => !(s.peerId === resolvedPeerId && s.type === 'ready')
    );
  }

  const signal: WebRTCSignal = {
    id: `sig-${now}-${Math.random().toString(36).slice(2, 7)}`,
    seq: room.nextSeq++,
    sender,
    peerId: resolvedPeerId,
    handshakeId: resolvedHandshakeId,
    type,
    data: data ?? null,
    timestamp: now,
  };

  room.signals.push(signal);

  // Cap total signals per room
  if (room.signals.length > 200) {
    room.signals = room.signals.slice(-200);
  }

  return res.json({ success: true, signalId: signal.id, seq: signal.seq });
});

// GET /api/video/:sessionId/signal?afterSeq=<n>&excludePeerId=<id>&excludeSender=<role>
videoRouter.get('/:sessionId/signal', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const afterSeq = parseInt(req.query.afterSeq as string, 10) || 0;
  const since = parseInt(req.query.since as string, 10) || 0;
  const excludePeerId = req.query.excludePeerId as string;
  const excludeSender = req.query.excludeSender as string;

  const room = getRoom(sessionId);
  const now = Date.now();

  // Prune expired signals (> 2 minutes old)
  room.signals = room.signals.filter((s) => now - s.timestamp < 120_000);

  const signals = room.signals.filter((s) => {
    const isNew = afterSeq > 0 ? s.seq > afterSeq : since > 0 ? s.timestamp > since : true;
    const notSelfPeer = !excludePeerId || s.peerId !== excludePeerId;
    const notSelfSender = excludePeerId ? true : !excludeSender || s.sender !== excludeSender;
    return isNew && notSelfPeer && notSelfSender;
  });

  const latestSeq = room.signals.length > 0 ? room.signals[room.signals.length - 1].seq : afterSeq;

  return res.json({ success: true, latestSeq, signals });
});
