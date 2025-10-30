import { test, expect } from '@playwright/test';
import fs from 'fs';

test('debug black screen issue', async ({ page }) => {
  console.log('\n🔍 Debugging breakdowns.gobarry.co.uk black screen\n');

  const consoleMessages = [];
  const errors = [];
  const networkRequests = [];

  // Capture console
  page.on('console', msg => {
    const entry = { type: msg.type(), text: msg.text() };
    consoleMessages.push(entry);
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    errors.push({ message: error.message, stack: error.stack });
    console.log(`💥 JS ERROR: ${error.message}`);
    console.log(error.stack);
  });

  // Capture network
  page.on('response', async response => {
    const status = response.status();
    const url = response.url();
    networkRequests.push({ url, status });

    if (status >= 400) {
      console.log(`❌ [${status}] ${url}`);
    }
  });

  // Navigate
  console.log('📡 Navigating to site...');
  await page.goto('https://breakdowns.gobarry.co.uk', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Screenshot immediately
  await page.screenshot({ path: '/Users/anthony/Go BARRY App/debug-immediate.png' });
  console.log('📸 Immediate screenshot saved');

  // Wait and screenshot again
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/anthony/Go BARRY App/debug-after-2s.png' });
  console.log('📸 2-second screenshot saved');

  // Check DOM
  const domInfo = await page.evaluate(() => {
    return {
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      bodyDisplay: window.getComputedStyle(document.body).display,
      rootExists: !!document.getElementById('root'),
      rootHTML: document.getElementById('root')?.innerHTML.substring(0, 500),
      totalElements: document.querySelectorAll('*').length,
      visibleText: document.body.innerText.substring(0, 200),
      title: document.title
    };
  });

  console.log('\n📊 DOM INFO:');
  console.log('  Body background:', domInfo.bodyBg);
  console.log('  Body display:', domInfo.bodyDisplay);
  console.log('  Root exists:', domInfo.rootExists);
  console.log('  Total elements:', domInfo.totalElements);
  console.log('  Page title:', domInfo.title);
  console.log('  Visible text:', domInfo.visibleText);

  console.log('\n❌ JavaScript Errors:', errors.length);
  errors.forEach((err, i) => {
    console.log(`\n  Error ${i + 1}:`);
    console.log('   ', err.message);
  });

  console.log('\n⚠️  Console Errors:');
  consoleMessages
    .filter(m => m.type === 'error')
    .forEach(m => console.log('   ', m.text));

  console.log('\n🌐 Failed Requests:');
  networkRequests
    .filter(r => r.status >= 400)
    .forEach(r => console.log(`    [${r.status}] ${r.url}`));

  // Save report
  const report = { consoleMessages, errors, networkRequests, domInfo };
  fs.writeFileSync(
    '/Users/anthony/Go BARRY App/debug-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n✅ Debug complete. Files saved.');
});
