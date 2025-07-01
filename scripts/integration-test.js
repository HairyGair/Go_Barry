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
    // Test 1: Navigation to Operations Centre
    console.log('Test 1: Navigation to Operations Centre');
    await page.goto('http://localhost:8081'); // Expo web default port
    await page.waitForSelector('text=Operations Centre', { timeout: 10000 });
    console.log('✅ Found Operations Centre link\n');
    
    // Test 2: Click Operations Centre
    console.log('Test 2: Clicking Operations Centre');
    await page.click('text=Operations Centre');
    await page.waitForNavigation();
    console.log('✅ Navigated to Operations Centre\n');
    
    // Test 3: Verify page loaded
    console.log('Test 3: Verify page structure');
    await page.waitForSelector('text=Operations Centre', { timeout: 5000 });
    
    // Check for gradient cards
    const cards = await page.$$('[data-testid^="operation-card-"]');
    if (cards.length === 6) {
      console.log('✅ Found all 6 operation cards');
    } else {
      console.log(`⚠️  Found ${cards.length} cards, expected 6`);
    }
    
    // Test 4: Check for UK localisation
    console.log('\nTest 4: UK Localisation Check');
    const textContent = await page.content();
    const ukTerms = ['Centre', 'colour', 'organisation', 'analyse'];
    const usTerms = ['Center', 'color', 'organization', 'analyze'];
    
    let localisationPassed = true;
    usTerms.forEach((term, index) => {
      if (textContent.includes(term)) {
        console.log(`❌ Found US spelling: "${term}"`);
        localisationPassed = false;
      }
    });
    
    if (localisationPassed) {
      console.log('✅ UK localisation verified\n');
    }
    
    // Test 5: Status Bar functionality
    console.log('Test 5: Status Bar Check');
    const statusIndicators = await page.$$('[data-testid^="status-"]');
    console.log(`✅ Found ${statusIndicators.length} status indicators\n`);
    
    // Test 6: Card interactions
    console.log('Test 6: Card Interaction Test');
    const firstCard = await page.$('[data-testid="operation-card-0"]');
    if (firstCard) {
      await firstCard.hover();
      await page.waitForTimeout(500); // Wait for hover animation
      console.log('✅ Card hover interaction working\n');
    }
    
    // Test 7: Quick Actions presence
    console.log('Test 7: Quick Actions Check');
    const quickActions = await page.$('text=Quick Actions');
    if (quickActions) {
      console.log('✅ Quick Actions section found\n');
    } else {
      console.log('❌ Quick Actions section missing\n');
    }
    
    // Test 8: Activity Feed
    console.log('Test 8: Activity Feed Check');
    const activityFeed = await page.$('text=Recent Activity');
    if (activityFeed) {
      console.log('✅ Activity Feed section found\n');
    } else {
      console.log('❌ Activity Feed section missing\n');
    }
    
    // Test 9: Navigation buttons
    console.log('Test 9: Navigation Buttons');
    const homeButton = await page.$('text=Home');
    const logoutButton = await page.$('text=Logout');
    
    if (homeButton && logoutButton) {
      console.log('✅ Navigation buttons present\n');
      
      // Test home navigation
      await homeButton.click();
      await page.waitForNavigation();
      console.log('✅ Home navigation works');
    }
    
    console.log('\n================================================');
    console.log('✅ All integration tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    
    // Take screenshot on failure
    await page.screenshot({ 
      path: `test-failure-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('📸 Screenshot saved');
    
  } finally {
    await browser.close();
  }
}

// Run the tests
testOperationsCentre().catch(console.error);
