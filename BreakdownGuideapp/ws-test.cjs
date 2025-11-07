const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting WebSocket URL verification test...\n');

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

  // Capture console messages
  page.on('console', msg => {
    if (msg.text().includes('WebSocket')) {
      console.log('📝 Browser console:', msg.text());
    }
  });

  console.log('🌐 Navigating to https://breakdowns.gobarry.co.uk/...\n');
  await page.goto('https://breakdowns.gobarry.co.uk/', { waitUntil: 'networkidle' });

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
    }
    if (wrongUrls.length > 0) {
      console.log('❌ Wrong URLs (breakdowns.gobarry.co.uk):', wrongUrls.length);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  await page.screenshot({ path: 'playwright-test-screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved as: playwright-test-screenshot.png');

  await browser.close();
  console.log('\n✅ Test complete!');
})();
