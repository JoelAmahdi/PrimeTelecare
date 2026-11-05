import { Router, Request, Response } from 'express';
import { store } from '../store';
import { Prescription } from '../../src/types';

export const prescriptionsRouter = Router();

// GET /api/prescriptions
prescriptionsRouter.get('/', (req: Request, res: Response) => {
  const { patientName } = req.query;
  const list = store.getPrescriptions(patientName as string);
  return res.json({ success: true, count: list.length, prescriptions: list });
});

// GET /api/prescriptions/:id
prescriptionsRouter.get('/:id', (req: Request, res: Response) => {
  const rx = store.getPrescriptionById(req.params.id);
  if (!rx) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  return res.json({ success: true, prescription: rx });
});

// POST /api/prescriptions/safety-check
prescriptionsRouter.post('/safety-check', (req: Request, res: Response) => {
  const { drugs = [], patientAllergies = [] } = req.body;
  const warnings: string[] = [];

  const lowerAllergies = patientAllergies.map((a: string) => a.toLowerCase());

  // Check common drug allergy cross-reactions
  for (const drug of drugs) {
    const dLower = (drug.drugName || drug || '').toLowerCase();
    if (lowerAllergies.some((a: string) => a.includes('penicillin')) && (dLower.includes('amoxicillin') || dLower.includes('ampicillin') || dLower.includes('augmentin') || dLower.includes('penicillin'))) {
      warnings.push(`Severe Allergy Warning: Patient is allergic to Penicillin. ${drug.drugName || drug} is contraindicated.`);
    }
    if (lowerAllergies.some((a: string) => a.includes('sulfa')) && (dLower.includes('bactrim') || dLower.includes('septra') || dLower.includes('sulfamethoxazole'))) {
      warnings.push(`Severe Allergy Warning: Patient is allergic to Sulfa drugs. ${drug.drugName || drug} is contraindicated.`);
    }
  }

  // Check drug-drug interaction pairs
  const drugNames = drugs.map((d: any) => (d.drugName || d || '').toLowerCase());
  if (drugNames.some((d: string) => d.includes('warfarin')) && drugNames.some((d: string) => d.includes('aspirin') || d.includes('ibuprofen'))) {
    warnings.push('Major Drug Interaction: Co-prescribing NSAIDs (Ibuprofen/Aspirin) with Warfarin significantly increases hemorrhage risk.');
  }
  if (drugNames.some((d: string) => d.includes('ciprofloxacin')) && drugNames.some((d: string) => d.includes('theophylline'))) {
    warnings.push('Major Drug Interaction: Ciprofloxacin increases Theophylline toxicity.');
  }

  return res.json({
    success: true,
    safe: warnings.length === 0,
    warningsCount: warnings.length,
    warnings,
  });
});

// POST /api/prescriptions
prescriptionsRouter.post('/', (req: Request, res: Response) => {
  const {
    referenceNo,
    date,
    patientName,
    doctorName,
    doctorLicense,
    doctorSpecialty,
    chiefComplaint,
    diagnosis,
    medications,
    doctorNotes,
  } = req.body;

  if (!patientName || !doctorName || !medications || medications.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Patient name, doctor name, and at least one medication are required',
    });
  }

  const created = store.createPrescription({
    referenceNo: referenceNo || `RX-${Math.floor(100000 + Math.random() * 900000)}`,
    date: date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    patientName,
    doctorName,
    doctorLicense: doctorLicense || 'MDCN/2019/98765',
    doctorSpecialty: doctorSpecialty || 'Consultant Telehealth Physician',
    doctorClinic: 'Prime Telecare Digital Medical Center',
    doctorSignature: doctorName,
    status: 'active',
    isVerified: true,
    chiefComplaint: chiefComplaint || 'Clinical Telehealth Review',
    diagnosis: diagnosis || 'Acute Symptomatic Episode',
    medications,
    doctorNotes: doctorNotes || 'Adhere strictly to prescribed dosage instructions.',
  });

  // Record NDPA audit log
  store.createAuditLog({
    accessedBy: doctorName,
    accessorRole: 'Doctor',
    accessorLicenseOrDept: doctorLicense || 'MDCN/2019/98765',
    recordAccessed: `E-Prescription #${created.referenceNo}`,
    accessReason: `Authorized e-prescription issued with cryptographic seal: ${created.authSealToken}`,
    actionType: 'Updated',
    ipAddress: req.ip,
    accessLocation: 'Clinical E-Prescribing System',
  });

  return res.status(201).json({ success: true, prescription: created });
});

// GET /api/prescriptions/:id/verify
prescriptionsRouter.get('/:id/verify', (req: Request, res: Response) => {
  const rx = store.getPrescriptionById(req.params.id);
  if (!rx) {
    return res.status(404).json({
      success: false,
      isVerified: false,
      message: 'Prescription authentication seal was not found in the national registry.',
    });
  }

  return res.json({
    success: true,
    isVerified: true,
    referenceNo: rx.referenceNo,
    patientName: rx.patientName,
    doctorName: rx.doctorName,
    doctorLicense: rx.doctorLicense,
    authSealToken: rx.authSealToken,
    dateIssued: rx.date,
    verificationTimestamp: new Date().toISOString(),
    status: rx.status,
  });
});

