import { test, expect } from '@playwright/test';

test('test actual login attempt', async ({ page }) => {
  console.log('\n🔐 Testing actual login...\n');

  const apiCalls = [];
  const responses = [];

  // Capture network activity
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      apiCalls.push({
        url,
        method: request.method(),
        headers: request.headers()
      });
      console.log(`📤 API Request: ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const status = response.status();
        let body = '';
        try {
          body = await response.text();
        } catch (e) {
          body = '[unable to read]';
        }
        responses.push({ url, status, body });
        console.log(`📥 API Response: ${status} ${url}`);
        if (body && body.length < 500) {
          console.log(`   Body: ${body.substring(0, 200)}`);
        }
      } catch (e) {
        console.log(`   Error reading response: ${e.message}`);
      }
    }
  });

  // Navigate to the site
  await page.goto('https://breakdowns.gobarry.co.uk');
  await page.waitForTimeout(2000);

  // Fill in login form with test credentials
  console.log('\n📝 Filling login form...');

  await page.fill('input[type="email"], input[placeholder*="email" i]', 'test@goahead.com');
  await page.fill('input[type="password"]', 'test123');

  console.log('✅ Form filled');

  // Click sign in button
  console.log('\n🖱️  Clicking Sign In...\n');
  await page.click('button:has-text("Sign In")');

  // Wait for API response
  await page.waitForTimeout(5000);

  // Take screenshot of result
  await page.screenshot({
    path: '/Users/anthony/Go BARRY App/login-attempt-result.png'
  });

  console.log('\n📊 SUMMARY:\n');
  console.log('='.repeat(60));
  console.log(`\n📤 Total API calls made: ${apiCalls.length}`);
  console.log(`📥 Total API responses: ${responses.length}`);

  if (apiCalls.length > 0) {
    console.log('\n✅ API CONNECTIVITY WORKING!');
    console.log('\nAPI Calls:');
    apiCalls.forEach((call, i) => {
      console.log(`  ${i + 1}. ${call.method} ${call.url}`);
    });
  } else {
    console.log('\n❌ NO API CALLS DETECTED');
  }

  if (responses.length > 0) {
    console.log('\nAPI Responses:');
    responses.forEach((resp, i) => {
      console.log(`  ${i + 1}. Status ${resp.status}: ${resp.url}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📸 Screenshot: login-attempt-result.png\n');
});
