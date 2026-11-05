import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Login
  await page.evaluate(() => {
    document.querySelector('button').click(); // whatever clicks through welcome screen
  });
  await page.waitForTimeout(1000);
  console.log('Done');
  await browser.close();
})();
