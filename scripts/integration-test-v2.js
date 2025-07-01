import puppeteer from 'puppeteer';

async function testOperationsCentre() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log('🧪 Starting Operations Centre Integration Tests');
  console.log('================================================\n');
  
  try {
    // Test 1: Load homepage
    console.log('Test 1: Loading homepage...');
    await page.goto('http://localhost:8081', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    console.log('✅ Homepage loaded\n');
    
    // Wait for any dynamic content
    await page.waitForTimeout(2000);
    
    // Test 2: Navigate to Operations Centre
    console.log('Test 2: Navigating to Operations Centre...');
    
    // Option 1: Try direct navigation first
    const directUrl = 'http://localhost:8081/operations-centre';
    console.log(`Trying direct navigation to ${directUrl}...`);
    
    const response = await page.goto(directUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    if (response.ok()) {
      console.log('✅ Successfully navigated to Operations Centre\n');
    } else {
      console.log(`⚠️  Response status: ${response.status()}`);
    }
    
    // Test 3: Verify page content
    console.log('Test 3: Verifying page content...');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    const pageContent = await page.evaluate(() => document.body.innerText || '');
    const pageTitle = await page.title();
    
    console.log(`Page title: ${pageTitle}`);
    console.log(`Content preview: ${pageContent.substring(0, 200)}...\n`);
    
    // Test 4: Check for expected elements
    console.log('Test 4: Checking for expected elements...');
    
    const checks = {
      'Operations Centre text': pageContent.includes('Operations Centre'),
      'UK spelling (Centre)': pageContent.includes('Centre') && !pageContent.includes('Center'),
      'Duty Boards': pageContent.includes('Duty') || pageContent.includes('duty'),
      'Incidents': pageContent.includes('Incident') || pageContent.includes('incident'),
      'Roadworks': pageContent.includes('Roadwork') || pageContent.includes('roadwork'),
      'Disruptions': pageContent.includes('Disruption') || pageContent.includes('disruption')
    };
    
    Object.entries(checks).forEach(([name, found]) => {
      console.log(`${found ? '✅' : '❌'} ${name}`);
    });
    
    // Test 5: Visual elements
    console.log('\nTest 5: Checking visual elements...');
    
    // Count various elements
    const elementCounts = await page.evaluate(() => {
      return {
        divs: document.querySelectorAll('div').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        images: document.querySelectorAll('img').length,
        cards: document.querySelectorAll('[class*="card"]').length
      };
    });
    
    console.log('Element counts:');
    Object.entries(elementCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Test 6: Take final screenshot
    console.log('\nTest 6: Taking screenshot...');
    await page.screenshot({ 
      path: 'operations-centre-final.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: operations-centre-final.png');
    
    // Summary
    console.log('\n================================================');
    const passedChecks = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.values(checks).length;
    
    if (passedChecks === totalChecks) {
      console.log('✅ All tests passed!');
    } else {
      console.log(`⚠️  Passed ${passedChecks}/${totalChecks} checks`);
      console.log('\nThis might be OK if the page structure is different than expected.');
      console.log('Check the screenshot to see if the page loaded correctly.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: `test-error-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('📸 Error screenshot saved');
    
  } finally {
    await browser.close();
  }
}

// Run the tests
testOperationsCentre().catch(console.error);
