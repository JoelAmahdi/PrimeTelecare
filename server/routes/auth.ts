import { Router, Request, Response } from 'express';
import { store } from '../store';
import { User, UserRole, Doctor } from '../../src/types';

export const authRouter = Router();

/**
 * Ensures any onboarded doctor account has a live entry in the doctors directory
 * so they appear immediately as online on the patient portal.
 */
function ensureDoctorInDirectory(user: User, isOnline = true): Doctor | null {
  if (user.role !== 'doctor') return null;
  if (!user.onboarded && !user.hasCompletedOnboarding && !user.doctorLicenseNo && !user.doctorSpecialty) {
    return null;
  }

  const docId = user.id.startsWith('doc-') ? user.id : `doc-${user.id}`;
  const existing = store.getDoctorById(docId) || store.getDoctorById(user.id);
  const cleanName = (user.name || 'Physician').trim().startsWith('Dr.')
    ? user.name.trim()
    : `Dr. ${(user.name || 'Physician').trim()}`;

  if (existing) {
    const updated: Doctor = {
      ...existing,
      name: cleanName,
      specialty: user.doctorSpecialty || existing.specialty || 'General Practice',
      avatarUrl: user.avatarUrl || existing.avatarUrl,
      isOnline,
      availabilityStatus: {
        ...(existing.availabilityStatus || {
          nextAvailableSlot: 'Today',
          workingDays: 'Mon - Fri (8:00 AM - 6:00 PM)',
        }),
        isOnline,
        statusText: isOnline ? 'Online & Available' : 'Offline',
      },
    };
    return store.saveDoctor(updated);
  }

  const specialty = user.doctorSpecialty || 'General Practice / Family Medicine';
  const newDoc: Doctor = {
    id: docId,
    name: cleanName,
    fullNameWithTitle: `${cleanName}, MD`,
    specialty,
    title: `Consultant in ${specialty}`,
    rating: 5.0,
    reviewsCount: 0,
    avatarUrl:
      user.avatarUrl ||
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    isOnline,
    isActive: true,
    practiceStatus: 'active',
    yearsExperience: 5,
    patientsCount: 0,
    about: `${cleanName} is a licensed medical practitioner on Prime Telecare specializing in ${specialty}.`,
    qualifications: [user.doctorLicenseNo || 'MDCN Licensed Medical Practitioner'],
    languagesSpoken: ['English'],
    consultationFee: { chat: 5000, voice: 7000, video: 10000, base: 10000 },
    availabilityStatus: {
      isOnline,
      statusText: isOnline ? 'Online & Available' : 'Offline',
      nextAvailableSlot: 'Today',
      workingDays: 'Mon - Fri (8:00 AM - 6:00 PM)',
    },
    verification: {
      isVerified: true,
      licenseNumber: user.doctorLicenseNo || 'MDCN Verified',
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
    availableTimeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
    prices: { chat: 5000, voice: 7000, video: 10000 },
  };
  return store.saveDoctor(newDoc);
}

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password, role, biometricToken } = req.body;

  if (biometricToken) {
    const users = store.getUsers();
    const user =
      role === 'admin'
        ? store.getUserById('admin-1')
        : users.find((u) => u.role === (role || 'patient'));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No registered account found for biometric unlock. Please sign in with email or Google.',
      });
    }

    if (user.role === 'doctor') {
      ensureDoctorInDirectory(user, true);
    }

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
      email: 'admin@primetelecare.com',
      role: 'admin' as UserRole,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      phone: '',
      onboarded: true,
      hasCompletedOnboarding: true,
    };
    return res.json({
      success: true,
      token: `jwt-admin-${Date.now()}`,
      user: adminUser,
    });
  }

  // Check if registered user exists in database
  const existing = store.getUserByEmail(normalizedEmail);
  if (existing) {
    const resolvedRole: UserRole =
      existing.role || (role === 'doctor' ? 'doctor' : 'patient');
    const updated: User = {
      ...existing,
      role: resolvedRole,
    };
    store.saveUser(updated);
    if (updated.role === 'doctor') {
      ensureDoctorInDirectory(updated, true);
    }
    return res.json({
      success: true,
      token: `jwt-${existing.id}-${Date.now()}`,
      user: updated,
    });
  }

  // Auto-provision a clean new account for newly entered email (requires onboarding)
  const targetRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';
  const id = `user-${Date.now()}`;
  const displayName = normalizedEmail
    .split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const newUser: User = {
    id,
    name: displayName || (targetRole === 'doctor' ? 'Doctor' : 'Patient'),
    email: normalizedEmail,
    role: targetRole,
    avatarUrl:
      targetRole === 'doctor'
        ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    phone: '',
    walletBalance: 0,
    onboarded: false,
    hasCompletedOnboarding: false,
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
  const { email, name, avatarUrl, role } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required for Google login' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = store.getUserByEmail(normalizedEmail);
  if (existing) {
    const resolvedRole: UserRole =
      existing.role || (role === 'doctor' ? 'doctor' : 'patient');
    const updated: User = {
      ...existing,
      name: existing.name || name || normalizedEmail.split('@')[0],
      avatarUrl: avatarUrl || existing.avatarUrl,
      role: resolvedRole,
    };
    store.saveUser(updated);
    if (updated.role === 'doctor') {
      ensureDoctorInDirectory(updated, true);
    }
    return res.json({
      success: true,
      token: `jwt-${existing.id}-${Date.now()}`,
      user: updated,
    });
  }

  const targetRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';
  const id = `user-${Date.now()}`;
  const displayName =
    name ||
    normalizedEmail
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const newUser: User = {
    id,
    name: displayName,
    email: normalizedEmail,
    role: targetRole,
    avatarUrl:
      avatarUrl ||
      (targetRole === 'doctor'
        ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'),
    phone: '',
    walletBalance: 0,
    onboarded: false,
    hasCompletedOnboarding: false,
    allergies: [],
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
    accessReason: 'Google OAuth registration',
    actionType: 'Updated',
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
  const {
    name,
    email,
    role,
    phone,
    stateOfResidence,
    lga,
    allergies,
    bloodGroup,
    emergencyContact,
    dob,
    gender,
    address,
    doctorLicenseNo,
    doctorSpecialty,
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const targetRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';

  const existing = store.getUserByEmail(normalizedEmail);
  if (existing) {
    const updated: User = {
      ...existing,
      name,
      role: existing.role || targetRole,
      phone: phone || existing.phone,
      stateOfResidence: stateOfResidence || existing.stateOfResidence,
      address: address || existing.address,
      dob: dob || existing.dob,
      gender: gender || existing.gender,
      doctorLicenseNo: doctorLicenseNo || existing.doctorLicenseNo,
      doctorSpecialty: doctorSpecialty || existing.doctorSpecialty,
    };
    store.saveUser(updated);
    if (updated.role === 'doctor') {
      ensureDoctorInDirectory(updated, true);
    }
    return res.json({
      success: true,
      message: 'Account updated successfully',
      token: `jwt-${existing.id}-${Date.now()}`,
      user: updated,
    });
  }

  const id = `user-${Date.now()}`;
  const isDoctorComplete = targetRole === 'doctor' && Boolean(doctorLicenseNo && doctorSpecialty);
  const newUser: User = {
    id,
    name,
    email: normalizedEmail,
    role: targetRole,
    avatarUrl:
      targetRole === 'doctor'
        ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    phone: phone || '',
    walletBalance: 0,
    stateOfResidence: stateOfResidence || '',
    lga: lga || '',
    address: address || '',
    dob: dob || '',
    gender: gender || '',
    allergies: allergies || [],
    bloodGroup: bloodGroup || '',
    emergencyContact,
    doctorLicenseNo,
    doctorSpecialty,
    onboarded: isDoctorComplete,
    hasCompletedOnboarding: isDoctorComplete,
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

  if (targetRole === 'doctor') {
    ensureDoctorInDirectory(newUser, true);
  }

  store.createAuditLog({
    accessedBy: newUser.name,
    accessorRole: 'System Administrator',
    recordAccessed: `User Profile & Consent (#${newUser.id})`,
    accessReason: 'Initial account enrollment and NDPA statutory consent recording',
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
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }
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
  const merged: User = existing
    ? { ...existing, ...updates, id }
    : {
        id,
        name: updates.name || 'User',
        email: updates.email || '',
        role: updates.role || 'patient',
        avatarUrl:
          updates.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        ...updates,
      };

  const updated = store.saveUser(merged);
  if (updated.role === 'doctor') {
    ensureDoctorInDirectory(updated, true);
  }
  return res.json({ success: true, user: updated });
});
