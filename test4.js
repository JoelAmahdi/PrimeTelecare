import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // Expose a function to set the screen
  await page.evaluate(() => {
    // If we want to force the screen, we can just use localStorage if the app saves it, 
    // or we can dispatch a custom event if the app listens to one,
    // or we can just click the login buttons.
  });
  
  const html = await page.innerHTML('body');
  console.log('Got HTML body');
  await browser.close();
})();
