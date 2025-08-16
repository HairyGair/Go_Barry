// backend/utils/bngToLatLng.js
// Convert British National Grid (EPSG:27700) to WGS84 (lat/lng)
// Based on Ordnance Survey transformation parameters

/**
 * Convert British National Grid coordinates to WGS84 lat/lng
 * @param {number} easting - X coordinate in BNG
 * @param {number} northing - Y coordinate in BNG
 * @returns {{lat: number, lng: number}} WGS84 coordinates
 */
export function bngToLatLng(easting, northing) {
  // BNG constants
  const a = 6377563.396; // Airy 1830 major semi-axis
  const b = 6356256.909; // Airy 1830 minor semi-axis
  const F0 = 0.9996012717; // NatGrid scale factor on central meridian
  const lat0 = 49 * Math.PI / 180; // NatGrid true origin latitude
  const lon0 = -2 * Math.PI / 180; // NatGrid true origin longitude
  const N0 = -100000; // Northing of true origin
  const E0 = 400000; // Easting of true origin
  const e2 = 1 - (b * b) / (a * a); // eccentricity squared
  const n = (a - b) / (a + b);
  const n2 = n * n;
  const n3 = n * n * n;

  let lat = lat0;
  let M = 0;
  
  do {
    lat = (northing - N0 - M) / (a * F0) + lat;
    const Ma = (1 + n + (5/4) * n2 + (5/4) * n3) * (lat - lat0);
    const Mb = (3 * n + 3 * n * n + (21/8) * n3) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
    const Mc = ((15/8) * n2 + (15/8) * n3) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0));
    const Md = (35/24) * n3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0));
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
  const VIII = tanLat / (24 * rho * nu3) * (5 + 3 * tan2lat + eta2 - 9 * tan2lat * eta2);
  const IX = tanLat / (720 * rho * nu5) * (61 + 90 * tan2lat + 45 * tan4lat);
  const X = secLat / nu;
  const XI = secLat / (6 * nu3) * (nu / rho + 2 * tan2lat);
  const XII = secLat / (120 * nu5) * (5 + 28 * tan2lat + 24 * tan4lat);
  const XIIA = secLat / (5040 * nu7) * (61 + 662 * tan2lat + 1320 * tan4lat + 720 * tan6lat);

  const dE = (easting - E0);
  const dE2 = dE * dE;
  const dE3 = dE2 * dE;
  const dE4 = dE2 * dE2;
  const dE5 = dE3 * dE2;
  const dE6 = dE4 * dE2;
  const dE7 = dE5 * dE2;
  
  lat = lat - VII * dE2 + VIII * dE4 - IX * dE6;
  const lon = lon0 + X * dE - XI * dE3 + XII * dE5 - XIIA * dE7;

  // Convert to degrees
  const latDegrees = lat * 180 / Math.PI;
  const lngDegrees = lon * 180 / Math.PI;

  return { lat: latDegrees, lng: lngDegrees };
}

/**
 * Parse StreetManager works_location_coordinates and extract representative point
 * @param {string} geometryString - POINT/POLYGON/LINESTRING from StreetManager
 * @returns {{lat: number, lng: number, source: string}} Representative coordinate
 */
export function parseStreetManagerGeometry(geometryString) {
  if (!geometryString || typeof geometryString !== 'string') {
    return null;
  }

  const geomUpper = geometryString.trim().toUpperCase();
  
  try {
    if (geomUpper.startsWith('POINT(')) {
      return parsePointToBNG(geometryString);
    } else if (geomUpper.startsWith('POLYGON(')) {
      return parsePolygonToBNG(geometryString);
    } else if (geomUpper.startsWith('LINESTRING(')) {
      return parseLineStringToBNG(geometryString);
    } else {
      console.warn(`Unknown geometry type: ${geometryString.substring(0, 50)}...`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to parse geometry: ${error.message}`);
    return null;
  }
}

/**
 * Parse POINT geometry from StreetManager
 * @param {string} pointString - POINT(easting northing)
 * @returns {{lat: number, lng: number, source: string}}
 */
export function parsePointToBNG(pointString) {
  const coordsString = pointString.replace(/^POINT\s*\(/i, '').replace(/\)$/, '');
  const [easting, northing] = coordsString.trim().split(/\s+/).map(Number);
  
  if (isNaN(easting) || isNaN(northing)) {
    throw new Error(`Invalid POINT coordinates: ${pointString}`);
  }
  
  const wgs84 = bngToLatLng(easting, northing);
  return {
    ...wgs84,
    source: 'streetmanager_point_bng'
  };
}

/**
 * Parse POLYGON geometry from StreetManager and return centroid
 * @param {string} polygonString - POLYGON((coords))
 * @returns {{lat: number, lng: number, source: string}}
 */
export function parsePolygonToBNG(polygonString) {
  // Extract coordinates from POLYGON((x y,x y,x y,x y))
  const coordsString = polygonString.replace(/^POLYGON\s*\(\(/i, '').replace(/\)\)$/, '');
  
  const coordinates = coordsString.split(',').map(coord => {
    const [easting, northing] = coord.trim().split(/\s+/).map(Number);
    return { easting, northing };
  }).filter(coord => !isNaN(coord.easting) && !isNaN(coord.northing));
  
  if (coordinates.length === 0) {
    throw new Error(`No valid coordinates in POLYGON: ${polygonString}`);
  }
  
  // Calculate centroid (simple average for small polygons)
  const centroidEasting = coordinates.reduce((sum, coord) => sum + coord.easting, 0) / coordinates.length;
  const centroidNorthing = coordinates.reduce((sum, coord) => sum + coord.northing, 0) / coordinates.length;
  
  const wgs84 = bngToLatLng(centroidEasting, centroidNorthing);
  return {
    ...wgs84,
    source: 'streetmanager_polygon_centroid_bng'
  };
}

/**
 * Parse and convert LINESTRING coordinates from BNG to lat/lng
 * @param {string} lineString - LINESTRING format from StreetManager
 * @returns {{lat: number, lng: number, source: string}} Midpoint of line
 */
export function parseLineStringToBNG(lineString) {
  // Remove LINESTRING() wrapper
  const coordsString = lineString.replace(/^LINESTRING\s*\(/i, '').replace(/\)$/, '');
  
  // Split into coordinate pairs
  const coordinates = coordsString.split(',').map(coord => {
    const [easting, northing] = coord.trim().split(/\s+/).map(Number);
    return { easting, northing };
  }).filter(coord => !isNaN(coord.easting) && !isNaN(coord.northing));
  
  if (coordinates.length === 0) {
    throw new Error(`No valid coordinates in LINESTRING: ${lineString}`);
  }
  
  // Calculate midpoint for representative location
  let midpointEasting, midpointNorthing;
  
  if (coordinates.length === 1) {
    // Single point
    midpointEasting = coordinates[0].easting;
    midpointNorthing = coordinates[0].northing;
  } else {
    // Multiple points - use middle point or interpolate
    const midIndex = Math.floor(coordinates.length / 2);
    midpointEasting = coordinates[midIndex].easting;
    midpointNorthing = coordinates[midIndex].northing;
  }
  
  // Convert BNG to lat/lng
  const wgs84 = bngToLatLng(midpointEasting, midpointNorthing);
  return {
    ...wgs84,
    source: 'streetmanager_linestring_midpoint_bng'
  };
}
