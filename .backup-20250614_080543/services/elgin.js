// services/elgin.js
// Elgin Roadworks API Integration for Go BARRY
// 🚧 MODULAR DESIGN - Can be easily disabled/removed

import axios from 'axios';
import dotenv from 'dotenv';
import { XMLParser } from 'fast-xml-parser';

dotenv.config();

// XML Parser configuration
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true
});

// Feature flag for easy enable/disable
const ELGIN_ENABLED = process.env.ELGIN_ENABLED === 'true';
const ELGIN_ENDPOINT = process.env.ELGIN_ENDPOINT || '';
const ELGIN_USERNAME = process.env.ELGIN_USERNAME || '';
const ELGIN_API_KEY = process.env.ELGIN_API_KEY || '';

// North East England bounding box for filtering
const NORTH_EAST_BOUNDS = {
  north: 55.5,    // Berwick upon Tweed area
  south: 54.3,    // Durham area  
  east: -1.0,     // Coast
  west: -2.5      // Pennines
};

console.log(`🚧 Elgin Roadworks API: ${ELGIN_ENABLED ? 'ENABLED' : 'DISABLED'}`);

class ElginService {
  constructor() {
    this.isAvailable = ELGIN_ENABLED && ELGIN_ENDPOINT && ELGIN_USERNAME && ELGIN_API_KEY;
    this.name = 'Elgin Roadworks API';
    this.lastFetch = null;
    this.cache = [];
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    if (!this.isAvailable) {
      console.log('⚠️ Elgin API not configured - check environment variables');
    } else {
      console.log('✅ Elgin API configured and ready');
    }
  }

  // Generate SOAP XML request for Elgin API
  createSOAPRequest(dataType = 'Items', itemType = 'Road closure') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:api="http://www.elgin.org.uk/schemas/api">
  <soap:Body>
    <api:GetDataRequest Account="${ELGIN_USERNAME}" Key="${ELGIN_API_KEY}">
      <api:DataParameter DataGrouping="${dataType}">
        <api:ItemType>${itemType}</api:ItemType>
        <api:GeographicArea>
          <api:BoundingBox>
            <api:North>${NORTH_EAST_BOUNDS.north}</api:North>
            <api:South>${NORTH_EAST_BOUNDS.south}</api:South>
            <api:East>${NORTH_EAST_BOUNDS.east}</api:East>
            <api:West>${NORTH_EAST_BOUNDS.west}</api:West>
          </api:BoundingBox>
        </api:GeographicArea>
      </api:DataParameter>
    </api:GetDataRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  // Parse XML response using proper XML parser
  parseElginResponse(xmlData) {
    try {
      console.log('🔍 Parsing Elgin XML response...');
      
      // Parse XML to JavaScript object
      const parsedXML = xmlParser.parse(xmlData);
      console.log('✅ XML parsed successfully');
      
      const incidents = [];
      
      // Navigate through SOAP envelope to find data
      const envelope = parsedXML['soap:Envelope'] || parsedXML['s:Envelope'];
      if (!envelope) {
        console.log('⚠️ No SOAP envelope found in response');
        return incidents;
      }
      
      const body = envelope['soap:Body'] || envelope['s:Body'];
      if (!body) {
        console.log('⚠️ No SOAP body found in response');
        return incidents;
      }
      
      // Look for GetDataResponse
      const response = body['GetDataResponse'] || body['api:GetDataResponse'];
      if (!response) {
        console.log('⚠️ No GetDataResponse found');
        return incidents;
      }
      
      // Extract items from response
      const items = response.Items || response['api:Items'] || [];
      const itemArray = Array.isArray(items) ? items : [items];
      
      console.log(`📊 Found ${itemArray.length} items in Elgin response`);
      
      // Process each item
      itemArray.forEach((item, index) => {
        try {
          if (item && (item.ItemType || item['api:ItemType'])) {
            const incident = {
              id: `elgin_${Date.now()}_${index}`,
              type: 'roadworks',
              title: item.Title || item['api:Title'] || 'Elgin Roadworks',
              description: item.Description || item['api:Description'] || 'Roadworks information from Elgin API',
              coordinates: this.extractCoordinates(item),
              severity: this.mapSeverity(item.Severity || item['api:Severity']),
              source: 'elgin',
              authority: item.Authority || item['api:Authority'] || 'Elgin',
              lastUpdated: new Date().toISOString(),
              itemType: item.ItemType || item['api:ItemType'],
              location: item.Location || item['api:Location'] || 'North East England'
            };
            
            incidents.push(incident);
          }
        } catch (itemError) {
          console.error(`❌ Error processing Elgin item ${index}:`, itemError.message);
        }
      });
      
      console.log(`✅ Successfully processed ${incidents.length} Elgin incidents`);
      return incidents;
      
    } catch (error) {
      console.error('❌ Elgin XML parsing error:', error.message);
      console.log('📝 Raw XML preview:', xmlData.substring(0, 500));
      return [];
    }
  }
  
  // Extract coordinates from item
  extractCoordinates(item) {
    try {
      // Look for various coordinate formats
      const coords = item.Coordinates || item['api:Coordinates'] || 
                    item.Location?.Coordinates || item['api:Location']?.Coordinates;
      
      if (coords) {
        const lat = parseFloat(coords.Latitude || coords.lat || coords.y);
        const lng = parseFloat(coords.Longitude || coords.lng || coords.lon || coords.x);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
      
      // Default to Newcastle area if no coordinates found
      return [54.9783, -1.6178];
    } catch (error) {
      return [54.9783, -1.6178]; // Newcastle fallback
    }
  }
  
  // Map Elgin severity to Go BARRY severity
  mapSeverity(elginSeverity) {
    if (!elginSeverity) return 'Medium';
    
    const severity = elginSeverity.toString().toLowerCase();
    
    if (severity.includes('high') || severity.includes('severe') || severity.includes('major')) {
      return 'High';
    } else if (severity.includes('low') || severity.includes('minor')) {
      return 'Low';
    } else {
      return 'Medium';
    }
  }

  // Fetch roadworks data from Elgin API
  async fetchRoadworks() {
    if (!this.isAvailable) {
      console.log('⚠️ Elgin API not available - skipping');
      return [];
    }

    try {
      console.log('🚧 Fetching roadworks from Elgin API...');
      
      const soapRequest = this.createSOAPRequest('Items', 'Road closure');
      
      const response = await axios.post(ELGIN_ENDPOINT, soapRequest, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '"http://www.elgin.org.uk/elgin/api/GetData"',
          'Accept': 'text/xml'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        const incidents = this.parseElginResponse(response.data);
        this.lastFetch = new Date();
        this.cache = incidents;
        
        console.log(`✅ Elgin API: Retrieved ${incidents.length} roadworks`);
        return incidents;
      } else {
        console.error('❌ Elgin API returned status:', response.status);
        return [];
      }

    } catch (error) {
      console.error('❌ Elgin API fetch error:', error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('🚫 Elgin API: Authentication failed - check credentials');
      } else if (error.response?.status === 403) {
        console.error('🚫 Elgin API: Access forbidden - contact Elgin for API access');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 Elgin API: Connection refused - service may be down');
      }
      
      return [];
    }
  }

  // Get cached data if available
  getCachedData() {
    if (!this.isAvailable) return [];
    
    const now = new Date();
    const cacheAge = this.lastFetch ? now - this.lastFetch : Infinity;
    
    if (cacheAge < this.cacheExpiry && this.cache.length > 0) {
      console.log(`📋 Using cached Elgin data (${Math.round(cacheAge / 1000)}s old)`);
      return this.cache;
    }
    
    return [];
  }

  // Main method to get Elgin data (with caching)
  async getTrafficData() {
    if (!this.isAvailable) {
      return {
        source: 'elgin',
        enabled: false,
        message: 'Elgin API not configured',
        incidents: []
      };
    }

    // Try cache first
    const cachedData = this.getCachedData();
    if (cachedData.length > 0) {
      return {
        source: 'elgin',
        enabled: true,
        cached: true,
        incidents: cachedData,
        lastUpdated: this.lastFetch
      };
    }

    // Fetch fresh data
    const incidents = await this.fetchRoadworks();
    
    return {
      source: 'elgin',
      enabled: true,
      cached: false,
      incidents: incidents,
      lastUpdated: new Date(),
      count: incidents.length
    };
  }

  // Health check for monitoring
  async healthCheck() {
    return {
      service: 'Elgin Roadworks API',
      enabled: ELGIN_ENABLED,
      configured: this.isAvailable,
      endpoint: ELGIN_ENDPOINT ? 'SET' : 'NOT_SET',
      username: ELGIN_USERNAME ? 'SET' : 'NOT_SET',
      apiKey: ELGIN_API_KEY ? 'SET' : 'NOT_SET',
      lastFetch: this.lastFetch,
      cacheSize: this.cache.length,
      status: this.isAvailable ? 'ready' : 'disabled'
    };
  }
}

// Create singleton instance
const elginService = new ElginService();

// Export functions for use in main API
export const getElginData = () => elginService.getTrafficData();
export const getElginHealth = () => elginService.healthCheck();
export const isElginEnabled = () => ELGIN_ENABLED;

export default elginService;
