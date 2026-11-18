import { Router, Request, Response } from 'express';
import { store } from '../store';
import { Appointment } from '../../src/types';

export const appointmentsRouter = Router();

// GET /api/appointments
appointmentsRouter.get('/', (req: Request, res: Response) => {
  const { patientName, doctorId, status } = req.query;
  let appointments = store.getAppointments({
    patientName: patientName as string,
    doctorId: doctorId as string,
  });

  if (status) {
    appointments = appointments.filter((a) => a.status === status);
  }

  return res.json({ success: true, count: appointments.length, appointments });
});

// GET /api/appointments/alerts
appointmentsRouter.get('/alerts', (req: Request, res: Response) => {
  const appointments = store.getAppointments({ status: 'upcoming' as any });
  const activeAlert = appointments.length > 0 ? {
    id: appointments[0].id,
    doctorName: appointments[0].doctorName,
    doctorSpecialty: appointments[0].doctorSpecialty || 'General Practice',
    doctorAvatar: appointments[0].doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    patientName: appointments[0].patientName,
    startTimeTimestamp: Date.now() + 15 * 60 * 1000, // 15 mins away
    type: appointments[0].type || 'Video',
  } : null;

  return res.json({ success: true, activeAlert });
});

// POST /api/appointments
appointmentsRouter.post('/', (req: Request, res: Response) => {
  const { doctorId, patientName, scheduledDate, timeSlot, type, notes, price } = req.body;

  if (!doctorId || !patientName || !scheduledDate || !timeSlot) {
    return res.status(400).json({
      success: false,
      error: 'Missing required appointment fields (doctorId, patientName, scheduledDate, timeSlot)',
    });
  }

  let doctor = store.getDoctorById(doctorId);
  if (!doctor) {
    doctor = store.getDoctors().find((d) => d.id === doctorId || d.name === doctorId) || {
      id: doctorId,
      name: req.body.doctorName || 'Doctor',
      specialty: req.body.doctorSpecialty || 'General Practice',
      avatarUrl: req.body.doctorAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    } as any;
  }

  const newAppointment = store.createAppointment({
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorSpecialty: doctor.specialty,
    doctorAvatar: doctor.avatarUrl,
    patientName,
    date: scheduledDate,
    scheduledDate,
    timeSlot,
    type: type || 'Video',
    status: 'upcoming',
    notes: notes || '',
    price: price || (doctor as any).consultationFee?.video || (doctor as any).prices?.video || 10000,
  });

  // Automatically record NDPA audit log
  store.createAuditLog({
    accessedBy: patientName,
    accessorRole: 'Doctor',
    accessorTitle: doctor.title || 'Doctor',
    accessorLicenseOrDept: (doctor.qualifications && doctor.qualifications[0]) || 'Clinical Staff',
    recordAccessed: `Appointment Record (#${newAppointment.id})`,
    accessReason: `Telehealth consultation booked for ${scheduledDate} at ${timeSlot}`,
    actionType: 'Updated',
    ipAddress: req.ip,
    accessLocation: 'Online Booking Gateway',
  });

  return res.status(201).json({ success: true, appointment: newAppointment });
});

// PUT /api/appointments/:id
appointmentsRouter.put('/:id', (req: Request, res: Response) => {
  const updated = store.updateAppointment(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }
  return res.json({ success: true, appointment: updated });
});

// DELETE /api/appointments/:id
appointmentsRouter.delete('/:id', (req: Request, res: Response) => {
  const updated = store.updateAppointment(req.params.id, { status: 'cancelled' });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }
  return res.json({ success: true, message: 'Appointment cancelled successfully', appointment: updated });
});

// GET /api/appointments/active-call (Poll for incoming doctor calls)
appointmentsRouter.get('/active-call', (req: Request, res: Response) => {
  const doctorId = req.query.doctorId as string;
  const activeCall = store.getActiveCall(doctorId);
  return res.json({ success: true, activeCall: activeCall || null, call: activeCall || null });
});

// POST /api/appointments/start-call (Trigger incoming call on doctor's device)
appointmentsRouter.post('/start-call', (req: Request, res: Response) => {
  const { consultationId, doctorId, doctorName, patientName, patientAvatar, type, vitals } = req.body;
  if (!doctorId || !patientName) {
    return res.status(400).json({ success: false, error: 'doctorId and patientName are required' });
  }
  const call = store.startCall({
    consultationId: consultationId || `cns-${Date.now()}`,
    doctorId,
    doctorName,
    patientName,
    patientAvatar,
    type: type || 'Video',
    vitals,
  });
  return res.json({ success: true, call, activeCall: call });
});

// POST /api/appointments/respond-call (Doctor accepts/declines incoming call)
appointmentsRouter.post('/respond-call', (req: Request, res: Response) => {
  const { callId, status } = req.body;
  if (!callId || !status) {
    return res.status(400).json({ success: false, error: 'callId and status are required' });
  }
  const call = store.respondCall(callId, status);
  return res.json({ success: true, call });
});

