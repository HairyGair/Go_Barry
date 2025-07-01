import puppeteer from 'puppeteer';

async function testOperationsCentreDirect() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log('🧪 Operations Centre Direct Navigation Test');
  console.log('==========================================\n');
  
  try {
    // Navigate directly to Operations Centre
    console.log('Navigating directly to Operations Centre...');
    await page.goto('http://localhost:8081/operations-centre', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const url = page.url();
    console.log(`✅ Loaded URL: ${url}\n`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'operations-centre-direct.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as operations-centre-direct.png\n');
    
    // Log page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page content preview:');
    console.log(bodyText.substring(0, 500) + '...\n');
    
    // Check for expected elements
    console.log('Checking for expected elements:');
    
    // Check for any cards
    const allDivs = await page.$$('div');
    console.log(`Total div elements: ${allDivs.length}`);
    
    // Look for gradient styles
    const gradientElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.background.includes('gradient') || 
               style.backgroundImage.includes('gradient');
      }).length;
    });
    console.log(`Elements with gradient backgrounds: ${gradientElements}`);
    
    // Check for text content
    const hasOperationsCentre = bodyText.includes('Operations Centre');
    const hasDutyBoards = bodyText.includes('Duty Boards');
    const hasIncidents = bodyText.includes('Incidents');
    const hasRoadworks = bodyText.includes('Roadworks');
    
    console.log(`\n✅ Content checks:`);
    console.log(`  - "Operations Centre": ${hasOperationsCentre ? '✅' : '❌'}`);
    console.log(`  - "Duty Boards": ${hasDutyBoards ? '✅' : '❌'}`);
    console.log(`  - "Incidents": ${hasIncidents ? '✅' : '❌'}`);
    console.log(`  - "Roadworks": ${hasRoadworks ? '✅' : '❌'}`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Check if it's a 404
    const response = await page.evaluate(() => {
      return {
        status: window.performance.getEntriesByType('navigation')[0].responseStatus,
        url: window.location.href
      };
    });
    console.log(`Response status: ${response.status}`);
    console.log(`Current URL: ${response.url}`);
    
    await page.screenshot({ 
      path: `error-screenshot-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('📸 Error screenshot saved');
    
  } finally {
    await browser.close();
  }
}

// Run the test
testOperationsCentreDirect().catch(console.error);
