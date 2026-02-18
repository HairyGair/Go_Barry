import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/Screenshots';
const BASE_URL = 'https://breakdowns.gobarry.co.uk';
const API_URL = 'https://api.breakdowns.gobarry.co.uk';

/**
 * Force-remove any modals/overlays from the DOM
 */
async function nukeOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.end-of-shift-modal, .shift-summary-modal, .handover-reminder-toast, .session-timeout-warning, .modal-overlay, .modal-backdrop').forEach(el => el.remove());
    document.querySelectorAll('[class*="shift-check"], [class*="ShiftCheck"]').forEach(el => el.remove());
  });
  await page.waitForTimeout(200);
}

/**
 * Set the demo duty to end far in the future
 */
async function setFutureDuty(page) {
  await page.evaluate(() => {
    const futureDuty = {
      code: '200',
      name: 'Day Shift',
      startTime: '07:30',
      endTime: '23:59',
      shiftStart: new Date().toISOString(),
      shiftEnd: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    };
    sessionStorage.setItem('currentDuty', JSON.stringify(futureDuty));
  });
}

/**
 * Clean up page after navigation - nuke overlays, set duty, hide banner
 */
async function cleanPage(page) {
  await setFutureDuty(page);
  await page.waitForTimeout(500);
  await nukeOverlays(page);
  await page.waitForTimeout(300);
  await nukeOverlays(page);

  // Hide demo banner
  const hideBtn = page.locator('.demo-mode-hide-btn');
  if (await hideBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await hideBtn.click({ force: true });
    await page.waitForTimeout(200);
  }
  await nukeOverlays(page);
}

/**
 * Navigate via menu link click (client-side, preserves session)
 */
async function navigateViaMenu(page, path) {
  await nukeOverlays(page);
  const menuTrigger = page.locator('.user-menu-trigger');
  if (await menuTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await menuTrigger.click({ force: true });
    await page.waitForTimeout(400);

    const navLink = page.locator(`.user-menu-dropdown a[href="${path}"]`);
    if (await navLink.count() > 0) {
      // Use JS click to bypass viewport limitations for links at bottom of dropdown
      await navLink.evaluate(el => el.click());
      await page.waitForTimeout(3000);
      await cleanPage(page);
      return true;
    }

    // Close menu if link not found
    await page.keyboard.press('Escape');
  }
  return false;
}

async function run() {
  console.log('Starting screenshot capture...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    userAgent: 'GoBarry-Screenshot-Tool/1.0 (Playwright)'
  });
  const page = await context.newPage();

  // Intercept the demo-login response to capture the auth cookie
  let authToken = null;
  page.on('response', async (res) => {
    if (res.url().includes('demo-login') && res.status() === 200) {
      const headers = res.headers();
      const setCookies = headers['set-cookie'] || '';
      const match = setCookies.match(/auth_token=([^;]+)/);
      if (match) {
        authToken = match[1];
        console.log('   Captured auth token from response');
      }
    }
  });

  // Track errors
  page.on('request', req => {
    if (req.url().includes('bug-reports')) {
      const body = req.postData();
      if (body) {
        try {
          const msg = JSON.parse(body).errorMessage;
          console.log('  [ERROR]', msg.substring(0, 150));
        } catch(e) {}
      }
    }
  });

  // ═══════════════════════════════════════════════
  // 1. LOGIN PAGE
  // ═══════════════════════════════════════════════
  console.log('1. Capturing login page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-login-page.png` });
  console.log('   Saved 01-login-page.png');

  // ═══════════════════════════════════════════════
  // 2. DEMO LOGIN
  // ═══════════════════════════════════════════════
  console.log('\n2. Clicking Try Demo...');
  await page.click('button:has-text("Try Demo")');
  await page.waitForTimeout(6000);

  // If we captured the auth token, manually set it as a cookie for persistence
  if (authToken) {
    await context.addCookies([{
      name: 'auth_token',
      value: authToken,
      domain: '.gobarry.co.uk',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'None'
    }]);
    console.log('   Auth cookie set manually for cross-page persistence');
  } else {
    console.log('   WARNING: Could not capture auth token - full page reloads may lose session');
  }

  // Set future duty + clear overlays
  await cleanPage(page);
  console.log('   Clean state ready');

  // ═══════════════════════════════════════════════
  // 3. HOMEPAGE
  // ═══════════════════════════════════════════════
  console.log('\n3. Capturing homepage...');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-homepage.png` });
  console.log('   Saved 03-homepage.png');

  // ═══════════════════════════════════════════════
  // 4. OPERATIONS DASHBOARD (via menu)
  // ═══════════════════════════════════════════════
  console.log('\n4. Capturing Operations Dashboard...');
  await navigateViaMenu(page, '/dashboards/sdc');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-operations-dashboard.png` });
  console.log('   Saved 04-operations-dashboard.png');

  // ═══════════════════════════════════════════════
  // 5. ROUTE STATUS (via menu)
  // ═══════════════════════════════════════════════
  console.log('\n5. Capturing Route Status...');
  await navigateViaMenu(page, '/dashboards/gtfs/routes');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-route-status.png` });
  console.log('   Saved 07-route-status.png');

  // ═══════════════════════════════════════════════
  // 6. FLEET INTELLIGENCE (via menu)
  // ═══════════════════════════════════════════════
  console.log('\n6. Capturing Fleet Intelligence...');
  await navigateViaMenu(page, '/fleet-intelligence');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-fleet-intelligence.png` });
  console.log('   Saved 08-fleet-intelligence.png');

  // ═══════════════════════════════════════════════
  // 7. TIMETABLE VIEWER (via menu)
  // ═══════════════════════════════════════════════
  console.log('\n7. Capturing Timetable Viewer...');
  await navigateViaMenu(page, '/dashboards/gtfs/timetable');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-timetable-viewer.png` });
  console.log('   Saved 09-timetable-viewer.png');

  // ═══════════════════════════════════════════════
  // 8. STOP FINDER (via menu)
  // ═══════════════════════════════════════════════
  console.log('\n8. Capturing Stop Finder...');
  await navigateViaMenu(page, '/dashboards/gtfs/stops');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/10-stop-finder.png` });
  console.log('   Saved 10-stop-finder.png');

  // ═══════════════════════════════════════════════
  // 9. ENGINEERING DASHBOARD (via menu)
  // ═══════════════════════════════════════════════
  console.log('\n9. Capturing Engineering Dashboard...');
  await navigateViaMenu(page, '/dashboards/engineering');
  // Dismiss the shift check-in modal if it appears
  await page.waitForTimeout(1000);
  await nukeOverlays(page);
  // Also try to dismiss any specific engineering modals
  const skipBtn = page.locator('button:has-text("Skip for now")').first();
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await nukeOverlays(page);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-engineering-dashboard.png` });
  console.log('   Saved 05-engineering-dashboard.png');

  // ═══════════════════════════════════════════════
  // 10. REPORT BREAKDOWN WIZARD (via menu)
  // ═══════════════════════════════════════════════
  console.log('\n10. Capturing Report Breakdown Wizard...');
  // Navigate home first
  await navigateViaMenu(page, '/');
  await page.waitForTimeout(500);
  await nukeOverlays(page);

  const menuTrigger = page.locator('.user-menu-trigger');
  if (await menuTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await menuTrigger.click({ force: true });
    await page.waitForTimeout(500);
    const reportBtn = page.locator('.quick-action-btn').first();
    if (await reportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reportBtn.click({ force: true });
      await page.waitForTimeout(3000);
      await nukeOverlays(page);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/11-report-breakdown.png` });
      console.log('   Saved 11-report-breakdown.png');
    }
  }

  // ═══════════════════════════════════════════════
  // 11. DISPLAY / CONTROL ROOM (via full page load - LAST because it hides nav)
  // ═══════════════════════════════════════════════
  console.log('\n11. Capturing Display (Control Room)...');
  // Use page.goto since the auth cookie should now be set
  await page.goto(`${BASE_URL}/dashboards/control-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-display-control-room.png` });
  console.log('   Saved 06-display-control-room.png');

  await browser.close();
  console.log('\nDone! All screenshots saved to:', SCREENSHOTS_DIR);
}

run().catch(err => {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
