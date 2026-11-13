import { Router, Request, Response } from 'express';
import { store } from '../store';

export const doctorsRouter = Router();

// GET /api/doctors
doctorsRouter.get('/', (req: Request, res: Response) => {
  const { specialty, onlineOnly, search } = req.query;
  let doctors = store.getDoctors();

  if (specialty && specialty !== 'All') {
    const specQuery = (specialty as string).toLowerCase();
    doctors = doctors.filter((d) => {
      const docSpec = d.specialty.toLowerCase();
      if (docSpec.includes(specQuery)) return true;
      // Normalize Paediatrics vs Pediatrics
      if (
        (specQuery.includes('paed') || specQuery.includes('ped')) &&
        (docSpec.includes('paed') || docSpec.includes('ped'))
      ) {
        return true;
      }
      return false;
    });
  }

  if (onlineOnly === 'true') {
    doctors = doctors.filter((d) => d.isOnline);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    doctors = doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.about.toLowerCase().includes(q)
    );
  }

  return res.json({ success: true, count: doctors.length, doctors });
});

// GET /api/doctors/:id
doctorsRouter.get('/:id', (req: Request, res: Response) => {
  const doc = store.getDoctorById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }
  return res.json({ success: true, doctor: doc });
});

// GET /api/doctors/:id/slots
doctorsRouter.get('/:id/slots', (req: Request, res: Response) => {
  const doc = store.getDoctorById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }

  const standardSlots = [
    { time: '09:00 AM', available: true },
    { time: '09:30 AM', available: false },
    { time: '10:00 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '11:30 AM', available: false },
    { time: '02:00 PM', available: true },
    { time: '02:30 PM', available: true },
    { time: '03:00 PM', available: true },
    { time: '03:30 PM', available: false },
    { time: '04:00 PM', available: true },
  ];

  return res.json({
    success: true,
    doctorId: doc.id,
    doctorName: doc.name,
    date: req.query.date || 'Today',
    slots: standardSlots,
  });
});

// POST /api/doctors (Create or Register a Doctor)
doctorsRouter.post('/', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name) {
    return res.status(400).json({ success: false, error: 'Doctor name is required' });
  }

  const id = data.id || `doc-${Date.now()}`;
  const cleanName = data.name.trim().startsWith('Dr.') ? data.name.trim() : `Dr. ${data.name.trim()}`;
  const newDoctor = {
    id,
    name: cleanName,
    fullNameWithTitle: data.fullNameWithTitle || `${cleanName}, MD`,
    specialty: data.specialty || 'General Practice',
    title: data.title || `Consultant in ${data.specialty || 'General Practice'}`,
    rating: data.rating || 5.0,
    reviewsCount: data.reviewsCount || 0,
    avatarUrl:
      data.avatarUrl ||
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    isOnline: data.isOnline !== undefined ? data.isOnline : true,
    yearsExperience: Number(data.yearsExperience) || 5,
    patientsCount: Number(data.patientsCount) || 0,
    about:
      data.about ||
      `${cleanName} is a licensed medical practitioner on Prime Telecare specializing in ${
        data.specialty || 'General Practice'
      }.`,
    qualifications: data.qualifications || [data.licenseNumber || 'MDCN Licensed Medical Practitioner'],
    languagesSpoken: data.languagesSpoken || ['English'],
    consultationFee: data.consultationFee || {
      chat: Number(data.chatFee) || 5000,
      voice: Number(data.voiceFee) || 7000,
      video: Number(data.videoFee) || 10000,
      base: Number(data.videoFee) || 10000,
    },
    availabilityStatus: {
      isOnline: true,
      statusText: 'Online & Available',
      nextAvailableSlot: 'Today',
      workingDays: data.workingDays || 'Mon - Fri (8:00 AM - 6:00 PM)',
    },
    verification: {
      isVerified: true,
      licenseNumber: data.licenseNumber || 'MDCN/2026/001',
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
    availableDates: ['Today', 'Tomorrow', 'This Week'],
    availableTimeSlots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    prices: {
      chat: Number(data.chatFee) || 5000,
      voice: Number(data.voiceFee) || 7000,
      video: Number(data.videoFee) || 10000,
    },
  };

  store.saveDoctor(newDoctor);

  store.createAuditLog({
    accessedBy: cleanName,
    accessorRole: 'Physician / Clinician',
    recordAccessed: `Doctor Profile (#${id})`,
    accessReason: 'New physician credentialing and roster publication',
    actionType: 'Created',
    ipAddress: req.ip,
    accessLocation: 'Clinician Registration Hub',
  });

  return res.status(201).json({ success: true, doctor: newDoctor });
});

// DELETE /api/doctors/:id
doctorsRouter.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = store.deleteDoctor(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }
  return res.json({ success: true, message: 'Doctor profile removed successfully' });
});

