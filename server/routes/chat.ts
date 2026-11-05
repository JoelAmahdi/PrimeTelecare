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
  const { sender, senderName, text, imageUrl, status } = req.body;

  if (!sender || !text) {
    return res.status(400).json({ success: false, error: 'Sender and text are required' });
  }

  const message = store.addChatMessage(sessionId, {
    sender,
    senderName: senderName || (sender === 'doctor' ? 'Dr. Sarah Johnson' : 'Ada Okonkwo'),
    text,
    imageUrl,
    status: status || 'delivered',
  });

  return res.status(201).json({ success: true, message });
});

// POST /api/chat/:sessionId/typing
chatRouter.post('/:sessionId/typing', (req: Request, res: Response) => {
  const { user } = req.body;
  return res.json({ success: true, isTyping: true, user });
});

