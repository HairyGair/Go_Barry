import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/Screenshots/audit';
const BASE_URL = 'https://breakdowns.gobarry.co.uk';

const EMAIL = 'anthony.gair@gonortheast.co.uk';
const PASSWORD = 'GoNorthEast2025!';

// Collect all issues found
const issues = [];
const consoleErrors = [];
const networkErrors = [];
const pageTimings = [];

function addIssue(page, severity, category, description) {
  issues.push({ page, severity, category, description });
}

async function nukeOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.end-of-shift-modal, .shift-summary-modal, .handover-reminder-toast, .session-timeout-warning, .modal-overlay, .modal-backdrop').forEach(el => el.remove());
    document.querySelectorAll('[class*="shift-check"], [class*="ShiftCheck"]').forEach(el => el.remove());
  });
  await page.waitForTimeout(200);
}

async function setFutureDuty(page) {
  await page.evaluate(() => {
    const futureDuty = {
      code: '200',
      name: 'Day Shift',
      startTime: '07:30',
      endTime: '23:59',
      shiftStart: new Date().toISOString(),
      shiftEnd: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      isDemo: false
    };
    sessionStorage.setItem('currentDuty', JSON.stringify(futureDuty));
  });
}

async function cleanPage(page) {
  await setFutureDuty(page);
  await page.waitForTimeout(500);
  await nukeOverlays(page);
  await page.waitForTimeout(300);
  await nukeOverlays(page);
}

async function navigateViaMenu(page, path) {
  await nukeOverlays(page);
  const menuTrigger = page.locator('.user-menu-trigger');
  if (await menuTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await menuTrigger.click({ force: true });
    await page.waitForTimeout(400);

    const navLink = page.locator(`.user-menu-dropdown a[href="${path}"]`);
    if (await navLink.count() > 0) {
      await navLink.evaluate(el => el.click());
      await page.waitForTimeout(3000);
      await cleanPage(page);
      return true;
    }
    await page.keyboard.press('Escape');
  }
  return false;
}

async function screenshotAndAnalyze(page, name, description) {
  const start = Date.now();
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: false });
  const loadTime = Date.now() - start;
  pageTimings.push({ name, description, screenshotTime: loadTime });

  // Check for error boundaries
  const hasError = await page.locator('text=Oops').isVisible().catch(() => false);
  if (hasError) {
    addIssue(name, 'CRITICAL', 'Error Boundary', 'React ErrorBoundary triggered on this page');
  }

  // Check for broken images
  const brokenImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src || img.alt || 'unknown');
  });
  if (brokenImages.length > 0) {
    addIssue(name, 'MEDIUM', 'Broken Images', `${brokenImages.length} broken image(s): ${brokenImages.join(', ')}`);
  }

  // Check for overflow / horizontal scroll
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (hasOverflow) {
    addIssue(name, 'LOW', 'Layout', 'Horizontal overflow detected - content wider than viewport');
  }

  // Check for elements with very small text (< 10px)
  const smallTextCount = await page.evaluate(() => {
    let count = 0;
    document.querySelectorAll('*').forEach(el => {
      const style = getComputedStyle(el);
      if (el.textContent?.trim() && parseFloat(style.fontSize) < 10 && el.offsetWidth > 0) {
        count++;
      }
    });
    return count;
  });
  if (smallTextCount > 5) {
    addIssue(name, 'LOW', 'Typography', `${smallTextCount} elements with font-size < 10px`);
  }

  // Check for empty state / no data indicators
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('No breakdowns') || bodyText.includes('No data') || bodyText.includes('No results')) {
    // Not an issue per se, just noting empty states
    addIssue(name, 'INFO', 'Empty State', 'Page showing empty/no-data state');
  }

  // Check z-index stacking issues (elements outside viewport but visible)
  const overlappingElements = await page.evaluate(() => {
    const problems = [];
    document.querySelectorAll('.modal, .dropdown, .tooltip, .popover, [class*="modal"], [class*="overlay"]').forEach(el => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        const rect = el.getBoundingClientRect();
        if (rect.top < -100 || rect.left < -100) {
          problems.push(el.className.substring(0, 50));
        }
      }
    });
    return problems;
  });
  if (overlappingElements.length > 0) {
    addIssue(name, 'LOW', 'Stacking', `Visible overlays detected: ${overlappingElements.join(', ')}`);
  }

  console.log(`   ✓ ${name}.png captured`);
}

async function run() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Go BARRY - Comprehensive App Audit');
  console.log('  Logging in as: ' + EMAIL);
  console.log('═══════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text().substring(0, 200);
      if (!text.includes('favicon') && !text.includes('ResizeObserver')) {
        consoleErrors.push(text);
      }
    }
  });

  // Track network errors (4xx/5xx)
  page.on('response', res => {
    const url = res.url();
    const status = res.status();
    if (status >= 400 && !url.includes('auth/me') && !url.includes('favicon') && !url.includes('bug-reports')) {
      networkErrors.push({ status, url: url.substring(0, 150) });
    }
  });

  // Track bug reports sent by the app
  page.on('request', req => {
    if (req.url().includes('bug-reports')) {
      const body = req.postData();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          addIssue('auto-report', 'CRITICAL', 'Auto Bug Report', parsed.errorMessage?.substring(0, 200) || 'Unknown error');
        } catch(e) {}
      }
    }
  });

  // ═══════════════════════════════════════
  // 1. LOGIN PAGE
  // ═══════════════════════════════════════
  console.log('1. Login Page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshotAndAnalyze(page, '01-login-page', 'Login page');

  // Check login form elements
  const hasEmailField = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
  const hasPasswordField = await page.locator('input[type="password"]').isVisible().catch(() => false);
  const hasDemoButton = await page.locator('button:has-text("Try Demo")').isVisible().catch(() => false);
  if (!hasEmailField) addIssue('01-login-page', 'HIGH', 'UX', 'Email field not visible');
  if (!hasPasswordField) addIssue('01-login-page', 'HIGH', 'UX', 'Password field not visible');
  console.log(`   Login form: email=${hasEmailField}, password=${hasPasswordField}, demo=${hasDemoButton}`);

  // ═══════════════════════════════════════
  // 2. LOGIN AS REAL USER
  // ═══════════════════════════════════════
  console.log('\n2. Logging in as Anthony Gair...');

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(EMAIL);
  await page.waitForTimeout(300);
  await passwordInput.fill(PASSWORD);
  await page.waitForTimeout(300);

  // Click login button
  const loginBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log In")').first();
  if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await loginBtn.click();
  }
  await page.waitForTimeout(5000);

  // Handle duty selection modal if it appears
  const dutyModal = page.locator('[class*="duty"], [class*="Duty"]').first();
  if (await dutyModal.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('   Duty selection modal appeared');
    await screenshotAndAnalyze(page, '02-duty-selection', 'Duty selection modal');

    // Try to select Day Shift (200) or skip
    const dayShiftBtn = page.locator('button:has-text("200"), button:has-text("Day Shift"), button:has-text("Day")').first();
    if (await dayShiftBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dayShiftBtn.click();
      await page.waitForTimeout(1000);
    }

    // Click confirm/continue if needed
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Continue"), button:has-text("Start")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  await cleanPage(page);

  // Check login was successful
  const isLoggedIn = await page.evaluate(() => {
    return !document.querySelector('input[type="password"]');
  });
  console.log(`   Login successful: ${isLoggedIn}`);
  if (!isLoggedIn) {
    addIssue('02-login', 'CRITICAL', 'Auth', 'Login may have failed - password field still visible');
  }

  // ═══════════════════════════════════════
  // 3. HOMEPAGE
  // ═══════════════════════════════════════
  console.log('\n3. Homepage...');
  await page.waitForTimeout(1000);
  await screenshotAndAnalyze(page, '03-homepage', 'Main homepage after login');

  // Check for welcome message and key elements
  const hasWelcome = await page.locator('text=Welcome, text=Good, text=Hello').first().isVisible().catch(() => false);
  const hasUserMenu = await page.locator('.user-menu-trigger').isVisible().catch(() => false);
  console.log(`   Welcome visible: ${hasWelcome}, User menu: ${hasUserMenu}`);

  // ═══════════════════════════════════════
  // 4. USER MENU - CHECK ALL LINKS
  // ═══════════════════════════════════════
  console.log('\n4. User Menu...');
  await nukeOverlays(page);
  const menuTrigger = page.locator('.user-menu-trigger');
  if (await menuTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await menuTrigger.click({ force: true });
    await page.waitForTimeout(500);
    await screenshotAndAnalyze(page, '04-user-menu', 'User menu dropdown');

    // Collect all menu links
    const menuLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('.user-menu-dropdown a').forEach(a => {
        links.push({ text: a.textContent.trim(), href: a.getAttribute('href') });
      });
      return links;
    });
    console.log(`   Menu links found: ${menuLinks.length}`);
    menuLinks.forEach(link => console.log(`     → ${link.text} (${link.href})`));

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // ═══════════════════════════════════════
  // 5. OPERATIONS DASHBOARD
  // ═══════════════════════════════════════
  console.log('\n5. Operations Dashboard...');
  await navigateViaMenu(page, '/dashboards/sdc');
  await page.waitForTimeout(2000);
  await screenshotAndAnalyze(page, '05-operations-dashboard', 'Operations (SDC) dashboard');

  // Check for key dashboard elements
  const hasBreakdownCards = await page.locator('[class*="breakdown-card"], [class*="BreakdownCard"], [class*="sdc-card"]').first().isVisible().catch(() => false);
  const hasDepotStatus = await page.locator('text=Depot Status, text=depot').first().isVisible().catch(() => false);
  console.log(`   Breakdown cards: ${hasBreakdownCards}, Depot status: ${hasDepotStatus}`);

  // Scroll down to see more content
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(500);
  await screenshotAndAnalyze(page, '05b-operations-scrolled', 'Operations dashboard scrolled down');

  // ═══════════════════════════════════════
  // 6. ENGINEERING DASHBOARD
  // ═══════════════════════════════════════
  console.log('\n6. Engineering Dashboard...');
  await navigateViaMenu(page, '/dashboards/engineering');
  await page.waitForTimeout(2000);

  // Dismiss shift check-in modal
  const skipBtn = page.locator('button:has-text("Skip for now"), button:has-text("Skip"), button:has-text("Close")').first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await nukeOverlays(page);
  await screenshotAndAnalyze(page, '06-engineering-dashboard', 'Engineering dashboard');

  // ═══════════════════════════════════════
  // 7. ENGINEER MANAGEMENT
  // ═══════════════════════════════════════
  console.log('\n7. Engineer Management...');
  await navigateViaMenu(page, '/dashboards/engineering/manage');
  await page.waitForTimeout(2000);
  await nukeOverlays(page);
  await screenshotAndAnalyze(page, '07-engineer-management', 'Engineer management page');

  // ═══════════════════════════════════════
  // 8. ROUTE STATUS
  // ═══════════════════════════════════════
  console.log('\n8. Route Status...');
  await navigateViaMenu(page, '/dashboards/gtfs/routes');
  await page.waitForTimeout(2000);
  await screenshotAndAnalyze(page, '08-route-status', 'Route status dashboard');

  // Check if routes loaded
  const routeCount = await page.locator('[class*="route-card"], [class*="RouteCard"], [class*="rsc__"]').count();
  console.log(`   Route cards visible: ${routeCount}`);
  if (routeCount === 0) {
    addIssue('08-route-status', 'MEDIUM', 'Data', 'No route cards visible - possible data loading issue');
  }

  // ═══════════════════════════════════════
  // 9. FLEET INTELLIGENCE
  // ═══════════════════════════════════════
  console.log('\n9. Fleet Intelligence...');
  await navigateViaMenu(page, '/fleet-intelligence');
  await page.waitForTimeout(2000);
  await screenshotAndAnalyze(page, '09-fleet-intelligence', 'Fleet defect intelligence');

  // ═══════════════════════════════════════
  // 10. TIMETABLE VIEWER
  // ═══════════════════════════════════════
  console.log('\n10. Timetable Viewer...');
  await navigateViaMenu(page, '/dashboards/gtfs/timetable');
  await page.waitForTimeout(2000);
  await screenshotAndAnalyze(page, '10-timetable-viewer', 'Timetable viewer');

  // ═══════════════════════════════════════
  // 11. STOP FINDER
  // ═══════════════════════════════════════
  console.log('\n11. Stop Finder...');
  await navigateViaMenu(page, '/dashboards/gtfs/stops');
  await page.waitForTimeout(2000);
  await screenshotAndAnalyze(page, '11-stop-finder', 'Stop finder');

  // ═══════════════════════════════════════
  // 12. REPORT BREAKDOWN WIZARD
  // ═══════════════════════════════════════
  console.log('\n12. Report Breakdown Wizard...');
  await navigateViaMenu(page, '/');
  await page.waitForTimeout(500);
  await nukeOverlays(page);

  const menuTrigger2 = page.locator('.user-menu-trigger');
  if (await menuTrigger2.isVisible({ timeout: 2000 }).catch(() => false)) {
    await menuTrigger2.click({ force: true });
    await page.waitForTimeout(500);
    const reportBtn = page.locator('.quick-action-btn').first();
    if (await reportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reportBtn.click({ force: true });
      await page.waitForTimeout(3000);
      await nukeOverlays(page);
      await screenshotAndAnalyze(page, '12-report-breakdown', 'Report breakdown wizard');

      // Check wizard step elements
      const hasFleetInput = await page.locator('input[placeholder*="fleet"], input[placeholder*="Fleet"], input[name*="fleet"]').isVisible().catch(() => false);
      console.log(`   Fleet input visible: ${hasFleetInput}`);
    }
  }

  // ═══════════════════════════════════════
  // 13. SETTINGS / ADMIN
  // ═══════════════════════════════════════
  console.log('\n13. Settings / Admin...');
  await navigateViaMenu(page, '/settings');
  await page.waitForTimeout(2000);
  await nukeOverlays(page);
  await screenshotAndAnalyze(page, '13-settings', 'Settings page');

  // ═══════════════════════════════════════
  // 14. DISPLAY (CONTROL ROOM) - via direct URL
  // ═══════════════════════════════════════
  console.log('\n14. Display (Control Room)...');
  await page.goto(`${BASE_URL}/dashboards/control-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await screenshotAndAnalyze(page, '14-display-control-room', 'Control room display');

  // Check if display loaded correctly
  const hasStatsBar = await page.locator('[class*="stats-bar"], [class*="stat-hero"]').first().isVisible().catch(() => false);
  console.log(`   Stats bar visible: ${hasStatsBar}`);

  // ═══════════════════════════════════════
  // 15. ENGINEERING DISPLAY (PUBLIC) - different depots
  // ═══════════════════════════════════════
  console.log('\n15. Engineering Display (Public)...');
  for (const depot of ['Washington', 'Riverside', 'Percy%20Main']) {
    const depotName = decodeURIComponent(depot);
    await page.goto(`${BASE_URL}/dashboards/engineering/display?depot=${depot}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshotAndAnalyze(page, `15-eng-display-${depotName.toLowerCase().replace(' ', '-')}`, `Engineering display - ${depotName}`);
  }

  // ═══════════════════════════════════════
  // 16. CHECK RESPONSIVE BEHAVIOUR AT SMALLER WIDTH
  // ═══════════════════════════════════════
  console.log('\n16. Responsive check (1024px)...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await cleanPage(page);
  await screenshotAndAnalyze(page, '16-responsive-1024', 'Homepage at 1024px width');

  // Reset viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // ═══════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════
  await browser.close();

  console.log('\n\n═══════════════════════════════════════════════');
  console.log('  AUDIT REPORT');
  console.log('═══════════════════════════════════════════════');

  console.log(`\n📸 Screenshots: ${pageTimings.length}`);
  console.log(`🐛 Issues found: ${issues.length}`);
  console.log(`❌ Console errors: ${consoleErrors.length}`);
  console.log(`🌐 Network errors: ${networkErrors.length}`);

  if (issues.length > 0) {
    console.log('\n--- ISSUES ---');
    const byPriority = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [], INFO: [] };
    issues.forEach(i => (byPriority[i.severity] || byPriority.INFO).push(i));

    for (const [level, items] of Object.entries(byPriority)) {
      if (items.length === 0) continue;
      console.log(`\n[${level}]`);
      items.forEach(i => console.log(`  ${i.page}: [${i.category}] ${i.description}`));
    }
  }

  if (consoleErrors.length > 0) {
    console.log('\n--- CONSOLE ERRORS ---');
    [...new Set(consoleErrors)].forEach(e => console.log(`  ${e}`));
  }

  if (networkErrors.length > 0) {
    console.log('\n--- NETWORK ERRORS ---');
    networkErrors.forEach(e => console.log(`  [${e.status}] ${e.url}`));
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  Audit complete!');
  console.log('═══════════════════════════════════════════════');
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
