// backend/services/geocoding/coordinateEnhancer.js
// Ensures all alerts have accurate coordinates like one.network
// © 2025 Anthony Gair. All rights reserved.

import axios from 'axios';

class CoordinateEnhancer {
  constructor() {
    this.geocodeCache = new Map();
    this.regionCenters = {
      // Major areas in North East England
      'NEWCASTLE': { lat: 54.9783, lng: -1.6178 },
      'GATESHEAD': { lat: 54.9527, lng: -1.6038 },
      'SUNDERLAND': { lat: 54.9069, lng: -1.3838 },
      'DURHAM': { lat: 54.7753, lng: -1.5849 },
      'NORTH TYNESIDE': { lat: 55.0174, lng: -1.4550 },
      'SOUTH TYNESIDE': { lat: 54.9985, lng: -1.4272 },
      'NORTHUMBERLAND': { lat: 55.2083, lng: -2.0784 },
      'WASHINGTON': { lat: 54.9000, lng: -1.5200 },
      'CHESTER-LE-STREET': { lat: 54.8543, lng: -1.5745 },
      'CONSETT': { lat: 54.8519, lng: -1.8314 },
      'STANLEY': { lat: 54.8681, lng: -1.6978 },
      'HEXHAM': { lat: 54.9719, lng: -2.1010 },
      'ASHINGTON': { lat: 55.1812, lng: -1.5686 },
      'BLYTH': { lat: 55.1272, lng: -1.5086 },
      'CRAMLINGTON': { lat: 55.0868, lng: -1.5859 },
      'WHITLEY BAY': { lat: 55.0456, lng: -1.4443 },
      'WALLSEND': { lat: 54.9911, lng: -1.5340 },
      'JARROW': { lat: 54.9803, lng: -1.4846 },
      'HEBBURN': { lat: 54.9731, lng: -1.5156 },
      'SOUTH SHIELDS': { lat: 55.0048, lng: -1.4311 },
      // Major roads
      'A1': { lat: 55.0500, lng: -1.6000 },
      'A19': { lat: 54.9500, lng: -1.4500 },
      'A69': { lat: 54.9800, lng: -2.0000 },
      'A167': { lat: 54.9000, lng: -1.5500 },
      'A184': { lat: 54.9400, lng: -1.5000 },
      'A194': { lat: 54.9200, lng: -1.4000 }
    };
    
    this.roadPatterns = [
      { pattern: /A1\s*(Northbound|Southbound)?.*J(unction\s*)?(\d+)/i, road: 'A1' },
      { pattern: /A19\s*(Northbound|Southbound)?.*J(unction\s*)?(\d+)/i, road: 'A19' },
      { pattern: /A69\s*(Eastbound|Westbound)?/i, road: 'A69' },
      { pattern: /A167/i, road: 'A167' },
      { pattern: /A184/i, road: 'A184' },
      { pattern: /A194/i, road: 'A194' }
    ];
    
    this.junctionCoordinates = {
      // A1 Junctions
      'A1_J65': { lat: 54.9140, lng: -1.5850 }, // Birtley
      'A1_J66': { lat: 54.9380, lng: -1.6100 }, // Team Valley
      'A1_J67': { lat: 54.9630, lng: -1.6220 }, // Metro Centre
      'A1_J68': { lat: 54.9780, lng: -1.6280 }, // Lobley Hill
      'A1_J69': { lat: 54.9950, lng: -1.6350 }, // Gateshead
      'A1_J70': { lat: 55.0120, lng: -1.6420 }, // Dunston
      'A1_J71': { lat: 55.0340, lng: -1.6500 }, // Scotswood
      'A1_J72': { lat: 55.0560, lng: -1.6580 }, // Denton
      'A1_J73': { lat: 55.0780, lng: -1.6660 }, // Gosforth
      'A1_J74': { lat: 55.1000, lng: -1.6740 }, // Brunton
      'A1_J75': { lat: 55.1220, lng: -1.6820 }, // Wideopen
      'A1_J76': { lat: 55.1440, lng: -1.6900 }, // Seaton Burn
      'A1_J77': { lat: 55.1660, lng: -1.6980 }, // Ponteland Road
      'A1_J78': { lat: 55.1880, lng: -1.7060 }, // Morpeth Road
      
      // A19 Junctions
      'A19_TYNE_TUNNEL': { lat: 54.9885, lng: -1.4576 },
      'A19_SILVERLINK': { lat: 55.0107, lng: -1.4492 },
      'A19_COAST_ROAD': { lat: 55.0220, lng: -1.4450 },
      'A19_HOLYSTONE': { lat: 55.0340, lng: -1.4400 },
      'A19_KILLINGWORTH': { lat: 55.0460, lng: -1.4350 },
      'A19_SEATON_BURN': { lat: 55.1200, lng: -1.4200 },
      'A19_MOOR_FARM': { lat: 55.1400, lng: -1.4150 },
      
      // A19 South
      'A19_BOLDON': { lat: 54.9450, lng: -1.4300 },
      'A19_TESTO': { lat: 54.9250, lng: -1.4200 },
      'A19_WASHINGTON': { lat: 54.9050, lng: -1.4100 },
      'A19_SUNDERLAND': { lat: 54.8850, lng: -1.4000 }
    };
  }

  /**
   * Enhance an alert with accurate coordinates
   * @param {Object} alert - The alert object to enhance
   * @returns {Object} Alert with guaranteed coordinates
   */
  async enhanceAlertCoordinates(alert) {
    try {
      // If alert already has valid coordinates, validate and return
      if (this.hasValidCoordinates(alert)) {
        const coords = this.extractCoordinates(alert);
        if (this.isInNorthEast(coords.lat, coords.lng)) {
          return {
            ...alert,
            coordinates: coords,
            coordinateSource: 'original',
            coordinateAccuracy: 'high'
          };
        }
      }

      // Try to geocode from location string
      const location = this.buildLocationString(alert);
      const geocoded = await this.geocodeLocation(location, alert);
      
      if (geocoded) {
        return {
          ...alert,
          coordinates: geocoded.coordinates,
          coordinateSource: geocoded.source,
          coordinateAccuracy: geocoded.accuracy,
          enhancedLocation: geocoded.enhancedLocation || alert.location
        };
      }

      // Fallback to region center based on location text
      const fallback = this.getFallbackCoordinates(alert);
      return {
        ...alert,
        coordinates: fallback.coordinates,
        coordinateSource: 'fallback',
        coordinateAccuracy: 'low',
        enhancedLocation: fallback.enhancedLocation || alert.location
      };

    } catch (error) {
      console.error('❌ Error enhancing coordinates:', error.message);
      // Always return with some coordinates
      return {
        ...alert,
        coordinates: { lat: 54.9783, lng: -1.6178 }, // Newcastle center
        coordinateSource: 'default',
        coordinateAccuracy: 'very_low'
      };
    }
  }

  /**
   * Enhance multiple alerts in batch
   * @param {Array} alerts - Array of alerts to enhance
   * @returns {Array} Enhanced alerts with coordinates
   */
  async enhanceMultipleAlerts(alerts) {
    console.log(`🌐 Enhancing coordinates for ${alerts.length} alerts...`);
    
    const enhanced = await Promise.all(
      alerts.map(alert => this.enhanceAlertCoordinates(alert))
    );
    
    const stats = {
      total: enhanced.length,
      withOriginalCoords: enhanced.filter(a => a.coordinateSource === 'original').length,
      geocoded: enhanced.filter(a => a.coordinateSource === 'geocoded').length,
      fromJunction: enhanced.filter(a => a.coordinateSource === 'junction').length,
      fallback: enhanced.filter(a => a.coordinateSource === 'fallback').length,
      default: enhanced.filter(a => a.coordinateSource === 'default').length
    };
    
    console.log(`✅ Coordinate enhancement complete:`, stats);
    return enhanced;
  }

  /**
   * Check if alert has valid coordinates
   */
  hasValidCoordinates(alert) {
    if (!alert) return false;
    
    // Check various coordinate formats
    if (alert.coordinates) {
      if (typeof alert.coordinates === 'object' && 
          'lat' in alert.coordinates && 'lng' in alert.coordinates) {
        return !isNaN(alert.coordinates.lat) && !isNaN(alert.coordinates.lng);
      }
      if (Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
        return !isNaN(alert.coordinates[0]) && !isNaN(alert.coordinates[1]);
      }
    }
    
    if (alert.lat && alert.lng) {
      return !isNaN(alert.lat) && !isNaN(alert.lng);
    }
    
    if (alert.latitude && alert.longitude) {
      return !isNaN(alert.latitude) && !isNaN(alert.longitude);
    }
    
    return false;
  }

  /**
   * Extract coordinates from various formats
   */
  extractCoordinates(alert) {
    if (alert.coordinates) {
      if (typeof alert.coordinates === 'object' && 
          'lat' in alert.coordinates && 'lng' in alert.coordinates) {
        return {
          lat: parseFloat(alert.coordinates.lat),
          lng: parseFloat(alert.coordinates.lng)
        };
      }
      if (Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
        return {
          lat: parseFloat(alert.coordinates[0]),
          lng: parseFloat(alert.coordinates[1])
        };
      }
    }
    
    if (alert.lat && alert.lng) {
      return {
        lat: parseFloat(alert.lat),
        lng: parseFloat(alert.lng)
      };
    }
    
    if (alert.latitude && alert.longitude) {
      return {
        lat: parseFloat(alert.latitude),
        lng: parseFloat(alert.longitude)
      };
    }
    
    return null;
  }

  /**
   * Check if coordinates are in North East England
   */
  isInNorthEast(lat, lng) {
    return lat >= 54.5 && lat <= 55.3 && lng >= -2.2 && lng <= -1.2;
  }

  /**
   * Build location string for geocoding
   */
  buildLocationString(alert) {
    const parts = [];
    
    if (alert.location) parts.push(alert.location);
    if (alert.street_name) parts.push(alert.street_name);
    if (alert.area_name) parts.push(alert.area_name);
    if (alert.town) parts.push(alert.town);
    if (alert.title && !parts.some(p => alert.title.includes(p))) {
      parts.push(alert.title);
    }
    
    // Add "North East England" to improve geocoding accuracy
    if (parts.length > 0 && !parts.some(p => p.toLowerCase().includes('england'))) {
      parts.push('North East England');
    }
    
    return parts.join(', ');
  }

  /**
   * Geocode a location string
   */
  async geocodeLocation(location, alert) {
    try {
      // Check cache first
      const cacheKey = location.toLowerCase();
      if (this.geocodeCache.has(cacheKey)) {
        console.log(`📍 Cache hit for: ${location}`);
        return this.geocodeCache.get(cacheKey);
      }

      // Check for junction references
      const junctionMatch = location.match(/J(unction\s*)?(\d+)/i);
      if (junctionMatch) {
        const roadMatch = location.match(/(A\d+)/i);
        if (roadMatch) {
          const junctionKey = `${roadMatch[1]}_J${junctionMatch[2]}`;
          if (this.junctionCoordinates[junctionKey]) {
            const result = {
              coordinates: this.junctionCoordinates[junctionKey],
              source: 'junction',
              accuracy: 'high',
              enhancedLocation: `${roadMatch[1]} Junction ${junctionMatch[2]}`
            };
            this.geocodeCache.set(cacheKey, result);
            return result;
          }
        }
      }

      // Try OpenStreetMap Nominatim
      console.log(`🌐 Geocoding: ${location}`);
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: location,
          format: 'json',
          limit: 1,
          countrycodes: 'gb',
          viewbox: '-2.2,55.3,-1.2,54.5', // North East England
          bounded: 1
        },
        headers: {
          'User-Agent': 'Go-BARRY-Traffic-Intelligence/2.0'
        },
        timeout: 3000
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const geocoded = {
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          },
          source: 'geocoded',
          accuracy: result.class === 'highway' ? 'high' : 'medium',
          enhancedLocation: result.display_name
        };
        
        // Cache the result
        this.geocodeCache.set(cacheKey, geocoded);
        
        // Limit cache size
        if (this.geocodeCache.size > 1000) {
          const firstKey = this.geocodeCache.keys().next().value;
          this.geocodeCache.delete(firstKey);
        }
        
        console.log(`✅ Geocoded to: ${geocoded.coordinates.lat}, ${geocoded.coordinates.lng}`);
        return geocoded;
      }

    } catch (error) {
      console.warn(`⚠️ Geocoding failed for "${location}":`, error.message);
    }

    return null;
  }

  /**
   * Get fallback coordinates based on location text
   */
  getFallbackCoordinates(alert) {
    const location = (alert.location || alert.title || '').toUpperCase();
    
    // Check for specific areas
    for (const [area, coords] of Object.entries(this.regionCenters)) {
      if (location.includes(area)) {
        return {
          coordinates: coords,
          enhancedLocation: `${area} area`
        };
      }
    }
    
    // Check for road patterns
    for (const roadPattern of this.roadPatterns) {
      if (roadPattern.pattern.test(location)) {
        const roadCoords = this.regionCenters[roadPattern.road];
        if (roadCoords) {
          return {
            coordinates: roadCoords,
            enhancedLocation: `${roadPattern.road} corridor`
          };
        }
      }
    }
    
    // Default to Newcastle center
    return {
      coordinates: { lat: 54.9783, lng: -1.6178 },
      enhancedLocation: 'Newcastle area (approximate)'
    };
  }

  /**
   * Get statistics about coordinate enhancement
   */
  getStats() {
    return {
      cacheSize: this.geocodeCache.size,
      regionCenters: Object.keys(this.regionCenters).length,
      junctionCoordinates: Object.keys(this.junctionCoordinates).length
    };
  }

  /**
   * Clear the geocoding cache
   */
  clearCache() {
    this.geocodeCache.clear();
    console.log('🗑️ Geocoding cache cleared');
  }
}

// Export singleton instance
const coordinateEnhancer = new CoordinateEnhancer();
export default coordinateEnhancer;
