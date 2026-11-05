const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const PORT = 3589;
const DIST_DIR = path.join(__dirname, 'dist');
const LOCAL_PREVIEW_DIR = path.join(__dirname, 'previews', 'responsive');
const ARTIFACT_PREVIEW_DIR = path.join('C:', 'Users', 'Acer Nitro 5', '.gemini', 'antigravity', 'brain', '4f55f8f6-387b-4cd1-b46f-2d36d881ad71', 'previews', 'responsive');

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

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Responsive preview server listening at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

function saveShot(buffer, filename) {
  const localPath = path.join(LOCAL_PREVIEW_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  if (fs.existsSync(ARTIFACT_PREVIEW_DIR)) {
    const artPath = path.join(ARTIFACT_PREVIEW_DIR, filename);
    fs.writeFileSync(artPath, buffer);
  }
  console.log(`Saved screenshot: ${filename} (${Math.round(buffer.length / 1024)} KB)`);
}

async function captureScreen(page, screenId, role, filename) {
  await page.evaluate(({ s, r }) => {
    localStorage.setItem('prime_telecare_screen', s);
    localStorage.setItem('prime_telecare_role', r);
    localStorage.setItem('prime_telecare_terms_accepted', 'true');
    localStorage.setItem('prime_telecare_emulator_active', 'false');
    sessionStorage.setItem('prime_telecare_health_records_unlocked', 'true');
    window.location.reload();
  }, { s: screenId, r: role });
  await page.waitForTimeout(1000);
  const shot = await page.screenshot({ fullPage: false });
  saveShot(shot, filename);
}

async function run() {
  if (!fs.existsSync(LOCAL_PREVIEW_DIR)) fs.mkdirSync(LOCAL_PREVIEW_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACT_PREVIEW_DIR)) fs.mkdirSync(ARTIFACT_PREVIEW_DIR, { recursive: true });

  const server = await startServer();
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    // ==========================================
    // 1. DESKTOP 1920x1080 Viewport
    // ==========================================
    console.log('\n--- Capturing 1920x1080 Full Desktop Previews ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`http://127.0.0.1:${PORT}`);
    await desktopPage.waitForTimeout(800);

    // Patient Dashboard
    await captureScreen(desktopPage, 'patient-home', 'patient', 'desktop_1920_patient_dashboard.png');

    // Doctor Dashboard
    await captureScreen(desktopPage, 'doctor-home', 'doctor', 'desktop_1920_doctor_dashboard.png');

    // Book Consultation
    await captureScreen(desktopPage, 'book-consultation', 'patient', 'desktop_1920_book_consultation.png');

    // Payment Screen
    await captureScreen(desktopPage, 'payment', 'patient', 'desktop_1920_payment_screen.png');

    // Doctor Discovery Roster
    await captureScreen(desktopPage, 'doctor-discovery', 'patient', 'desktop_1920_doctor_discovery.png');

    // Health Records
    await captureScreen(desktopPage, 'health-records', 'patient', 'desktop_1920_health_records.png');

    // Active Chat & Consultations Queue
    await captureScreen(desktopPage, 'active-chat', 'patient', 'desktop_1920_active_chat.png');

    // ==========================================
    // 2. LAPTOP 1440x900 Viewport
    // ==========================================
    console.log('\n--- Capturing 1440x900 Laptop Previews ---');
    const laptopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const laptopPage = await laptopContext.newPage();
    await laptopPage.goto(`http://127.0.0.1:${PORT}`);
    await laptopPage.waitForTimeout(800);

    await captureScreen(laptopPage, 'patient-home', 'patient', 'laptop_1440_patient_dashboard.png');
    await captureScreen(laptopPage, 'doctor-home', 'doctor', 'laptop_1440_doctor_dashboard.png');

    // ==========================================
    // 3. TABLET 1024x768 Viewport
    // ==========================================
    console.log('\n--- Capturing 1024x768 Tablet Previews ---');
    const tabletContext = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      deviceScaleFactor: 1,
    });
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(`http://127.0.0.1:${PORT}`);
    await tabletPage.waitForTimeout(800);

    await captureScreen(tabletPage, 'patient-home', 'patient', 'tablet_1024_patient_dashboard.png');
    await captureScreen(tabletPage, 'doctor-discovery', 'patient', 'tablet_1024_doctor_discovery.png');

    // ==========================================
    // 4. MOBILE 393x852 Viewport
    // ==========================================
    console.log('\n--- Capturing 393x852 Mobile Previews ---');
    const iPhone = devices['iPhone 14 Pro'];
    const mobileContext = await browser.newContext({
      ...iPhone,
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://127.0.0.1:${PORT}`);
    await mobilePage.waitForTimeout(800);

    await captureScreen(mobilePage, 'patient-home', 'patient', 'mobile_393_patient_dashboard.png');
    await captureScreen(mobilePage, 'book-consultation', 'patient', 'mobile_393_book_consultation.png');

    console.log('\n✓ All responsive previews captured successfully!');
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

run();
