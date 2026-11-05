process.env.NODE_ENV = 'test';
import http from 'http';

async function testBackend() {
  const { app } = await import('./server/index');
  console.log('--- Starting Prime Telecare Backend Test Suite ---');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:5099/api';

  async function req(endpoint: string, options: any = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const json = await res.json();
    return { status: res.status, data: json };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`  [PASS] ${label}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${label}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await req('/health');
  assert(health.status === 200 && health.data.status === 'healthy', 'GET /api/health returns healthy');

  // 2. Auth Login
  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'ada.okonkwo@email.com', role: 'patient' }),
  });
  assert(login.status === 200 && login.data.user.name === 'Ada Okonkwo', 'POST /api/auth/login authenticates patient');

  // 3. Doctors List
  const doctors = await req('/doctors');
  assert(doctors.status === 200 && doctors.data.doctors.length > 0, 'GET /api/doctors returns doctors list');

  // 4. Appointments Creation
  const newApt = await req('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      doctorId: 'doc-anya',
      patientName: 'Ada Okonkwo',
      scheduledDate: 'Tomorrow',
      timeSlot: '10:00 AM',
      type: 'Video',
      price: 10000,
    }),
  });
  assert(newApt.status === 201 && newApt.data.appointment.doctorId === 'doc-anya', 'POST /api/appointments creates appointment');

  // 5. Clinical Triage Evaluation (Emergency Case)
  const triageEmergency = await req('/triage/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      patientName: 'Ada Okonkwo',
      vitals: { temp: '37.0', hr: '80', spo2: '89', systolicBp: '120' }, // Low SpO2
      redFlags: { chestPain: true },
    }),
  });
  assert(
    triageEmergency.status === 200 && triageEmergency.data.triageCase.severity === 'immediate_emergency',
    'POST /api/triage/evaluate accurately triggers immediate_emergency for low SpO2 & chest pain'
  );

  // 6. Clinical Triage Evaluation (Routine Case)
  const triageRoutine = await req('/triage/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      patientName: 'Ada Okonkwo',
      vitals: { temp: '36.8', hr: '72', spo2: '99', systolicBp: '120' },
      redFlags: {},
    }),
  });
  assert(
    triageRoutine.status === 200 && triageRoutine.data.triageCase.severity === 'routine_care',
    'POST /api/triage/evaluate categorizes normal vitals as routine_care'
  );

  // 7. Prescriptions Safety Check (Allergy Trigger)
  const safetyCheck = await req('/prescriptions/safety-check', {
    method: 'POST',
    body: JSON.stringify({
      drugs: [{ drugName: 'Amoxicillin 500mg' }],
      patientAllergies: ['Penicillin'],
    }),
  });
  assert(
    safetyCheck.status === 200 && safetyCheck.data.safe === false && safetyCheck.data.warnings.length > 0,
    'POST /api/prescriptions/safety-check flags penicillin cross-allergy contraindication'
  );

  // 8. E-Prescription Creation with HMAC-SHA256 Cryptographic Seal
  const newRx = await req('/prescriptions', {
    method: 'POST',
    body: JSON.stringify({
      patientName: 'Ada Okonkwo',
      doctorName: 'Dr. Sarah Johnson',
      doctorLicense: 'MDCN/2019/88492',
      chiefComplaint: 'Mild Seasonal Bronchospasm',
      diagnosis: 'Allergic Rhinitis',
      medications: [
        {
          id: 'm-1',
          drugName: 'Cetirizine Hydrochloride',
          strength: '10mg',
          dosage: '1 tablet',
          frequency: 'Once daily at bedtime',
          duration: '10 days',
        },
      ],
    }),
  });
  assert(
    newRx.status === 201 &&
      newRx.data.prescription.authSealToken.startsWith('MDCN-SEAL-') &&
      newRx.data.prescription.isVerified === true,
    'POST /api/prescriptions generates authentic MDCN-SEAL token and valid record'
  );

  // 9. Prescription Verification by Reference
  const verifyRx = await req(`/prescriptions/${newRx.data.prescription.id}/verify`);
  assert(
    verifyRx.status === 200 && verifyRx.data.isVerified === true,
    'GET /api/prescriptions/:id/verify verifies prescription seal authenticity'
  );

  // 10. NDPA Records Export Release Workflow
  const reqExport = await req('/records/export-request', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'app-test-1', purpose: 'Second Opinion' }),
  });
  assert(
    reqExport.status === 200 && reqExport.data.exportAuthorization.status === 'pending_doctor_approval',
    'POST /api/records/export-request sets authorization to pending_doctor_approval'
  );

  const authExport = await req('/records/export-authorize', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'app-test-1', action: 'grant', doctorName: 'Dr. Sarah Johnson' }),
  });
  assert(
    authExport.status === 200 && authExport.data.exportAuthorization.status === 'granted',
    'POST /api/records/export-authorize transitions status to granted'
  );

  // 11. Payments Initialization & Verification
  const initPayment = await req('/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({ amount: 10000, purpose: 'consultation', method: 'paystack' }),
  });
  assert(
    initPayment.status === 200 && initPayment.data.payment.reference.startsWith('PRIME-PAY-'),
    'POST /api/payments/initialize generates transaction reference'
  );

  const verifyPayment = await req('/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference: initPayment.data.payment.reference }),
  });
  assert(
    verifyPayment.status === 200 && verifyPayment.data.payment.status === 'successful',
    'POST /api/payments/verify marks transaction as successful'
  );

  // 12. Admin Metrics
  const adminMetrics = await req('/admin/metrics');
  assert(
    adminMetrics.status === 200 && adminMetrics.data.metrics.systemUptimePercent > 99,
    'GET /api/admin/metrics returns system health and analytics'
  );

  console.log(`\n--- Test Results: ${passed} Passed, ${failed} Failed ---`);
  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

testBackend().catch((err) => {
  console.error('Fatal backend test error:', err);
  process.exit(1);
});
