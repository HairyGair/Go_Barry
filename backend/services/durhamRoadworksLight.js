import axios from 'axios';
import * as cheerio from 'cheerio';

class DurhamRoadworksLightService {
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

    console.log('🔄 Fetching Durham roadworks (lightweight)...');
    
    try {
      // Simple HTTP request
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-GB,en;q=0.9'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Find the roadworks table
      const roadworks = [];
      
      // Try to find table rows (skip header)
      $('table tbody tr, table tr:not(:first-child)').each((index, row) => {
        const cells = $(row).find('td');
        
        if (cells.length >= 5) {
          const roadwork = {
            location: $(cells[0]).text().trim(),
            description: $(cells[1]).text().trim(),
            trafficManagement: $(cells[2]).text().trim(),
            startDate: $(cells[3]).text().trim(),
            endDate: $(cells[4]).text().trim(),
            contractor: $(cells[5]).text().trim() || 'Durham County Council'
          };
          
          // Handle if the order is different (based on the screenshot)
          // Location | Description | Traffic Management | Start Date | End Date | Responsibility
          if (cells.length === 6 && !roadwork.contractor) {
            roadwork.contractor = $(cells[5]).text().trim() || 'Durham County Council';
          }
          
          // Only add if we have valid data
          if (roadwork.location && roadwork.description) {
            roadworks.push(roadwork);
          }
        }
      });
      
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
      console.log(`✅ Processed ${this.roadworks.length} Durham roadworks`);
      
    } catch (error) {
      console.error('❌ Durham roadworks fetch error:', error.message);
      
      // Return cached data if available
      if (this.roadworks.length > 0) {
        console.log('⚠️ Using cached data due to fetch error');
        return this.roadworks;
      }
      
      this.roadworks = [];
    }

    return this.roadworks;
  }

  calculateSeverity(trafficManagement) {
    const mgmt = trafficManagement?.toLowerCase() || '';
    if (mgmt.includes('road closure') || mgmt.includes('closed')) return 'high';
    if (mgmt.includes('traffic lights') || mgmt.includes('convoy')) return 'medium';
    if (mgmt.includes('traffic signals')) return 'medium';
    if (mgmt.includes('lane closure') || mgmt.includes('narrow')) return 'medium';
    if (mgmt.includes('diversion')) return 'medium';
    return 'low';
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    
    try {
      // Handle DD Month YYYY format (e.g., "10 March 2015")
      const parts = dateStr.split(' ');
      if (parts.length === 3) {
        const months = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3,
          'May': 4, 'June': 5, 'July': 6, 'August': 7,
          'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        const year = parseInt(parts[2]);
        
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
          return new Date(year, month, day).toISOString();
        }
      }
      
      // Try standard date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // Fall through to default
    }
    
    return new Date().toISOString();
  }

  extractRoutes(text) {
    // Look for Go North East route numbers
    const routePattern = /\b(X?\d{1,3}[A-Z]?)\b/g;
    const matches = text.match(routePattern) || [];
    
    // Filter out road numbers (A/B/M roads)
    return matches.filter(r => !r.match(/^(A|B|M)\d/));
  }
}

export default new DurhamRoadworksLightService();