import puppeteer from 'puppeteer';

async function testOperationsCentre() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log('🧪 Operations Centre Test - Fixed Version');
  console.log('========================================\n');
  
  try {
    // Step 1: Load homepage and wait for it to fully render
    console.log('1. Loading homepage...');
    await page.goto('http://localhost:8081', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Check if we need to log in first
    const needsLogin = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      return bodyText.includes('Login') || bodyText.includes('Sign in');
    });
    
    if (needsLogin) {
      console.log('⚠️  Login required - The app requires authentication');
      console.log('   You may need to log in manually first');
    }
    
    // Step 2: Look for Operations Centre
    console.log('\n2. Looking for Operations Centre...');
    
    // Try multiple ways to find it
    let found = false;
    
    // Method 1: Direct navigation
    console.log('   Trying direct navigation...');
    const directResponse = await page.goto('http://localhost:8081/operations-centre', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    if (directResponse.ok()) {
      console.log('   ✅ Direct navigation successful!');
      found = true;
    }
    
    // Wait for content
    await page.waitForTimeout(2000);
    
    // Step 3: Verify content
    console.log('\n3. Checking page content...');
    
    const pageInfo = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return {
        url: window.location.href,
        title: document.title,
        hasOperationsCentre: text.includes('Operations Centre'),
        hasDutyBoards: text.includes('Duty Boards'),
        hasIncidents: text.includes('Incidents') || text.includes('incident'),
        hasRoadworks: text.includes('Roadworks') || text.includes('roadwork'),
        hasCards: document.querySelectorAll('[class*="card"]').length,
        hasGradients: Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.background.includes('gradient') || 
                 style.backgroundImage.includes('gradient');
        }).length,
        bodyText: text.substring(0, 500)
      };
    });
    
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   Has "Operations Centre": ${pageInfo.hasOperationsCentre ? '✅' : '❌'}`);
    console.log(`   Has operational sections: ${pageInfo.hasDutyBoards || pageInfo.hasIncidents || pageInfo.hasRoadworks ? '✅' : '❌'}`);
    console.log(`   Card elements: ${pageInfo.hasCards}`);
    console.log(`   Gradient elements: ${pageInfo.hasGradients}`);
    
    // Step 4: Take screenshot
    console.log('\n4. Taking screenshot...');
    await page.screenshot({ 
      path: 'operations-centre-test.png',
      fullPage: true 
    });
    console.log('   📸 Saved: operations-centre-test.png');
    
    // Summary
    console.log('\n========================================');
    if (pageInfo.hasOperationsCentre || pageInfo.hasCards > 0) {
      console.log('✅ Operations Centre appears to be working!');
      console.log('   Check the screenshot to verify the UI');
    } else {
      console.log('⚠️  Operations Centre may not be fully loaded');
      console.log('   Check the screenshot and browser window');
      console.log('\nDebug info:');
      console.log(pageInfo.bodyText);
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    
    await page.screenshot({ 
      path: `error-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('📸 Error screenshot saved');
    
  } finally {
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testOperationsCentre().catch(console.error);
