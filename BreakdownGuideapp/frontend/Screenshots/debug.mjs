import { chromium } from 'playwright';
const BASE_URL = 'https://breakdowns.gobarry.co.uk';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  // Intercept bug report to capture the actual error
  page.on('request', req => {
    if (req.url().includes('bug-reports')) {
      const body = req.postData();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          console.log('=== ERROR REPORT ===');
          console.log('Title:', parsed.title);
          console.log('Error:', parsed.errorMessage);
          console.log('Stack:', (parsed.errorStack || '').substring(0, 800));
          console.log('Component:', (parsed.additionalData?.componentStack || '').substring(0, 800));
          console.log('=== END REPORT ===');
        } catch(e) {
          console.log('Bug report body:', body.substring(0, 500));
        }
      }
    }
  });

  // Capture HTTP errors (skip the expected 401 on session check)
  page.on('response', res => {
    const url = res.url();
    if (res.status() >= 400 && !url.includes('auth/me') && !url.includes('bug-reports')) {
      console.log('[HTTP ' + res.status() + ']', url.substring(0, 150));
    }
  });

  console.log('Loading login page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Clicking Try Demo...');
  await page.click('button:has-text("Try Demo")');
  await page.waitForTimeout(8000);

  const hasError = await page.locator('text=Oops').isVisible().catch(() => false);
  console.log('Has error boundary:', hasError);

  await browser.close();
  console.log('Done');
}

run().catch(e => { console.error(e.message); process.exit(1); });
