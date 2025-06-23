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

  async login() {
    console.log('🔐 Logging into One.Network...');
    
    try {
      // Wait for email field
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await this.page.type('input[type="email"], input[name="email"]', ONE_NETWORK_EMAIL);
      
      // Click next button - find all buttons and look for "Next" text
      const nextButtons = await this.page.$$('button');
      for (const button of nextButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.trim().toLowerCase() === 'next') {
          await button.click();
          break;
        }
      }
      
      // Wait for password field
      await this.page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await this.page.type('input[type="password"]', ONE_NETWORK_PASSWORD);
      
      // Submit login - find and click Next button again
      await this.page.waitForTimeout(1000);
      const submitButtons = await this.page.$$('button');
      for (const button of submitButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.trim().toLowerCase() === 'next') {
          await button.click();
          break;
        }
      }
      
      // Wait for map to load
      await this.page.waitForSelector('.mapboxgl-canvas', { timeout: 20000 });
      console.log('✅ Login successful');
      
      // Wait for map to fully initialize
      await this.page.waitForTimeout(5000);
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  async enableLayers() {
    console.log('🗺️ Enabling roadworks and closures layers...');
    
    try {
      // Open map layers menu
      await this.page.click('button[aria-label="Open Map Layer Menu"]');
      await this.page.waitForTimeout(1000);
      
      // Enable Roadworks layer if not already enabled
      const roadworksButtons = await this.page.$$('button');
      for (const button of roadworksButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('Roadworks')) {
          const isExpanded = await button.evaluate(el => el.getAttribute('aria-expanded') === 'true');
          if (!isExpanded) {
            await button.click();
            await this.page.waitForTimeout(500);
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
            await this.page.waitForTimeout(500);
          }
          break;
        }
      }
      
      // Close the menu
      await this.page.click('button[aria-label="Close Map Layer Menu"]');
      await this.page.waitForTimeout(2000);
      
      console.log('✅ Layers enabled');
    } catch (error) {
      console.error('❌ Failed to enable layers:', error.message);
    }
  }

  async navigateToRegion(region) {
    console.log(`📍 Navigating to ${region.name}...`);
    
    try {
      // Clear search box
      const searchBox = await this.page.$('input[aria-label="Search"]');
      await searchBox.click({ clickCount: 3 });
      await searchBox.type(region.name);
      
      // Wait for search results
      await this.page.waitForTimeout(2000);
      
      // Click on the first matching result using XPath
      const menuItems = await this.page.$$('div[role="menuitem"]');
      for (const item of menuItems) {
        const text = await item.evaluate(el => el.textContent);
        if (text && text.includes(region.name)) {
          await item.click();
          await this.page.waitForTimeout(3000); // Wait for map to pan
          break;
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to navigate to ${region.name}:`, error.message);
    }
  }

  async extractMarkerData() {
    console.log('🔍 Extracting marker data from visible area...');
    
    const markers = await this.page.$$('.mapboxgl-marker');
    console.log(`Found ${markers.length} markers`);
    
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
        await this.page.waitForTimeout(1000);
        
        // Look for popup content
        const popup = await this.page.$('.mapboxgl-popup-content');
        if (popup) {
          const data = await popup.evaluate(el => {
            const getText = (selector) => {
              const elem = el.querySelector(selector);
              return elem ? elem.textContent.trim() : '';
            };
            
            return {
              title: getText('h3, h4, .title'),
              description: getText('.description, p'),
              location: getText('.location, .address'),
              dates: getText('.dates, .date-range'),
              impact: getText('.impact, .severity'),
              promoter: getText('.promoter, .organisation'),
              reference: getText('.reference, .ref')
            };
          });
          
          // Add to collection if it has meaningful data
          if (data.title || data.description) {
            // Try to extract coordinates from marker position
            const position = await marker.evaluate(el => {
              const transform = el.style.transform;
              const match = transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
              return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
            });
            
            // Convert pixel position to lat/lng (approximate)
            const bounds = await this.page.evaluate(() => {
              if (window.map && window.map.getBounds) {
                const bounds = window.map.getBounds();
                return {
                  north: bounds.getNorth(),
                  south: bounds.getSouth(),
                  east: bounds.getEast(),
                  west: bounds.getWest()
                };
              }
              return null;
            });
            
            if (bounds && position) {
              const viewport = await this.page.viewport();
              const lat = bounds.north - (position.y / viewport.height) * (bounds.north - bounds.south);
              const lng = bounds.west + (position.x / viewport.width) * (bounds.east - bounds.west);
              
              data.lat = lat;
              data.lng = lng;
            }
            
            this.roadworks.push(data);
            console.log(`📌 Extracted: ${data.title || 'Unnamed roadwork'}`);
          }
          
          // Close popup
          const closeButton = await this.page.$('.mapboxgl-popup-close-button');
          if (closeButton) {
            await closeButton.click();
            await this.page.waitForTimeout(500);
          }
        }
        
      } catch (error) {
        console.error(`Error processing marker ${i}:`, error.message);
      }
    }
  }

  async scrapeAllRegions() {
    console.log('🏁 Starting regional scraping...');
    
    for (const region of GO_NORTH_EAST_REGIONS) {
      await this.navigateToRegion(region);
      await this.page.waitForTimeout(3000); // Wait for markers to load
      await this.extractMarkerData();
      
      // Try different zoom levels to catch more markers
      for (let zoom = 11; zoom <= 14; zoom++) {
        await this.page.evaluate((z) => {
          if (window.map && window.map.setZoom) {
            window.map.setZoom(z);
          }
        }, zoom);
        await this.page.waitForTimeout(2000);
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
      title: rawData.title || 'Roadwork',
      description: rawData.description || '',
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
      const key = `${current.title}-${current.location}`;
      if (!acc.find(item => `${item.title}-${item.location}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    // Transform to schema
    const transformed = uniqueRoadworks.map(rw => this.transformToSchema(rw));
    
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
      await this.login();
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
