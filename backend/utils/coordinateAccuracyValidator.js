// backend/utils/coordinateAccuracyValidator.js
// Enhanced coordinate accuracy validation for UK roadworks

/**
 * Validate coordinate accuracy based on known street geometry
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} streetName - Street name for context
 * @returns {Object} Validation result with confidence score
 */
export function validateCoordinateAccuracy(lat, lng, streetName) {
  const validation = {
    isValid: true,
    confidence: 1.0,
    issues: [],
    suggestions: []
  };

  // Check if coordinates are within UK bounds
  if (lat < 49.5 || lat > 61 || lng < -8 || lng > 2) {
    validation.isValid = false;
    validation.confidence = 0;
    validation.issues.push('Coordinates outside UK boundaries');
    return validation;
  }

  // Check for common coordinate errors
  
  // 1. Swapped lat/lng (common error)
  if (lng > 10 || lng < -90) {
    validation.isValid = false;
    validation.confidence = 0.1;
    validation.issues.push('Longitude value suggests coordinates may be swapped');
    validation.suggestions.push('Try swapping latitude and longitude values');
  }

  // 2. Missing decimal point (e.g., 54978300 instead of 54.978300)
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    validation.isValid = false;
    validation.confidence = 0;
    validation.issues.push('Coordinate values exceed valid ranges');
    validation.suggestions.push('Check if decimal point is missing');
  }

  // 3. Truncated coordinates (less than 4 decimal places = low accuracy)
  const latDecimals = (lat.toString().split('.')[1] || '').length;
  const lngDecimals = (lng.toString().split('.')[1] || '').length;
  
  if (latDecimals < 4 || lngDecimals < 4) {
    validation.confidence *= 0.7;
    validation.issues.push(`Low precision: only ${Math.min(latDecimals, lngDecimals)} decimal places`);
    validation.suggestions.push('Request higher precision coordinates for better accuracy');
  }

  // 4. Coordinates at exact grid intersections (suspiciously round numbers)
  if (lat % 0.01 === 0 && lng % 0.01 === 0) {
    validation.confidence *= 0.8;
    validation.issues.push('Coordinates appear to be rounded to grid intersection');
    validation.suggestions.push('May indicate approximate location rather than precise point');
  }

  // 5. Check for default/placeholder coordinates
  const commonDefaults = [
    [0, 0],
    [51.5074, -0.1278], // London center
    [54.9783, -1.6178], // Newcastle center
    [52.4862, -1.8904], // Birmingham center
    [53.4808, -2.2426], // Manchester center
  ];

  for (const [defaultLat, defaultLng] of commonDefaults) {
    if (Math.abs(lat - defaultLat) < 0.0001 && Math.abs(lng - defaultLng) < 0.0001) {
      validation.confidence *= 0.3;
      validation.issues.push('Coordinates match common default/placeholder values');
      validation.suggestions.push('Verify these are actual work location coordinates');
      break;
    }
  }

  // 6. Water body check (basic - would need proper water body data for production)
  // This is a simplified check for major UK water areas
  const inIrishSea = lat > 53 && lat < 55 && lng < -3.5 && lng > -5.5;
  const inNorthSea = lat > 53 && lat < 59 && lng > 0.5 && lng < 3;
  
  if (inIrishSea || inNorthSea) {
    validation.confidence *= 0.2;
    validation.issues.push('Coordinates appear to be in water');
    validation.suggestions.push('Check coordinate conversion or source data');
  }

  return validation;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Validate LINESTRING coordinates for consistency
 * @param {Array} coordinates - Array of [lat, lng] pairs
 * @returns {Object} Validation result
 */
export function validateLinestringCoordinates(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return {
      isValid: false,
      issues: ['No coordinates provided']
    };
  }

  const validation = {
    isValid: true,
    issues: [],
    totalLength: 0,
    maxGap: 0,
    avgGap: 0
  };

  // Check each coordinate pair
  for (let i = 0; i < coordinates.length; i++) {
    const [lat, lng] = coordinates[i];
    const pointValidation = validateCoordinateAccuracy(lat, lng, '');
    
    if (!pointValidation.isValid) {
      validation.isValid = false;
      validation.issues.push(`Point ${i+1}: ${pointValidation.issues.join(', ')}`);
    }

    // Calculate distances between consecutive points
    if (i > 0) {
      const [prevLat, prevLng] = coordinates[i-1];
      const distance = calculateDistance(prevLat, prevLng, lat, lng);
      validation.totalLength += distance;
      validation.maxGap = Math.max(validation.maxGap, distance);
    }
  }

  // Check for unrealistic gaps (> 5km between consecutive points)
  if (validation.maxGap > 5000) {
    validation.issues.push(`Large gap detected: ${(validation.maxGap/1000).toFixed(1)}km between points`);
    validation.isValid = false;
  }

  // Check for duplicate points
  const uniquePoints = new Set(coordinates.map(([lat, lng]) => `${lat},${lng}`));
  if (uniquePoints.size < coordinates.length) {
    validation.issues.push(`${coordinates.length - uniquePoints.size} duplicate points found`);
  }

  validation.avgGap = coordinates.length > 1 ? 
    validation.totalLength / (coordinates.length - 1) : 0;

  return validation;
}

/**
 * Suggest coordinate corrections based on common errors
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Array} Array of suggested corrections
 */
export function suggestCoordinateCorrections(lat, lng) {
  const suggestions = [];

  // Suggest swapped coordinates
  if (lng > 50 || lat < -10) {
    suggestions.push({
      type: 'swap',
      lat: lng,
      lng: lat,
      reason: 'Coordinates may be swapped'
    });
  }

  // Suggest decimal point insertion for large values
  if (Math.abs(lat) > 1000) {
    const correctedLat = lat / Math.pow(10, Math.floor(Math.log10(Math.abs(lat))) - 1);
    suggestions.push({
      type: 'decimal',
      lat: correctedLat,
      lng: lng,
      reason: 'Missing decimal point in latitude'
    });
  }

  if (Math.abs(lng) > 1000) {
    const correctedLng = lng / Math.pow(10, Math.floor(Math.log10(Math.abs(lng))) - 1);
    suggestions.push({
      type: 'decimal',
      lat: lat,
      lng: correctedLng,
      reason: 'Missing decimal point in longitude'
    });
  }

  return suggestions;
}

export default {
  validateCoordinateAccuracy,
  calculateDistance,
  validateLinestringCoordinates,
  suggestCoordinateCorrections
};
