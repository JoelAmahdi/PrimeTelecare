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

  // Pre-configured demo accounts
  if (email === 'patient@telecare.com') {
    const user = store.getUserById('pat-1')!;
    return res.json({ success: true, token: `jwt-pat-1-${Date.now()}`, user });
  } else if (email === 'dr.emeka@primetelecare.com' || email.includes('doctor') || email.includes('dr.')) {
    const user = store.getUserById('doc-1')!;
    return res.json({ success: true, token: `jwt-doc-1-${Date.now()}`, user });
  } else if (email === 'admin@primetelecare.com' || email.includes('admin')) {
    const user = store.getUserById('admin-1')!;
    return res.json({ success: true, token: `jwt-admin-1-${Date.now()}`, user });
  }

  // Check if registered user exists in database
  const existing = store.getUserByEmail(email);
  if (existing) {
    return res.json({
      success: true,
      token: `jwt-${existing.id}-${Date.now()}`,
      user: existing,
    });
  }

  // Auto-provision personal account for newly entered email
  const id = `user-${Date.now()}`;
  const displayName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const newUser: User = {
    id,
    name: displayName || 'Patient User',
    email,
    role: (role as UserRole) || 'patient',
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
    phone: '+234 800 000 0000',
    walletBalance: 10000,
    stateOfResidence: 'Lagos State',
    ndpaConsent: {
      acceptedAt: new Date().toISOString(),
      telehealthConsentGiven: true,
    },
  };
  store.saveUser(newUser);

  return res.json({
    success: true,
    token: `jwt-${newUser.id}-${Date.now()}`,
    user: newUser,
  });
});

// POST /api/auth/google
authRouter.post('/google', (req: Request, res: Response) => {
  const { email, name, avatarUrl, googleUid, role } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required for Google login' });
  }

  // Check if user already exists
  const existing = store.getUserByEmail(email);
  if (existing) {
    const updated: User = {
      ...existing,
      name: existing.name || name || email.split('@')[0],
      avatarUrl: avatarUrl || existing.avatarUrl,
    };
    store.saveUser(updated);
    return res.json({
      success: true,
      token: `jwt-${existing.id}-${Date.now()}`,
      user: updated,
    });
  }

  // Auto-provision new account with Google profile info
  const id = `user-${Date.now()}`;
  const displayName = name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const newUser: User = {
    id,
    name: displayName,
    email: email.toLowerCase().trim(),
    role: (role as UserRole) || 'patient',
    avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
    phone: '+234 800 000 0000',
    walletBalance: 10000,
    stateOfResidence: 'Lagos State',
    lga: 'Ikeja',
    address: '',
    dob: '',
    gender: 'Other',
    allergies: [],
    bloodGroup: 'O+',
    emergencyContact: {
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

  store.createAuditLog({
    accessedBy: newUser.name,
    accessorRole: 'System Administrator',
    recordAccessed: `User Profile (#${newUser.id})`,
    accessReason: 'Google OAuth registration and patient provisioning',
    actionType: 'Created',
    ipAddress: req.ip,
    accessLocation: 'Google OAuth Portal',
  });

  return res.status(201).json({
    success: true,
    message: 'Google login successful',
    token: `jwt-${newUser.id}-${Date.now()}`,
    user: newUser,
  });
});

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, role, phone, stateOfResidence, lga, allergies, bloodGroup, emergencyContact, dob, gender, address } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const existing = store.getUserByEmail(email);
  if (existing) {
    const updated = {
      ...existing,
      name,
      phone: phone || existing.phone,
      stateOfResidence: stateOfResidence || existing.stateOfResidence,
      address: address || existing.address,
      dob: dob || existing.dob,
      gender: gender || existing.gender,
    };
    store.saveUser(updated);
    return res.json({
      success: true,
      message: 'Account updated successfully',
      token: `jwt-${existing.id}-${Date.now()}`,
      user: updated,
    });
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
    address: address || '',
    dob: dob || '',
    gender: gender || 'Female',
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
    accessLocation: 'Registration Portal',
  });

  return res.status(201).json({
    success: true,
    message: 'Account registered successfully',
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

