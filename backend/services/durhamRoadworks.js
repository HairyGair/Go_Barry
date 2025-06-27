import puppeteer from 'puppeteer';
import durhamRoadworksLight from './durhamRoadworksLight.js';

class DurhamRoadworksService {
  constructor() {
    this.baseUrl = 'https://www.durham.gov.uk/roadworks';
    this.roadworks = [];
    this.lastFetch = null;
    this.cacheMinutes = 30; // Cache for 30 minutes
  }

  async fetchRoadworks() {
    // Check if Durham scraper is explicitly disabled
    if (process.env.DURHAM_SCRAPER_ENABLED === 'false') {
      console.log('📵 Durham scraper disabled via environment variable');
      this.roadworks = [];
      this.lastFetch = Date.now();
      return this.roadworks;
    }
    
    // Check cache
    if (this.lastFetch && (Date.now() - this.lastFetch) < this.cacheMinutes * 60 * 1000) {
      console.log('✅ Using cached Durham roadworks data');
      return this.roadworks;
    }
    
    // Try lightweight scraper first (no Chrome required)
    try {
      console.log('🌐 Attempting lightweight Durham scraper...');
      const lightResult = await durhamRoadworksLight.fetchRoadworks();
      if (lightResult && lightResult.length > 0) {
        this.roadworks = lightResult;
        this.lastFetch = Date.now();
        return this.roadworks;
      }
    } catch (error) {
      console.log('⚠️ Lightweight scraper failed, falling back to Puppeteer:', error.message);
    }

    console.log('🔄 Fetching Durham roadworks...');
    let browser;
    
    try {
      // Try to launch Puppeteer
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        ...(process.env.NODE_ENV === 'production' && {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
        })
      });
      
      const page = await browser.newPage();
      
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Debug: log page content
      const pageTitle = await page.title();
      console.log(`📄 Page title: ${pageTitle}`);
      
      // Debug: check what's on the page
      const hasTable = await page.$('table') !== null;
      const hasList = await page.$('ul.roadworks-list, .roadworks-list') !== null;
      const hasCards = await page.$('.card, .roadwork-card') !== null;
      
      console.log(`🔍 Page elements - Table: ${hasTable}, List: ${hasList}, Cards: ${hasCards}`);
      
      // Try multiple selectors
      let roadworks = [];
      
      if (hasTable) {
        // Original table-based extraction
        await page.waitForSelector('table', { timeout: 20000 });
        roadworks = await this.extractFromTable(page);
      } else if (hasList || hasCards) {
        // Try alternative selectors
        roadworks = await this.extractFromListOrCards(page);
      } else {
        // Fallback: look for any text content about roadworks
        roadworks = await this.extractFromGenericContent(page);
        
        // Debug: save screenshot if no roadworks found
        if (roadworks.length === 0) {
          try {
            await page.screenshot({ path: 'durham-debug.png' });
            console.log('📸 Debug screenshot saved to durham-debug.png');
          } catch (err) {
            console.log('⚠️ Could not save screenshot:', err.message);
          }
        }
      }
      
      console.log(`✅ Found ${roadworks.length} roadworks entries`);

      // Transform to match your format
      this.roadworks = roadworks.map((rw, index) => ({
        id: `DURHAM-${Date.now()}-${index}`,
        title: rw.description || 'Durham Roadworks',
        location: rw.location,
        severity: this.calculateSeverity(rw.trafficManagement),
        startDate: this.parseDate(rw.startDate),
        endDate: this.parseDate(rw.endDate),
        source: 'Durham County Council',
        description: `${rw.description}\nTraffic Management: ${rw.trafficManagement}\nContractor: ${rw.contractor}`,
        affectedRoutes: this.extractRoutes(rw.location + ' ' + rw.description),
        coordinates: null // Would need geocoding
      }));

      this.lastFetch = Date.now();
      console.log(`✅ Fetched ${this.roadworks.length} Durham roadworks`);
      
    } catch (error) {
      console.error('❌ Durham roadworks fetch error:', error);
      
      // If Chrome isn't available (common on cloud platforms), return empty array
      if (error.message.includes('Could not find Chrome')) {
        console.warn('⚠️ Chrome not available - Durham scraper disabled on this platform');
        console.log('💡 To enable: Install Chrome or Chromium on the server');
        this.roadworks = [];
        this.lastFetch = Date.now();
        return this.roadworks;
      }
      
      throw error;
    } finally {
      if (browser) await browser.close();
    }

    return this.roadworks;
  }

  calculateSeverity(trafficManagement) {
    const mgmt = trafficManagement?.toLowerCase() || '';
    if (mgmt.includes('road closure') || mgmt.includes('closed')) return 'high';
    if (mgmt.includes('traffic lights') || mgmt.includes('convoy')) return 'medium';
    if (mgmt.includes('lane closure') || mgmt.includes('narrow')) return 'medium';
    return 'low';
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  extractRoutes(text) {
    // Look for Go North East route numbers
    const routePattern = /\b(X?\d{1,3}[A-Z]?)\b/g;
    const matches = text.match(routePattern) || [];
    return matches.filter(r => !r.match(/^(A|B|M)\d/)); // Exclude road numbers
  }

  async extractFromTable(page) {
    return await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return null;
        
        return {
          location: cells[0]?.textContent?.trim() || '',
          description: cells[1]?.textContent?.trim() || '',
          startDate: cells[2]?.textContent?.trim() || '',
          endDate: cells[3]?.textContent?.trim() || '',
          trafficManagement: cells[4]?.textContent?.trim() || '',
          contractor: cells[5]?.textContent?.trim() || 'Durham County Council'
        };
      }).filter(item => item && item.location);
    });
  }

  async extractFromListOrCards(page) {
    return await page.evaluate(() => {
      // Try various selectors for modern layouts
      const items = document.querySelectorAll('.roadwork-item, .roadworks-list li, .card, [class*="roadwork"]');
      
      return Array.from(items).map(item => {
        const text = item.textContent || '';
        
        // Extract info using common patterns
        const locationMatch = text.match(/Location:?\s*([^\n]+)/i);
        const descMatch = text.match(/Description:?\s*([^\n]+)/i);
        const startMatch = text.match(/Start:?\s*([^\n]+)/i);
        const endMatch = text.match(/End:?\s*([^\n]+)/i);
        
        return {
          location: locationMatch?.[1]?.trim() || item.querySelector('h3, h4, .title')?.textContent?.trim() || '',
          description: descMatch?.[1]?.trim() || item.querySelector('.description, .details')?.textContent?.trim() || text.substring(0, 100),
          startDate: startMatch?.[1]?.trim() || 'TBC',
          endDate: endMatch?.[1]?.trim() || 'TBC',
          trafficManagement: 'Check Durham Council website',
          contractor: 'Durham County Council'
        };
      }).filter(item => item.location);
    });
  }

  async extractFromGenericContent(page) {
    console.log('⚠️ Using fallback content extraction');
    
    return await page.evaluate(() => {
      // Look for any text that might contain roadwork info
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(line => line.trim());
      
      const roadworks = [];
      let currentRoadwork = null;
      
      for (const line of lines) {
        // Look for location patterns (road names, areas)
        if (line.match(/(A\d{1,4}|B\d{3,4}|road|street|lane|avenue)/i) && line.length < 100) {
          if (currentRoadwork) {
            roadworks.push(currentRoadwork);
          }
          currentRoadwork = {
            location: line.trim(),
            description: '',
            startDate: 'TBC',
            endDate: 'TBC',
            trafficManagement: 'Check Durham Council website',
            contractor: 'Durham County Council'
          };
        } else if (currentRoadwork && line.length > 20) {
          // Add as description
          currentRoadwork.description += line + ' ';
        }
      }
      
      if (currentRoadwork) {
        roadworks.push(currentRoadwork);
      }
      
      return roadworks.slice(0, 10); // Limit to prevent too many false positives
    });
  }
}

export default new DurhamRoadworksService();