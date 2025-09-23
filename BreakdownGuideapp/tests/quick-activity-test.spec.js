import { test, expect } from '@playwright/test';

test('Quick activity feed test', async ({ page }) => {
  const consoleLogs = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log(`BROWSER: ${text}`);
  });

  // Navigate to homepage
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3001');

  // Wait for initial load
  await page.waitForTimeout(3000);

  // Look for activity feed logs that show improvement
  const keepingCachedLogs = consoleLogs.filter(log =>
    log.includes('🔄 LiveActivityFeed: Keeping cached activities instead of empty')
  );

  console.log('Found "keeping cached" logs:', keepingCachedLogs.length);

  // Check if we can find the activity feed element
  const activityFeedExists = await page.locator('.live-activity-feed').count() > 0;
  console.log('Activity feed element exists:', activityFeedExists);

  if (activityFeedExists) {
    const activityItems = await page.locator('.activity-item, .live-activity-item').count();
    console.log('Activity items found:', activityItems);
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/quick-activity-test.png', fullPage: true });
  console.log('Screenshot saved to /tmp/quick-activity-test.png');
});