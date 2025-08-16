// backend/services/coordinateService.js
// Unified Coordinate Service - Single source of truth for all coordinate operations
// Replaces 6+ disparate coordinate services with one efficient system

import proj4 from 'proj4';
import dotenv from 'dotenv';
import crypto from 'crypto';
import LRUCache from '../utils/lruCache.js';
import { getSupabaseClient } from './supabaseHelper.js';
import redisCache from './redisCache.js';
import { getFetch } from '../utils/fetchHelper.js';
import coordinateServiceEnhancements from './coordinateServiceEnhancements.js';

dotenv.config();

// Define coordinate systems
proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

/**
 * Unified Coordinate Service
 * Handles all coordinate operations with consistent precision and caching
 */
class CoordinateService {
  constructor() {
    // Configuration
    this.PRECISION = 6; // Standard precision (0.11m accuracy)
    this.UK_BOUNDS = {
      north: 56.0,
      south: 54.0,
      east: 0.0,
      west: -2.5
    };
    
    // Cache configuration (3-tier strategy)
    this.memoryCache = new LRUCache(1000, 5 * 60 * 1000); // Level 1: 5 minutes
    this.redisCacheTTL = 60 * 60; // Level 2: 1 hour
    this.dbCacheTTL = 30 * 24 * 60 * 60 * 1000; // Level 3: 30 days
    
    // API keys
    this.GEOCODING_KEY = process.env.HERE_API_KEY || process.env.MAPBOX_TOKEN;
    
    // Known locations for North East England
    this.KNOWN_LOCATIONS = {
      // Major cities
      'newcastle': { lat: 54.9783, lng: -1.6178, confidence: 100 },
      'gateshead': { lat: 54.9595, lng: -1.6056, confidence: 100 },
      'sunderland': { lat: 54.9069, lng: -1.3838, confidence: 100 },
      'durham': { lat: 54.7761, lng: -1.5733, confidence: 100 },
      
      // Major roads
      'a1': { lat: 54.9783, lng: -1.6178, confidence: 90 },
      'a19': { lat: 54.9830, lng: -1.4600, confidence: 90 },
      'a167': { lat: 54.7761, lng: -1.5733, confidence: 90 },
      'a690': { lat: 54.9069, lng: -1.3838, confidence: 90 },
      
      // Key junctions
      'tyne tunnel': { lat: 54.9830, lng: -1.4600, confidence: 95 },
      'angel of the north': { lat: 54.9144, lng: -1.5898, confidence: 100 },
      'metro centre': { lat: 54.9583, lng: -1.6658, confidence: 100 }
    };
  }

  /**
   * Main entry point - process any coordinate input
   */
  async processCoordinate(input, options = {}) {
    try {
      // Step 1: Generate cache key
      const cacheKey = this.generateCacheKey(input);
      
      // Step 2: Check cache (all levels)
      const cached = await this.checkCache(cacheKey);
      if (cached && !options.forceRefresh) {
        return this.formatOutput(cached, 'cache');
      }
      
      // Step 3: Extract/convert coordinates
      let result = null;
      
      // Try direct coordinates
      if (input.lat && input.lng) {
        result = await this.validateAndFormat(input.lat, input.lng, 'direct');
      }
      // Try BNG conversion
      else if (input.easting && input.northing) {
        result = await this.convertBNGtoWGS84(input.easting, input.northing);
      }
      // Try geometry parsing
      else if (input.geometry) {
        result = await this.parseGeometry(input.geometry);
      }
      // Try geocoding
      else if (input.location || input.address || input.postcode) {
        result = await this.geocode(input);
      }
      // Try known locations
      else if (input.name) {
        result = this.lookupKnownLocation(input.name);
      }
      
      // Step 4: Validate result
      if (!result || !this.isValidCoordinate(result.lat, result.lng)) {
        throw new Error('Could not resolve valid coordinates');
      }
      
      // Step 5: Cache result
      await this.cacheResult(cacheKey, result);
      
      // Step 6: Return formatted output
      return this.formatOutput(result, result.source);
      
    } catch (error) {
      console.error('❌ Coordinate processing error:', error);
      return this.getDefaultCoordinate(input);
    }
  }

  /**
   * Validate coordinates are within UK bounds
   */
  isValidCoordinate(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) return false;
    
    // Check UK bounds (focus on North East)
    return latitude >= this.UK_BOUNDS.south && 
           latitude <= this.UK_BOUNDS.north &&
           longitude >= this.UK_BOUNDS.west && 
           longitude <= this.UK_BOUNDS.east;
  }

  /**
   * Validate and format direct coordinates
   */
  async validateAndFormat(lat, lng, source = 'direct') {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (!this.isValidCoordinate(latitude, longitude)) {
      throw new Error('Coordinates outside UK bounds');
    }
    
    return {
      lat: this.roundToPrecision(latitude),
      lng: this.roundToPrecision(longitude),
      source,
      confidence: 100
    };
  }

  /**
   * Convert British National Grid to WGS84
   */
  async convertBNGtoWGS84(easting, northing) {
    try {
      const e = parseFloat(easting);
      const n = parseFloat(northing);
      
      if (isNaN(e) || isNaN(n)) {
        throw new Error('Invalid BNG coordinates');
      }
      
      // Use proj4 for accurate conversion
      const [lng, lat] = proj4('EPSG:27700', 'EPSG:4326', [e, n]);
      
      return {
        lat: this.roundToPrecision(lat),
        lng: this.roundToPrecision(lng),
        source: 'bng_conversion',
        confidence: 95,
        original: { easting: e, northing: n }
      };
    } catch (error) {
      console.error('❌ BNG conversion error:', error);
      throw error;
    }
  }

  /**
   * Parse geometry strings (POINT, LINESTRING, etc)
   */
  async parseGeometry(geometry) {
    try {
      const geomStr = geometry.toString().toUpperCase();
      
      // Handle POINT
      if (geomStr.includes('POINT')) {
        const match = geomStr.match(/POINT\s*\(\s*([^\s]+)\s+([^\s]+)\s*\)/);
        if (match) {
          const lng = parseFloat(match[1]);
          const lat = parseFloat(match[2]);
          return this.validateAndFormat(lat, lng, 'point_geometry');
        }
      }
      
      // Handle LINESTRING - use first point
      if (geomStr.includes('LINESTRING')) {
        const match = geomStr.match(/LINESTRING\s*\(([^)]+)\)/);
        if (match) {
          const points = match[1].split(',');
          if (points.length > 0) {
            const [lng, lat] = points[0].trim().split(/\s+/).map(parseFloat);
            return this.validateAndFormat(lat, lng, 'linestring_start');
          }
        }
      }
      
      throw new Error('Unsupported geometry type');
    } catch (error) {
      console.error('❌ Geometry parsing error:', error);
      throw error;
    }
  }

  /**
   * Geocode address/location
   */
  async geocode(input) {
    try {
      const query = input.location || input.address || input.postcode || '';
      
      // Check for postcode
      const postcodeMatch = query.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i);
      if (postcodeMatch) {
        return await this.geocodePostcode(postcodeMatch[1]);
      }
      
      // Check known locations first
      const known = this.lookupKnownLocation(query);
      if (known) return known;
      
      // Use geocoding API (if configured)
      if (this.GEOCODING_KEY) {
        return await this.geocodeWithAPI(query);
      }
      
      throw new Error('No geocoding method available');
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Geocode UK postcode with enhanced fallback
   */
  async geocodePostcode(postcode) {
    // Use enhanced postcode geocoding with multiple fallbacks
    const result = await coordinateServiceEnhancements.enhancedPostcodeGeocoding(postcode);
    
    if (result) {
      return {
        lat: this.roundToPrecision(result.lat),
        lng: this.roundToPrecision(result.lng),
        source: result.source,
        confidence: result.confidence,
        postcode: postcode.toUpperCase(),
        metadata: {
          district: result.district,
          ward: result.ward,
          area: result.area
        }
      };
    }
    
    throw new Error('Postcode not found');
  }

  /**
   * Geocode with external API (HERE/Mapbox)
   */
  async geocodeWithAPI(query) {
    // Implementation depends on which API key is available
    // This is a placeholder for the actual implementation
    throw new Error('External geocoding not implemented');
  }

  /**
   * Lookup known location
   */
  lookupKnownLocation(name) {
    const searchTerm = name.toLowerCase().trim();
    
    // Direct match
    if (this.KNOWN_LOCATIONS[searchTerm]) {
      const location = this.KNOWN_LOCATIONS[searchTerm];
      return {
        lat: this.roundToPrecision(location.lat),
        lng: this.roundToPrecision(location.lng),
        source: 'known_location',
        confidence: location.confidence,
        name: searchTerm
      };
    }
    
    // Partial match
    for (const [key, location] of Object.entries(this.KNOWN_LOCATIONS)) {
      if (searchTerm.includes(key) || key.includes(searchTerm)) {
        return {
          lat: this.roundToPrecision(location.lat),
          lng: this.roundToPrecision(location.lng),
          source: 'known_location_partial',
          confidence: location.confidence * 0.8,
          name: key
        };
      }
    }
    
    return null;
  }

  /**
   * Generate consistent cache key
   */
  generateCacheKey(input) {
    // Priority order for cache key generation
    if (input.id) return `coord:id:${input.id}`;
    if (input.usrn) return `coord:usrn:${input.usrn}`;
    if (input.permitReference) return `coord:permit:${input.permitReference}`;
    if (input.postcode) return `coord:postcode:${input.postcode.toUpperCase()}`;
    if (input.easting && input.northing) return `coord:bng:${input.easting}:${input.northing}`;
    if (input.lat && input.lng) return `coord:wgs84:${input.lat}:${input.lng}`;
    
    // Hash complex inputs
    const hash = crypto.createHash('md5')
      .update(JSON.stringify(input))
      .digest('hex')
      .substring(0, 8);
    return `coord:hash:${hash}`;
  }

  /**
   * Check all cache levels
   */
  async checkCache(key) {
    // Level 1: Memory cache
    const memCached = this.memoryCache.get(key);
    if (memCached) {
      console.log(`📦 Cache hit (memory): ${key}`);
      return memCached;
    }
    
    // Level 2: Redis cache
    try {
      const redisCached = await redisCache.get(key);
      if (redisCached) {
        console.log(`📦 Cache hit (Redis): ${key}`);
        // Promote to memory cache
        this.memoryCache.set(key, redisCached);
        return redisCached;
      }
    } catch (error) {
      console.warn('⚠️ Redis cache check failed:', error);
    }
    
    // Level 3: Database cache
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('coordinate_cache')
        .select('*')
        .eq('cache_key', key)
        .single();
      
      if (data && this.isDbCacheValid(data.cached_at)) {
        console.log(`📦 Cache hit (database): ${key}`);
        const result = {
          lat: data.latitude,
          lng: data.longitude,
          source: data.source,
          confidence: data.confidence
        };
        
        // Promote to faster caches
        this.memoryCache.set(key, result);
        await redisCache.set(key, result, this.redisCacheTTL);
        
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Database cache check failed:', error);
    }
    
    return null;
  }

  /**
   * Cache result in all levels
   */
  async cacheResult(key, result) {
    // Level 1: Memory cache
    this.memoryCache.set(key, result);
    
    // Level 2: Redis cache
    try {
      await redisCache.set(key, result, this.redisCacheTTL);
    } catch (error) {
      console.warn('⚠️ Redis cache write failed:', error);
    }
    
    // Level 3: Database cache
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('coordinate_cache')
        .upsert({
          cache_key: key,
          latitude: result.lat,
          longitude: result.lng,
          source: result.source,
          confidence: result.confidence,
          cached_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('⚠️ Database cache write failed:', error);
    }
  }

  /**
   * Check if database cache is still valid
   */
  isDbCacheValid(cachedAt) {
    const age = Date.now() - new Date(cachedAt).getTime();
    return age < this.dbCacheTTL;
  }

  /**
   * Round to standard precision
   */
  roundToPrecision(value) {
    return parseFloat(value.toFixed(this.PRECISION));
  }

  /**
   * Format output consistently
   */
  formatOutput(coords, source) {
    return {
      success: true,
      coordinates: [coords.lat, coords.lng],
      lat: coords.lat,
      lng: coords.lng,
      precision: this.PRECISION,
      accuracy: `${Math.pow(10, -this.PRECISION) * 111000}m`, // Approximate accuracy in meters
      source: source || 'unknown',
      confidence: coords.confidence || 0,
      metadata: {
        cached: source === 'cache',
        timestamp: new Date().toISOString(),
        ...coords.metadata
      }
    };
  }

  /**
   * Get default coordinate (Newcastle city center)
   */
  getDefaultCoordinate(input) {
    console.warn('⚠️ Using default coordinates for:', input);
    return this.formatOutput({
      lat: 54.9783,
      lng: -1.6178,
      source: 'default',
      confidence: 0
    }, 'default');
  }

  /**
   * Batch process multiple coordinates
   */
  async batchProcess(items, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => this.processCoordinate(item, options))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Clear all caches (for maintenance)
   */
  async clearAllCaches() {
    // Clear memory cache
    this.memoryCache = new LRUCache(1000, 5 * 60 * 1000);
    
    // Clear Redis cache
    try {
      await redisCache.flushAll();
    } catch (error) {
      console.warn('⚠️ Redis cache clear failed:', error);
    }
    
    // Clear database cache (optional, usually keep for persistence)
    if (process.env.CLEAR_DB_CACHE === 'true') {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('coordinate_cache')
          .delete()
          .gte('cached_at', '1970-01-01');
      } catch (error) {
        console.warn('⚠️ Database cache clear failed:', error);
      }
    }
    
    console.log('✅ All coordinate caches cleared');
  }

  /**
   * Get coordinate quality assessment
   */
  assessQuality(coord, metadata = {}) {
    return coordinateServiceEnhancements.scoreCoordinateQuality(coord, metadata);
  }

  /**
   * Cluster nearby coordinates for map display
   */
  clusterCoordinates(coordinates, radius = 100) {
    return coordinateServiceEnhancements.clusterNearbyCoordinates(coordinates, radius);
  }

  /**
   * Interpolate points along a roadwork segment
   */
  interpolateSegment(startCoord, endCoord, numPoints = 5) {
    return coordinateServiceEnhancements.interpolateRoadworkSegment(startCoord, endCoord, numPoints);
  }
}

// Export singleton instance
export default new CoordinateService();
