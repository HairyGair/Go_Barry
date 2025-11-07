const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting AUTHENTICATED WebSocket URL verification test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const wsUrls = [];

  // Capture all WebSocket connections
  page.on('websocket', ws => {
    const url = ws.url();
    console.log('🔌 WebSocket connection detected:', url);
    wsUrls.push(url);
  });

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('WebSocket')) {
      console.log(`📝 [${msg.type()}]`, msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });

  console.log('🌐 Navigating to https://breakdowns.gobarry.co.uk/...\n');
  await page.goto('https://breakdowns.gobarry.co.uk/', { waitUntil: 'networkidle' });

  console.log('📝 Filling in login form...');

  // Fill in email
  await page.fill('input[type="email"]', 'anthony.gair@gonortheast.co.uk');

  // Fill in password
  await page.fill('input[type="password"]', 'GoNorthEast2025!');

  // Click sign in button
  console.log('🔐 Clicking Sign In...\n');
  await page.click('button:has-text("Sign In")');

  // Wait for navigation after login
  console.log('⏳ Waiting for post-login page load...\n');
  await page.waitForTimeout(5000);

  // Check if we're at duty selection or dashboard
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);

  // Take screenshot of current state
  await page.screenshot({ path: 'after-login.png', fullPage: true });
  console.log('📸 Screenshot saved as: after-login.png\n');

  // If duty selection modal appears, click a duty option
  const dutyModal = await page.locator('text=Select Your Duty Shift').count();
  if (dutyModal > 0) {
    console.log('🎯 Duty selection modal detected, selecting Duty 200...');
    await page.click('button:has-text("Duty 200")');
    await page.waitForTimeout(2000);
  }

  console.log('⏳ Waiting 10 seconds for WebSocket connections to establish...\n');
  await page.waitForTimeout(10000);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Total WebSocket connections attempted: ${wsUrls.length}\n`);

  if (wsUrls.length === 0) {
    console.log('⚠️  NO WebSocket connections detected!\n');
  } else {
    console.log('WebSocket URLs detected:');
    wsUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });
    console.log('');

    // Check for correct vs wrong URLs
    const correctUrls = wsUrls.filter(url => url.includes('api.breakdowns.gobarry.co.uk'));
    const wrongUrls = wsUrls.filter(url => url.includes('breakdowns.gobarry.co.uk') && !url.includes('api.'));

    if (correctUrls.length > 0) {
      console.log('✅ Correct URLs (api.breakdowns.gobarry.co.uk):', correctUrls.length);
      correctUrls.forEach(url => console.log('   ', url));
    }
    if (wrongUrls.length > 0) {
      console.log('❌ Wrong URLs (breakdowns.gobarry.co.uk):', wrongUrls.length);
      wrongUrls.forEach(url => console.log('   ', url));
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  await page.screenshot({ path: 'final-state.png', fullPage: true });
  console.log('📸 Final screenshot saved as: final-state.png');

  // Check localStorage for debug
  const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
  console.log('\n🔍 localStorage contents:');
  console.log(localStorage);

  console.log('\n⏸️  Pausing for manual inspection (press Ctrl+C to close)...');
  await page.waitForTimeout(60000);

  await browser.close();
  console.log('\n✅ Test complete!');
})();
