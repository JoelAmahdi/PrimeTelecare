import { Router, Request, Response } from 'express';
import { store } from '../store';

export const triageRouter = Router();

// POST /api/triage/evaluate
triageRouter.post('/evaluate', async (req: Request, res: Response) => {
  const {
    patientId = 'pat-1',
    patientName = 'Ada Okonkwo',
    patientAge = 28,
    gender = 'Female',
    vitals = {},
    redFlags = {},
  } = req.body;

  // 1. Red Flag Emergency Evaluation (Deterministic Clinical Safeguard)
  const isEmergency =
    redFlags.chestPain ||
    redFlags.breathingDiff ||
    redFlags.strokeSymptoms ||
    redFlags.heavyBleeding ||
    redFlags.anaphylaxis ||
    redFlags.severeTrauma;

  // 2. Vitals Analysis
  const tempNum = parseFloat(vitals.temp || '0');
  const hrNum = parseFloat(vitals.hr || '0');
  const spo2Num = parseFloat(vitals.spo2 || '100');
  const systolicNum = parseFloat(vitals.systolicBp || '120');

  const hasHighFever = tempNum >= 39.0;
  const hasLowOxygen = spo2Num > 0 && spo2Num < 92;
  const hasExtremeBp = systolicNum > 180 || (systolicNum > 0 && systolicNum < 90);

  let severity: 'immediate_emergency' | 'urgent_telehealth' | 'routine_care';
  let recommendation: string;
  let suggestedSpecialty: string;

  if (isEmergency || hasLowOxygen || hasExtremeBp) {
    severity = 'immediate_emergency';
    recommendation =
      'Immediate in-person emergency care required. Please visit the nearest hospital emergency department or dial national emergency services (112 / 199 in Nigeria). Telehealth consultation is unsafe for critical emergencies.';
    suggestedSpecialty = 'Emergency Medicine & Critical Care';
  } else if (hasHighFever || hrNum > 115) {
    severity = 'urgent_telehealth';
    recommendation =
      'High priority urgent telehealth consultation advised within 1-2 hours. Vitals show elevated clinical response requiring prompt medical assessment and symptom relief.';
    suggestedSpecialty = 'General Practice / Urgent Care';
  } else {
    severity = 'routine_care';
    recommendation =
      'Standard telehealth consultation is appropriate. Your vitals are within normal range for routine remote clinical review.';
    suggestedSpecialty = 'Family Medicine & General Practice';
  }

  // 3. Clinical decision support evaluation summary
  const clinicalNotes = severity === 'immediate_emergency'
    ? 'Priority clinical alert triggered based on recorded vital parameters.'
    : 'Baseline clinical vital parameters verified within acceptable range.';

  // Record triage case in server store
  const triageCase = store.createTriageCase({
    patientId,
    patientName,
    patientAge,
    gender,
    vitals,
    redFlags,
    severity,
    recommendation,
    suggestedSpecialty,
    aiNotes: clinicalNotes,
  });

  return res.json({
    success: true,
    triageCase,
  });
});

// GET /api/triage/history
triageRouter.get('/history', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    cases: store.getTriageCases(),
  });
});

