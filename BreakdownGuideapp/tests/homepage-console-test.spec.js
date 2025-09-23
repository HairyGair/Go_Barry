import { test, expect } from '@playwright/test';

test('Check homepage console for activity feed debugging', async ({ page }) => {
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

  // Wait for data to load
  await page.waitForTimeout(5000);

  // Look for specific activity feed logs
  const activityFeedLogs = consoleLogs.filter(log =>
    log.includes('LiveActivityFeed') ||
    log.includes('fetchDashboardData') ||
    log.includes('updateDashboardData')
  );

  console.log('\n=== Activity Feed Related Logs ===');
  activityFeedLogs.forEach(log => console.log(log));

  // Check if we can find the activity feed element
  const activityFeedExists = await page.locator('.live-activity-feed').count() > 0;
  console.log('\nActivity feed element exists:', activityFeedExists);

  if (activityFeedExists) {
    const activityItems = await page.locator('.activity-item, .live-activity-item').count();
    console.log('Activity items found:', activityItems);

    // Get the text content of the activity feed
    const feedContent = await page.locator('.live-activity-feed').textContent();
    console.log('Activity feed content preview:', feedContent.substring(0, 200));
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/homepage-activity-feed.png', fullPage: true });
  console.log('Screenshot saved to /tmp/homepage-activity-feed.png');
});