import { test, expect } from '@playwright/test';

test('test login with fixed API URL', async ({ page }) => {
  console.log('\n🌐 Testing https://breakdowns.gobarry.co.uk\n');

  const consoleMessages = [];
  const apiCalls = [];

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Capture network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('gobarry.co.uk')) {
      apiCalls.push({
        url,
        method: request.method()
      });
    }
  });

  // Navigate to the site
  await page.goto('https://breakdowns.gobarry.co.uk', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit for any async operations
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({
    path: '/Users/anthony/Go BARRY App/login-test-fixed.png',
    fullPage: true
  });

  console.log('\n📊 RESULTS:\n');
  console.log('='.repeat(60));

  // Check for backend URL in console
  const backendUrlLog = consoleMessages.find(msg =>
    msg.text.includes('Backend URL') || msg.text.includes('api.breakdowns')
  );

  console.log('\n🔧 BACKEND CONFIGURATION:');
  if (backendUrlLog) {
    console.log(`  ✅ ${backendUrlLog.text}`);
  } else {
    console.log('  ⚠️  Backend URL not logged (check if API_URL is set)');
  }

  // Check API calls made
  const backendApiCalls = apiCalls.filter(call =>
    call.url.includes('api.breakdowns.gobarry.co.uk')
  );

  console.log('\n🌐 API CALLS MADE:');
  if (backendApiCalls.length > 0) {
    console.log(`  ✅ ${backendApiCalls.length} calls to api.breakdowns.gobarry.co.uk`);
    backendApiCalls.slice(0, 5).forEach(call => {
      console.log(`     ${call.method} ${call.url}`);
    });
  } else {
    console.log('  ⚠️  No API calls to api.breakdowns.gobarry.co.uk detected');
  }

  // Check for localhost calls (should be NONE)
  const localhostCalls = apiCalls.filter(call =>
    call.url.includes('localhost:3001')
  );

  if (localhostCalls.length > 0) {
    console.log('\n❌ PROBLEM - Still calling localhost:');
    localhostCalls.forEach(call => {
      console.log(`   ${call.method} ${call.url}`);
    });
  } else {
    console.log('\n✅ NO LOCALHOST CALLS - Correct!');
  }

  // Check console errors
  const errors = consoleMessages.filter(msg => msg.type === 'error');
  console.log('\n🔴 CONSOLE ERRORS:');
  if (errors.length > 0) {
    errors.slice(0, 5).forEach(err => {
      console.log(`  - ${err.text}`);
    });
  } else {
    console.log('  ✅ No console errors');
  }

  // Check if login form is visible
  const hasLoginForm = await page.locator('input[type="password"], input[type="text"], button:has-text("Login")').count() > 0;
  console.log(`\n📝 LOGIN FORM: ${hasLoginForm ? '✅ Visible' : '❌ Not found'}`);

  console.log('\n' + '='.repeat(60));
  console.log('\n📸 Screenshot saved: login-test-fixed.png\n');
});
