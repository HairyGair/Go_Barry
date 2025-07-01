import puppeteer from 'puppeteer';
import fs from 'fs';

async function simpleTest() {
  console.log('🔍 Simple Operations Centre Test\n');
  
  const browser = await puppeteer.launch({ 
    headless: true, // Run in headless mode for speed
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Homepage
    console.log('1. Testing homepage...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });
    
    const homepageContent = await page.evaluate(() => document.body.innerText);
    console.log('✅ Homepage loaded');
    console.log(`   Contains: ${homepageContent.substring(0, 100)}...`);
    
    // Save homepage HTML for debugging
    const homepageHTML = await page.content();
    fs.writeFileSync('homepage-content.html', homepageHTML);
    console.log('   Saved: homepage-content.html\n');
    
    // Test 2: Operations Centre
    console.log('2. Testing Operations Centre route...');
    const response = await page.goto('http://localhost:8081/operations-centre', { 
      waitUntil: 'networkidle2' 
    });
    
    console.log(`   Response status: ${response.status()}`);
    console.log(`   Response URL: ${response.url()}`);
    
    const opsContent = await page.evaluate(() => document.body.innerText);
    console.log(`   Contains: ${opsContent.substring(0, 100)}...`);
    
    // Save operations centre HTML
    const opsHTML = await page.content();
    fs.writeFileSync('operations-centre-content.html', opsHTML);
    console.log('   Saved: operations-centre-content.html\n');
    
    // Test 3: Look for any navigation elements
    console.log('3. Looking for navigation elements...');
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })).filter(link => link.text);
    });
    
    if (links.length > 0) {
      console.log('   Found links:');
      links.forEach(link => {
        console.log(`   - "${link.text}" → ${link.href}`);
      });
    } else {
      console.log('   No links found');
    }
    
    // Test 4: Look for any buttons
    console.log('\n4. Looking for buttons...');
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(text => text);
    });
    
    if (buttons.length > 0) {
      console.log('   Found buttons:');
      buttons.forEach(btn => {
        console.log(`   - "${btn}"`);
      });
    } else {
      console.log('   No buttons found');
    }
    
    // Test 5: Check for React/Expo
    console.log('\n5. Checking for React/Expo...');
    const hasReact = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || 
             document.querySelector('#root') !== null ||
             document.querySelector('[data-reactroot]') !== null;
    });
    console.log(`   React detected: ${hasReact ? '✅' : '❌'}`);
    
    console.log('\n✅ Tests completed!');
    console.log('\n📁 Check these files for details:');
    console.log('   - homepage-content.html');
    console.log('   - operations-centre-content.html');
    console.log('   - Open them in a browser to see what the app is rendering');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    // Save error screenshot
    await page.screenshot({ path: 'error-state.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-state.png');
    
  } finally {
    await browser.close();
  }
}

simpleTest().catch(console.error);
