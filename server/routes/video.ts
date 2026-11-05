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

