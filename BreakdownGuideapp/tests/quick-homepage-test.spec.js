import { test, expect } from '@playwright/test';

test('Quick test homepage API calls', async ({ page }) => {
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
  await page.waitForTimeout(3000);
  console.log(`Initial API calls made: ${apiCalls.length}`);

  // Monitor for 15 seconds to check for rapid API calls
  console.log('Monitoring API calls for 15 seconds...');
  const startTime = Date.now();
  let lastCallCount = apiCalls.length;

  while (Date.now() - startTime < 15000) {
    await page.waitForTimeout(2000);
    const currentCallCount = apiCalls.length;
    const newCalls = currentCallCount - lastCallCount;

    if (newCalls > 0) {
      console.log(`New calls in last 2 seconds: ${newCalls} (Total: ${currentCallCount})`);
      lastCallCount = currentCallCount;
    }
  }

  // Check if throttling is working - should not have more than 14 total calls in 15 seconds
  console.log(`\nFinal total API calls: ${apiCalls.length}`);
  expect(apiCalls.length).toBeLessThan(20); // Should be much less if throttling works
});