// backend/utils/coordinateConverter.js
// Convert British National Grid (OSGB36) to WGS84 lat/lng for mapping

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
  
  return [latitude, longitude];
}

/**
 * Process Street Manager coordinates from webhook data OR direct field
 * @param {Object} roadwork - Roadwork record with works_location_coordinates
 * @returns {Object} Enhanced roadwork with processed coordinates
 */
export function processStreetManagerCoordinates(roadwork) {
  // Try multiple data sources for coordinates
  let wktString = null;
  let sourceType = 'none';
  
  // 1. Try webhook data (original format)
  if (roadwork.raw_webhook_data?.object_data?.works_location_coordinates) {
    wktString = roadwork.raw_webhook_data.object_data.works_location_coordinates;
    sourceType = 'webhook';
  }
  // 2. Try direct field (Supabase format)
  else if (roadwork.works_location_coordinates) {
    wktString = roadwork.works_location_coordinates;
    sourceType = 'direct';
  }
  
  if (!wktString) {
    return {
      ...roadwork,
      coordinates: null,
      coordinateSource: 'none',
      coordinateError: 'No works_location_coordinates found in webhook data or direct field'
    };
  }
  
  try {
    console.log(`🗺️ Processing coordinates for ${roadwork.sm_reference || roadwork.id} (${sourceType}): ${wktString.substring(0, 50)}...`);
    
    // Parse LINESTRING coordinates
    const osgbCoords = parseWKTLinestring(wktString);
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
    
    // Convert to WGS84 lat/lng
    const [easting, northing] = centroid;
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
      coordinatePoints: osgbCoords.length
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
