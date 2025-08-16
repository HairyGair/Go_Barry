// services/enhancedRouteConfidence.js
// Enhanced Route Matching with Confidence Scoring and Multi-Modal Detection
import { isGTFSReady, findAffectedRoutesEnhanced } from '../utils/gtfsRouteMatching.js';
import gtfsService from './gtfsService.js';

// Metro stations and their connecting bus routes
const METRO_CONNECTIONS = {
  'Monument': {
    station: 'Monument Metro',
    coordinates: { lat: 54.973556, lng: -1.612778 },
    busRoutes: ['Q3', 'Q3X', '1', '2', '22', '40'],
    lines: ['Yellow', 'Green']
  },
  'Haymarket': {
    station: 'Haymarket Metro',
    coordinates: { lat: 54.977778, lng: -1.613889 },
    busRoutes: ['10', '10A', '10B', '38', '62', '63'],
    lines: ['Yellow', 'Green']
  },
  'Central Station': {
    station: 'Central Station Metro',
    coordinates: { lat: 54.968889, lng: -1.620556 },
    busRoutes: ['21', '27', '28', 'X21'],
    lines: ['Yellow', 'Green']
  },
  'Gateshead': {
    station: 'Gateshead Metro',
    coordinates: { lat: 54.961667, lng: -1.603333 },
    busRoutes: ['53', '54', '93', '94'],
    lines: ['Yellow', 'Green']
  },
  'Four Lane Ends': {
    station: 'Four Lane Ends Metro',
    coordinates: { lat: 55.014444, lng: -1.568889 },
    busRoutes: ['1', '2', '63'],
    lines: ['Yellow']
  },
  'Regent Centre': {
    station: 'Regent Centre Metro',
    coordinates: { lat: 55.033333, lng: -1.577778 },
    busRoutes: ['X7', 'X8', 'X9', '52', '55'],
    lines: ['Yellow']
  }
};

// Ferry terminals and connecting routes
const FERRY_CONNECTIONS = {
  'North Shields': {
    terminal: 'North Shields Ferry',
    coordinates: { lat: 55.008333, lng: -1.443889 },
    busRoutes: ['333', '335', '1', '2'],
    destination: 'South Shields'
  },
  'South Shields': {
    terminal: 'South Shields Ferry',
    coordinates: { lat: 55.004444, lng: -1.434722 },
    busRoutes: ['E1', 'E2', 'E6', '5'],
    destination: 'North Shields'
  }
};

// Major interchange points
const INTERCHANGES = {
  'Eldon Square': {
    type: 'bus_station',
    coordinates: { lat: 54.975278, lng: -1.615556 },
    routes: ['10', '10A', '10B', '12', '22', '30', '31', '38', '40', '62', '63']
  },
  'Gateshead Interchange': {
    type: 'bus_metro_interchange',
    coordinates: { lat: 54.961389, lng: -1.602222 },
    routes: ['21', '25', '26', '27', '28', '29', '53', '54', '56', '57', '58'],
    metroLines: ['Yellow', 'Green']
  },
  'Park Lane': {
    type: 'bus_station',
    coordinates: { lat: 54.905556, lng: -1.382778 },
    routes: ['2', '2A', '20', '35', '36', '39', '56', '60', '61']
  }
};

/**
 * Calculate route match confidence with detailed scoring
 */
export function calculateRouteConfidence(route, incident, matchDetails) {
  let confidence = 0;
  const factors = [];

  // 1. Distance-based confidence (max 40 points)
  if (matchDetails.distance !== undefined) {
    if (matchDetails.distance <= 50) {
      confidence += 40;
      factors.push({ factor: 'distance', score: 40, detail: `${matchDetails.distance}m from route` });
    } else if (matchDetails.distance <= 100) {
      confidence += 30;
      factors.push({ factor: 'distance', score: 30, detail: `${matchDetails.distance}m from route` });
    } else if (matchDetails.distance <= 200) {
      confidence += 20;
      factors.push({ factor: 'distance', score: 20, detail: `${matchDetails.distance}m from route` });
    } else if (matchDetails.distance <= 300) {
      confidence += 10;
      factors.push({ factor: 'distance', score: 10, detail: `${matchDetails.distance}m from route` });
    }
  }

  // 2. Match type confidence (max 30 points)
  switch (matchDetails.matchType) {
    case 'direct':
      confidence += 30;
      factors.push({ factor: 'matchType', score: 30, detail: 'Direct GPS match' });
      break;
    case 'stop_proximity':
      confidence += 25;
      factors.push({ factor: 'matchType', score: 25, detail: 'Near bus stop' });
      break;
    case 'shape_proximity':
      confidence += 20;
      factors.push({ factor: 'matchType', score: 20, detail: 'Near route path' });
      break;
    case 'regional':
      confidence += 10;
      factors.push({ factor: 'matchType', score: 10, detail: 'Regional match' });
      break;
  }

  // 3. Location name matching (max 20 points)
  if (matchDetails.locationMatch) {
    confidence += 20;
    factors.push({ factor: 'location', score: 20, detail: 'Location name matches route' });
  }

  // 4. Time relevance (max 10 points)
  if (matchDetails.isActiveNow) {
    confidence += 10;
    factors.push({ factor: 'timing', score: 10, detail: 'Route active at this time' });
  } else if (matchDetails.runsToday) {
    confidence += 5;
    factors.push({ factor: 'timing', score: 5, detail: 'Route runs today' });
  }

  // Convert to 0-1 scale
  const normalizedConfidence = confidence / 100;

  return {
    route,
    confidence: normalizedConfidence,
    matchType: matchDetails.matchType,
    distance: matchDetails.distance,
    factors,
    totalScore: confidence,
    isMultiModal: matchDetails.isMultiModal || false,
    connections: matchDetails.connections || []
  };
}

/**
 * Detect multi-modal impacts (Metro/Ferry connections)
 */
export function detectMultiModalImpacts(lat, lng, radius = 500) {
  const impacts = {
    metro: [],
    ferry: [],
    interchanges: [],
    cascadingRoutes: new Set()
  };

  // Check Metro connections
  for (const [name, data] of Object.entries(METRO_CONNECTIONS)) {
    const distance = calculateDistance(lat, lng, data.coordinates.lat, data.coordinates.lng);
    if (distance <= radius) {
      impacts.metro.push({
        station: data.station,
        distance: Math.round(distance),
        lines: data.lines,
        affectedBusRoutes: data.busRoutes
      });
      data.busRoutes.forEach(route => impacts.cascadingRoutes.add(route));
    }
  }

  // Check Ferry connections
  for (const [name, data] of Object.entries(FERRY_CONNECTIONS)) {
    const distance = calculateDistance(lat, lng, data.coordinates.lat, data.coordinates.lng);
    if (distance <= radius) {
      impacts.ferry.push({
        terminal: data.terminal,
        distance: Math.round(distance),
        destination: data.destination,
        affectedBusRoutes: data.busRoutes
      });
      data.busRoutes.forEach(route => impacts.cascadingRoutes.add(route));
    }
  }

  // Check major interchanges
  for (const [name, data] of Object.entries(INTERCHANGES)) {
    const distance = calculateDistance(lat, lng, data.coordinates.lat, data.coordinates.lng);
    if (distance <= radius) {
      impacts.interchanges.push({
        name,
        type: data.type,
        distance: Math.round(distance),
        affectedRoutes: data.routes,
        metroLines: data.metroLines || []
      });
      data.routes.forEach(route => impacts.cascadingRoutes.add(route));
    }
  }

  return {
    ...impacts,
    cascadingRoutes: Array.from(impacts.cascadingRoutes),
    hasMultiModalImpact: impacts.metro.length > 0 || impacts.ferry.length > 0,
    totalAffectedConnections: impacts.metro.length + impacts.ferry.length + impacts.interchanges.length
  };
}

/**
 * Get active routes based on time and day
 */
export async function getActiveRoutesAtTime(timestamp = new Date()) {
  const dayOfWeek = timestamp.getDay();
  const timeString = timestamp.toTimeString().slice(0, 5); // HH:MM format
  const hour = timestamp.getHours();

  // Service patterns
  const serviceTypes = {
    weekday: dayOfWeek >= 1 && dayOfWeek <= 5,
    saturday: dayOfWeek === 6,
    sunday: dayOfWeek === 0,
    peak: (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18),
    night: hour >= 23 || hour < 5,
    school: dayOfWeek >= 1 && dayOfWeek <= 5 && ((hour >= 7 && hour <= 9) || (hour >= 15 && hour <= 16))
  };

  // Route service patterns (simplified - would be from GTFS calendar in production)
  const routePatterns = {
    // 24/7 routes
    always: ['1', '2', '56'],
    
    // Peak only routes
    peakOnly: ['X1', 'X21', 'X30', 'X31', 'X66', 'X70', 'X71'],
    
    // Weekday only
    weekdayOnly: ['6', '7', '8', '16', '17', '84', '85'],
    
    // School services
    schoolOnly: ['16A', '265', '267', '268', '269'],
    
    // Night services (N prefix)
    nightOnly: ['N21', 'N56', 'N58'],
    
    // Reduced Sunday service
    noSunday: ['43', '44', '45', '52', '55'],
    
    // Summer only (June-August)
    seasonal: ['S1', 'S2'] // Coastal services
  };

  const activeRoutes = new Set();

  // Add always running routes
  routePatterns.always.forEach(route => activeRoutes.add(route));

  // Add time-specific routes
  if (serviceTypes.peak && serviceTypes.weekday) {
    routePatterns.peakOnly.forEach(route => activeRoutes.add(route));
  }

  if (serviceTypes.weekday) {
    routePatterns.weekdayOnly.forEach(route => activeRoutes.add(route));
  }

  if (serviceTypes.school) {
    routePatterns.schoolOnly.forEach(route => activeRoutes.add(route));
  }

  if (serviceTypes.night) {
    routePatterns.nightOnly.forEach(route => activeRoutes.add(route));
  }

  // Check Sunday restrictions
  if (!serviceTypes.sunday) {
    routePatterns.noSunday.forEach(route => activeRoutes.add(route));
  }

  // All other standard routes (simplified list)
  const standardRoutes = ['10', '10A', '10B', '21', '22', '27', '28', 'Q3', 'Q3X', 
                         '53', '54', '57', '58', '62', '63', '93', '94'];
  
  standardRoutes.forEach(route => {
    if (!serviceTypes.night || route === '21' || route === '56') { // Some routes run late
      activeRoutes.add(route);
    }
  });

  return {
    activeRoutes: Array.from(activeRoutes),
    serviceType: Object.entries(serviceTypes).filter(([k, v]) => v).map(([k]) => k),
    timestamp: timestamp.toISOString(),
    totalActive: activeRoutes.size
  };
}

/**
 * Enhanced route matching with all features combined
 */
export async function enhancedRouteMatchWithConfidence(lat, lng, location, options = {}) {
  const {
    radius = 300,
    timestamp = new Date(),
    includeInactive = false
  } = options;

  const results = [];
  
  // Get base route matches from GTFS
  const baseMatches = isGTFSReady() 
    ? await findAffectedRoutesEnhanced(lat, lng, location, radius)
    : [];

  // Get active routes for time-based filtering
  const { activeRoutes } = await getActiveRoutesAtTime(timestamp);
  
  // Get multi-modal impacts
  const multiModalImpacts = detectMultiModalImpacts(lat, lng, radius);

  // Process each matched route
  for (const routeMatch of baseMatches) {
    const route = typeof routeMatch === 'string' ? routeMatch : routeMatch.route;
    
    // Skip inactive routes unless requested
    if (!includeInactive && !activeRoutes.includes(route)) {
      continue;
    }

    // Calculate confidence with all factors
    const matchDetails = {
      matchType: routeMatch.matchType || 'regional',
      distance: routeMatch.distance || radius,
      locationMatch: location && location.toLowerCase().includes(route.toLowerCase()),
      isActiveNow: activeRoutes.includes(route),
      runsToday: true, // Simplified - would check GTFS calendar
      isMultiModal: multiModalImpacts.cascadingRoutes.includes(route),
      connections: getRouteConnections(route, multiModalImpacts)
    };

    const confidenceResult = calculateRouteConfidence(route, { lat, lng, location }, matchDetails);
    results.push(confidenceResult);
  }

  // Add cascading routes from multi-modal impacts
  for (const cascadeRoute of multiModalImpacts.cascadingRoutes) {
    if (!results.find(r => r.route === cascadeRoute)) {
      const matchDetails = {
        matchType: 'cascade',
        distance: null,
        locationMatch: false,
        isActiveNow: activeRoutes.includes(cascadeRoute),
        runsToday: true,
        isMultiModal: true,
        connections: getRouteConnections(cascadeRoute, multiModalImpacts)
      };

      const confidenceResult = calculateRouteConfidence(cascadeRoute, { lat, lng, location }, matchDetails);
      results.push(confidenceResult);
    }
  }

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  return {
    matches: results,
    multiModalImpacts,
    activeRoutesCount: activeRoutes.length,
    timestamp: timestamp.toISOString(),
    serviceType: (await getActiveRoutesAtTime(timestamp)).serviceType
  };
}

// Helper functions
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

function getRouteConnections(route, multiModalImpacts) {
  const connections = [];
  
  // Check metro connections
  multiModalImpacts.metro.forEach(metro => {
    if (metro.affectedBusRoutes.includes(route)) {
      connections.push({
        type: 'metro',
        name: metro.station,
        lines: metro.lines
      });
    }
  });

  // Check ferry connections
  multiModalImpacts.ferry.forEach(ferry => {
    if (ferry.affectedBusRoutes.includes(route)) {
      connections.push({
        type: 'ferry',
        name: ferry.terminal,
        destination: ferry.destination
      });
    }
  });

  // Check interchange connections
  multiModalImpacts.interchanges.forEach(interchange => {
    if (interchange.affectedRoutes.includes(route)) {
      connections.push({
        type: 'interchange',
        name: interchange.name,
        interchangeType: interchange.type
      });
    }
  });

  return connections;
}

export default {
  calculateRouteConfidence,
  detectMultiModalImpacts,
  getActiveRoutesAtTime,
  enhancedRouteMatchWithConfidence
};
