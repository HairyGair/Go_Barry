import puppeteer from 'puppeteer';

async function visualCheck() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });
  
  const page = await browser.newPage();
  
  console.log('🔍 Visual Check - Browser will stay open\n');
  
  const urls = [
    'http://localhost:8081',
    'http://localhost:8081/operations-centre',
    'http://localhost:8081/operations',
    'http://localhost:8081/admin'
  ];
  
  for (const url of urls) {
    console.log(`\nChecking ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      console.log(`✅ Loaded successfully`);
      
      // Wait a bit to see the page
      await page.waitForTimeout(3000);
      
      // Log what we see
      const title = await page.title();
      const bodyText = await page.evaluate(() => {
        const text = document.body.innerText || '';
        return text.substring(0, 100);
      });
      
      console.log(`Title: ${title}`);
      console.log(`Content: ${bodyText}...`);
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n\n👀 Browser is open for manual inspection');
  console.log('Navigate manually to see what\'s available');
  console.log('Press Ctrl+C when done\n');
  
  // Keep browser open
  await new Promise(() => {});
}

visualCheck().catch(console.error);
