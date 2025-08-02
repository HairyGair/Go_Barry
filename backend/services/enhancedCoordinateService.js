// backend/services/enhancedCoordinateService.js
// Phase 1 Coordinate Accuracy Improvements for Go BARRY
// Implements multiple UK-specific geocoding sources with fallback chain

import dotenv from 'dotenv';
import { getFetch } from '../utils/fetchHelper.js';
import LRUCache from '../utils/lruCache.js';
import { bngToLatLng, parseStreetManagerGeometry } from '../utils/bngToLatLng.js';
import { getSupabaseClient } from './supabaseHelper.js';

dotenv.config();

// Cache configuration - optimized for 2GB RAM constraint
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const coordinateCache = new LRUCache(1000, CACHE_DURATION);
const postcodeCache = new LRUCache(500, CACHE_DURATION);

// API configuration
const HERE_API_KEY = process.env.HERE_API_KEY;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

// UK Postcode regex patterns
const UK_POSTCODE_PATTERNS = [
  /\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/gi, // Full postcode
  /\b([A-Z]{1,2}[0-9][A-Z0-9]?)\b/gi, // Outward code only
  /\b(NE[0-9]{1,2}[0-9A-Z]?\s?[0-9][A-Z]{2})\b/gi, // Newcastle specific
  /\b(DH[0-9]{1,2}[0-9A-Z]?\s?[0-9][A-Z]{2})\b/gi, // Durham specific
  /\b(SR[0-9]{1,2}[0-9A-Z]?\s?[0-9][A-Z]{2})\b/gi, // Sunderland specific
];

// USRN (Unique Street Reference Number) pattern
const USRN_PATTERN = /\bUSRN[:\s]*([0-9]{8})\b/gi;

// Enhanced known locations for North East England with confidence scores
const ENHANCED_KNOWN_LOCATIONS = {
  // Major A-roads with specific sections
  'a1 newcastle': { lat: 54.9783, lng: -1.6178, confidence: 95, source: 'known_location' },
  'a1 gateshead': { lat: 54.9530, lng: -1.6030, confidence: 95, source: 'known_location' },
  'a1 birtley': { lat: 54.8800, lng: -1.5800, confidence: 95, source: 'known_location' },
  'a19 tyne tunnel': { lat: 54.9830, lng: -1.4600, confidence: 95, source: 'known_location' },
  'a19 silverlink': { lat: 55.0300, lng: -1.4800, confidence: 95, source: 'known_location' },
  'a167 durham': { lat: 54.7761, lng: -1.5733, confidence: 95, source: 'known_location' },
  'a690 sunderland': { lat: 54.9069, lng: -1.3838, confidence: 95, source: 'known_location' },
  
  // City centers with high accuracy
  'newcastle city centre': { lat: 54.9742, lng: -1.6142, confidence: 98, source: 'known_location' },
  'gateshead town centre': { lat: 54.9595, lng: -1.6056, confidence: 98, source: 'known_location' },
  'durham city centre': { lat: 54.7761, lng: -1.5733, confidence: 98, source: 'known_location' },
  'sunderland city centre': { lat: 54.9069, lng: -1.3838, confidence: 98, source: 'known_location' },
  
  // Transport hubs
  'newcastle central station': { lat: 54.9689, lng: -1.6173, confidence: 99, source: 'known_location' },
  'metro centre': { lat: 54.9530, lng: -1.6720, confidence: 98, source: 'known_location' },
  'newcastle airport': { lat: 55.0375, lng: -1.6917, confidence: 99, source: 'known_location' },
  
  // Business areas
  'team valley': { lat: 54.9230, lng: -1.6330, confidence: 95, source: 'known_location' },
  'cobalt business park': { lat: 55.0450, lng: -1.4750, confidence: 95, source: 'known_location' },
  'quayside newcastle': { lat: 54.9699, lng: -1.6006, confidence: 95, source: 'known_location' },
};

/**
 * Enhanced Coordinate Service Class
 * Provides multiple geocoding strategies with UK-specific accuracy
 */
class EnhancedCoordinateService {
  constructor() {
    this.requestCount = 0;
    this.successCount = 0;
    this.cacheHits = 0;
  }

  /**
   * Main coordinate resolution method with comprehensive fallback chain
   * @param {Object} alert - Alert object with location information
   * @returns {Promise<Object>} Enhanced alert with coordinates and confidence
   */
  async enhanceAlertCoordinates(alert) {
    if (!alert) return alert;

    console.log(`🎯 Enhancing coordinates for alert: ${alert.id} - "${alert.location}"`);
    this.requestCount++;

    // Skip if we already have high-confidence coordinates
    if (this.hasHighConfidenceCoordinates(alert)) {
      console.log(`✅ Alert ${alert.id} already has high-confidence coordinates`);
      return alert;
    }

    const cacheKey = this.generateCacheKey(alert);
    const cachedResult = coordinateCache.get(cacheKey);
    
    if (cachedResult) {
      console.log(`📦 Cache hit for alert ${alert.id}`);
      this.cacheHits++;
      return { ...alert, ...cachedResult };
    }

    let coordinateResult = null;

    try {
      // Phase 1: Extract from Street Manager geometry data
      coordinateResult = await this.extractStreetManagerCoordinates(alert);
      
      if (!coordinateResult) {
        // Phase 2: Extract postcodes and use Ordnance Survey
        coordinateResult = await this.extractPostcodeCoordinates(alert);
      }
      
      if (!coordinateResult) {
        // Phase 3: Extract USRN and convert to coordinates
        coordinateResult = await this.extractUSRNCoordinates(alert);
      }
      
      if (!coordinateResult) {
        // Phase 4: Fallback geocoding chain
        coordinateResult = await this.fallbackGeocodingChain(alert);
      }
      
      if (!coordinateResult) {
        // Phase 5: Known location matching
        coordinateResult = await this.matchKnownLocations(alert);
      }

      if (coordinateResult) {
        const enhancedAlert = this.applyCoordinateResult(alert, coordinateResult);
        
        // Cache successful results
        coordinateCache.set(cacheKey, {
          coordinates: enhancedAlert.coordinates,
          coordinateSource: enhancedAlert.coordinateSource,
          coordinateConfidence: enhancedAlert.coordinateConfidence,
          geocodingMetadata: enhancedAlert.geocodingMetadata
        });
        
        this.successCount++;
        console.log(`✅ Successfully enhanced coordinates for alert ${alert.id} (${coordinateResult.source}, confidence: ${coordinateResult.confidence}%)`);
        return enhancedAlert;
      }

      console.warn(`⚠️ Could not enhance coordinates for alert ${alert.id}, using default`);
      return this.applyDefaultCoordinates(alert);

    } catch (error) {
      console.error(`❌ Error enhancing coordinates for alert ${alert.id}:`, error.message);
      return this.applyDefaultCoordinates(alert);
    }
  }

  /**
   * Check if alert already has high-confidence coordinates
   */
  hasHighConfidenceCoordinates(alert) {
    if (!alert.coordinates) return false;
    
    // Check array format
    if (Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
      const [lat, lng] = alert.coordinates;
      if (this.isValidCoordinate(lat, lng) && alert.coordinateConfidence >= 90) {
        return true;
      }
    }
    
    // Check object format
    if (alert.coordinates.lat && alert.coordinates.lng) {
      if (this.isValidCoordinate(alert.coordinates.lat, alert.coordinates.lng) && alert.coordinateConfidence >= 90) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Phase 1: Enhanced Street Manager coordinate extraction
   */
  async extractStreetManagerCoordinates(alert) {
    if (!alert.raw_webhook_data && !alert.sm_easting && !alert.sm_northing) {
      return null;
    }

    console.log(`🗺️ Phase 1: Extracting Street Manager coordinates for ${alert.id}`);

    // Method 1: Direct BNG coordinates
    if (alert.sm_easting && alert.sm_northing) {
      try {
        const easting = parseFloat(alert.sm_easting);
        const northing = parseFloat(alert.sm_northing);
        
        if (!isNaN(easting) && !isNaN(northing)) {
          const wgs84 = bngToLatLng(easting, northing);
          
          if (this.isValidCoordinate(wgs84.lat, wgs84.lng)) {
            return {
              lat: wgs84.lat,
              lng: wgs84.lng,
              source: 'streetmanager_bng_direct',
              confidence: 95,
              metadata: { originalBNG: { easting, northing } }
            };
          }
        }
      } catch (error) {
        console.warn(`⚠️ BNG conversion failed:`, error.message);
      }
    }

    // Method 2: Parse geometry from webhook data
    if (alert.raw_webhook_data) {
      try {
        const rawData = typeof alert.raw_webhook_data === 'string' ? 
          JSON.parse(alert.raw_webhook_data) : alert.raw_webhook_data;
        
        if (rawData?.object_data?.works_location_coordinates) {
          const geometryString = rawData.object_data.works_location_coordinates;
          const parsed = parseStreetManagerGeometry(geometryString);
          
          if (parsed && this.isValidCoordinate(parsed.lat, parsed.lng)) {
            return {
              lat: parsed.lat,
              lng: parsed.lng,
              source: parsed.source,
              confidence: 90,
              metadata: { geometryType: geometryString.split('(')[0] }
            };
          }
        }

        // Method 3: Extract polygon boundary data
        if (rawData?.object_data?.work_boundary) {
          const boundaryResult = this.parseWorkBoundary(rawData.object_data.work_boundary);
          if (boundaryResult) {
            return boundaryResult;
          }
        }

      } catch (error) {
        console.warn(`⚠️ Webhook geometry parsing failed:`, error.message);
      }
    }

    return null;
  }

  /**
   * Phase 2: Extract postcodes and use Ordnance Survey CodePoint
   */
  async extractPostcodeCoordinates(alert) {
    const locationText = this.buildLocationSearchText(alert);
    const postcodes = this.extractPostcodes(locationText);
    
    if (postcodes.length === 0) {
      return null;
    }

    console.log(`📮 Phase 2: Found postcodes ${postcodes.join(', ')} for alert ${alert.id}`);

    // Try cached postcodes first
    for (const postcode of postcodes) {
      const cached = postcodeCache.get(postcode);
      if (cached) {
        console.log(`📦 Postcode cache hit: ${postcode}`);
        return {
          ...cached,
          source: 'ordnance_survey_cached',
          confidence: 88
        };
      }
    }

    // Use Ordnance Survey CodePoint API for precise UK postcode lookup
    for (const postcode of postcodes) {
      try {
        const result = await this.lookupPostcodeOrdnanceSurvey(postcode);
        if (result) {
          postcodeCache.set(postcode, result);
          return {
            ...result,
            source: 'ordnance_survey_codepoint',
            confidence: 92
          };
        }
      } catch (error) {
        console.warn(`⚠️ Ordnance Survey lookup failed for ${postcode}:`, error.message);
      }
    }

    return null;
  }

  /**
   * Phase 3: Extract USRN and convert to coordinates
   */
  async extractUSRNCoordinates(alert) {
    const locationText = this.buildLocationSearchText(alert);
    const usrns = this.extractUSRNs(locationText);
    
    if (usrns.length === 0) {
      return null;
    }

    console.log(`🔍 Phase 3: Found USRNs ${usrns.join(', ')} for alert ${alert.id}`);

    // USRN to coordinate lookup would require OS database
    // For now, return null as this requires special licensing
    // TODO: Implement USRN database lookup if licensing allows
    
    return null;
  }

  /**
   * Phase 4: Fallback geocoding chain with multiple services
   */
  async fallbackGeocodingChain(alert) {
    const locationText = this.buildLocationSearchText(alert);
    
    console.log(`🔄 Phase 4: Fallback geocoding chain for "${locationText}"`);

    // Try HERE API first (best for UK)
    let result = await this.geocodeWithHERE(locationText);
    if (result) {
      return { ...result, source: 'here_geocoding', confidence: 85 };
    }

    // Try OpenStreetMap Nominatim
    result = await this.geocodeWithNominatim(locationText);
    if (result) {
      return { ...result, source: 'nominatim_geocoding', confidence: 75 };
    }

    // Try MapBox as final fallback
    result = await this.geocodeWithMapBox(locationText);
    if (result) {
      return { ...result, source: 'mapbox_geocoding', confidence: 70 };
    }

    return null;
  }

  /**
   * Phase 5: Match against enhanced known locations
   */
  async matchKnownLocations(alert) {
    const locationText = this.buildLocationSearchText(alert).toLowerCase();
    
    console.log(`📍 Phase 5: Matching known locations for "${locationText}"`);

    // Direct matches
    for (const [key, coords] of Object.entries(ENHANCED_KNOWN_LOCATIONS)) {
      if (locationText.includes(key)) {
        return {
          lat: coords.lat,
          lng: coords.lng,
          source: coords.source,
          confidence: coords.confidence,
          metadata: { matchedKey: key }
        };
      }
    }

    // Fuzzy matching for road numbers and areas
    const roadMatch = locationText.match(/\b(a\d+|m\d+|a\d+\(m\))\b/);
    if (roadMatch) {
      const roadNumber = roadMatch[1];
      for (const [key, coords] of Object.entries(ENHANCED_KNOWN_LOCATIONS)) {
        if (key.includes(roadNumber)) {
          return {
            lat: coords.lat,
            lng: coords.lng,
            source: coords.source,
            confidence: coords.confidence - 10, // Lower confidence for fuzzy match
            metadata: { fuzzyMatch: roadNumber, matchedKey: key }
          };
        }
      }
    }

    return null;
  }

  /**
   * Build comprehensive location search text from alert data
   */
  buildLocationSearchText(alert) {
    const parts = [
      alert.location,
      alert.sm_location_description,
      alert.sm_street_name,
      alert.sm_area_name,
      alert.title,
      alert.description
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Extract UK postcodes from text using multiple patterns
   */
  extractPostcodes(text) {
    if (!text) return [];

    const postcodes = [];
    
    for (const pattern of UK_POSTCODE_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const postcode = match[1].toUpperCase().replace(/\s+/g, ' ').trim();
        if (!postcodes.includes(postcode)) {
          postcodes.push(postcode);
        }
      }
    }

    return postcodes;
  }

  /**
   * Extract USRN numbers from text
   */
  extractUSRNs(text) {
    if (!text) return [];

    const usrns = [];
    let match;
    
    while ((match = USRN_PATTERN.exec(text)) !== null) {
      const usrn = match[1];
      if (!usrns.includes(usrn)) {
        usrns.push(usrn);
      }
    }

    return usrns;
  }

  /**
   * Lookup postcode using Ordnance Survey CodePoint API
   */
  async lookupPostcodeOrdnanceSurvey(postcode) {
    try {
      // Free Ordnance Survey CodePoint API endpoint
      const fetch = await getFetch();
      const url = `https://api.ordnancesurvey.co.uk/places/v1/addresses/postcode`;
      
      const params = new URLSearchParams({
        postcode: postcode,
        dataset: 'LPI',
        lr: 'EN', // English language
        format: 'JSON'
      });

      // Note: Requires OS API key - using free tier
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          if (result.LPI && result.LPI.length > 0) {
            const location = result.LPI[0];
            return {
              lat: parseFloat(location.LAT),
              lng: parseFloat(location.LNG),
              metadata: {
                postcode: postcode,
                address: location.ADDRESS,
                localAuthority: location.LOCAL_CUSTODIAN_CODE
              }
            };
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Ordnance Survey postcode lookup failed:`, error.message);
    }

    // Fallback to free postcode lookup service
    return await this.lookupPostcodeFree(postcode);
  }

  /**
   * Free postcode lookup fallback
   */
  async lookupPostcodeFree(postcode) {
    try {
      const fetch = await getFetch();
      const cleanPostcode = postcode.replace(/\s+/g, '');
      const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`;

      const response = await fetch(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Go-BARRY/3.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 200 && data.result) {
          return {
            lat: data.result.latitude,
            lng: data.result.longitude,
            metadata: {
              postcode: postcode,
              district: data.result.admin_district,
              region: data.result.region
            }
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Free postcode lookup failed:`, error.message);
    }

    return null;
  }

  /**
   * Geocode using HERE API
   */
  async geocodeWithHERE(location) {
    if (!HERE_API_KEY) {
      return null;
    }

    try {
      const fetch = await getFetch();
      const params = new URLSearchParams({
        q: `${location}, North East England, UK`,
        apiKey: HERE_API_KEY,
        limit: 1,
        lang: 'en-GB'
      });

      const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`, {
        timeout: 8000
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            lat: item.position.lat,
            lng: item.position.lng,
            metadata: {
              address: item.title,
              relevance: item.scoring?.queryScore || 0,
              resultType: item.resultType
            }
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ HERE geocoding failed:`, error.message);
    }

    return null;
  }

  /**
   * Geocode using OpenStreetMap Nominatim
   */
  async geocodeWithNominatim(location) {
    try {
      const fetch = await getFetch();
      const params = new URLSearchParams({
        q: `${location}, North East England, UK`,
        format: 'json',
        limit: 1,
        countrycodes: 'gb',
        'accept-language': 'en'
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Go-BARRY/3.0 (traffic.management@barry.co.uk)'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const item = data[0];
          return {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            metadata: {
              address: item.display_name,
              importance: item.importance,
              osm_type: item.osm_type
            }
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Nominatim geocoding failed:`, error.message);
    }

    return null;
  }

  /**
   * Geocode using MapBox (existing implementation)
   */
  async geocodeWithMapBox(location) {
    if (!MAPBOX_TOKEN) {
      return null;
    }

    try {
      const fetch = await getFetch();
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: 'GB',
        proximity: '-1.6178,54.9783', // Newcastle
        types: 'address,poi,postcode,place',
        limit: 1
      });

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?${params}`;

      const response = await fetch(url, {
        timeout: 8000
      });

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.center;
          return {
            lat: lat,
            lng: lng,
            metadata: {
              address: feature.place_name,
              relevance: feature.relevance,
              place_type: feature.place_type
            }
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ MapBox geocoding failed:`, error.message);
    }

    return null;
  }

  /**
   * Parse work boundary data from Street Manager
   */
  parseWorkBoundary(boundaryData) {
    if (!boundaryData) return null;

    try {
      // Handle various boundary data formats
      if (typeof boundaryData === 'string') {
        // Try parsing as geometry string
        const parsed = parseStreetManagerGeometry(boundaryData);
        if (parsed) {
          return {
            lat: parsed.lat,
            lng: parsed.lng,
            source: 'streetmanager_boundary',
            confidence: 85,
            metadata: { boundaryType: 'geometry_string' }
          };
        }
      }

      if (typeof boundaryData === 'object' && boundaryData.coordinates) {
        // Handle GeoJSON-like format
        if (Array.isArray(boundaryData.coordinates)) {
          const coords = boundaryData.coordinates[0]; // First coordinate pair
          if (coords && coords.length >= 2) {
            return {
              lat: coords[1],
              lng: coords[0],
              source: 'streetmanager_boundary_geojson',
              confidence: 85,
              metadata: { boundaryType: 'geojson' }
            };
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Work boundary parsing failed:`, error.message);
    }

    return null;
  }

  /**
   * Apply coordinate result to alert
   */
  applyCoordinateResult(alert, result) {
    return {
      ...alert,
      coordinates: [result.lat, result.lng],
      coordinateSource: result.source,
      coordinateConfidence: result.confidence,
      geocodingMetadata: {
        ...result.metadata,
        enhancedAt: new Date().toISOString(),
        method: 'enhanced_coordinate_service'
      }
    };
  }

  /**
   * Apply default coordinates (Newcastle city center)
   */
  applyDefaultCoordinates(alert) {
    return {
      ...alert,
      coordinates: [54.9783, -1.6178], // Newcastle default
      coordinateSource: 'default_newcastle',
      coordinateConfidence: 10, // Very low confidence
      geocodingMetadata: {
        reason: 'no_coordinates_found',
        enhancedAt: new Date().toISOString(),
        method: 'default_fallback'
      }
    };
  }

  /**
   * Validate coordinates are within reasonable bounds for UK
   */
  isValidCoordinate(lat, lng) {
    return lat >= 49.0 && lat <= 61.0 && lng >= -8.0 && lng <= 2.0;
  }

  /**
   * Generate cache key for coordinate lookup
   */
  generateCacheKey(alert) {
    const keyParts = [
      alert.location,
      alert.sm_location_description,
      alert.sm_street_name,
      alert.sm_easting,
      alert.sm_northing
    ].filter(Boolean);

    return `coord_${keyParts.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      successCount: this.successCount,
      successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
      cacheHits: this.cacheHits,
      cacheHitRate: this.requestCount > 0 ? (this.cacheHits / this.requestCount * 100).toFixed(2) + '%' : '0%',
      cacheSize: coordinateCache.size(),
      postcodeCacheSize: postcodeCache.size()
    };
  }

  /**
   * Clear all caches (memory management)
   */
  clearCaches() {
    coordinateCache.clear();
    postcodeCache.clear();
    console.log('🗑️ Enhanced coordinate service caches cleared');
  }

  /**
   * Persist enhanced coordinates back to the database
   * Saves the enhanced coordinates to avoid re-processing in the future
   * @param {string} alertId - The alert/streetwork ID
   * @param {Object} coordinates - The enhanced coordinates [lat, lng]
   * @param {string} coordinateSource - Source of the coordinates
   * @param {number} coordinateConfidence - Confidence level (0-100)
   * @param {Object} geocodingMetadata - Additional metadata from geocoding
   */
  async persistEnhancedCoordinates(alertId, coordinates, coordinateSource, coordinateConfidence, geocodingMetadata) {
    try {
      if (!alertId || !coordinates || coordinates.length < 2) {
        console.warn('⚠️ Cannot persist invalid coordinates for alert:', alertId);
        return { success: false, error: 'Invalid coordinate data' };
      }

      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        console.warn('⚠️ Supabase client not available for coordinate persistence');
        return { success: false, error: 'Database not available' };
      }

      const [latitude, longitude] = coordinates;
      const updateData = {
        latitude: latitude,
        longitude: longitude,
        coordinate_source: coordinateSource,
        coordinate_confidence: coordinateConfidence,
        coordinate_enhanced_at: new Date().toISOString(),
        geocoding_metadata: geocodingMetadata
      };

      // Try to update streetworks table first (most common)
      const { data: streetworkData, error: streetworkError } = await supabaseClient
        .from('streetworks')
        .update(updateData)
        .eq('id', alertId)
        .select('id')
        .maybeSingle();

      if (!streetworkError && streetworkData) {
        console.log(`✅ Enhanced coordinates persisted to streetworks table for ${alertId}: [${latitude}, ${longitude}] (${coordinateSource}, ${coordinateConfidence}%)`);
        return { success: true, table: 'streetworks', id: streetworkData.id };
      }

      // If not found in streetworks, try roadworks table
      const { data: roadworkData, error: roadworkError } = await supabaseClient
        .from('roadworks')
        .update({
          coordinates: JSON.stringify([latitude, longitude]),
          coordinate_source: coordinateSource,
          coordinate_confidence: coordinateConfidence,
          coordinate_enhanced_at: new Date().toISOString(),
          geocoding_metadata: geocodingMetadata
        })
        .eq('id', alertId)
        .select('id')
        .maybeSingle();

      if (!roadworkError && roadworkData) {
        console.log(`✅ Enhanced coordinates persisted to roadworks table for ${alertId}: [${latitude}, ${longitude}] (${coordinateSource}, ${coordinateConfidence}%)`);
        return { success: true, table: 'roadworks', id: roadworkData.id };
      }

      // Try manual_incidents table as final attempt
      const { data: incidentData, error: incidentError } = await supabaseClient
        .from('manual_incidents')
        .update({
          coordinates: JSON.stringify([latitude, longitude]),
          coordinate_source: coordinateSource,
          coordinate_confidence: coordinateConfidence,
          coordinate_enhanced_at: new Date().toISOString(),
          geocoding_metadata: geocodingMetadata
        })
        .eq('id', alertId)
        .select('id')
        .maybeSingle();

      if (!incidentError && incidentData) {
        console.log(`✅ Enhanced coordinates persisted to manual_incidents table for ${alertId}: [${latitude}, ${longitude}] (${coordinateSource}, ${coordinateConfidence}%)`);
        return { success: true, table: 'manual_incidents', id: incidentData.id };
      }

      console.warn(`⚠️ Could not find alert ${alertId} in any table for coordinate persistence`);
      return { success: false, error: 'Alert not found in database' };

    } catch (error) {
      console.error(`❌ Error persisting enhanced coordinates for ${alertId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enhanced coordinate processing with automatic persistence
   * This is the main method that should be called to enhance and persist coordinates
   * @param {Object} alert - Alert object with location information
   * @param {boolean} persistToDB - Whether to persist coordinates to database (default: true)
   * @returns {Promise<Object>} Enhanced alert with coordinates and persistence status
   */
  async enhanceAndPersistCoordinates(alert, persistToDB = true) {
    try {
      // First enhance the coordinates
      const enhancedAlert = await this.enhanceAlertCoordinates(alert);
      
      // If enhancement was successful and coordinates have good confidence, persist them
      if (persistToDB && 
          enhancedAlert.coordinates && 
          enhancedAlert.coordinateConfidence >= 70 && // Only persist high-confidence coordinates
          enhancedAlert.coordinateSource !== 'default_newcastle') { // Don't persist default coordinates
        
        console.log(`💾 Persisting enhanced coordinates for ${alert.id}...`);
        
        const persistResult = await this.persistEnhancedCoordinates(
          alert.id,
          enhancedAlert.coordinates,
          enhancedAlert.coordinateSource,
          enhancedAlert.coordinateConfidence,
          enhancedAlert.geocodingMetadata
        );
        
        // Add persistence metadata to the result
        enhancedAlert.coordinatePersisted = persistResult.success;
        enhancedAlert.persistenceTable = persistResult.table;
        enhancedAlert.persistenceError = persistResult.error;
        
        if (persistResult.success) {
          console.log(`✅ Coordinates successfully enhanced and persisted for ${alert.id}`);
        } else {
          console.warn(`⚠️ Coordinates enhanced but persistence failed for ${alert.id}: ${persistResult.error}`);
        }
      } else if (persistToDB) {
        console.log(`📝 Skipping persistence for ${alert.id}: confidence=${enhancedAlert.coordinateConfidence}%, source=${enhancedAlert.coordinateSource}`);
        enhancedAlert.coordinatePersisted = false;
        enhancedAlert.persistenceReason = 'low_confidence_or_default';
      }
      
      return enhancedAlert;
      
    } catch (error) {
      console.error(`❌ Error in enhanceAndPersistCoordinates for ${alert.id}:`, error.message);
      
      // Return the original alert with error information
      return {
        ...alert,
        coordinateEnhancementError: error.message,
        coordinatePersisted: false
      };
    }
  }
}

// Export singleton instance
export default new EnhancedCoordinateService();