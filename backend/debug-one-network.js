// Debug script to understand One.Network's structure after login
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 One.Network Debug Script');
console.log('This will help us understand the page structure after login\n');

async function debug() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Navigate to One.Network
  await page.goto('https://one.network/public', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  console.log('👉 Please manually log into One.Network');
  console.log('⏳ Press Enter in this terminal when you see the map...\n');
  
  // Wait for user to press Enter
  await new Promise(resolve => {
    process.stdin.once('data', () => {
      resolve();
    });
  });

  console.log('🔍 Analyzing page structure...\n');
  
  // Take a screenshot
  await page.screenshot({ path: 'one-network-logged-in.png' });
  console.log('📸 Screenshot saved as: one-network-logged-in.png');
  
  // Check for various map indicators
  const mapSelectors = [
    '.mapboxgl-canvas',
    '.maplibregl-canvas',
    '.leaflet-container',
    'canvas',
    '[aria-label="Map"]',
    '#map',
    '.map-container',
    'div[data-testid="map"]',
    'button[aria-label="Open Map Layer Menu"]',
    'button[aria-label="Zoom in"]',
    '.map-wrapper',
    '.ol-viewport' // OpenLayers
  ];
  
  console.log('Checking for map elements:');
  for (const selector of mapSelectors) {
    const element = await page.$(selector);
    if (element) {
      console.log(`✅ Found: ${selector}`);
      
      // Get more info about the element
      const info = await element.evaluate(el => {
        return {
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          isVisible: window.getComputedStyle(el).display !== 'none'
        };
      });
      console.log(`   Details:`, info);
    }
  }
  
  // Check for iframes
  const iframes = await page.$$('iframe');
  console.log(`\n🖼️ Found ${iframes.length} iframes`);
  
  // Look for buttons
  console.log('\n🔘 Looking for control buttons:');
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);
  
  // Sample first 10 buttons
  for (let i = 0; i < Math.min(10, buttons.length); i++) {
    const button = buttons[i];
    const text = await button.evaluate(el => el.textContent?.trim());
    const ariaLabel = await button.evaluate(el => el.getAttribute('aria-label'));
    if (text || ariaLabel) {
      console.log(`  Button ${i}: "${text || ''}" (aria-label: "${ariaLabel || 'none'}")`);
    }
  }
  
  // Check page title and URL
  const title = await page.title();
  const url = page.url();
  console.log(`\n📄 Page Info:`);
  console.log(`  Title: ${title}`);
  console.log(`  URL: ${url}`);
  
  // Get all unique class names on the page
  const classNames = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const classes = new Set();
    allElements.forEach(el => {
      if (el.className && typeof el.className === 'string') {
        el.className.split(' ').forEach(c => {
          if (c.includes('map') || c.includes('Map')) {
            classes.add(c);
          }
        });
      }
    });
    return Array.from(classes);
  });
  
  if (classNames.length > 0) {
    console.log('\n🗺️ Map-related class names found:');
    classNames.forEach(c => console.log(`  .${c}`));
  }
  
  console.log('\n✅ Debug complete! Check one-network-logged-in.png');
  console.log('Press Ctrl+C to exit');
  
  // Keep browser open
  await new Promise(() => {});
}

debug().catch(console.error);
