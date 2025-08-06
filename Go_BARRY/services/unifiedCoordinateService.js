// Go_BARRY/services/unifiedCoordinateService.js
// Frontend unified coordinate service - mirrors backend architecture

import { API_CONFIG } from '../config/api';

class UnifiedCoordinateService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Process coordinates through the unified backend service
   */
  async processCoordinate(input) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/coordinates/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`Coordinate API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to process coordinates:', error);
      // Return default Newcastle coordinates on error
      return {
        success: false,
        lat: 54.9783,
        lng: -1.6178,
        source: 'default',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Batch process multiple coordinates
   */
  async batchProcess(items) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/coordinates/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error(`Batch API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to batch process coordinates:', error);
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Validate coordinates are within UK bounds
   */
  async validateCoordinates(lat, lng) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/coordinates/validate?lat=${lat}&lng=${lng}`
      );

      if (!response.ok) {
        throw new Error(`Validation API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to validate coordinates:', error);
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Convert BNG to WGS84
   */
  async convertBNGtoWGS84(easting, northing) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/coordinates/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ easting, northing })
      });

      if (!response.ok) {
        throw new Error(`Conversion API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to convert BNG coordinates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Geocode address or postcode
   */
  async geocode(input) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/coordinates/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to geocode:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get known locations
   */
  async getKnownLocations() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/coordinates/known-locations`);

      if (!response.ok) {
        throw new Error(`Known locations API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get known locations:', error);
      return {
        success: false,
        locations: [],
        error: error.message
      };
    }
  }

  /**
   * Get service statistics
   */
  async getStats() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/coordinates/stats`);

      if (!response.ok) {
        throw new Error(`Stats API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format coordinates for display
   */
  formatForDisplay(lat, lng, precision = 6) {
    const latitude = parseFloat(lat).toFixed(precision);
    const longitude = parseFloat(lng).toFixed(precision);
    return `${latitude}, ${longitude}`;
  }

  /**
   * Calculate distance between two points (in meters)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if coordinates are within North East England
   */
  isInNorthEast(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // North East England bounds
    return latitude >= 54.0 && latitude <= 56.0 &&
           longitude >= -2.5 && longitude <= 0.0;
  }
}

// Export singleton instance
export default new UnifiedCoordinateService();
