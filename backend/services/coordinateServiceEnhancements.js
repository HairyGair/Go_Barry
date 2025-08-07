// coordinateServiceEnhancements.js
// Additional features for the unified coordinate service

import { getFetch } from '../utils/fetchHelper.js';

/**
 * Enhanced postcode geocoding with multiple fallback sources
 */
export async function enhancedPostcodeGeocoding(postcode) {
  const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
  
  // Method 1: Postcodes.io (free, no API key needed)
  try {
    const fetch = await getFetch();
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 200 && data.result) {
        return {
          lat: data.result.latitude,
          lng: data.result.longitude,
          source: 'postcodes.io',
          confidence: 95,
          district: data.result.admin_district,
          ward: data.result.admin_ward
        };
      }
    }
  } catch (error) {
    console.warn('Postcodes.io lookup failed:', error.message);
  }
  
  // Method 2: Use postcode district mapping for North East
  const postcodeDistricts = {
    'NE1': { lat: 54.9742, lng: -1.6142, area: 'Newcastle City Centre' },
    'NE2': { lat: 54.9950, lng: -1.6070, area: 'Jesmond' },
    'NE3': { lat: 54.9890, lng: -1.6480, area: 'Gosforth' },
    'NE4': { lat: 54.9640, lng: -1.6850, area: 'Benwell' },
    'NE5': { lat: 54.9780, lng: -1.6720, area: 'Westgate' },
    'NE6': { lat: 54.9860, lng: -1.5590, area: 'Byker/Walker' },
    'NE7': { lat: 55.0000, lng: -1.5950, area: 'Benton' },
    'NE8': { lat: 54.9620, lng: -1.5990, area: 'Gateshead' },
    'NE9': { lat: 54.9340, lng: -1.5660, area: 'Low Fell' },
    'NE10': { lat: 54.9130, lng: -1.5320, area: 'Felling' },
    'NE11': { lat: 54.9370, lng: -1.6160, area: 'Dunston' },
    'NE12': { lat: 55.0360, lng: -1.5080, area: 'Killingworth' },
    'NE13': { lat: 55.0140, lng: -1.6780, area: 'Wideopen' },
    'NE15': { lat: 54.9930, lng: -1.7180, area: 'Lemington' },
    'NE16': { lat: 54.9480, lng: -1.7830, area: 'Whickham' },
    'NE20': { lat: 55.0570, lng: -1.7880, area: 'Ponteland' },
    'NE21': { lat: 54.9570, lng: -1.8570, area: 'Blaydon' },
    'NE23': { lat: 55.0740, lng: -1.6360, area: 'Cramlington' },
    'DH1': { lat: 54.7761, lng: -1.5733, area: 'Durham City' },
    'DH2': { lat: 54.8350, lng: -1.5960, area: 'Chester-le-Street' },
    'DH3': { lat: 54.8540, lng: -1.5520, area: 'Birtley' },
    'DH4': { lat: 54.8490, lng: -1.4260, area: 'Houghton-le-Spring' },
    'DH5': { lat: 54.8170, lng: -1.3870, area: 'Hetton-le-Hole' },
    'SR1': { lat: 54.9069, lng: -1.3838, area: 'Sunderland City Centre' },
    'SR2': { lat: 54.8920, lng: -1.3960, area: 'Sunderland South' },
    'SR3': { lat: 54.8660, lng: -1.4210, area: 'Farringdon' },
    'SR4': { lat: 54.9210, lng: -1.4280, area: 'Sunderland North' },
    'SR5': { lat: 54.9450, lng: -1.4010, area: 'Southwick' },
    'SR6': { lat: 54.9180, lng: -1.3470, area: 'Sunderland East' }
  };
  
  const district = cleanPostcode.match(/^([A-Z]{1,2}\d{1,2})/)?.[1];
  if (district && postcodeDistricts[district]) {
    const location = postcodeDistricts[district];
    return {
      lat: location.lat,
      lng: location.lng,
      source: 'postcode_district',
      confidence: 70,
      area: location.area
    };
  }
  
  return null;
}

/**
 * Intelligent coordinate clustering for multiple nearby roadworks
 */
export function clusterNearbyCoordinates(coordinates, radius = 100) {
  const clusters = [];
  const processed = new Set();
  
  coordinates.forEach((coord, i) => {
    if (processed.has(i)) return;
    
    const cluster = {
      center: coord,
      items: [coord],
      indices: [i]
    };
    
    coordinates.forEach((other, j) => {
      if (i !== j && !processed.has(j)) {
        const distance = haversineDistance(coord, other);
        if (distance <= radius) {
          cluster.items.push(other);
          cluster.indices.push(j);
          processed.add(j);
        }
      }
    });
    
    if (cluster.items.length > 1) {
      // Calculate cluster center
      const avgLat = cluster.items.reduce((sum, c) => sum + c.lat, 0) / cluster.items.length;
      const avgLng = cluster.items.reduce((sum, c) => sum + c.lng, 0) / cluster.items.length;
      cluster.center = { lat: avgLat, lng: avgLng };
    }
    
    clusters.push(cluster);
    processed.add(i);
  });
  
  return clusters;
}

/**
 * Calculate Haversine distance between two points (meters)
 */
function haversineDistance(coord1, coord2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = coord1.lat * Math.PI / 180;
  const φ2 = coord2.lat * Math.PI / 180;
  const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
  const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

/**
 * Validate and score coordinate quality
 */
export function scoreCoordinateQuality(coord, metadata = {}) {
  let score = 0;
  const issues = [];
  
  // Source quality scoring
  const sourceScores = {
    'direct': 100,
    'bng_conversion': 95,
    'postcodes.io': 90,
    'known_location': 85,
    'postcode_district': 70,
    'geocoded': 60,
    'default': 0
  };
  
  score = sourceScores[metadata.source] || 50;
  
  // Precision check
  if (metadata.precision >= 6) {
    score += 5;
  } else {
    issues.push('Low precision');
  }
  
  // Bounds check
  if (coord.lat >= 54.0 && coord.lat <= 56.0 && 
      coord.lng >= -2.5 && coord.lng <= 0.0) {
    score += 5;
  } else {
    issues.push('Outside typical bounds');
    score -= 20;
  }
  
  // Cache freshness
  if (metadata.cached) {
    const age = Date.now() - new Date(metadata.timestamp).getTime();
    if (age < 5 * 60 * 1000) { // Less than 5 minutes
      score += 5;
    } else if (age < 60 * 60 * 1000) { // Less than 1 hour
      score += 2;
    }
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F',
    issues,
    recommendation: score < 60 ? 'Consider manual verification' : 'Good quality'
  };
}

/**
 * Smart coordinate interpolation for roadwork segments
 */
export function interpolateRoadworkSegment(startCoord, endCoord, numPoints = 5) {
  const points = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    points.push({
      lat: startCoord.lat + (endCoord.lat - startCoord.lat) * fraction,
      lng: startCoord.lng + (endCoord.lng - startCoord.lng) * fraction,
      position: fraction,
      type: i === 0 ? 'start' : i === numPoints ? 'end' : 'intermediate'
    });
  }
  
  return points;
}

export default {
  enhancedPostcodeGeocoding,
  clusterNearbyCoordinates,
  scoreCoordinateQuality,
  interpolateRoadworkSegment
};
