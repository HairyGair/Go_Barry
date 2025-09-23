import { test, expect } from '@playwright/test';

test('Debug homepage polling behavior', async ({ page }) => {
  // Intercept all API calls to track frequency
  const apiCalls = [];

  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        url: request.url(),
        timestamp: new Date().toISOString(),
        method: request.method()
      });
      console.log(`API Call: ${request.method()} ${request.url()} at ${new Date().toISOString()}`);
    }
  });

  // Navigate to homepage
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3001');

  // Wait for initial load
  await page.waitForTimeout(5000);
  console.log(`Initial API calls made: ${apiCalls.length}`);

  // Monitor for 65 seconds to catch multiple polling cycles
  console.log('Monitoring API calls for 65 seconds...');
  const startTime = Date.now();
  let lastCallCount = apiCalls.length;

  while (Date.now() - startTime < 65000) {
    await page.waitForTimeout(5000);
    const currentCallCount = apiCalls.length;
    const newCalls = currentCallCount - lastCallCount;

    if (newCalls > 0) {
      console.log(`New calls in last 5 seconds: ${newCalls} (Total: ${currentCallCount})`);
      lastCallCount = currentCallCount;
    }
  }

  // Analyze call patterns
  console.log('\n=== API Call Analysis ===');
  console.log(`Total API calls: ${apiCalls.length}`);

  // Group by endpoint
  const endpointCounts = {};
  apiCalls.forEach(call => {
    const endpoint = call.url.split('/api/')[1].split('?')[0];
    endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
  });

  console.log('\nCalls by endpoint:');
  Object.entries(endpointCounts).forEach(([endpoint, count]) => {
    console.log(`  ${endpoint}: ${count} calls`);
  });

  // Check timing patterns
  if (apiCalls.length > 10) {
    console.log('\nTiming analysis:');
    const timings = [];
    for (let i = 1; i < Math.min(apiCalls.length, 20); i++) {
      const prevTime = new Date(apiCalls[i-1].timestamp);
      const currTime = new Date(apiCalls[i].timestamp);
      const diff = currTime - prevTime;
      timings.push(diff);
    }

    const avgInterval = timings.reduce((a, b) => a + b, 0) / timings.length;
    console.log(`  Average time between calls: ${Math.round(avgInterval)}ms`);
    console.log(`  Min interval: ${Math.min(...timings)}ms`);
    console.log(`  Max interval: ${Math.max(...timings)}ms`);
  }

  // Take a screenshot for visual inspection
  await page.screenshot({ path: '/tmp/homepage-debug.png', fullPage: true });
  console.log('Screenshot saved to /tmp/homepage-debug.png');
});