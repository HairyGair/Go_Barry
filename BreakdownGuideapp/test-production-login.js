/**
 * Production Login Test with Playwright
 * Tests the actual deployed site at breakdowns.gobarry.co.uk
 */

import { chromium } from 'playwright';

async function testProductionLogin() {
  console.log('🔍 Starting Production Login Test...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser so we can see what happens
    slowMo: 1000 // Slow down actions to see them
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './test-videos/',
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    console.log(`[CONSOLE ${msg.type()}]`, text);
  });

  // Capture network errors
  const networkErrors = [];
  page.on('requestfailed', request => {
    const failure = request.failure();
    networkErrors.push({
      url: request.url(),
      error: failure ? failure.errorText : 'Unknown error'
    });
    console.log(`[NETWORK ERROR]`, request.url(), '->', failure?.errorText);
  });

  // Capture network requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('api') || request.url().includes('supabase')) {
      apiRequests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers()
      });
      console.log(`[API REQUEST]`, request.method(), request.url());
    }
  });

  // Capture API responses
  page.on('response', async response => {
    if (response.url().includes('api') || response.url().includes('supabase')) {
      const status = response.status();
      let body = null;
      try {
        body = await response.text();
      } catch (e) {
        body = '[Could not read response body]';
      }
      console.log(`[API RESPONSE]`, status, response.url());
      if (status >= 400) {
        console.log(`[ERROR RESPONSE BODY]`, body);
      }
    }
  });

  try {
    console.log('\n📍 Step 1: Navigating to production site...');
    await page.goto('https://breakdowns.gobarry.co.uk', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: './test-screenshots/01-initial-load.png', fullPage: true });
    console.log('✅ Page loaded');

    console.log('\n📍 Step 2: Checking page title and content...');
    const title = await page.title();
    console.log('Page title:', title);

    const bodyText = await page.textContent('body');
    console.log('Page contains login?', bodyText.includes('Login') || bodyText.includes('login'));
    console.log('Page contains error?', bodyText.includes('error') || bodyText.includes('Error'));

    await page.screenshot({ path: './test-screenshots/02-page-loaded.png', fullPage: true });

    console.log('\n📍 Step 3: Looking for login form...');

    // Try multiple possible selectors
    const possibleSelectors = [
      'input[type="email"]',
      'input[type="text"]',
      'input[name="email"]',
      'input[name="badgeNumber"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="badge" i]',
      'input[placeholder*="username" i]',
      '.login-form input',
      'form input[type="text"]'
    ];

    let emailInput = null;
    for (const selector of possibleSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) {
          console.log(`✅ Found login input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!emailInput) {
      console.error('❌ Could not find login input field!');
      await page.screenshot({ path: './test-screenshots/03-no-login-form.png', fullPage: true });

      // Check if we're on the login page or somewhere else
      const url = page.url();
      console.log('Current URL:', url);

      // Check for any forms
      const forms = await page.$$('form');
      console.log(`Found ${forms.length} forms on the page`);

      // Check for any inputs
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} input fields on the page`);

      // Get all input types
      for (let i = 0; i < inputs.length; i++) {
        const type = await inputs[i].getAttribute('type');
        const name = await inputs[i].getAttribute('name');
        const placeholder = await inputs[i].getAttribute('placeholder');
        console.log(`Input ${i + 1}:`, { type, name, placeholder });
      }

      // Get the HTML to see what's actually rendered
      const html = await page.content();
      console.log('\n--- PAGE HTML (first 2000 chars) ---');
      console.log(html.substring(0, 2000));
      console.log('--- END HTML ---\n');

      throw new Error('Login form not found');
    }

    console.log('\n📍 Step 4: Attempting to log in...');

    // Find password input
    const passwordInput = await page.$('input[type="password"]');

    if (passwordInput) {
      console.log('Found password input - using email/password login');

      // Fill in email and password
      await emailInput.fill('jamie.rao@goahead.com');
      await passwordInput.fill('Stafford45!');

      await page.screenshot({ path: './test-screenshots/04-credentials-entered.png', fullPage: true });

      // Find and click login button
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        console.log('Clicking login button...');
        await loginButton.click();
      } else {
        console.log('Submitting form...');
        await page.press('input[type="password"]', 'Enter');
      }
    } else {
      console.log('No password input found - trying badge number login');

      // Try badge number login
      await emailInput.fill('AG003');

      await page.screenshot({ path: './test-screenshots/04-badge-entered.png', fullPage: true });

      const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      if (loginButton) {
        console.log('Clicking login button...');
        await loginButton.click();
      } else {
        console.log('Pressing Enter...');
        await emailInput.press('Enter');
      }
    }

    console.log('\n📍 Step 5: Waiting for response...');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: './test-screenshots/05-after-login-attempt.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Check if we're still on login page
    if (currentUrl.includes('/login')) {
      console.log('⚠️  Still on login page - login may have failed');

      // Check for error messages
      const errorMessages = await page.$$('.error, .alert-danger, [role="alert"]');
      if (errorMessages.length > 0) {
        console.log('Found error messages:');
        for (const error of errorMessages) {
          const text = await error.textContent();
          console.log(' -', text);
        }
      }
    } else {
      console.log('✅ URL changed - login may have succeeded');
    }

    // Wait a bit more to see final state
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './test-screenshots/06-final-state.png', fullPage: true });

    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log('Console Messages:', consoleMessages.length);
    console.log('Network Errors:', networkErrors.length);
    console.log('API Requests:', apiRequests.length);

    if (networkErrors.length > 0) {
      console.log('\n❌ Network Errors:');
      networkErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.url}`);
        console.log(`     Error: ${err.error}`);
      });
    }

    if (consoleMessages.filter(m => m.type === 'error').length > 0) {
      console.log('\n❌ Console Errors:');
      consoleMessages
        .filter(m => m.type === 'error')
        .forEach((msg, i) => {
          console.log(`  ${i + 1}. ${msg.text}`);
        });
    }

    console.log('\n📸 Screenshots saved to ./test-screenshots/');
    console.log('🎥 Video saved to ./test-videos/');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    await page.screenshot({ path: './test-screenshots/ERROR.png', fullPage: true });
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await context.close();
    await browser.close();
  }
}

// Run the test
testProductionLogin().catch(console.error);
