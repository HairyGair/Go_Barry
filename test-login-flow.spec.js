import { test, expect } from '@playwright/test';

test('debug post-login black screen', async ({ page }) => {
  console.log('\n🔐 Testing full login flow...\n');

  const consoleMessages = [];
  const errors = [];
  const apiCalls = [];

  // Capture everything
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push({ message: error.message, stack: error.stack });
    console.log(`💥 ERROR: ${error.message}`);
    console.log(error.stack);
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      apiCalls.push({ url: response.url(), status });

      const icon = status >= 400 ? '❌' : '✅';
      console.log(`${icon} API [${status}] ${response.url()}`);

      if (status >= 400) {
        try {
          const body = await response.text();
          console.log(`   Body: ${body.substring(0, 200)}`);
        } catch (e) {}
      }
    }
  });

  // Step 1: Navigate to site
  console.log('📡 Step 1: Loading site...');
  await page.goto('https://breakdowns.gobarry.co.uk');
  await page.waitForTimeout(2000);

  // Screenshot 1: Login page
  await page.screenshot({ path: '/Users/anthony/Go BARRY App/flow-1-login.png' });
  console.log('📸 Login page screenshot saved');

  // Step 2: Fill login form (use a test account or skip if you don't have one)
  console.log('\n📝 Step 2: Attempting login...');

  // Check if login form is present
  const emailInput = await page.locator('input[type="email"], input[placeholder*="email" i]').first();
  const passwordInput = await page.locator('input[type="password"]').first();
  const loginButton = await page.locator('button:has-text("Sign In")').first();

  const hasLoginForm = await emailInput.count() > 0;
  console.log('Login form present:', hasLoginForm);

  if (hasLoginForm) {
    // Try to login with test credentials
    // NOTE: Replace with real credentials or skip this test
    console.log('Filling form with test credentials...');
    await emailInput.fill('jamie.rao@goahead.com'); // Replace with test account
    await passwordInput.fill('TestPassword123'); // Replace with test password

    console.log('Clicking login button...');
    await loginButton.click();

    // Wait for navigation/response
    console.log('Waiting for login response...');
    await page.waitForTimeout(3000);

    // Screenshot 2: After login attempt
    await page.screenshot({ path: '/Users/anthony/Go BARRY App/flow-2-after-login.png' });
    console.log('📸 After-login screenshot saved');

    // Check current URL
    const currentURL = page.url();
    console.log('Current URL:', currentURL);

    // Check DOM state
    const domState = await page.evaluate(() => {
      return {
        title: document.title,
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        totalElements: document.querySelectorAll('*').length,
        visibleText: document.body.innerText.substring(0, 300),
        rootHTML: document.getElementById('root')?.innerHTML.substring(0, 500) || 'No root element'
      };
    });

    console.log('\n📊 POST-LOGIN DOM STATE:');
    console.log('  Title:', domState.title);
    console.log('  Body BG:', domState.bodyBg);
    console.log('  Total elements:', domState.totalElements);
    console.log('  Visible text:', domState.visibleText);
    console.log('  Root HTML preview:', domState.rootHTML.substring(0, 200));

    // Wait a bit more to see if anything renders
    console.log('\nWaiting 5 more seconds to see if content appears...');
    await page.waitForTimeout(5000);

    // Screenshot 3: After waiting
    await page.screenshot({ path: '/Users/anthony/Go BARRY App/flow-3-after-wait.png' });
    console.log('📸 After-wait screenshot saved');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n❌ JavaScript Errors:', errors.length);
  errors.forEach(err => console.log('  -', err.message));

  console.log('\n⚠️  Console Errors/Warnings:');
  consoleMessages
    .filter(m => m.type === 'error' || m.type === 'warning')
    .slice(0, 10)
    .forEach(m => console.log(`  [${m.type}] ${m.text}`));

  console.log('\n🌐 Failed API Calls:');
  apiCalls
    .filter(c => c.status >= 400)
    .forEach(c => console.log(`  [${c.status}] ${c.url}`));

  console.log('\n✅ Successful API Calls:');
  apiCalls
    .filter(c => c.status < 400)
    .forEach(c => console.log(`  [${c.status}] ${c.url}`));
});
