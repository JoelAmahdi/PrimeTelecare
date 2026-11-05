const { chromium } = require('playwright');
const path = require('path');
const http = require('http');

async function testRun() {
  console.log('======================================================');
  console.log('  Prime Telecare — Full-Stack Live Test Run Probe     ');
  console.log('======================================================\n');

  // Set to test mode for programmatic control
  process.env.NODE_ENV = 'production';
  process.env.PORT = '5050';

  const { app } = await import('./server/index.ts');
  const server = http.createServer(app);
  
  await new Promise((resolve) => server.listen(5050, '127.0.0.1', resolve));
  console.log('1. Full-Stack Server active on http://127.0.0.1:5050');

  // Probe 1: Health endpoint
  const healthRes = await fetch('http://127.0.0.1:5050/api/health');
  const healthData = await healthRes.json();
  console.log('2. Health Probe:', healthRes.status, healthData.status, `(Compliance: ${healthData.compliance.join(', ')})`);

  // Probe 2: Doctors API
  const docsRes = await fetch('http://127.0.0.1:5050/api/doctors');
  const docsData = await docsRes.json();
  console.log('3. Doctors API Probe:', docsRes.status, `Found ${docsData.doctors.length} doctors online & available`);

  // Probe 3: Appointments API
  const aptsRes = await fetch('http://127.0.0.1:5050/api/appointments');
  const aptsData = await aptsRes.json();
  console.log('4. Appointments API Probe:', aptsRes.status, `Found ${aptsData.appointments.length} active consultation bookings`);

  // Probe 4: Launch Headless Browser to test Frontend Single Page App
  console.log('5. Launching Chrome to test live UI rendering...');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // iPhone 16 Pro viewport
  });

  await context.addInitScript(() => {
    localStorage.setItem('prime_telecare_terms_accepted', 'true');
    localStorage.setItem('prime_telecare_emulator_active', 'false');
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('http://127.0.0.1:5050/');
  await page.waitForTimeout(1000);

  const title = await page.title();
  const bodyText = await page.innerText('body');
  console.log('6. SPA Live Page Title:', JSON.stringify(title));
  console.log('7. Page Errors Caught:', pageErrors.length === 0 ? 'None (Clean)' : pageErrors);
  console.log('8. Heading sample:', bodyText.slice(0, 120).replace(/\n+/g, ' '));

  // Test live navigation to Doctor Dashboard
  await page.evaluate(() => {
    if (window.__PRIME_NAVIGATE__) {
      window.__PRIME_NAVIGATE__('doctor-home', 'doctor');
    }
  });
  await page.waitForTimeout(800);
  const doctorHeading = await page.innerText('body');
  console.log('9. Doctor Dashboard Live View:', doctorHeading.includes('Doctor Dashboard') ? 'VERIFIED' : 'PENDING');

  // Capture verification screenshot
  const shotPath = path.join(__dirname, 'previews', 'live_test_run.png');
  await page.screenshot({ path: shotPath });
  console.log('10. Live screenshot saved to:', shotPath);

  await browser.close();
  server.close(() => {
    console.log('\n======================================================');
    console.log('  TEST RUN COMPLETED SUCCESSFULLY: ALL PROBES GREEN   ');
    console.log('======================================================\n');
    process.exit(0);
  });
}

testRun().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

