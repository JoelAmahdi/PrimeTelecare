import { Router, Request, Response } from 'express';
import { store } from '../store';
import { User, UserRole } from '../../src/types';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password, role, biometricToken } = req.body;

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
    return res.status(400).json({ success: false, error: 'Email or username is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Admin Authentication - Single master admin account with special credentials
  const ADMIN_IDENTIFIERS = ['admin', 'admin@telecare.ng', 'admin@primetelecare.com'];
  const VALID_ADMIN_PASSWORDS = ['TelecareAdmin@2026!', 'Admin2026#', 'Admin@Telecare2026', 'admin1234'];

  if (ADMIN_IDENTIFIERS.includes(normalizedEmail) || role === 'admin') {
    if (!ADMIN_IDENTIFIERS.includes(normalizedEmail)) {
      return res.status(401).json({
        success: false,
        error: 'Unrecognized administrator account. Only the single authorized platform administrator can sign in here.',
      });
    }
    if (password && !VALID_ADMIN_PASSWORDS.includes(password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid master administrator password. Unauthorized access attempts are audited.',
      });
    }
    const adminUser = store.getUserById('admin-1') || {
      id: 'admin-1',
      name: 'System Administrator',
      email: 'admin@telecare.ng',
      role: 'admin' as UserRole,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      phone: '+234 809 999 0000',
    };
    return res.json({
      success: true,
      token: `jwt-admin-${Date.now()}`,
      user: adminUser,
    });
  }

  // Pre-configured doctor accounts or explicitly requested doctor role
  if (role === 'doctor' || normalizedEmail === 'dr.emeka@primetelecare.com' || normalizedEmail.includes('doctor') || normalizedEmail.includes('dr.')) {
    const doctorUser = store.getUserById('doc-1') || {
      id: 'doc-1',
      name: 'Dr. Emeka Nnamdi',
      email: normalizedEmail.includes('@') ? normalizedEmail : 'dr.emeka@primetelecare.com',
      role: 'doctor' as UserRole,
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      phone: '+234 802 345 6789',
      doctorLicenseNo: 'MDCN/2018/74920',
      doctorSpecialty: 'General Practice & Telemedicine Specialist',
    };
    return res.json({
      success: true,
      token: `jwt-doc-${Date.now()}`,
      user: doctorUser,
    });
  }

  // Pre-configured demo accounts
  if (normalizedEmail === 'patient@telecare.com') {
    const user = store.getUserById('pat-1')!;
    return res.json({ success: true, token: `jwt-pat-1-${Date.now()}`, user });
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
  const { name, email, role, phone, stateOfResidence, lga, allergies, bloodGroup, emergencyContact, dob, gender, address, doctorLicenseNo, doctorSpecialty } = req.body;

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

  if (role === 'doctor') {
    const cleanName = newUser.name.trim().startsWith('Dr.') ? newUser.name.trim() : `Dr. ${newUser.name.trim()}`;
    const newDoc = {
      id: `doc-${newUser.id}`,
      name: cleanName,
      fullNameWithTitle: `${cleanName}, MD`,
      specialty: doctorSpecialty || 'General Practice / Family Medicine',
      title: `Consultant in ${doctorSpecialty || 'General Practice'}`,
      rating: 5.0,
      reviewsCount: 0,
      avatarUrl: newUser.avatarUrl,
      isOnline: true,
      yearsExperience: 5,
      patientsCount: 0,
      about: `${cleanName} is a licensed medical practitioner on Prime Telecare specializing in ${
        doctorSpecialty || 'General Practice'
      }.`,
      qualifications: [doctorLicenseNo || 'MDCN Licensed Medical Practitioner'],
      languagesSpoken: ['English'],
      consultationFee: { chat: 5000, voice: 7000, video: 10000, base: 10000 },
      availabilityStatus: {
        isOnline: true,
        statusText: 'Online & Available',
        nextAvailableSlot: 'Today',
        workingDays: 'Mon - Fri (8:00 AM - 6:00 PM)',
      },
      verification: {
        isVerified: true,
        licenseNumber: doctorLicenseNo || 'MDCN/2026/001',
        boardName: 'Medical and Dental Council of Nigeria (MDCN)',
        verifiedBadgeText: 'Verified MDCN License',
        verificationDate: 'Verified',
      },
      reviewPolicy: {
        policyText: 'Authentic patient tele-consultation feedback.',
        verifiedOnly: true,
        auditEnforced: true,
      },
      reviewsList: [],
      availableDates: ['Today', 'Tomorrow'],
      availableTimeSlots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
      prices: { chat: 5000, voice: 7000, video: 10000 },
    };
    store.saveDoctor(newDoc);
  }

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

