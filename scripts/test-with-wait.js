import puppeteer from 'puppeteer';
import fs from 'fs';

async function testWithWait() {
  console.log('🔍 Operations Centre Test with Content Waiting\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Homepage with wait for content
    console.log('1. Loading homepage and waiting for content...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });
    
    // Wait for any visible content
    try {
      await page.waitForSelector('*', { 
        visible: true, 
        timeout: 10000 
      });
      
      // Additional wait for React to render
      await page.waitForTimeout(3000);
      
      const homepageContent = await page.evaluate(() => document.body.innerText);
      console.log('✅ Homepage loaded');
      console.log(`   Content: ${homepageContent || '[No text content found]'}`);
      
      // Take screenshot
      await page.screenshot({ path: 'homepage-screenshot.png', fullPage: true });
      console.log('   📸 Screenshot saved: homepage-screenshot.png');
      
      // Look for any clickable elements
      const clickableElements = await page.evaluate(() => {
        const elements = [];
        
        // Find all buttons
        document.querySelectorAll('button').forEach(btn => {
          if (btn.innerText) {
            elements.push({ type: 'button', text: btn.innerText.trim() });
          }
        });
        
        // Find all links  
        document.querySelectorAll('a').forEach(link => {
          if (link.innerText) {
            elements.push({ type: 'link', text: link.innerText.trim(), href: link.href });
          }
        });
        
        // Find clickable divs (common in React Native Web)
        document.querySelectorAll('div[role="button"]').forEach(div => {
          if (div.innerText) {
            elements.push({ type: 'clickable-div', text: div.innerText.trim() });
          }
        });
        
        return elements;
      });
      
      if (clickableElements.length > 0) {
        console.log('\n   Found clickable elements:');
        clickableElements.forEach(el => {
          console.log(`   - [${el.type}] "${el.text}"${el.href ? ` → ${el.href}` : ''}`);
        });
      } else {
        console.log('   ⚠️  No clickable elements found');
      }
      
      // Try to find Operations Centre navigation
      console.log('\n2. Looking for Operations Centre navigation...');
      
      // Look for text containing "Operations"
      const hasOperationsText = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        return bodyText.toLowerCase().includes('operations');
      });
      
      if (hasOperationsText) {
        console.log('   ✅ Found "Operations" text on page');
        
        // Try to click on it
        try {
          await page.click('*:has-text("Operations Centre")', { timeout: 5000 });
          console.log('   ✅ Clicked on Operations Centre');
          await page.waitForTimeout(3000);
        } catch (e) {
          console.log('   ⚠️  Could not click on Operations Centre element');
        }
      } else {
        console.log('   ⚠️  No "Operations" text found on page');
      }
      
    } catch (error) {
      console.log('   ⚠️  Timeout waiting for content:', error.message);
      
      // Check if there's an error message
      const errorText = await page.evaluate(() => {
        const error = document.querySelector('.error-message, [data-testid="error"], #error');
        return error ? error.innerText : null;
      });
      
      if (errorText) {
        console.log('   ❌ Error on page:', errorText);
      }
    }
    
    // Test 2: Direct navigation to operations-centre
    console.log('\n3. Direct navigation to /operations-centre...');
    await page.goto('http://localhost:8081/operations-centre', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    const opsContent = await page.evaluate(() => document.body.innerText);
    console.log(`   Content: ${opsContent || '[No text content found]'}`);
    
    await page.screenshot({ path: 'operations-centre-screenshot.png', fullPage: true });
    console.log('   📸 Screenshot saved: operations-centre-screenshot.png');
    
    // Check page structure
    console.log('\n4. Analyzing page structure...');
    const pageStructure = await page.evaluate(() => {
      const structure = {
        hasRoot: !!document.getElementById('root'),
        rootChildren: document.getElementById('root')?.children.length || 0,
        totalDivs: document.querySelectorAll('div').length,
        totalElements: document.querySelectorAll('*').length,
        hasReactRoot: !!document.querySelector('[data-reactroot]'),
        bodyClasses: document.body.className,
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(src => src)
      };
      return structure;
    });
    
    console.log('   Page structure:', JSON.stringify(pageStructure, null, 2));
    
    console.log('\n✅ Test completed!');
    console.log('\n📁 Generated files:');
    console.log('   - homepage-screenshot.png');
    console.log('   - operations-centre-screenshot.png');
    console.log('\n⏸️  Browser will remain open for 10 seconds for inspection...');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-screenshot.png');
  } finally {
    await browser.close();
  }
}

testWithWait().catch(console.error);
