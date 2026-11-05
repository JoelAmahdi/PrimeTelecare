const http = require('http');

console.log('=====================================================');
console.log('  Prime Telecare — Full-Stack E2E Journey Verification');
console.log('=====================================================\n');

async function runE2E() {
  const tsxCli = require('path').resolve(__dirname, 'node_modules/tsx/dist/cli.mjs');
  
  // Set NODE_ENV to test to prevent auto-listen conflict
  process.env.NODE_ENV = 'test';
  
  const { app } = await import('./server/index.ts');
  const server = http.createServer(app);
  
  const TEST_PORT = 5098;
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  async function api(path, method = 'GET', body = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  let step = 1;
  function report(title, success, details = '') {
    const mark = success ? '✓ [PASS]' : '✗ [FAIL]';
    console.log(`Step ${step++}: ${mark} ${title} ${details ? '— ' + details : ''}`);
    if (!success) {
      console.error('Critical failure at step:', title);
      server.close();
      process.exit(1);
    }
  }

  // Journey Step 1: Health & Compliance Check
  const health = await api('/health');
  report('Health Check', health.ok && health.data.status === 'healthy', `Uptime: ${health.data.uptime}s, Version: ${health.data.version}`);

  // Journey Step 2: Patient Authentication
  const auth = await api('/auth/login', 'POST', { email: 'ada.okonkwo@email.com', role: 'patient' });
  report('Patient Login', auth.ok && auth.data.user.name === 'Ada Okonkwo', `Logged in as: ${auth.data.user.name}`);

  // Journey Step 3: Doctor Discovery Roster
  const docs = await api('/doctors?specialty=Pediatrician');
  report('Doctor Discovery', docs.ok && docs.data.doctors.length > 0, `Found ${docs.data.doctors.length} pediatrician(s)`);
  const chosenDoctor = docs.data.doctors[0];

  // Journey Step 4: Clinical Triage Pre-Flight Screening
  const triage = await api('/triage/evaluate', 'POST', {
    patientName: 'Ada Okonkwo',
    patientAge: 28,
    gender: 'Female',
    vitals: { temp: '37.1', hr: '76', spo2: '98', systolicBp: '118' },
    redFlags: { chestPain: false, breathingDiff: false },
  });
  report('Clinical Triage', triage.ok && triage.data.triageCase.severity === 'routine_care', `Triage recommendation: ${triage.data.triageCase.recommendation.slice(0, 40)}...`);

  // Journey Step 5: Appointment Booking
  const booking = await api('/appointments', 'POST', {
    doctorId: chosenDoctor.id,
    patientName: 'Ada Okonkwo',
    scheduledDate: 'Tomorrow, Oct 30, 2026',
    timeSlot: '02:00 PM',
    type: 'Video',
    price: 10000,
    notes: 'Pediatric follow-up consultation',
  });
  report('Appointment Booking', booking.ok && booking.data.appointment.status === 'upcoming', `Booked ID: ${booking.data.appointment.id}`);

  // Journey Step 6: Payment Gateway Processing & Verification
  const paymentInit = await api('/payments/initialize', 'POST', {
    amount: 10000,
    purpose: 'consultation',
    method: 'paystack',
    patientName: 'Ada Okonkwo',
    consultationId: booking.data.appointment.id,
  });
  report('Payment Initialization', paymentInit.ok && paymentInit.data.payment.reference.startsWith('PRIME-PAY-'), `Ref: ${paymentInit.data.payment.reference}`);

  const paymentVerify = await api('/payments/verify', 'POST', {
    reference: paymentInit.data.payment.reference,
  });
  report('Payment Settlement', paymentVerify.ok && paymentVerify.data.payment.status === 'successful', 'Transaction status: successful');

  // Journey Step 7: WebRTC Telehealth Video Room Session
  const videoToken = await api(`/video/${booking.data.appointment.id}/token?role=patient`);
  report('WebRTC Video Session Token', videoToken.ok && videoToken.data.iceServers.length > 0, `Allocated: ${videoToken.data.allocatedDurationMinutes} mins`);

  // Journey Step 8: Active Consultation Chat Messaging
  const chat = await api(`/chat/${booking.data.appointment.id}/messages`, 'POST', {
    sender: 'patient',
    senderName: 'Ada Okonkwo',
    text: 'Hello doctor, checking in for our scheduled consultation.',
  });
  report('Consultation Chat Message', chat.ok && chat.data.message.status === 'delivered', `Delivered: "${chat.data.message.text}"`);

  // Journey Step 9: Clinical Safety Drug Check
  const drugSafety = await api('/prescriptions/safety-check', 'POST', {
    drugs: [{ drugName: 'Amoxicillin 500mg' }],
    patientAllergies: ['Penicillin'],
  });
  report('Drug Safety Contraindication Guard', drugSafety.ok && drugSafety.data.safe === false, `Blocked contraindication: ${drugSafety.data.warnings[0].slice(0, 50)}...`);

  // Journey Step 10: Doctor Issues Cryptographically Signed E-Prescription
  const prescription = await api('/prescriptions', 'POST', {
    patientName: 'Ada Okonkwo',
    doctorName: chosenDoctor.name,
    doctorLicense: chosenDoctor.verification ? chosenDoctor.verification.licenseNumber : 'MDCN/2018/74920',
    doctorSpecialty: chosenDoctor.specialty,
    chiefComplaint: 'Pediatric Asthma Follow-up',
    diagnosis: 'Mild Bronchospasm',
    medications: [
      {
        id: 'm-1',
        drugName: 'Salbutamol Inhaler (100mcg)',
        strength: '100mcg/dose',
        dosage: '2 puffs',
        frequency: 'As needed for acute wheezing',
        duration: '30 days',
      },
    ],
  });
  report('E-Prescription Issuance', prescription.ok && prescription.data.prescription.authSealToken.startsWith('MDCN-SEAL-'), `Seal: ${prescription.data.prescription.authSealToken}`);

  // Journey Step 11: Public Prescription Seal Verification
  const rxVerify = await api(`/prescriptions/${prescription.data.prescription.id}/verify`);
  report('Public Seal Verification', rxVerify.ok && rxVerify.data.isVerified === true, `MDCN Authenticated: ${rxVerify.data.referenceNo}`);

  // Journey Step 12: NDPA Medical Records Export Release Workflow
  const reqRelease = await api('/records/export-request', 'POST', {
    sessionId: booking.data.appointment.id,
    purpose: 'Personal Health Archive & Second Opinion',
    patientName: 'Ada Okonkwo',
  });
  report('EHR Export Request', reqRelease.ok && reqRelease.data.exportAuthorization.status === 'pending_doctor_approval', 'Status: pending_doctor_approval');

  const docRelease = await api('/records/export-authorize', 'POST', {
    sessionId: booking.data.appointment.id,
    action: 'grant',
    doctorName: chosenDoctor.name,
  });
  report('Doctor EHR Authorization', docRelease.ok && docRelease.data.exportAuthorization.status === 'granted', `Granted at: ${docRelease.data.exportAuthorization.grantedAt}`);

  // Journey Step 13: Family Dependents Management
  const newDependent = await api('/dependents', 'POST', {
    name: 'Tunde Okonkwo',
    relationship: 'Child',
    dob: '2021-06-15',
    age: 5,
    gender: 'Male',
    allergies: ['None'],
  });
  report('Family Dependent Enrollment', newDependent.ok && newDependent.data.dependent.name === 'Tunde Okonkwo', `Enrolled ward: ${newDependent.data.dependent.name}`);

  // Journey Step 14: Administrator Overview & NDPA Audit Logs
  const adminMetrics = await api('/admin/metrics');
  report('Admin Operations KPIs', adminMetrics.ok && adminMetrics.data.metrics.systemUptimePercent > 99, `System uptime: ${adminMetrics.data.metrics.systemUptimePercent}%, Consultations: ${adminMetrics.data.metrics.totalConsultations}`);

  const auditLogs = await api('/records/audit-logs');
  report('NDPA Compliance Audit Trail', auditLogs.ok && auditLogs.data.auditLogs.length > 0, `Captured ${auditLogs.data.auditLogs.length} immutable statutory audit events`);

  console.log('\n=====================================================');
  console.log('  ALL 14 E2E CLINICAL & TECHNICAL JOURNEYS PASSED!   ');
  console.log('=====================================================\n');

  server.close(() => {
    process.exit(0);
  });
}

runE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});

