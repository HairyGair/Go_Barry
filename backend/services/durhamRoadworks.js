import puppeteer from 'puppeteer';

class DurhamRoadworksService {
  constructor() {
    this.baseUrl = 'https://www.durham.gov.uk/roadworks';
    this.roadworks = [];
    this.lastFetch = null;
    this.cacheMinutes = 30; // Cache for 30 minutes
  }

  async fetchRoadworks() {
    // Check cache
    if (this.lastFetch && (Date.now() - this.lastFetch) < this.cacheMinutes * 60 * 1000) {
      console.log('✅ Using cached Durham roadworks data');
      return this.roadworks;
    }

    console.log('🔄 Fetching Durham roadworks...');
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for the table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Extract roadworks data
      const roadworks = await page.evaluate(() => {
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
}

export default new DurhamRoadworksService();