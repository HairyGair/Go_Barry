// Enhanced coordinate validator that detects default/fallback coordinates
export class CoordinateValidator {
  constructor() {
    // Known default/fallback coordinates that should trigger the fallback system
    this.defaultLocations = [
      // Newcastle Haymarket area (common default)
      { lat: 54.9783, lng: -1.6178, radius: 0.002, name: 'Newcastle Haymarket default' },
      // Newcastle city center
      { lat: 54.978, lng: -1.615, radius: 0.003, name: 'Newcastle center default' },
      // Other potential defaults
      { lat: 54.9740, lng: -1.6132, radius: 0.002, name: 'Newcastle Monument default' },
      { lat: 55.0000, lng: -1.5000, radius: 0.005, name: 'Generic Tyne area default' },
      // Zero coordinates
      { lat: 0, lng: 0, radius: 0.1, name: 'Zero coordinates' }
    ];

    // Authority-specific validation
    this.authorityBounds = {
      'NORTH TYNESIDE COUNCIL': {
        center: { lat: 55.0182, lng: -1.4858 },
        minLat: 54.98, maxLat: 55.08,
        minLng: -1.65, maxLng: -1.40
      },
      'NEWCASTLE CITY COUNCIL': {
        center: { lat: 54.9783, lng: -1.6178 },
        minLat: 54.94, maxLat: 55.05,
        minLng: -1.75, maxLng: -1.50
      },
      'GATESHEAD COUNCIL': {
        center: { lat: 54.9527, lng: -1.6035 },
        minLat: 54.88, maxLat: 55.00,
        minLng: -1.78, maxLng: -1.48
      },
      'SUNDERLAND CITY COUNCIL': {
        center: { lat: 54.9069, lng: -1.3838 },
        minLat: 54.82, maxLat: 54.95,
        minLng: -1.52, maxLng: -1.25
      },
      'DURHAM COUNTY COUNCIL': {
        center: { lat: 54.7753, lng: -1.5849 },
        minLat: 54.45, maxLat: 54.95,
        minLng: -2.35, maxLng: -1.20
      }
    };
  }

  /**
   * Check if coordinates are valid and not a default location
   */
  validateCoordinates(roadwork) {
    if (!roadwork.coordinates || !Array.isArray(roadwork.coordinates) || roadwork.coordinates.length !== 2) {
      return {
        valid: false,
        reason: 'No coordinates provided',
        shouldUseFallback: true
      };
    }

    const [lat, lng] = roadwork.coordinates;

    // Check basic validity
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return {
        valid: false,
        reason: 'Invalid coordinate format',
        shouldUseFallback: true
      };
    }

    // Check if it's a known default location
    for (const defaultLoc of this.defaultLocations) {
      const distance = this.calculateDistance(lat, lng, defaultLoc.lat, defaultLoc.lng);
      if (distance <= defaultLoc.radius) {
        return {
          valid: false,
          reason: `Detected default location: ${defaultLoc.name}`,
          shouldUseFallback: true,
          detectedDefault: defaultLoc.name
        };
      }
    }

    // Check authority-specific validation
    if (roadwork.sm_highway_authority && this.authorityBounds[roadwork.sm_highway_authority]) {
      const bounds = this.authorityBounds[roadwork.sm_highway_authority];
      
      // Check if coordinates are within the authority's bounds
      if (lat < bounds.minLat || lat > bounds.maxLat || lng < bounds.minLng || lng > bounds.maxLng) {
        // Coordinates are outside the authority area - suspicious
        // Check if they're in Newcastle center (common default)
        const newcastleBounds = this.authorityBounds['NEWCASTLE CITY COUNCIL'];
        if (lat >= newcastleBounds.minLat && lat <= newcastleBounds.maxLat &&
            lng >= newcastleBounds.minLng && lng <= newcastleBounds.maxLng &&
            roadwork.sm_highway_authority !== 'NEWCASTLE CITY COUNCIL') {
          return {
            valid: false,
            reason: `Coordinates in Newcastle but roadwork is in ${roadwork.sm_highway_authority}`,
            shouldUseFallback: true,
            suspiciousLocation: 'Newcastle center for non-Newcastle roadwork'
          };
        }
      }
    }

    // Check street name vs location mismatch
    if (roadwork.sm_street_name && this.isLocationMismatch(roadwork)) {
      return {
        valid: false,
        reason: 'Street name does not match coordinate location',
        shouldUseFallback: true,
        mismatchDetected: true
      };
    }

    return {
      valid: true,
      reason: 'Coordinates appear valid'
    };
  }

  /**
   * Calculate distance between two coordinates (in degrees, for small distances)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const dLat = Math.abs(lat2 - lat1);
    const dLng = Math.abs(lng2 - lng1);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  /**
   * Check if street name suggests a different location than coordinates
   */
  isLocationMismatch(roadwork) {
    const streetName = roadwork.sm_street_name.toLowerCase();
    const [lat, lng] = roadwork.coordinates;

    // Killingworth-specific check
    if (streetName.includes('killingworth') && roadwork.sm_highway_authority === 'NORTH TYNESIDE COUNCIL') {
      // Killingworth is in North Tyneside, not Newcastle center
      // Check if coordinates are in Newcastle center instead
      if (lat >= 54.97 && lat <= 54.99 && lng >= -1.63 && lng <= -1.60) {
        return true; // Mismatch detected
      }
    }

    // Add more location-specific checks as needed
    const locationChecks = [
      { keyword: 'wallsend', expectedArea: { minLat: 54.98, maxLat: 55.01, minLng: -1.55, maxLng: -1.50 } },
      { keyword: 'whitley bay', expectedArea: { minLat: 55.02, maxLat: 55.05, minLng: -1.47, maxLng: -1.42 } },
      { keyword: 'north shields', expectedArea: { minLat: 54.99, maxLat: 55.02, minLng: -1.47, maxLng: -1.42 } },
      { keyword: 'jarrow', expectedArea: { minLat: 54.96, maxLat: 54.99, minLng: -1.50, maxLng: -1.46 } },
      { keyword: 'gateshead', expectedArea: { minLat: 54.93, maxLat: 54.97, minLng: -1.65, maxLng: -1.55 } }
    ];

    for (const check of locationChecks) {
      if (streetName.includes(check.keyword)) {
        const area = check.expectedArea;
        if (lat < area.minLat || lat > area.maxLat || lng < area.minLng || lng > area.maxLng) {
          return true; // Location mismatch
        }
      }
    }

    return false;
  }

  /**
   * Process roadwork with validation
   */
  processWithValidation(roadwork) {
    const validation = this.validateCoordinates(roadwork);
    
    if (!validation.valid && validation.shouldUseFallback) {
      // Invalid coordinates - remove them to trigger fallback
      return {
        ...roadwork,
        coordinates: null,
        coordinateSource: 'removed_invalid',
        coordinateValidation: validation,
        originalCoordinates: roadwork.coordinates // Keep for debugging
      };
    }
    
    return roadwork;
  }
}

export const coordinateValidator = new CoordinateValidator();
