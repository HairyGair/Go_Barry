import { test, expect } from '@playwright/test';

test('Debug activity feed data flow', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });

  // Navigate to debug page
  console.log('Navigating to debug page...');
  await page.goto('http://localhost:3001/debug-activity-feed.html');

  // Wait for the test to complete
  await page.waitForTimeout(5000);

  // Check if we got results
  const results = await page.locator('#results').textContent();
  console.log('Results content:', results.substring(0, 500));

  // Take screenshot for debugging
  await page.screenshot({ path: '/tmp/debug-activity-feed.png', fullPage: true });
  console.log('Screenshot saved to /tmp/debug-activity-feed.png');
});