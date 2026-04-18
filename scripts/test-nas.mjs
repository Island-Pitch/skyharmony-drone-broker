import { chromium } from 'playwright';

const url = 'http://192.168.4.235:50080';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const logs = [];

  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.message));
  page.on('requestfailed', req => errors.push(`FAILED: ${req.url()} ${req.failure()?.errorText}`));

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`Status: ${response.status()}`);
    console.log(`Title: ${await page.title()}`);

    await page.waitForTimeout(3000);

    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML.substring(0, 1000) || 'NO ROOT');
    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    console.log(`\nBody background: ${bgColor}`);
    console.log(`\nVisible text (first 500 chars):\n${bodyText || '(empty)'}`);
    console.log(`\nRoot HTML (first 1000 chars):\n${rootHTML}`);

    await page.screenshot({ path: '/tmp/skyharmony-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved to /tmp/skyharmony-screenshot.png');
  } catch (e) {
    console.error('Navigation error:', e.message);
  }

  if (logs.length) {
    console.log('\n--- Console logs ---');
    logs.forEach(l => console.log(l));
  }
  if (errors.length) {
    console.log('\n--- Errors ---');
    errors.forEach(e => console.log(e));
  }

  await browser.close();
})();
