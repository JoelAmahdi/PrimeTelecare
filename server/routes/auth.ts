import { Router, Request, Response } from 'express';
import { store } from '../store';
import { User, UserRole } from '../../src/types';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, role, biometricToken } = req.body;

  if (biometricToken) {
    // Biometric instant authentication
    const user = store.getUserById('pat-1') || store.getDoctors()[0];
    return res.json({
      success: true,
      message: 'Biometric authentication successful',
      token: `bio-jwt-${Date.now()}`,
      user,
    });
  }

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const existing = store.getUserByEmail(email);
  if (existing) {
    return res.json({
      success: true,
      token: `jwt-${existing.id}-${Date.now()}`,
      user: existing,
    });
  }

  // Fallback demo user resolution based on selected role
  let fallbackUser: User;
  if (role === 'doctor') {
    fallbackUser = store.getUserById('doc-1')!;
  } else if (role === 'admin') {
    fallbackUser = store.getUserById('admin-1')!;
  } else {
    fallbackUser = store.getUserById('pat-1')!;
  }

  return res.json({
    success: true,
    token: `jwt-${fallbackUser.id}-${Date.now()}`,
    user: fallbackUser,
  });
});

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, role, phone, stateOfResidence, lga, allergies, bloodGroup, emergencyContact } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const id = `user-${Date.now()}`;
  const newUser: User = {
    id,
    name,
    email,
    role: (role as UserRole) || 'patient',
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
    phone: phone || '+234 800 000 0000',
    walletBalance: 10000,
    stateOfResidence: stateOfResidence || 'Lagos State',
    lga: lga || 'Ikeja',
    allergies: allergies || [],
    bloodGroup: bloodGroup || 'O+',
    emergencyContact: emergencyContact || {
      name: 'Next of Kin',
      relationship: 'Family',
      phone: '+234 800 111 2222',
    },
    ndpaConsent: {
      acceptedAt: new Date().toISOString(),
      telehealthConsentGiven: true,
      ipAddress: req.ip,
    },
    communicationPreferences: {
      smsAlerts: true,
      emailSummaries: true,
      whatsappPrescriptions: true,
      promotionalHealthTips: false,
    },
  };

  store.saveUser(newUser);

  // Record NDPA audit log for account creation
  store.createAuditLog({
    accessedBy: newUser.name,
    accessorRole: 'System Administrator',
    recordAccessed: `User Profile & Consent (#${newUser.id})`,
    accessReason: 'Initial patient enrollment and NDPA statutory consent recording',
    actionType: 'Updated',
    ipAddress: req.ip,
    accessLocation: 'Patient Registration Portal',
  });

  return res.status(201).json({
    success: true,
    token: `jwt-${newUser.id}-${Date.now()}`,
    user: newUser,
  });
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'pat-1';
  const user = store.getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  return res.json({ success: true, user });
});

// PUT /api/auth/profile
authRouter.put('/profile', (req: Request, res: Response) => {
  const { id, ...updates } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  const existing = store.getUserById(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const updated = store.saveUser({ ...existing, ...updates });
  return res.json({ success: true, user: updated });
});

