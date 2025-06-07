// backend/config/geographicBounds.js
// Go North East Geographic Coverage Configuration
// Based on actual GTFS stop data analysis

// Calculate bounds from actual GTFS data
export const GO_NORTH_EAST_COVERAGE = {
  // Main service area bounds (from GTFS data analysis)
  bounds: {
    north: 55.042571,  // Whitley Bay (northernmost stop)
    south: 54.755372,  // Brandon (southernmost stop) 
    east: -1.382834,   // Sunderland area (easternmost)
    west: -2.095787   // Hexham (westernmost stop)
  },
  
  // Traffic API bounding boxes - covering full Go North East network
  traffiAPIBounds: [
    // Primary Newcastle/Gateshead Metro area
    '54.90,55.05,-1.80,-1.40',
    
    // Sunderland and Washington area
    '54.75,54.95,-1.60,-1.35',
    
    // North Tyneside coastal area  
    '54.95,55.05,-1.50,-1.40',
    
    // Durham and Chester-le-Street
    '54.75,54.90,-1.70,-1.55',
    
    // Consett and western areas
    '54.85,54.95,-1.85,-1.75',
    
    // Hexham and Northumberland corridor
    '54.95,55.00,-2.10,-1.85'
  ],
  
  // Combined single bounding box for APIs that only support one
  combinedBounds: '54.75,55.05,-2.10,-1.35',
  
  // Regional centers for focused queries
  regions: {
    newcastle: {
      name: 'Newcastle/Gateshead',
      center: { lat: 54.9783, lng: -1.6178 },
      bounds: '54.90,55.00,-1.75,-1.55',
      majorRoutes: ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '28', '28B', '29']
    },
    sunderland: {
      name: 'Sunderland/Washington', 
      center: { lat: 54.9069, lng: -1.3838 },
      bounds: '54.85,54.95,-1.55,-1.35',
      majorRoutes: ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9']
    },
    northTyneside: {
      name: 'North Tyneside/Coast',
      center: { lat: 55.0174, lng: -1.4234 },
      bounds: '54.95,55.05,-1.55,-1.40', 
      majorRoutes: ['1', '2', '307', '309', '317', '327', '352', '354', '355', '356']
    },
    durham: {
      name: 'Durham/Chester-le-Street',
      center: { lat: 54.7761, lng: -1.5756 },
      bounds: '54.75,54.85,-1.65,-1.55',
      majorRoutes: ['21', '22', 'X21', '6', '50']
    },
    consett: {
      name: 'Consett/Stanley',
      center: { lat: 54.8691, lng: -1.8316 },
      bounds: '54.85,54.90,-1.85,-1.75',
      majorRoutes: ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85']
    },
    hexham: {
      name: 'Hexham/West Northumberland', 
      center: { lat: 54.9722, lng: -2.1000 },
      bounds: '54.95,55.00,-2.15,-1.95',
      majorRoutes: ['X85', '684']
    }
  }
};

// Utility function to get appropriate bounds for different APIs
export function getBoundsForAPI(apiProvider, preferredRegion = null) {
  const config = GO_NORTH_EAST_COVERAGE;
  
  switch (apiProvider) {
    case 'tomtom':
      // TomTom supports bbox parameter
      return preferredRegion && config.regions[preferredRegion] 
        ? config.regions[preferredRegion].bounds
        : config.combinedBounds;
        
    case 'mapquest':
      // MapQuest uses boundingBox format (different parameter order)
      const bounds = preferredRegion && config.regions[preferredRegion]
        ? config.regions[preferredRegion].bounds  
        : config.combinedBounds;
      // Convert from 'south,north,west,east' to 'north,west,south,east'
      const [south, north, west, east] = bounds.split(',');
      return `${north},${west},${south},${east}`;
      
    case 'here':
      // HERE API uses bbox
      return preferredRegion && config.regions[preferredRegion]
        ? config.regions[preferredRegion].bounds
        : config.combinedBounds;
        
    case 'multi-region':
      // Return array of regional bounds for multi-query approach
      return config.traffiAPIBounds;
      
    default:
      return config.combinedBounds;
  }
}

// Function to determine if coordinates are within Go North East coverage
export function isWithinCoverage(lat, lng) {
  const bounds = GO_NORTH_EAST_COVERAGE.bounds;
  return lat >= bounds.south && 
         lat <= bounds.north && 
         lng >= bounds.west && 
         lng <= bounds.east;
}

// Get the most appropriate region for given coordinates
export function getRegionForCoordinates(lat, lng) {
  if (!isWithinCoverage(lat, lng)) {
    return null;
  }
  
  const regions = GO_NORTH_EAST_COVERAGE.regions;
  
  // Check each region to find the best match
  for (const [regionKey, region] of Object.entries(regions)) {
    const [south, north, west, east] = region.bounds.split(',').map(parseFloat);
    
    if (lat >= south && lat <= north && lng >= west && lng <= east) {
      return {
        key: regionKey,
        ...region
      };
    }
  }
  
  // Fallback to closest region center
  let closestRegion = null;
  let minDistance = Infinity;
  
  for (const [regionKey, region] of Object.entries(regions)) {
    const distance = Math.sqrt(
      Math.pow(lat - region.center.lat, 2) + 
      Math.pow(lng - region.center.lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestRegion = { key: regionKey, ...region };
    }
  }
  
  return closestRegion;
}

export default GO_NORTH_EAST_COVERAGE;
