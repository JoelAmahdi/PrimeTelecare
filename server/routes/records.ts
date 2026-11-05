import { Router, Request, Response } from 'express';
import { store } from '../store';

export const recordsRouter = Router();

// GET /api/records
recordsRouter.get('/', (req: Request, res: Response) => {
  const patientId = (req.query.patientId as string) || 'pat-1';
  const user = store.getUserById(patientId);

  return res.json({
    success: true,
    patientId,
    bloodGroup: user?.bloodGroup || 'O+',
    allergies: user?.allergies || ['Penicillin', 'Peanuts'],
    existingConditions: user?.existingConditions || ['Seasonal Asthma'],
    currentMedications: user?.currentMedications || 'Cetirizine 10mg daily',
    totalConsultations: 4,
    lastConsultationDate: 'October 15, 2026',
  });
});

// GET /api/records/export-status
recordsRouter.get('/export-status', (req: Request, res: Response) => {
  const sessionId = (req.query.sessionId as string) || 'app-1';
  const auth = store.getExportAuthorization(sessionId);
  return res.json({ success: true, exportAuthorization: auth });
});

// POST /api/records/export-request
recordsRouter.post('/export-request', (req: Request, res: Response) => {
  const { sessionId = 'app-1', purpose, patientName = 'Ada Okonkwo' } = req.body;

  const auth = store.saveExportAuthorization(sessionId, {
    status: 'pending_doctor_approval',
    purpose: purpose || 'Second Medical Opinion & Archive',
    patientName,
    requestedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  store.createAuditLog({
    accessedBy: patientName,
    accessorRole: 'Doctor',
    recordAccessed: `Full Health Record Archive (#${sessionId})`,
    accessReason: `Patient initiated export authorization request: ${purpose || 'Clinical Review'}`,
    actionType: 'Viewed',
    ipAddress: req.ip,
    accessLocation: 'Health Records Module',
  });

  return res.json({ success: true, exportAuthorization: auth });
});

// POST /api/records/export-authorize
recordsRouter.post('/export-authorize', (req: Request, res: Response) => {
  const { sessionId = 'app-1', action, doctorName = 'Dr. Sarah Johnson', doctorLicense = 'MDCN/2019/88492' } = req.body;

  const isGranted = action === 'grant';
  const auth = store.saveExportAuthorization(sessionId, {
    status: isGranted ? 'granted' : 'rejected',
    doctorName,
    doctorLicense,
    grantedAt: isGranted
      ? new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined,
  });

  store.createAuditLog({
    accessedBy: doctorName,
    accessorRole: 'Doctor',
    accessorLicenseOrDept: doctorLicense,
    recordAccessed: `Patient Health Record Release (#${sessionId})`,
    accessReason: `Doctor formal sign-off: Health record export release ${isGranted ? 'APPROVED' : 'REJECTED'}`,
    actionType: isGranted ? 'Exported' : 'Updated',
    ipAddress: req.ip,
    accessLocation: 'Doctor Clinical Documentation Suite',
  });

  return res.json({ success: true, exportAuthorization: auth });
});

// GET /api/records/audit-logs
recordsRouter.get('/audit-logs', (_req: Request, res: Response) => {
  const logs = store.getAuditLogs();
  return res.json({ success: true, count: logs.length, auditLogs: logs });
});

