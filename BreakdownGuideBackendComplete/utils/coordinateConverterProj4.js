// backend/utils/coordinateConverterProj4.js
// Professional-grade British National Grid (OSGB36) to WGS84 conversion using proj4
import proj4 from 'proj4';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Define coordinate reference systems
proj4.defs([
  // British National Grid (OSGB36 / British National Grid)
  ['EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs +type=crs'],
  
  // WGS84 (GPS coordinates)
  ['EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs']
]);

/**
 * Parse WKT LINESTRING and extract coordinates
 * @param {string} wktString - LINESTRING(easting northing, easting northing, ...)
 * @returns {Array} Array of [easting, northing] coordinate pairs
 */
export function parseWKTLinestring(wktString) {
  if (!wktString || typeof wktString !== 'string') return [];
  
  try {
    // Match LINESTRING format: "LINESTRING(x1 y1,x2 y2,x3 y3)"
    const match = wktString.match(/LINESTRING\s*\(\s*([^)]+)\s*\)/i);
    if (!match) return [];
    
    const coordString = match[1];
    const pairs = coordString.split(',');
    
    const coordinates = pairs.map(pair => {
      const [easting, northing] = pair.trim().split(/\s+/).map(parseFloat);
      return [easting, northing];
    }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
    
    return coordinates;
  } catch (error) {
    console.warn('Failed to parse WKT LINESTRING:', wktString, error);
    return [];
  }
}

/**
 * Get the most representative point from a LINESTRING
 * For road works, this uses the first point (start of works) rather than centroid
 * as it's more likely to be the actual work location
 * @param {Array} coordinates - Array of [easting, northing] pairs
 * @returns {Array} [easting, northing] of representative point
 */
export function getRepresentativePoint(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;
  
  // For single point, return it
  if (coordinates.length === 1) return coordinates[0];
  
  // For multi-point linestrings, use the first point as it's typically 
  // where the works start/are most significant
  // Alternative: use middle point for better representation of entire works
  const useMiddlePoint = true;
  
  if (useMiddlePoint && coordinates.length > 2) {
    // Use middle point of linestring
    const middleIndex = Math.floor(coordinates.length / 2);
    return coordinates[middleIndex];
  }
  
  // Default to first point
  return coordinates[0];
}

/**
 * Calculate bounding box of coordinates for validation
 * @param {Array} coordinates - Array of [easting, northing] pairs
 * @returns {Object} Bounding box {minE, maxE, minN, maxN}
 */
export function calculateBoundingBox(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;
  
  let minE = Infinity, maxE = -Infinity;
  let minN = Infinity, maxN = -Infinity;
  
  coordinates.forEach(([e, n]) => {
    minE = Math.min(minE, e);
    maxE = Math.max(maxE, e);
    minN = Math.min(minN, n);
    maxN = Math.max(maxN, n);
  });
  
  return { minE, maxE, minN, maxN };
}

/**
 * Convert British National Grid (OSGB36) to WGS84 lat/lng using proj4
 * Professional-grade transformation with full datum shift
 * @param {number} easting - OSGB36 easting (meters)
 * @param {number} northing - OSGB36 northing (meters) 
 * @returns {Array} [latitude, longitude] in WGS84 with 7 decimal precision
 */
export function osgb36ToWGS84(easting, northing) {
  // Validate input ranges for UK
  if (easting < 0 || easting > 800000 || northing < 0 || northing > 1400000) {
    console.warn(`OSGB36 coordinates out of UK range: ${easting}, ${northing}`);
    return null;
  }
  
  try {
    // Transform from OSGB36 to WGS84
    const [longitude, latitude] = proj4('EPSG:27700', 'EPSG:4326', [easting, northing]);
    
    // Validate result is within UK bounds
    if (latitude < 49.5 || latitude > 61 || longitude < -8 || longitude > 2) {
      console.warn(`Converted coordinates out of UK bounds: ${latitude}, ${longitude}`);
      return null;
    }
    
    // Return with high precision (7 decimal places = ~1.1cm accuracy)
    return [
      parseFloat(latitude.toFixed(7)),
      parseFloat(longitude.toFixed(7))
    ];
  } catch (error) {
    console.error(`Proj4 conversion error for ${easting}, ${northing}:`, error);
    return null;
  }
}

/**
 * Enhanced coordinate validation
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid for UK region
 */
export function validateUKCoordinates(lat, lng) {
  // UK bounding box with some margin
  const UK_BOUNDS = {
    minLat: 49.5,
    maxLat: 61.0,
    minLng: -8.0,
    maxLng: 2.0
  };
  
  return lat >= UK_BOUNDS.minLat && lat <= UK_BOUNDS.maxLat &&
         lng >= UK_BOUNDS.minLng && lng <= UK_BOUNDS.maxLng;
}

/**
 * Process Street Manager coordinates from multiple sources with caching
 * Enhanced version with proj4 conversion, caching, and better error handling
 * @param {Object} roadwork - Roadwork record with coordinate data
 * @param {Object} options - Processing options
 * @returns {Object} Enhanced roadwork with processed coordinates
 */
/**
 * Geocode an address using Google Maps Geocoding API
 * @param {string} address - Address to geocode
 * @returns {Object|null} { lat, lng } or null if failed
 */
export async function geocodeAddress(address) {
  if (!address || !process.env.GOOGLE_MAPS_API_KEY) {
    console.warn('No address to geocode or missing Google Maps API key');
    return null;
  }

  try {
    // Clean up the address for better geocoding results
    const cleanAddress = address
      .replace(/COUNTY COUNCIL/gi, '')
      .replace(/COUNCIL/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`🔍 Geocoding address: "${cleanAddress}"`);

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: cleanAddress + ', UK',  // Add UK to improve results
        region: 'uk',  // Bias results to UK
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address;
      
      console.log(`✅ Geocoded to: ${location.lat}, ${location.lng} (${formattedAddress})`);
      
      // Validate UK bounds
      if (location.lat >= 49.5 && location.lat <= 61 && location.lng >= -8 && location.lng <= 2) {
        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress,
          precision: response.data.results[0].geometry.location_type
        };
      } else {
        console.warn(`Geocoded location outside UK bounds: ${location.lat}, ${location.lng}`);
        return null;
      }
    } else {
      console.warn(`Geocoding failed: ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

export async function processStreetManagerCoordinates(roadwork, options = {}) {
  // Check if we have cached coordinates first
  if (roadwork.converted_coordinates && !options.forceRecalculate) {
    const cached = roadwork.converted_coordinates;
    const metadata = roadwork.coordinate_metadata || {};
    
    // Use cached coordinates if they're recent (within 30 days)
    const cacheAge = metadata.converted_at ? 
      (Date.now() - new Date(metadata.converted_at).getTime()) / (1000 * 60 * 60 * 24) : 
      Infinity;
      
    if (cacheAge < 30 && cached.lat && cached.lng) {
      console.log(`📦 Using cached coordinates for ${roadwork.sm_reference || roadwork.id}`);
      return {
        ...roadwork,
        coordinates: [cached.lat, cached.lng],
        coordinateSource: metadata.source || 'cached',
        coordinateAccuracy: cached.accuracy || 'high',
        coordinatePrecision: metadata.precision || '1.1cm',
        coordinateMetadata: metadata,
        cacheHit: true
      };
    }
  }
  
  // Original processing logic continues...
  // Try multiple data sources for coordinates
  let coordinateData = null;
  let sourceType = 'none';
  
  // 1. Try sm_easting and sm_northing (Supabase direct fields)
  if (roadwork.sm_easting && roadwork.sm_northing) {
    const easting = parseFloat(roadwork.sm_easting);
    const northing = parseFloat(roadwork.sm_northing);
    if (!isNaN(easting) && !isNaN(northing)) {
      coordinateData = { easting, northing, type: 'point' };
      sourceType = 'supabase_point';
    }
  }
  
  // 2. Try webhook data LINESTRING (original format)
  if (!coordinateData && roadwork.raw_webhook_data?.object_data?.works_location_coordinates) {
    coordinateData = { wktString: roadwork.raw_webhook_data.object_data.works_location_coordinates, type: 'linestring' };
    sourceType = 'webhook_linestring';
  }
  
  // 3. Try direct field LINESTRING (Supabase format)
  if (!coordinateData && roadwork.works_location_coordinates) {
    coordinateData = { wktString: roadwork.works_location_coordinates, type: 'linestring' };
    sourceType = 'direct_linestring';
  }
  
  if (!coordinateData) {
    // Try geocoding fallback if we have street information
    if (roadwork.sm_street_name) {
      const addressParts = [
        roadwork.sm_street_name,
        roadwork.sm_town || roadwork.sm_area,
        roadwork.sm_highway_authority
      ].filter(Boolean);
      
      const address = addressParts.join(', ');
      console.log(`🗺️ No coordinates found for ${roadwork.sm_reference || roadwork.id}, attempting geocoding...`);
      
      const geocoded = await geocodeAddress(address);
      if (geocoded) {
        // Prepare cache data for geocoded results
        const cacheData = {
          converted_coordinates: {
            lat: geocoded.lat,
            lng: geocoded.lng,
            accuracy: geocoded.precision === 'ROOFTOP' ? 'high' : 'medium'
          },
          coordinate_metadata: {
            converted_at: new Date().toISOString(),
            method: 'google_geocoding',
            source: 'geocoded_fallback',
            precision: geocoded.precision,
            confidence: geocoded.precision === 'ROOFTOP' ? 0.9 : 0.7,
            geocoded_address: geocoded.formattedAddress,
            verified: false
          }
        };
        
        return {
          ...roadwork,
          coordinates: [geocoded.lat, geocoded.lng],
          coordinateSource: 'geocoded_fallback',
          coordinateAccuracy: geocoded.precision === 'ROOFTOP' ? 'high' : 'medium',
          coordinatePrecision: geocoded.precision,
          geocodedAddress: geocoded.formattedAddress,
          coordinateError: null,
          cacheData: cacheData,
          shouldUpdateCache: true
        };
      }
    }
    
    return {
      ...roadwork,
      coordinates: null,
      coordinateSource: 'none',
      coordinateError: 'No coordinate data found and geocoding failed'
    };
  }
  
  try {
    console.log(`🗺️ Processing coordinates for ${roadwork.sm_reference || roadwork.id} (${sourceType}):`, 
      coordinateData.type === 'point' ? 
        `[${coordinateData.easting}, ${coordinateData.northing}]` : 
        coordinateData.wktString?.substring(0, 50) + '...'
    );
    
    let easting, northing, pointsCount = 1;
    let boundingBox = null;
    let allCoordinates = [];
    
    if (coordinateData.type === 'point') {
      // Direct easting/northing coordinates
      easting = coordinateData.easting;
      northing = coordinateData.northing;
      pointsCount = 1;
      allCoordinates = [[easting, northing]];
    } else {
      // LINESTRING coordinates - parse and get representative point
      const osgbCoords = parseWKTLinestring(coordinateData.wktString);
      if (osgbCoords.length === 0) {
        return {
          ...roadwork,
          coordinates: null,
          coordinateSource: 'failed_parse',
          coordinateError: 'Failed to parse LINESTRING coordinates'
        };
      }
      
      // Store all coordinates for potential future use
      allCoordinates = osgbCoords;
      
      // Get representative point (first/middle point instead of centroid)
      const representative = getRepresentativePoint(osgbCoords);
      if (!representative) {
        return {
          ...roadwork,
          coordinates: null,
          coordinateSource: 'failed_representative',
          coordinateError: 'Failed to get representative point'
        };
      }
      
      [easting, northing] = representative;
      pointsCount = osgbCoords.length;
      
      // Calculate bounding box for the entire works
      boundingBox = calculateBoundingBox(osgbCoords);
    }
    
    // Convert OSGB36 to WGS84 lat/lng using proj4
    const wgs84 = osgb36ToWGS84(easting, northing);
    
    if (!wgs84) {
      return {
        ...roadwork,
        coordinates: null,
        coordinateSource: 'failed_conversion',
        coordinateError: `Failed to convert OSGB36 ${easting}, ${northing} to WGS84`,
        originalCoordinates: { easting, northing }
      };
    }
    
    const [latitude, longitude] = wgs84;
    
    // Additional validation
    if (!validateUKCoordinates(latitude, longitude)) {
      return {
        ...roadwork,
        coordinates: null,
        coordinateSource: 'failed_validation',
        coordinateError: `Coordinates outside UK bounds: ${latitude}, ${longitude}`,
        originalCoordinates: { easting, northing }
      };
    }
    
    console.log(`✅ Converted ${roadwork.sm_reference || roadwork.id}: [${easting}, ${northing}] → [${latitude.toFixed(7)}, ${longitude.toFixed(7)}]`);
    
    // Convert all points if linestring (for future use)
    let allWgs84Points = null;
    if (coordinateData.type === 'linestring' && allCoordinates.length > 1) {
      allWgs84Points = allCoordinates.map(([e, n]) => {
        const wgs = osgb36ToWGS84(e, n);
        return wgs ? [wgs[0].toFixed(7), wgs[1].toFixed(7)] : null;
      }).filter(Boolean);
    }
    
    // Prepare cache data
    const cacheData = {
      converted_coordinates: {
        lat: latitude,
        lng: longitude,
        accuracy: 'high'
      },
      coordinate_metadata: {
        converted_at: new Date().toISOString(),
        method: 'proj4_osgb36_wgs84',
        source: `street_manager_converted_${sourceType}`,
        precision: '1.1cm',
        confidence: 0.95,
        points_count: pointsCount,
        has_all_points: !!allWgs84Points,
        representative_type: pointsCount > 2 ? 'middle' : 'first',
        verified: false
      }
    };
    
    return {
      ...roadwork,
      coordinates: [latitude, longitude],
      coordinateSource: `street_manager_converted_${sourceType}`,
      coordinateAccuracy: 'high',
      coordinatePrecision: '1.1cm',
      originalCoordinates: { easting, northing },
      coordinatePoints: pointsCount,
      coordinateBoundingBox: boundingBox,
      allCoordinatePoints: allWgs84Points, // All converted points for linestrings
      representativePointType: pointsCount > 2 ? 'middle' : 'first',
      cacheData: cacheData, // Include cache data for storage
      shouldUpdateCache: true
    };
    
  } catch (error) {
    console.error(`❌ Coordinate processing error for ${roadwork.sm_reference || roadwork.id}:`, error);
    return {
      ...roadwork,
      coordinates: null,
      coordinateSource: 'error',
      coordinateError: error.message
    };
  }
}

// Export both old function names for backward compatibility
export const processCoordinates = processStreetManagerCoordinates;

// Export a version check function
export function isProj4Available() {
  try {
    // Test proj4 is working
    const test = proj4('EPSG:27700', 'EPSG:4326', [400000, 300000]);
    return test && test.length === 2;
  } catch {
    return false;
  }
}
