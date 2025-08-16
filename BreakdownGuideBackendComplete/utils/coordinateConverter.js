// backend/utils/coordinateConverter.js
// Convert British National Grid (OSGB36) to WGS84 lat/lng for mapping

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

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
 * Get centroid of a LINESTRING for representative map point
 * @param {Array} coordinates - Array of [easting, northing] pairs
 * @returns {Array} [easting, northing] of centroid
 */
export function getLinestringCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;
  if (coordinates.length === 1) return coordinates[0];
  
  const sumEasting = coordinates.reduce((sum, coord) => sum + coord[0], 0);
  const sumNorthing = coordinates.reduce((sum, coord) => sum + coord[1], 0);
  
  return [
    sumEasting / coordinates.length,
    sumNorthing / coordinates.length
  ];
}

/**
 * Convert British National Grid (OSGB36) to WGS84 lat/lng
 * Using approximate transformation suitable for UK roadworks
 * @param {number} easting - OSGB36 easting (meters)
 * @param {number} northing - OSGB36 northing (meters) 
 * @returns {Array} [latitude, longitude] in WGS84
 */
export function osgb36ToWGS84(easting, northing) {
  // Validate input ranges for UK
  if (easting < 0 || easting > 800000 || northing < 0 || northing > 1400000) {
    console.warn(`OSGB36 coordinates out of UK range: ${easting}, ${northing}`);
    return null;
  }
  
  // Constants for OSGB36 to WGS84 transformation
  const a = 6377563.396;      // OSGB36 semi-major axis
  const b = 6356256.909;      // OSGB36 semi-minor axis
  const F0 = 0.9996012717;    // Scale factor on central meridian
  const lat0 = 49 * Math.PI / 180;  // Latitude of true origin (radians)
  const lon0 = -2 * Math.PI / 180;  // Longitude of true origin (radians)
  const N0 = -100000;         // Northing of true origin
  const E0 = 400000;          // Easting of true origin
  
  const e2 = 1 - (b * b) / (a * a);  // Eccentricity squared
  const n = (a - b) / (a + b);
  const n2 = n * n;
  const n3 = n * n * n;
  
  let lat = lat0;
  let M = 0;
  
  // Iterative calculation for latitude
  do {
    lat = (northing - N0 - M) / (a * F0) + lat;
    
    const Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (lat - lat0);
    const Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
    const Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(lat - lat0)) * Math.cos(2*(lat + lat0));
    const Md = (35/24)*n3 * Math.sin(3*(lat - lat0)) * Math.cos(3*(lat + lat0));
    
    M = b * F0 * (Ma - Mb + Mc - Md);
  } while (northing - N0 - M >= 0.00001);
  
  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const nu = a * F0 / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const eta2 = nu / rho - 1;
  
  const tanLat = Math.tan(lat);
  const tan2lat = tanLat * tanLat;
  const tan4lat = tan2lat * tan2lat;
  const tan6lat = tan4lat * tan2lat;
  const secLat = 1 / cosLat;
  
  const nu3 = nu * nu * nu;
  const nu5 = nu3 * nu * nu;
  const nu7 = nu5 * nu * nu;
  
  const VII = tanLat / (2 * rho * nu);
  const VIII = tanLat / (24 * rho * nu3) * (5 + 3*tan2lat + eta2 - 9*tan2lat*eta2);
  const IX = tanLat / (720 * rho * nu5) * (61 + 90*tan2lat + 45*tan4lat);
  
  const X = secLat / nu;
  const XI = secLat / (6 * nu3) * (nu/rho + 2*tan2lat);
  const XII = secLat / (120 * nu5) * (5 + 28*tan2lat + 24*tan4lat);
  const XIIA = secLat / (5040 * nu7) * (61 + 662*tan2lat + 1320*tan4lat + 720*tan6lat);
  
  const dE = easting - E0;
  const dE2 = dE * dE;
  const dE3 = dE2 * dE;
  const dE4 = dE2 * dE2;
  const dE5 = dE3 * dE2;
  const dE6 = dE3 * dE3;
  const dE7 = dE4 * dE3;
  
  lat = lat - VII*dE2 + VIII*dE4 - IX*dE6;
  const lon = lon0 + X*dE - XI*dE3 + XII*dE5 - XIIA*dE7;
  
  // Convert to degrees
  const latitude = lat * 180 / Math.PI;
  const longitude = lon * 180 / Math.PI;
  
  // Validate result is within UK bounds
  if (latitude < 49.5 || latitude > 61 || longitude < -8 || longitude > 2) {
    console.warn(`Converted coordinates out of UK bounds: ${latitude}, ${longitude}`);
    return null;
  }
  
  // Limit to 6 decimal places to prevent issues with map services
  return [
    parseFloat(latitude.toFixed(6)),
    parseFloat(longitude.toFixed(6))
  ];
}

/**
 * Process Street Manager coordinates from multiple sources
 * @param {Object} roadwork - Roadwork record with coordinate data
 * @returns {Object} Enhanced roadwork with processed coordinates
 */
/**
 * Build a geocoding-friendly address from roadwork data
 * @param {Object} alert - Roadwork record with location data
 * @returns {string} Formatted address for geocoding
 */
export function buildGeocodingAddress(alert) {
  const parts = [];
  
  // Street name
  if (alert.sm_street_name) {
    parts.push(alert.sm_street_name);
  }
  
  // Town/area (prioritize this over council)
  if (alert.sm_town) {
    parts.push(alert.sm_town);
  } else if (alert.sm_area_name) {
    parts.push(alert.sm_area_name);
  }
  
  // Only add council if no town/area AND clean it up
  if (!alert.sm_town && !alert.sm_area_name && alert.sm_highway_authority) {
    const cleanedAuthority = alert.sm_highway_authority
      .replace(/COUNCIL$/i, '')
      .replace(/CITY$/i, '')
      .trim();
    parts.push(cleanedAuthority);
  }
  
  // Add UK but not "North East England"
  parts.push('UK');
  
  return parts.filter(Boolean).join(', ');
}

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
    console.log(`🔍 Geocoding address: "${address}"`);

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,  // Use the address as-is (already includes UK)
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

export async function processStreetManagerCoordinates(roadwork) {
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
      const address = buildGeocodingAddress(roadwork);
      console.log(`🗺️ No coordinates found for ${roadwork.sm_reference || roadwork.id}, attempting geocoding...`);
      
      const geocoded = await geocodeAddress(address);
      if (geocoded) {
        return {
          ...roadwork,
          coordinates: [geocoded.lat, geocoded.lng],
          coordinateSource: 'geocoded_fallback',
          coordinateAccuracy: geocoded.precision === 'ROOFTOP' ? 'high' : 'medium',
          geocodedAddress: geocoded.formattedAddress,
          coordinateError: null
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
    console.log(`🗺️ Processing coordinates for ${roadwork.sm_reference || roadwork.id} (${sourceType}):`, coordinateData.type === 'point' ? `[${coordinateData.easting}, ${coordinateData.northing}]` : coordinateData.wktString?.substring(0, 50) + '...');
    
    let easting, northing, pointsCount = 1;
    
    if (coordinateData.type === 'point') {
      // Direct easting/northing coordinates
      easting = coordinateData.easting;
      northing = coordinateData.northing;
      pointsCount = 1;
    } else {
      // LINESTRING coordinates - parse and get centroid
      const osgbCoords = parseWKTLinestring(coordinateData.wktString);
      if (osgbCoords.length === 0) {
        return {
          ...roadwork,
          coordinates: null,
          coordinateSource: 'failed_parse',
          coordinateError: 'Failed to parse LINESTRING coordinates'
        };
      }
      
      // Get representative point (centroid for multi-point, first point for single)
      const centroid = getLinestringCentroid(osgbCoords);
      if (!centroid) {
        return {
          ...roadwork,
          coordinates: null,
          coordinateSource: 'failed_centroid',
          coordinateError: 'Failed to calculate centroid'
        };
      }
      
      [easting, northing] = centroid;
      pointsCount = osgbCoords.length;
    }
    
    // Convert OSGB36 to WGS84 lat/lng
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
    console.log(`✅ Converted ${roadwork.sm_reference || roadwork.id}: [${easting}, ${northing}] → [${latitude.toFixed(6)}, ${longitude.toFixed(6)}]`);
    
    return {
      ...roadwork,
      coordinates: [latitude, longitude],
      coordinateSource: `street_manager_converted_${sourceType}`,
      coordinateAccuracy: 'high',
      originalCoordinates: { easting, northing },
      coordinatePoints: pointsCount
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
