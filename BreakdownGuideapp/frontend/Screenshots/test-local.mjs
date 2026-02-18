import { chromium } from 'playwright';

// Test against local dev server to verify fix
// The dev server proxies /api to localhost:3001 (backend)
// If backend isn't running locally, demo login will fail with network error
// In that case, we test against production after deployment
const BASE_URL = process.argv[2] || 'https://breakdowns.gobarry.co.uk';

async function run() {
  console.log('Testing against:', BASE_URL);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  // Intercept bug report to capture errors
  let errorFound = null;
  page.on('request', req => {
    if (req.url().includes('bug-reports')) {
      const body = req.postData();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          errorFound = parsed.errorMessage;
          console.log('ERROR CAUGHT:', parsed.errorMessage);
        } catch(e) {}
      }
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Clicking Try Demo...');
  const demoBtn = page.locator('button:has-text("Try Demo")');
  if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await demoBtn.click();
  } else {
    console.log('Try Demo button not found!');
    await browser.close();
    return;
  }

  await page.waitForTimeout(6000);

  const hasError = await page.locator('text=Oops').isVisible().catch(() => false);
  if (hasError) {
    console.log('FAIL: ErrorBoundary triggered');
    if (errorFound) console.log('Error:', errorFound);
  } else {
    console.log('SUCCESS: No error boundary - app loaded correctly!');
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
    console.log('Page content:', bodyText);
  }

  await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
