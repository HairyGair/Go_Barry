import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// One.Network credentials
const ONE_NETWORK_EMAIL = 'anthony.gair@gonortheast.co.uk';
const ONE_NETWORK_PASSWORD = 'Turnip1105!!!!!';

// Go North East operating regions
const GO_NORTH_EAST_REGIONS = [
  { name: 'Newcastle upon Tyne', lat: 54.9783, lng: -1.6178, zoom: 12 },
  { name: 'Gateshead', lat: 54.9527, lng: -1.6035, zoom: 12 },
  { name: 'Sunderland', lat: 54.9069, lng: -1.3838, zoom: 12 },
  { name: 'Durham', lat: 54.7753, lng: -1.5849, zoom: 11 },
  { name: 'South Shields', lat: 54.9983, lng: -1.4323, zoom: 12 },
  { name: 'Washington', lat: 54.9000, lng: -1.5200, zoom: 12 }
];

class OneNetworkService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.roadworks = [];
    
    // Initialize Supabase client
    // Try service key first, then anon key as fallback
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!process.env.SUPABASE_URL || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not found. Data will not be saved.');
      this.supabase = null;
    } else {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        supabaseKey
      );
      console.log('✅ Supabase client initialized');
    }
  }

  async initialize() {
    console.log('🚀 Launching browser for One.Network scraping...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true in production
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    
    // Set up console message logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    // Navigate to One.Network
    await this.page.goto('https://one.network/public', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
  }

  async waitForManualLogin() {
    console.log('🔐 Manual Login Required');
    console.log('');
    console.log('👉 Please manually log into One.Network in the browser window:');
    console.log('   1. Enter email: ' + ONE_NETWORK_EMAIL);
    console.log('   2. Click Next');
    console.log('   3. Enter password (ending with !!!)');
    console.log('   4. Complete any verification (CAPTCHA, etc.)');
    console.log('   5. Wait for the map to appear');
    console.log('');
    console.log('⏳ Waiting for you to complete login (up to 3 minutes)...');
    
    try {
      // Wait for MapLibre GL canvas (not Mapbox GL)
      await this.page.waitForSelector('.maplibregl-canvas', { timeout: 180000 }); // 3 minutes
      console.log('✅ Login detected - map loaded!');
      
      // Give the map time to fully initialize
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      // Check for alternative indicators
      const isLoggedIn = await this.page.evaluate(() => {
        return !!document.querySelector('.maplibregl-canvas') || 
               !!document.querySelector('.ons-map-container') ||
               !!document.querySelector('button[aria-label="Open Map Layer Menu"]');
      });
      
      if (isLoggedIn) {
        console.log('✅ Login successful (alternative check)');
      } else {
        throw new Error('Login timeout - please restart and try again');
      }
    }
  }

  async debugPage() {
    console.log('\n🔍 Debugging page structure...');
    
    const debugInfo = await this.page.evaluate(() => {
      const info = {
        searchInputs: [],
        buttons: [],
        mapElements: [],
        markerClasses: []
      };
      
      // Find all input elements
      document.querySelectorAll('input').forEach(input => {
        info.searchInputs.push({
          placeholder: input.placeholder,
          ariaLabel: input.getAttribute('aria-label'),
          id: input.id,
          name: input.name,
          type: input.type,
          className: input.className
        });
      });
      
      // Find buttons with text
      document.querySelectorAll('button').forEach(button => {
        const text = button.textContent.trim();
        if (text && text.length < 50) {
          info.buttons.push({
            text: text,
            ariaLabel: button.getAttribute('aria-label'),
            className: button.className
          });
        }
      });
      
      // Find map-related elements
      const mapSelectors = [
        '.maplibregl-canvas', '.mapboxgl-canvas',
        '.maplibregl-marker', '.mapboxgl-marker',
        '.ons-map-marker', '.map-marker',
        '[class*="marker"]', '[data-marker]'
      ];
      
      mapSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          info.mapElements.push({
            selector: selector,
            count: elements.length
          });
        }
      });
      
      // Look for any elements with marker in their class
      document.querySelectorAll('[class*="marker" i]').forEach(el => {
        if (!info.markerClasses.includes(el.className)) {
          info.markerClasses.push(el.className);
        }
      });
      
      return info;
    });
    
    console.log('📋 Debug Info:');
    console.log('Search Inputs:', debugInfo.searchInputs);
    console.log('Buttons (sample):', debugInfo.buttons.slice(0, 10));
    console.log('Map Elements:', debugInfo.mapElements);
    console.log('Marker Classes:', debugInfo.markerClasses);
    
    // Take a screenshot for visual debugging
    await this.page.screenshot({ path: 'debug-screenshot.png' });
    console.log('📸 Screenshot saved as debug-screenshot.png');
  }

  async enableLayers() {
    console.log('🗺️ Enabling roadworks and closures layers...');
    
    // First, let's debug what's on the page
    await this.debugPage();
    
    try {
      // Try to find the layers menu button with various selectors
      const layerButtonSelectors = [
        'button[aria-label="Open Map Layer Menu"]',
        'button[aria-label*="layer" i]',
        'button[aria-label*="Layer" i]',
        'button[title*="layer" i]',
        'button:has-text("Layers")',
        '.layers-button',
        '[class*="layer-menu"]'
      ];
      
      let layerButton = null;
      for (const selector of layerButtonSelectors) {
        try {
          layerButton = await this.page.$(selector);
          if (layerButton) {
            console.log(`Found layer button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }
      
      if (!layerButton) {
        console.log('⚠️ Could not find layer menu button');
        return;
      }
      
      await layerButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Enable Roadworks layer if not already enabled
      const roadworksButtons = await this.page.$$('button');
      for (const button of roadworksButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('Roadworks')) {
          const isExpanded = await button.evaluate(el => el.getAttribute('aria-expanded') === 'true');
          if (!isExpanded) {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          break;
        }
      }
      
      // Enable Road closures layer
      const closuresButtons = await this.page.$$('button');
      for (const button of closuresButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('Road closures and diversions')) {
          const isExpanded = await button.evaluate(el => el.getAttribute('aria-expanded') === 'true');
          if (!isExpanded) {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          break;
        }
      }
      
      // Try to close the menu
      const closeSelectors = [
        'button[aria-label="Close Map Layer Menu"]',
        'button[aria-label*="close" i]',
        '.close-button',
        'button:has-text("X")',
        'button:has-text("Close")'
      ];
      
      for (const selector of closeSelectors) {
        try {
          const closeButton = await this.page.$(selector);
          if (closeButton) {
            await closeButton.click();
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Layers enabled (or attempted)');
    } catch (error) {
      console.error('❌ Failed to enable layers:', error.message);
    }
  }

  async navigateToRegion(region) {
    console.log(`📍 Navigating to ${region.name}...`);
    
    try {
      // Try multiple search box selectors
      const searchSelectors = [
        'input[aria-label="Search"]',
        'input[placeholder*="Search" i]',
        'input[placeholder*="search" i]',
        'input[type="search"]',
        '.search-input',
        'input.search',
        '#search'
      ];
      
      let searchBox = null;
      for (const selector of searchSelectors) {
        searchBox = await this.page.$(selector);
        if (searchBox) {
          console.log(`Found search box with selector: ${selector}`);
          break;
        }
      }
      
      if (!searchBox) {
        console.warn('Search box not found, trying alternative navigation...');
        // Try alternative: direct map manipulation
        await this.page.evaluate((lat, lng, zoom) => {
          // Try various map object names
          const mapObjects = ['map', 'Map', 'mapInstance', 'maplibreMap', 'mapboxMap'];
          
          for (const mapName of mapObjects) {
            if (window[mapName] && typeof window[mapName].flyTo === 'function') {
              console.log(`Using window.${mapName}.flyTo`);
              window[mapName].flyTo({
                center: [lng, lat],
                zoom: zoom
              });
              return;
            }
          }
          
          // If no global map, try to find it in other places
          if (window.app && window.app.map) {
            window.app.map.flyTo({ center: [lng, lat], zoom: zoom });
          }
        }, region.lat, region.lng, region.zoom);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return;
      }
      
      await searchBox.click({ clickCount: 3 });
      await searchBox.type(region.name);
      
      // Wait for search results
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click on the first matching result
      const menuItems = await this.page.$$('div[role="menuitem"], li[role="option"], .search-result');
      for (const item of menuItems) {
        const text = await item.evaluate(el => el.textContent);
        if (text && text.includes(region.name)) {
          await item.click();
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for map to pan
          break;
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to navigate to ${region.name}:`, error.message);
    }
  }

  async extractMarkerData() {
    console.log('🔍 Extracting marker data from visible area...');
    
    // Try a wider range of marker selectors
    const markerSelectors = [
      '.maplibregl-marker',
      '.mapboxgl-marker',
      '.ons-map-marker',
      '.map-marker',
      '[class*="marker"]:not([class*="cluster"])',
      'div[data-marker]',
      '.pin',
      '.map-pin',
      '[role="button"][aria-label*="marker" i]'
    ];
    
    let markers = [];
    for (const selector of markerSelectors) {
      const found = await this.page.$$(selector);
      if (found.length > 0) {
        console.log(`Found ${found.length} markers with selector: ${selector}`);
        markers = found;
        break;
      }
    }
    
    if (markers.length === 0) {
      console.log('No markers found with any known selector');
      
      // Debug: print all divs with position absolute (common for map markers)
      const absoluteDivs = await this.page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        return divs
          .filter(div => {
            const style = window.getComputedStyle(div);
            return style.position === 'absolute' && div.offsetWidth > 0 && div.offsetHeight > 0;
          })
          .slice(0, 5)
          .map(div => ({
            className: div.className,
            id: div.id,
            innerHTML: div.innerHTML.substring(0, 100)
          }));
      });
      
      console.log('Sample absolute positioned divs:', absoluteDivs);
      return;
    }
    
    for (let i = 0; i < markers.length; i++) {
      try {
        const marker = markers[i];
        
        // Check if marker is visible
        const isVisible = await marker.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        
        if (!isVisible) continue;
        
        // Click on marker
        await marker.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Look for popup content with various selectors
        const popupSelectors = [
          '.maplibregl-popup-content',
          '.mapboxgl-popup-content',
          '.popup-content',
          '.map-popup',
          '[class*="popup"]',
          '.tooltip',
          '.info-window'
        ];
        
        let popup = null;
        for (const selector of popupSelectors) {
          popup = await this.page.$(selector);
          if (popup) break;
        }
        
        if (popup) {
          const data = await popup.evaluate(el => {
            const getText = (selector) => {
              const elem = el.querySelector(selector);
              return elem ? elem.textContent.trim() : '';
            };
            
            // Try to get text from various possible elements
            const allText = el.textContent.trim();
            
            return {
              title: getText('h3, h4, h5, .title, .heading'),
              description: getText('.description, p, .content'),
              location: getText('.location, .address, .street'),
              dates: getText('.dates, .date-range, .period'),
              impact: getText('.impact, .severity, .level'),
              promoter: getText('.promoter, .organisation, .company'),
              reference: getText('.reference, .ref, .id'),
              allText: allText // Fallback to capture everything
            };
          });
          
          // Add to collection if it has meaningful data
          if (data.title || data.description || (data.allText && data.allText.length > 10)) {
            this.roadworks.push(data);
            console.log(`📌 Extracted: ${data.title || data.allText.substring(0, 50) || 'Unnamed roadwork'}`);
          }
          
          // Close popup - try various selectors
          const closeSelectors = [
            '.maplibregl-popup-close-button',
            '.mapboxgl-popup-close-button',
            '.popup-close',
            'button[aria-label*="close" i]',
            '.close'
          ];
          
          for (const selector of closeSelectors) {
            const closeButton = await this.page.$(selector);
            if (closeButton) {
              await closeButton.click();
              await new Promise(resolve => setTimeout(resolve, 500));
              break;
            }
          }
        }
        
      } catch (error) {
        console.error(`Error processing marker ${i}:`, error.message);
      }
    }
  }

  async scrapeAllRegions() {
    console.log('🏁 Starting regional scraping...');
    
    // First region only for debugging
    const testRegions = GO_NORTH_EAST_REGIONS.slice(0, 1);
    
    for (const region of testRegions) {
      await this.navigateToRegion(region);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for markers to load
      
      // Debug what's on screen
      await this.debugPage();
      
      await this.extractMarkerData();
      
      // Try different zoom levels to catch more markers
      for (let zoom = 11; zoom <= 14; zoom++) {
        await this.page.evaluate((z) => {
          // Try various map object names
          const mapObjects = ['map', 'Map', 'mapInstance', 'maplibreMap', 'mapboxMap'];
          
          for (const mapName of mapObjects) {
            if (window[mapName] && typeof window[mapName].setZoom === 'function') {
              window[mapName].setZoom(z);
              return;
            }
          }
        }, zoom);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.extractMarkerData();
      }
    }
    
    console.log(`✅ Total roadworks collected: ${this.roadworks.length}`);
  }

  transformToSchema(rawData) {
    // Parse dates from various formats
    const parseDates = (dateStr) => {
      if (!dateStr) return { start: null, end: null };
      
      // Common patterns: "01/01/2025 - 31/01/2025", "From 01 Jan to 31 Jan 2025"
      const rangeMatch = dateStr.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[-–]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (rangeMatch) {
        return {
          start: new Date(rangeMatch[1]).toISOString(),
          end: new Date(rangeMatch[2]).toISOString()
        };
      }
      
      return { start: new Date().toISOString(), end: null };
    };
    
    const dates = parseDates(rawData.dates);
    
    // Map impact levels
    const impactMap = {
      'high': 'high',
      'severe': 'high',
      'medium': 'medium',
      'moderate': 'medium',
      'low': 'low',
      'minimal': 'low'
    };
    
    const impact = rawData.impact ? 
      impactMap[rawData.impact.toLowerCase()] || 'medium' : 
      'medium';
    
    return {
      id: crypto.randomUUID(),
      roadworkId: rawData.reference || `ONE-${Date.now()}`,
      title: rawData.title || rawData.allText?.substring(0, 100) || 'Roadwork',
      description: rawData.description || rawData.allText || '',
      location: rawData.location || '',
      lat: rawData.lat || null,
      lng: rawData.lng || null,
      startDate: dates.start,
      endDate: dates.end,
      severity: impact,
      impact: impact,
      status: 'active',
      source: 'one.network',
      affectedRoutes: [], // Would need route matching logic
      geometry: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async saveToSupabase() {
    console.log('💾 Saving to Supabase...');
    
    if (this.roadworks.length === 0) {
      console.log('No roadworks to save');
      return;
    }
    
    // Remove duplicates based on title and location
    const uniqueRoadworks = this.roadworks.reduce((acc, current) => {
      const key = `${current.title || current.allText}-${current.location}`;
      if (!acc.find(item => `${item.title || item.allText}-${item.location}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    // Transform to schema
    const transformed = uniqueRoadworks.map(rw => this.transformToSchema(rw));
    
    console.log('📋 Roadworks to save:', transformed);
    
    try {
      if (!this.supabase) {
        console.log('⚠️ Supabase not configured - skipping save');
        console.log('📊 Would have saved:', transformed.length, 'roadworks');
        return;
      }
      
      const { data, error } = await this.supabase
        .from('roadworks')
        .upsert(transformed, {
          onConflict: 'roadworkId',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('❌ Supabase error:', error);
      } else {
        console.log(`✅ Saved ${transformed.length} roadworks to Supabase`);
      }
    } catch (error) {
      console.error('❌ Failed to save to Supabase:', error);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.waitForManualLogin();  // Changed from automatic login
      await this.enableLayers();
      await this.scrapeAllRegions();
      await this.saveToSupabase();
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

export default OneNetworkService;