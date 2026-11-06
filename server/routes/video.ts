import { Router, Request, Response } from 'express';
import crypto from 'crypto';

export const videoRouter = Router();

// GET /api/video/:sessionId/token
videoRouter.get('/:sessionId/token', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const role = (req.query.role as string) || 'patient';
  const userName = (req.query.userName as string) || 'Ada Okonkwo';

  const roomToken = crypto
    .createHmac('sha256', 'prime-video-secret')
    .update(`${sessionId}-${role}-${Date.now()}`)
    .digest('hex');

  return res.json({
    success: true,
    sessionId,
    roomToken,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:turn.primetelecare.com:3478',
        username: `prime-user-${role}`,
        credential: roomToken.slice(0, 16),
      },
    ],
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
  const { latencyMs, packetLoss, resolution, audioOnlyMode } = req.body;
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

// In-memory WebRTC signaling hub for multi-device peer discovery
interface WebRTCSignal {
  id: string;
  sender: string;
  type: 'offer' | 'answer' | 'candidate' | 'joined' | 'leave';
  data: any;
  timestamp: number;
}

const activeSignals: Record<string, WebRTCSignal[]> = {};

// POST /api/video/:sessionId/signal
videoRouter.post('/:sessionId/signal', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { sender, type, data } = req.body;

  if (!sender || !type) {
    return res.status(400).json({ success: false, error: 'Sender and signal type required' });
  }

  if (!activeSignals[sessionId]) {
    activeSignals[sessionId] = [];
  }

  const signal: WebRTCSignal = {
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender,
    type,
    data,
    timestamp: Date.now(),
  };

  activeSignals[sessionId].push(signal);

  // Keep latest 100 signals per consultation room
  if (activeSignals[sessionId].length > 100) {
    activeSignals[sessionId].shift();
  }

  return res.json({ success: true, signalId: signal.id });
});

// GET /api/video/:sessionId/signal?since=<timestamp>&excludeSender=<roleOrId>
videoRouter.get('/:sessionId/signal', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const since = parseInt(req.query.since as string, 10) || 0;
  const excludeSender = req.query.excludeSender as string;

  const signals = (activeSignals[sessionId] || []).filter((s) => {
    const isNew = s.timestamp > since;
    const notSelf = !excludeSender || s.sender !== excludeSender;
    return isNew && notSelf;
  });

  return res.json({ success: true, signals });
});

