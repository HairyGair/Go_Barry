// Enhanced Route Matching Utility for Go BARRY
// Combines coordinate-based matching with geocoded location names for maximum accuracy

// Enhanced route matching using both coordinates AND geocoded location names
export function enhancedRouteMatchingWithLocation(lat, lng, geocodedLocation, radiusMeters = 250) {
  const foundRoutes = new Set();
  const locationText = (geocodedLocation || '').toLowerCase();
  
  console.log(`🎯 Enhanced route matching for: "${geocodedLocation}" at ${lat}, ${lng}`);
  
  // 1. SPECIFIC ROAD/STREET NAME MATCHING
  const roadMatches = {
    // Major A-roads with specific routes
    'a1': ['21', 'X21', '25', '28', '28B', 'X25'],
    'a19': ['1', '2', '307', '309', '317', '56', '9'],
    'a167': ['21', '22', 'X21', '6', '50'], // Durham Road
    'a184': ['1', '2', '307', '309', '327'], // Coast Road
    'a693': ['X30', 'X31', '74', '84'], // Stanley/Consett
    'a696': ['74', '43', '44'], // Ponteland Road
    
    // Specific major roads
    'central motorway': ['Q3', 'Q3X', '10', '12', '21'],
    'newgate street': ['Q3', 'Q3X', '10', '12'],
    'grainger street': ['Q3', 'Q3X', '10', '12'],
    'collingwood street': ['Q3', 'Q3X', '10', '12'],
    'grey street': ['Q3', 'Q3X', '10', '12'],
    'northumberland street': ['Q3', 'Q3X', '10', '12'],
    
    'durham road': ['21', '22', 'X21', '6'],
    'west road': ['X82', 'X84', 'X85'],
    'gosforth high street': ['1', '2'],
    'coast road': ['1', '2', '307', '309'],
    'shields road': ['27', '28'],
    'saltwell road': ['53', '54'],
    
    // Sunderland roads
    'chester road': ['20', '24', '35'],
    'fawcett street': ['16', '20', '61'],
    'park lane': ['16', '20', '24', '35', '36'],
    
    // Major bridges and landmarks
    'tyne bridge': ['Q3', 'Q3X', '10', '21'],
    'king edward bridge': ['21', '22'],
    'swing bridge': ['Q3', 'Q3X'],
    'millennium bridge': ['Q3', 'Q3X'],
    'redheugh bridge': ['21', '27', '28'],
    'metro centre': ['10', '10A', '10B', '27', '28'],
    'angel of the north': ['21', 'X21', '25'],
    
    // Town centers
    'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29'],
    'gateshead': ['10', '10A', '10B', '21', '27', '28', '28B', 'Q3', 'Q3X', '53', '54'],
    'sunderland': ['16', '18', '20', '24', '35', '36', '56', '61', '62', '63'],
    'durham': ['21', '22', 'X21', '6', '7', '50'],
    'consett': ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85'],
    'stanley': ['X30', 'X31', '8', '78'],
    'chester le street': ['21', '22', 'X21', '25', '28'],
    'washington': ['2A', '2B', '4', '85', '86', 'X1'],
    'hebburn': ['27', '28', '28B'],
    'jarrow': ['27', '28', '526'],
    'south shields': ['1', '2', '11', '17'],
    'whitley bay': ['308', '309', '311'],
    'cramlington': ['43', '44', '45'],
    'blyth': ['1', '2', '308']
  };
  
  // Check for road/location matches
  for (const [keyword, routes] of Object.entries(roadMatches)) {
    if (locationText.includes(keyword)) {
      routes.forEach(route => foundRoutes.add(route));
      console.log(`✅ Location match "${keyword}" → routes: ${routes.join(', ')}`);
    }
  }
  
  // 2. COORDINATE-BASED MATCHING (geographic regions)
  const coordinateRoutes = findRoutesNearCoordinatesFixed(lat, lng, radiusMeters);
  coordinateRoutes.forEach(route => foundRoutes.add(route));
  
  // 3. VALIDATION: Remove routes that are geographically impossible
  const finalRoutes = Array.from(foundRoutes);
  const validatedRoutes = validateRoutesGeographically(finalRoutes, lat, lng);
  
  console.log(`✨ Enhanced matching result: ${validatedRoutes.length} routes for "${geocodedLocation}"`);
  console.log(`   📍 Coordinate-based: ${coordinateRoutes.length} routes`);
  console.log(`   🗺️ Location-based: ${finalRoutes.length - coordinateRoutes.length} additional routes`);
  console.log(`   ✅ Final validated: ${validatedRoutes.join(', ')}`);
  
  return validatedRoutes;
}

// Geographic region-based route matching for coordinates
function findRoutesNearCoordinatesFixed(lat, lng, radiusMeters = 250) {
  const foundRoutes = new Set();
  
  // Geographic region-based route matching for Go North East
  const regions = [
    {
      name: 'Newcastle Centre',
      bounds: { north: 55.0, south: 54.96, east: -1.58, west: -1.64 },
      routes: ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29', '47', '53', '54', '56', '57', '58']
    },
    {
      name: 'Gateshead',
      bounds: { north: 54.97, south: 54.93, east: -1.6, west: -1.7 },
      routes: ['10', '10A', '10B', '27', '28', '28B', 'Q3', 'Q3X', '53', '54']
    },
    {
      name: 'North Tyneside',
      bounds: { north: 55.05, south: 55.0, east: -1.4, west: -1.5 },
      routes: ['1', '2', '307', '309', '317', '327', '352', '354', '355', '356']
    },
    {
      name: 'Sunderland',
      bounds: { north: 54.93, south: 54.88, east: -1.35, west: -1.42 },
      routes: ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9']
    },
    {
      name: 'Durham',
      bounds: { north: 54.88, south: 54.75, east: -1.5, west: -1.6 },
      routes: ['21', '22', 'X21', '6', '50', '28']
    },
    {
      name: 'Consett',
      bounds: { north: 54.87, south: 54.82, east: -1.8, west: -1.9 },
      routes: ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85']
    },
    {
      name: 'A1 Corridor',
      bounds: { north: 55.0, south: 54.8, east: -1.55, west: -1.65 },
      routes: ['21', 'X21', '25', '28', '28B']
    },
    {
      name: 'A19 Corridor', 
      bounds: { north: 55.1, south: 54.9, east: -1.35, west: -1.55 },
      routes: ['1', '2', '9', '307', '309', '56']
    }
  ];

  // Find matching region
  for (const region of regions) {
    if (lat >= region.bounds.south && lat <= region.bounds.north &&
        lng >= region.bounds.west && lng <= region.bounds.east) {
      region.routes.forEach(route => foundRoutes.add(route));
      break;
    }
  }

  // If no specific region, use major routes as fallback
  if (foundRoutes.size === 0) {
    ['21', '22', '10', '1', '2', 'Q3'].forEach(route => foundRoutes.add(route));
  }

  return Array.from(foundRoutes).sort();
}

// Validate routes geographically to remove impossible matches
function validateRoutesGeographically(routes, lat, lng) {
  const impossibleCombinations = {
    // Routes that don't serve certain areas
    sunderland: ['Q3', 'Q3X', '10', '10A', '10B', '12'], // Newcastle city routes don't go to Sunderland
    consett: ['1', '2', '307', '309'], // North Tyneside routes don't go to Consett
    durham: ['1', '2', '307', '309', '43', '44'] // North Tyneside/Cramlington routes don't go to Durham
  };
  
  // Determine general area
  let area = 'general';
  if (lat >= 54.88 && lat <= 54.95 && lng >= -1.42 && lng <= -1.35) area = 'sunderland';
  else if (lat >= 54.82 && lat <= 54.87 && lng >= -1.9 && lng <= -1.8) area = 'consett';
  else if (lat >= 54.75 && lat <= 54.85 && lng >= -1.6 && lng <= -1.5) area = 'durham';
  
  // Filter out impossible routes
  const validRoutes = routes.filter(route => {
    const impossible = impossibleCombinations[area] || [];
    return !impossible.includes(route);
  });
  
  return validRoutes.sort();
}

// Enhanced route matching for text-only incidents (no coordinates)
export function enhancedTextOnlyRouteMatching(locationText, description = '') {
  const foundRoutes = new Set();
  const text = `${locationText} ${description}`.toLowerCase();
  
  // Same road matching logic as above
  const roadMatches = {
    'a1': ['21', 'X21', '25', '28', '28B', 'X25'],
    'a19': ['1', '2', '307', '309', '317', '56', '9'],
    'a167': ['21', '22', 'X21', '6', '50'],
    'a184': ['1', '2', '307', '309', '327'],
    'a693': ['X30', 'X31', '74', '84'],
    'a696': ['74', '43', '44'],
    'central motorway': ['Q3', 'Q3X', '10', '12', '21'],
    'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29'],
    'gateshead': ['10', '10A', '10B', '21', '27', '28', '28B', 'Q3', 'Q3X', '53', '54'],
    'sunderland': ['16', '18', '20', '24', '35', '36', '56', '61', '62', '63'],
    'durham': ['21', '22', 'X21', '6', '7', '50'],
    'consett': ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85'],
    'washington': ['2A', '2B', '4', '85', '86', 'X1'],
    'tyne bridge': ['Q3', 'Q3X', '10', '21'],
    'metro centre': ['10', '10A', '10B', '27', '28']
  };
  
  for (const [keyword, routes] of Object.entries(roadMatches)) {
    if (text.includes(keyword)) {
      routes.forEach(route => foundRoutes.add(route));
    }
  }
  
  return Array.from(foundRoutes).sort();
}

export default {
  enhancedRouteMatchingWithLocation,
  enhancedTextOnlyRouteMatching
};
