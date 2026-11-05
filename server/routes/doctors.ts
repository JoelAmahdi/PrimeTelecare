import { Router, Request, Response } from 'express';
import { store } from '../store';

export const doctorsRouter = Router();

// GET /api/doctors
doctorsRouter.get('/', (req: Request, res: Response) => {
  const { specialty, onlineOnly, search } = req.query;
  let doctors = store.getDoctors();

  if (specialty && specialty !== 'All') {
    doctors = doctors.filter((d) =>
      d.specialty.toLowerCase().includes((specialty as string).toLowerCase())
    );
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

