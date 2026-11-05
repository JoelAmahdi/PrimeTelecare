const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const PORT = 3456;
const DIST_DIR = path.join(__dirname, 'dist');
const ARTIFACT_DIR = path.join('C:', 'Users', 'Acer Nitro 5', '.gemini', 'antigravity', 'brain', '4f55f8f6-387b-4cd1-b46f-2d36d881ad71', 'previews');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(DIST_DIR, reqPath);

      if (!fs.existsSync(filePath)) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch (e) {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      console.log(`Preview server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

function saveScreenshot(sourceBuffer, filename, localDir, artifactDir) {
  const localPath = path.join(localDir, filename);
  fs.writeFileSync(localPath, sourceBuffer);
  if (fs.existsSync(artifactDir)) {
    const artPath = path.join(artifactDir, filename);
    fs.writeFileSync(artPath, sourceBuffer);
  }
}

async function run() {
  const server = await startServer();
  const localDir = path.join(__dirname, 'previews');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  console.log('Launching Chrome with mobile iPhone 14 Pro emulation...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const iPhone = devices['iPhone 14 Pro'];
  const mobileContext = await browser.newContext({
    ...iPhone,
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
  });

  await mobileContext.addInitScript(() => {
    try {
      localStorage.setItem('prime_telecare_terms_accepted', 'true');
      localStorage.setItem('prime_telecare_emulator_active', 'false');
      sessionStorage.setItem('prime_telecare_health_records_unlocked', 'true');
    } catch (e) {}
  });

  const page = await mobileContext.newPage();

  // 1. Welcome Screen
  console.log('Capturing Screen 1: Welcome...');
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(600);
  let shot = await page.screenshot();
  saveScreenshot(shot, '01_welcome_screen.png', localDir, ARTIFACT_DIR);

  // 2. Login Screen
  console.log('Capturing Screen 2: Login...');
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(600);
  shot = await page.screenshot();
  saveScreenshot(shot, '02_login_screen.png', localDir, ARTIFACT_DIR);

  // 3. Patient Home Dashboard
  console.log('Capturing Screen 3: Patient Home Dashboard...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  shot = await page.screenshot();
  saveScreenshot(shot, '03_patient_dashboard.png', localDir, ARTIFACT_DIR);

  // 4. Book Consultation Screen
  console.log('Capturing Screen 4: Book Consultation...');
  await page.click('button[aria-label="Consultation"]', { force: true });
  await page.waitForTimeout(800);
  shot = await page.screenshot();
  saveScreenshot(shot, '04_book_consultation.png', localDir, ARTIFACT_DIR);

  // 5. Health Records Screen
  console.log('Capturing Screen 5: Health Records...');
  await page.click('button[aria-label="Records"]', { force: true });
  await page.waitForTimeout(800);
  shot = await page.screenshot();
  saveScreenshot(shot, '05_health_records.png', localDir, ARTIFACT_DIR);

  // 6. Settings Screen
  console.log('Capturing Screen 6: Settings...');
  await page.click('button[aria-label="Profile"]', { force: true });
  await page.waitForTimeout(800);
  shot = await page.screenshot();
  saveScreenshot(shot, '06_settings.png', localDir, ARTIFACT_DIR);

  // 7. Terms of Care Screen via Screen Switcher
  console.log('Capturing Screen 7: Terms of Care...');
  await page.click('button[title*="Screens"]', { force: true });
  await page.waitForTimeout(400);
  await page.click('button:has-text("Terms of Care")', { force: true });
  await page.waitForTimeout(800);
  shot = await page.screenshot();
  saveScreenshot(shot, '07_terms_screen.png', localDir, ARTIFACT_DIR);

  // 8. Doctor Clinical Dashboard via Screen Switcher
  console.log('Capturing Screen 8: Doctor Clinical Dashboard...');
  await page.click('button[title*="Screens"]', { force: true });
  await page.waitForTimeout(400);
  await page.click('button:has-text("Doctor Clinical Dashboard")', { force: true });
  await page.waitForTimeout(1000);
  shot = await page.screenshot();
  saveScreenshot(shot, '08_doctor_dashboard.png', localDir, ARTIFACT_DIR);

  // 9. Full Desktop View with Device Emulator Frame Active
  console.log('Capturing Screen 9: Desktop Workspace with Device Emulator Frame...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1366, height: 920 },
  });
  await desktopContext.addInitScript(() => {
    try {
      localStorage.setItem('prime_telecare_terms_accepted', 'true');
      localStorage.setItem('prime_telecare_emulator_active', 'true');
    } catch (e) {}
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`http://localhost:${PORT}`);
  await desktopPage.waitForTimeout(1200);
  shot = await desktopPage.screenshot();
  saveScreenshot(shot, '09_device_emulator_frame.png', localDir, ARTIFACT_DIR);

  console.log('All 9 screens successfully captured and saved to artifacts!');
  await browser.close();
  server.close();
}

run().catch((err) => {
  console.error('Error in capture script:', err);
  process.exit(1);
});
