const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const PORT = 3463;
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
      console.log(`Live feature preview server running at http://localhost:${PORT}`);
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

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const iPhone = devices['iPhone 14 Pro'];
  const context = await browser.newContext({
    ...iPhone,
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
  });

  await context.addInitScript(() => {
    try {
      localStorage.setItem('prime_telecare_terms_accepted', 'true');
      localStorage.setItem('prime_telecare_emulator_active', 'false');
      sessionStorage.setItem('prime_telecare_health_records_unlocked', 'true');
    } catch (e) {}
  });

  const page = await context.newPage();

  console.log('Navigating to Active Chat Screen...');
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(600);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(600);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(800);

  // Jump to Active Chat Consultation
  await page.click('button[title*="Screens"]', { force: true });
  await page.waitForTimeout(300);
  await page.click('button:has-text("Active Chat Consultation")', { force: true });
  await page.waitForTimeout(800);

  // Enter session
  const enterChatBtn = await page.$('button:has-text("Enter Consultation"), button:has-text("Join Consultation Room")');
  if (enterChatBtn) {
    await enterChatBtn.click();
    await page.waitForTimeout(600);
  }

  let chatShot = await page.screenshot();
  saveScreenshot(chatShot, 'live_active_chat_with_calls.png', localDir, ARTIFACT_DIR);
  console.log('Saved live_active_chat_with_calls.png');

  await browser.close();
  server.close();
}

run().catch((err) => {
  console.error('Error during chat capture:', err);
  process.exit(1);
});
