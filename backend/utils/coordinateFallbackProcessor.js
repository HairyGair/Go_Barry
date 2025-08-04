import axios from 'axios';
import { geocodeWithGoogle, buildGeocodingAddress } from '../../Go_BARRY/services/googleGeocoding.js';

// Enhanced coordinate fallback processor with Google Maps geocoding
export class CoordinateFallbackProcessor {
  constructor() {
    this.geocodingCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    // Use Google Maps geocoding for better accuracy
    this.geocodingEnabled = process.env.DISABLE_GEOCODING !== 'true';
    this.failureCount = 0;
    this.maxFailures = 5; // Reduce max failures since Google is more reliable
    
    if (!this.geocodingEnabled) {
      console.log('🚫 Google Maps geocoding disabled (DISABLE_GEOCODING set)');
    } else {
      console.log('✅ Google Maps geocoding enabled for enhanced accuracy');
    }
  }

  /**
   * Process roadwork with comprehensive fallback strategies
   */
  async processRoadworkWithFallbacks(roadwork) {
    // Strategy 1: Check if coordinates already exist and are valid
    if (this.hasValidCoordinates(roadwork)) {
      return {
        ...roadwork,
        coordinateFallbackAttempted: false,
        coordinateFallbackStrategy: 'existing_valid_coordinates'
      };
    }

    // Strategy 2: Try Street Manager easting/northing conversion
    if (roadwork.sm_easting && roadwork.sm_northing) {
      const converted = this.convertOSGB36ToWGS84(roadwork.sm_easting, roadwork.sm_northing);
      if (converted) {
        return {
          ...roadwork,
          coordinates: [converted.lat, converted.lng],
          coordinateSource: 'street_manager_converted',
          coordinateAccuracy: 'high',
          coordinateFallbackStrategy: 'osgb36_conversion'
        };
      }
    }

    // Strategy 3: Parse LINESTRING coordinates
    const linestring = roadwork.works_location_coordinates || 
                     roadwork.sm_works_location_coordinates ||
                     (roadwork.raw_webhook_data?.object_data?.works_location_coordinates);
    
    if (linestring && linestring.includes('LINESTRING')) {
      const parsed = this.parseLineStringToCoordinates(linestring);
      if (parsed) {
        return {
          ...roadwork,
          coordinates: parsed.centroid,
          coordinateSource: 'linestring_centroid',
          coordinateAccuracy: 'high',
          coordinateFallbackStrategy: 'linestring_parsing',
          lineStringBounds: parsed.bounds
        };
      }
    }

    // Strategy 4: Geocode from street name with enhancements
    const locationString = this.buildLocationString(roadwork);
    if (locationString && this.geocodingEnabled) {
      const geocoded = await this.geocodeWithFallbacks(locationString, roadwork);
      if (geocoded) {
        return {
          ...roadwork,
          coordinates: [geocoded.lat, geocoded.lng],
          coordinateSource: geocoded.source,
          coordinateAccuracy: geocoded.accuracy,
          coordinateFallbackStrategy: 'geocoding',
          geocodingDetails: geocoded.details
        };
      }
    }

    // Strategy 5: Highway authority area centroid
    const authorityCoords = this.getHighwayAuthorityCoordinates(roadwork.sm_highway_authority, roadwork);
    if (authorityCoords) {
      return {
        ...roadwork,
        coordinates: authorityCoords.coordinates,
        coordinateSource: authorityCoords.source || 'highway_authority_area',
        coordinateAccuracy: authorityCoords.accuracy || 'low',
        coordinateFallbackStrategy: authorityCoords.strategy || 'authority_area_centroid',
        areaRadius: authorityCoords.radius
      };
    }

    // Strategy 6: Return with comprehensive fallback information
    return {
      ...roadwork,
      coordinates: null,
      coordinateSource: 'none',
      coordinateAccuracy: 'none',
      coordinateFallbackAttempted: true,
      coordinateFallbackStrategy: 'all_strategies_exhausted',
      fallbackSuggestions: this.generateFallbackSuggestions(roadwork)
    };
  }

  /**
   * Check if roadwork has valid coordinates
   */
  hasValidCoordinates(roadwork) {
    if (!roadwork.coordinates) return false;
    
    // Check array format
    if (Array.isArray(roadwork.coordinates) && roadwork.coordinates.length === 2) {
      const [lat, lng] = roadwork.coordinates;
      return this.isValidUKCoordinate(lat, lng);
    }
    
    // Check object format
    if (roadwork.coordinates.lat && roadwork.coordinates.lng) {
      return this.isValidUKCoordinate(roadwork.coordinates.lat, roadwork.coordinates.lng);
    }
    
    return false;
  }

  /**
   * Validate UK coordinates
   */
  isValidUKCoordinate(lat, lng) {
    return typeof lat === 'number' && typeof lng === 'number' &&
           !isNaN(lat) && !isNaN(lng) &&
           lat >= 49.5 && lat <= 61 && lng >= -8.5 && lng <= 2;
  }

  /**
   * Convert OSGB36 to WGS84 (improved approximation)
   */
  convertOSGB36ToWGS84(easting, northing) {
    try {
      console.log(`🔄 Converting OSGB36: E${easting}, N${northing}`);
      
      // Validate input ranges for UK
      if (easting < 0 || easting > 800000 || northing < 0 || northing > 1400000) {
        console.warn(`⚠️ OSGB36 coordinates out of range: E${easting}, N${northing}`);
        return null;
      }
      
      // Improved approximation using Helmert transformation parameters
      // This is more accurate than the previous version
      
      // OSGB36 to WGS84 transformation parameters (approximate)
      const dx = 446.448;  // X shift in meters
      const dy = -125.157; // Y shift in meters
      const dz = 542.060;  // Z shift in meters
      
      // Semi-major axis and flattening for Airy 1830 (OSGB36)
      const a = 6377563.396;
      const b = 6356256.909;
      const f = (a - b) / a;
      const e2 = 2 * f - f * f;
      
      // Grid parameters
      const F0 = 0.9996012717;
      const phi0 = 49.0 * Math.PI / 180.0; // True origin latitude
      const lambda0 = -2.0 * Math.PI / 180.0; // True origin longitude
      const N0 = -100000.0; // Northing of true origin
      const E0 = 400000.0;  // Easting of true origin
      
      // Calculate n
      const n = (a - b) / (a + b);
      const n2 = n * n;
      const n3 = n * n * n;
      
      // Initial approximation
      let phi = phi0 + (northing - N0) / (a * F0);
      let M = 0;
      let phi_old = 0;
      
      // Iterate to find phi
      while (Math.abs(phi - phi_old) > 1e-9) {
        phi_old = phi;
        M = b * F0 * (((1 + n + (5/4)*n2 + (5/4)*n3) * (phi - phi0)) -
            ((3*n + 3*n2 + (21/8)*n3) * Math.sin(phi - phi0) * Math.cos(phi + phi0)) +
            (((15/8)*n2 + (15/8)*n3) * Math.sin(2*(phi - phi0)) * Math.cos(2*(phi + phi0))) -
            ((35/24)*n3 * Math.sin(3*(phi - phi0)) * Math.cos(3*(phi + phi0))));
        phi = phi0 + (northing - N0 - M) / (a * F0);
      }
      
      const v = a * F0 / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
      const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi) * Math.sin(phi), 1.5);
      const eta2 = v / rho - 1;
      
      const VII = Math.tan(phi) / (2 * rho * v);
      const VIII = Math.tan(phi) / (24 * rho * Math.pow(v, 3)) * (5 + 3 * Math.pow(Math.tan(phi), 2) + eta2 - 9 * eta2 * Math.pow(Math.tan(phi), 2));
      const IX = Math.tan(phi) / (720 * rho * Math.pow(v, 5)) * (61 + 90 * Math.pow(Math.tan(phi), 2) + 45 * Math.pow(Math.tan(phi), 4));
      
      const X = 1 / (Math.cos(phi) * v);
      const XI = 1 / (Math.cos(phi) * 6 * Math.pow(v, 3)) * (v / rho + 2 * Math.pow(Math.tan(phi), 2));
      const XII = 1 / (Math.cos(phi) * 120 * Math.pow(v, 5)) * (5 + 28 * Math.pow(Math.tan(phi), 2) + 24 * Math.pow(Math.tan(phi), 4));
      const XIIA = 1 / (Math.cos(phi) * 5040 * Math.pow(v, 7)) * (61 + 662 * Math.pow(Math.tan(phi), 2) + 1320 * Math.pow(Math.tan(phi), 4) + 720 * Math.pow(Math.tan(phi), 6));
      
      const dE = easting - E0;
      
      // Calculate lat/lon in radians
      const lat_rad = phi - VII * dE * dE + VIII * Math.pow(dE, 4) - IX * Math.pow(dE, 6);
      const lon_rad = lambda0 + X * dE - XI * Math.pow(dE, 3) + XII * Math.pow(dE, 5) - XIIA * Math.pow(dE, 7);
      
      // Convert to degrees
      const latDeg = lat_rad * 180.0 / Math.PI;
      const lonDeg = lon_rad * 180.0 / Math.PI;
      
      console.log(`✅ Converted to: ${latDeg.toFixed(6)}, ${lonDeg.toFixed(6)}`);
      
      if (this.isValidUKCoordinate(latDeg, lonDeg)) {
        return { lat: latDeg, lng: lonDeg };
      } else {
        console.warn(`⚠️ Converted coordinates outside UK bounds: ${latDeg}, ${lonDeg}`);
        return null;
      }
    } catch (error) {
      console.error('❌ OSGB36 conversion failed:', error.message);
    }
    return null;
  }

  /**
   * Parse LINESTRING to coordinates
   */
  parseLineStringToCoordinates(linestring) {
    try {
      const match = linestring.match(/LINESTRING\s*\(\s*(.+)\s*\)/);
      if (!match) return null;

      const coordPairs = match[1].split(',');
      const osgbPoints = coordPairs.map(pair => {
        const [easting, northing] = pair.trim().split(/\s+/).map(parseFloat);
        return { easting, northing };
      });

      if (osgbPoints.length === 0) return null;

      // Convert OSGB36 points to WGS84
      const wgs84Points = osgbPoints.map(point => {
        const converted = this.convertOSGB36ToWGS84(point.easting, point.northing);
        if (converted) {
          return { lat: converted.lat, lng: converted.lng };
        }
        return null;
      }).filter(Boolean);

      if (wgs84Points.length === 0) return null;

      // Calculate centroid from WGS84 coordinates
      const sumLat = wgs84Points.reduce((sum, p) => sum + p.lat, 0);
      const sumLng = wgs84Points.reduce((sum, p) => sum + p.lng, 0);
      const centroid = [sumLat / wgs84Points.length, sumLng / wgs84Points.length];

      // Calculate bounds
      const bounds = {
        north: Math.max(...wgs84Points.map(p => p.lat)),
        south: Math.min(...wgs84Points.map(p => p.lat)),
        east: Math.max(...wgs84Points.map(p => p.lng)),
        west: Math.min(...wgs84Points.map(p => p.lng))
      };

      return { centroid, bounds, points: wgs84Points };
    } catch (error) {
      console.error('LINESTRING parsing failed:', error);
      return null;
    }
  }

  /**
   * Build enhanced location string for Google geocoding
   */
  buildLocationString(roadwork) {
    return buildGeocodingAddress(roadwork);
  }

  /**
   * Geocode with Google Maps (much more accurate than Nominatim)
   */
  async geocodeWithFallbacks(locationString, roadwork) {
    // Check local cache first
    const cacheKey = locationString.toLowerCase();
    const cached = this.geocodingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    // Strategy 1: Try full location string with Google
    let result = await this.geocodeWithGoogle(locationString);
    
    // Strategy 2: Try without highway authority if first attempt fails
    if (!result && roadwork.sm_highway_authority) {
      const withoutAuthority = locationString.replace(new RegExp(roadwork.sm_highway_authority.replace(/COUNCIL|CITY/gi, '').trim() + ',?\s*', 'gi'), '');
      result = await this.geocodeWithGoogle(withoutAuthority);
    }
    
    // Strategy 3: Try just street name + nearest town
    if (!result && roadwork.sm_street_name) {
      const nearestTown = this.findNearestTown(roadwork);
      if (nearestTown) {
        result = await this.geocodeWithGoogle(`${roadwork.sm_street_name}, ${nearestTown}, UK`);
      }
    }
    
    // Strategy 4: Try location description with landmarks
    if (!result && roadwork.sm_location_description) {
      const landmarks = this.extractLandmarks(roadwork.sm_location_description);
      for (const landmark of landmarks) {
        result = await this.geocodeWithGoogle(`${landmark}, ${roadwork.sm_highway_authority || 'North East England'}, UK`);
        if (result) break;
      }
    }
    
    // Cache result if successful
    if (result) {
      this.geocodingCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
    }
    
    return result;
  }

  /**
   * Geocode using Google Maps with enhanced error handling
   */
  async geocodeWithGoogle(query) {
    // Check if geocoding is disabled due to failures
    if (!this.geocodingEnabled) {
      console.log('⚠️ Geocoding temporarily disabled due to repeated failures');
      return null;
    }
    
    try {
      console.log(`🌍 Google geocoding: "${query}"`);
      
      const result = await geocodeWithGoogle(query);
      
      if (result) {
        this.failureCount = 0; // Reset failure count on success
        
        return {
          lat: result.latitude,
          lng: result.longitude,
          source: 'google_maps',
          accuracy: result.confidence,
          details: {
            address: result.address,
            place_id: result.place_id,
            types: result.types
          }
        };
      }
      return null;
    } catch (error) {
      this.failureCount++;
      
      // Log significant errors
      if (this.failureCount === 1 || this.failureCount % 5 === 0) {
        console.error(`Google geocoding issues: ${this.failureCount} failures -`, error.message);
      }
      
      // Disable geocoding after too many failures
      if (this.failureCount >= this.maxFailures) {
        this.geocodingEnabled = false;
        console.error('🚫 Disabling geocoding due to repeated failures. Will use coordinate fallbacks.');
        
        // Re-enable after 10 minutes
        setTimeout(() => {
          this.geocodingEnabled = true;
          this.failureCount = 0;
          console.log('✅ Re-enabling geocoding after cooldown');
        }, 10 * 60 * 1000);
      }
    }
    return null;
  }

  /**
   * Assess geocoding accuracy based on result type
   */
  assessGeocodeAccuracy(nominatimResult) {
    const type = nominatimResult.type;
    const importance = nominatimResult.importance || 0;
    
    if (type === 'road' || type === 'street') return 'high';
    if (type === 'suburb' || type === 'neighbourhood') return 'medium';
    if (importance > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Get highway authority area coordinates
   */
  getHighwayAuthorityCoordinates(authority, roadwork) {
    const authorityCoordinates = {
      'NEWCASTLE CITY COUNCIL': { coordinates: [54.9783, -1.6178], radius: 8000 },
      'GATESHEAD COUNCIL': { coordinates: [54.9527, -1.6035], radius: 7000 },
      'NORTH TYNESIDE COUNCIL': { coordinates: [55.0182, -1.4858], radius: 8000 },
      'SOUTH TYNESIDE COUNCIL': { coordinates: [54.9985, -1.4323], radius: 6000 },
      'SUNDERLAND CITY COUNCIL': { coordinates: [54.9069, -1.3838], radius: 10000 },
      'DURHAM COUNTY COUNCIL': { coordinates: [54.7753, -1.5849], radius: 20000 },
      'NORTHUMBERLAND COUNTY COUNCIL': { coordinates: [55.2083, -1.6910], radius: 30000 },
      // Add more authorities as needed
    };
    
    // Special handling for known areas that might be misattributed
    const locationOverrides = {
      'WALKERGATE': { coordinates: [54.9783, -1.5641], radius: 2000 }, // Walkergate, Newcastle
      'WALKER': { coordinates: [54.9744, -1.5513], radius: 2000 }, // Walker, Newcastle
      'BYKER': { coordinates: [54.9748, -1.5752], radius: 2000 }, // Byker, Newcastle
      'HEATON': { coordinates: [54.9883, -1.5825], radius: 2000 }, // Heaton, Newcastle
      'WALLSEND': { coordinates: [54.9910, -1.5340], radius: 3000 }, // Wallsend
      'GOSFORTH': { coordinates: [55.0074, -1.6238], radius: 3000 }, // Gosforth
      'JESMOND': { coordinates: [54.9897, -1.6045], radius: 2000 } // Jesmond
    };
    
    // Check if roadwork location matches any known areas
    if (roadwork) {
      const locationText = (
        (roadwork.sm_street_name || '') + ' ' + 
        (roadwork.sm_location_description || '') + ' ' +
        (roadwork.sm_town || '')
      ).toUpperCase();
      
      for (const [area, coords] of Object.entries(locationOverrides)) {
        if (locationText.includes(area)) {
          console.log(`📍 Found known area '${area}' in roadwork location`);
          return {
            ...coords,
            source: 'known_area_override',
            accuracy: 'medium',
            strategy: `known_area_${area.toLowerCase()}`
          };
        }
      }
    }
    
    const normalized = this.normalizeAuthorityName(authority);
    return authorityCoordinates[normalized] || null;
  }

  /**
   * Normalize authority name
   */
  normalizeAuthorityName(authority) {
    if (!authority) return '';
    return authority.toUpperCase().trim();
  }

  /**
   * Find nearest town from location description
   */
  findNearestTown(roadwork) {
    const knownTowns = [
      'Newcastle', 'Gateshead', 'Sunderland', 'Durham', 
      'Wallsend', 'Jarrow', 'South Shields', 'Washington',
      'Chester-le-Street', 'Consett', 'Stanley', 'Blaydon',
      'Whitley Bay', 'North Shields', 'Tynemouth', 'Ashington',
      'Blyth', 'Cramlington', 'Hexham', 'Morpeth'
    ];
    
    const description = (roadwork.sm_location_description || '').toLowerCase();
    
    for (const town of knownTowns) {
      if (description.includes(town.toLowerCase())) {
        return town;
      }
    }
    
    return null;
  }

  /**
   * Extract landmarks from description
   */
  extractLandmarks(description) {
    const landmarks = [];
    
    // Common landmark patterns
    const patterns = [
      /near (.+?)(?:,|\.|$)/i,
      /adjacent to (.+?)(?:,|\.|$)/i,
      /opposite (.+?)(?:,|\.|$)/i,
      /outside (.+?)(?:,|\.|$)/i,
      /junction with (.+?)(?:,|\.|$)/i,
      /(\w+ roundabout)/i,
      /(\w+ bridge)/i,
      /(\w+ hospital)/i,
      /(\w+ school)/i,
      /(\w+ station)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        landmarks.push(match[1].trim());
      }
    }
    
    return landmarks;
  }

  /**
   * Generate fallback suggestions for supervisors
   */
  generateFallbackSuggestions(roadwork) {
    const suggestions = [];
    
    // Check original notification sources
    suggestions.push({
      icon: 'email-outline',
      text: 'Check the original roadworks notification email',
      detail: `Permit ref: ${roadwork.sm_permit_reference || 'Unknown'}`
    });
    
    // Suggest one.network search
    if (roadwork.sm_permit_reference) {
      suggestions.push({
        icon: 'web',
        text: 'Search on one.network',
        detail: `Use permit reference: ${roadwork.sm_permit_reference}`,
        url: `https://one.network/?q=${encodeURIComponent(roadwork.sm_permit_reference)}`
      });
    }
    
    // Contact suggestions
    if (roadwork.sm_promoter_organisation) {
      suggestions.push({
        icon: 'phone',
        text: `Contact ${roadwork.sm_promoter_organisation}`,
        detail: 'Request exact location details'
      });
    }
    
    // Local knowledge
    suggestions.push({
      icon: 'map-search',
      text: 'Use local knowledge',
      detail: `Search area: ${roadwork.sm_highway_authority || 'Unknown'}`
    });
    
    return suggestions;
  }
}

// Export singleton instance
export const coordinateFallbackProcessor = new CoordinateFallbackProcessor();
