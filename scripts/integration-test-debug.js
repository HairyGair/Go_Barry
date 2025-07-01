import puppeteer from 'puppeteer';

async function testOperationsCentre() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: true // Open DevTools for debugging
  });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('🧪 Starting Operations Centre Integration Tests');
  console.log('================================================\n');
  
  try {
    // Test 1: Navigate to homepage
    console.log('Test 1: Loading homepage...');
    await page.goto('http://localhost:8081', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    console.log('✅ Homepage loaded\n');
    
    // Debug: Log the page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page Title: ${title}`);
    console.log(`Current URL: ${url}\n`);
    
    // Debug: Take screenshot of homepage
    await page.screenshot({ 
      path: 'homepage-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Homepage screenshot saved\n');
    
    // Debug: Log all visible text
    console.log('Checking page content...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page contains:', bodyText.substring(0, 200) + '...\n');
    
    // Test 2: Look for Operations Centre link/button
    console.log('Test 2: Looking for Operations Centre...');
    
    // Try multiple selectors
    const selectors = [
      'a:contains("Operations Centre")',
      'button:contains("Operations Centre")',
      '[href*="operations-centre"]',
      'text/Operations Centre',
      '::-p-text(Operations Centre)',
      'a[href="/operations-centre"]',
      'div:contains("Operations Centre")',
      'span:contains("Operations Centre")',
      '*:contains("Operations Centre")'
    ];
    
    let found = false;
    let operationsLink = null;
    
    for (const selector of selectors) {
      try {
        operationsLink = await page.$(selector);
        if (operationsLink) {
          console.log(`✅ Found Operations Centre with selector: ${selector}`);
          found = true;
          break;
        }
      } catch (e) {
        // Silent fail, try next selector
      }
    }
    
    if (!found) {
      // Log all links on the page
      console.log('\n❌ Could not find Operations Centre link');
      console.log('Available links on page:');
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.innerText,
          href: a.href
        }));
      });
      console.log(links);
      
      // Also log all buttons
      console.log('\nAvailable buttons:');
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.innerText);
      });
      console.log(buttons);
      
      throw new Error('Operations Centre link not found');
    }
    
    // Test 3: Click Operations Centre
    console.log('\nTest 3: Clicking Operations Centre...');
    
    // Try clicking
    if (operationsLink) {
      await operationsLink.click();
      
      // Wait for navigation or URL change
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.waitForTimeout(5000)
      ]);
      
      const newUrl = page.url();
      console.log(`✅ Navigated to: ${newUrl}\n`);
    }
    
    // Test 4: Verify we're on Operations Centre page
    console.log('Test 4: Verifying Operations Centre page...');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'operations-centre-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Operations Centre screenshot saved\n');
    
    // Check URL
    const currentUrl = page.url();
    if (currentUrl.includes('operations-centre')) {
      console.log('✅ URL contains "operations-centre"');
    } else {
      console.log(`⚠️  URL doesn't contain "operations-centre": ${currentUrl}`);
    }
    
    // Test 5: Look for expected elements
    console.log('\nTest 5: Checking for expected elements...');
    
    // Check for cards (try different selectors)
    const cardSelectors = [
      '[data-testid^="operation-card-"]',
      '.operation-card',
      '.card',
      '[class*="card"]',
      'div[style*="gradient"]'
    ];
    
    let cards = [];
    for (const selector of cardSelectors) {
      cards = await page.$$(selector);
      if (cards.length > 0) {
        console.log(`✅ Found ${cards.length} cards with selector: ${selector}`);
        break;
      }
    }
    
    if (cards.length === 0) {
      console.log('⚠️  No cards found with any selector');
    }
    
    // Test 6: Check for UK localisation
    console.log('\nTest 6: UK Localisation Check...');
    const pageContent = await page.content();
    
    if (pageContent.includes('Centre') && !pageContent.includes('Center')) {
      console.log('✅ UK spelling "Centre" found');
    } else {
      console.log('⚠️  UK localisation may need checking');
    }
    
    // Test 7: Check for main sections
    console.log('\nTest 7: Checking main sections...');
    
    const sections = {
      'Status Bar': ['status', 'Status', 'system health'],
      'Quick Actions': ['quick action', 'Quick Action', 'actions'],
      'Activity Feed': ['activity', 'Activity', 'recent', 'Recent']
    };
    
    for (const [section, keywords] of Object.entries(sections)) {
      let found = false;
      for (const keyword of keywords) {
        if (pageContent.toLowerCase().includes(keyword.toLowerCase())) {
          console.log(`✅ ${section} section likely present (found "${keyword}")`);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`⚠️  ${section} section might be missing`);
      }
    }
    
    console.log('\n================================================');
    console.log('✅ Integration tests completed!');
    console.log('\n📸 Screenshots saved:');
    console.log('  - homepage-screenshot.png');
    console.log('  - operations-centre-screenshot.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: `test-error-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('📸 Error screenshot saved');
    
    // Log current page state
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`\nCurrent URL: ${currentUrl}`);
    console.log(`Page Title: ${pageTitle}`);
    
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

// Run the tests
testOperationsCentre().catch(console.error);
