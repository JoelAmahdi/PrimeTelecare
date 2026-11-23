import { Router, Request, Response } from 'express';
import { store } from '../store';

export const chatRouter = Router();

// GET /api/chat/:sessionId/messages
chatRouter.get('/:sessionId/messages', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId || 'default';
  const messages = store.getChatMessages(sessionId);
  return res.json({ success: true, count: messages.length, messages });
});

// POST /api/chat/:sessionId/messages
chatRouter.post('/:sessionId/messages', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId || 'default';
  const { sender, senderName, text, imageUrl, audioUrl, audioDuration, status, timestamp, replyTo } = req.body;

  if (!sender || (!text && !audioUrl && !imageUrl)) {
    return res.status(400).json({ success: false, error: 'Sender and content are required' });
  }

  const message = store.addChatMessage(sessionId, {
    sender,
    senderName: senderName || (sender === 'doctor' ? 'Doctor' : 'Patient'),
    text: text || (audioUrl ? '🎤 Voice Note' : ''),
    imageUrl,
    audioUrl,
    audioDuration,
    status: status || 'delivered',
    timestamp,
    replyTo,
  });

  return res.status(201).json({ success: true, message });
});

// GET /api/chat/:sessionId/typing
chatRouter.get('/:sessionId/typing', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId || 'default';
  const role = req.query.role as string | undefined;
  const status = store.getTyping(sessionId, role);
  return res.json({ success: true, ...status });
});

// POST /api/chat/:sessionId/typing
chatRouter.post('/:sessionId/typing', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId || 'default';
  const { user, role, isTyping } = req.body;
  store.setTyping(sessionId, user || 'User', role || 'patient', isTyping !== false);
  return res.json({ success: true, isTyping: isTyping !== false, user });
});

// POST /api/chat/:sessionId/read
chatRouter.post('/:sessionId/read', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId || 'default';
  const { readerRole } = req.body;
  if (!readerRole || (readerRole !== 'doctor' && readerRole !== 'patient')) {
    return res.status(400).json({ success: false, error: 'readerRole must be "doctor" or "patient"' });
  }
  const messages = store.markMessagesRead(sessionId, readerRole);
  return res.json({ success: true, count: messages.length, messages });
});

