// services/tomtomEnhancementService.js
// TomTom Enhancement Service - Geocoding, Routing, POI, and Route Impact
// Uses TomTom's other free tier APIs (2,500 req/day each)

import axios from 'axios';

const TOMTOM_KEY = process.env.TOMTOM_API_KEY;
const CACHE = new Map(); // Simple in-memory cache to reduce API calls

// Cache helper
function getCacheKey(type, ...params) {
  return `${type}:${params.join(':')}`;
}

// 1. Enhanced Location Service - Better geocoding for incidents
async function enhanceLocation(location, nearLat = 54.978, nearLon = -1.618) {
  if (!TOMTOM_KEY || !location) return null;
  
  const cacheKey = getCacheKey('geocode', location);
  if (CACHE.has(cacheKey)) {
    console.log('📍 Using cached location for:', location);
    return CACHE.get(cacheKey);
  }
  
  try {
    console.log('🔍 TomTom Geocoding:', location);
    
    const response = await axios.get(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(location)}.json`, {
        params: {
          key: TOMTOM_KEY,
          limit: 1,
          countrySet: 'GB',
          lat: nearLat,
          lon: nearLon,
          radius: 50000, // 50km radius
          language: 'en-GB'
        },
        timeout: 5000
      }
    );
    
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const enhanced = {
        originalLocation: location,
        enhancedLocation: result.address.freeformAddress,
        streetName: result.address.streetName,
        municipality: result.address.municipality,
        coordinates: {
          lat: result.position.lat,
          lon: result.position.lon
        },
        confidence: result.score,
        type: result.type
      };
      
      CACHE.set(cacheKey, enhanced);
      console.log('✅ Enhanced location:', enhanced.enhancedLocation);
      return enhanced;
    }
    
  } catch (error) {
    console.warn('⚠️ TomTom geocoding failed:', error.message);
  }
  
  return null;
}

// 2. Reverse Geocoding with Landmarks - Add context to coordinate-only incidents
async function reverseGeocodeWithLandmarks(lat, lon) {
  if (!TOMTOM_KEY || !lat || !lon) return null;
  
  const cacheKey = getCacheKey('reverse', lat.toFixed(4), lon.toFixed(4));
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey);
  }
  
  try {
    console.log(`📍 TomTom Reverse Geocoding: ${lat}, ${lon}`);
    
    // Get address
    const geoResponse = await axios.get(
      `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json`, {
        params: {
          key: TOMTOM_KEY,
          language: 'en-GB',
          returnSpeedLimit: false,
          returnRoadUse: true
        },
        timeout: 5000
      }
    );
    
    // Get nearby POIs for context
    const poiResponse = await axios.get(
      `https://api.tomtom.com/search/2/nearbySearch/.json`, {
        params: {
          key: TOMTOM_KEY,
          lat: lat,
          lon: lon,
          radius: 200, // 200m radius
          limit: 3,
          language: 'en-GB'
        },
        timeout: 5000
      }
    );
    
    if (geoResponse.data.addresses && geoResponse.data.addresses.length > 0) {
      const address = geoResponse.data.addresses[0];
      const pois = poiResponse.data.results || [];
      
      const landmarks = pois
        .filter(poi => poi.poi && poi.poi.name)
        .map(poi => ({
          name: poi.poi.name,
          category: poi.poi.categories?.[0] || 'landmark',
          distance: Math.round(poi.dist)
        }));
      
      const result = {
        streetName: address.address.streetName || address.address.streetNameAndNumber,
        area: address.address.municipalitySubdivision || address.address.municipality,
        fullAddress: address.address.freeformAddress,
        roadType: address.address.roadUse,
        nearbyLandmarks: landmarks,
        description: landmarks.length > 0 
          ? `Near ${landmarks[0].name} (${landmarks[0].distance}m)` 
          : address.address.freeformAddress
      };
      
      CACHE.set(cacheKey, result);
      console.log('✅ Reverse geocoded with landmarks:', result.description);
      return result;
    }
    
  } catch (error) {
    console.warn('⚠️ TomTom reverse geocoding failed:', error.message);
  }
  
  return null;
}

// 3. Route Impact Calculator - Calculate delays for affected bus routes
async function calculateRouteImpact(incidentLat, incidentLon, routePoints, routeName) {
  if (!TOMTOM_KEY || !incidentLat || !incidentLon || !routePoints || routePoints.length < 2) {
    return null;
  }
  
  try {
    console.log(`🚌 Calculating impact for route ${routeName}`);
    
    // Find the route segment nearest to the incident
    let nearestSegmentIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const dist = getDistanceFromLatLon(incidentLat, incidentLon, routePoints[i].lat, routePoints[i].lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestSegmentIndex = i;
      }
    }
    
    // Only calculate if incident is within 500m of route
    if (minDistance > 0.5) {
      return { affected: false, distance: minDistance };
    }
    
    // Get normal route time (without traffic)
    const start = routePoints[Math.max(0, nearestSegmentIndex - 5)];
    const end = routePoints[Math.min(routePoints.length - 1, nearestSegmentIndex + 5)];
    
    const normalResponse = await axios.get(
      `https://api.tomtom.com/routing/1/calculateRoute/${start.lat},${start.lon}:${end.lat},${end.lon}/json`, {
        params: {
          key: TOMTOM_KEY,
          routeType: 'fastest',
          traffic: false,
          travelMode: 'bus'
        },
        timeout: 5000
      }
    );
    
    // Get current route time (with traffic)
    const trafficResponse = await axios.get(
      `https://api.tomtom.com/routing/1/calculateRoute/${start.lat},${start.lon}:${end.lat},${end.lon}/json`, {
        params: {
          key: TOMTOM_KEY,
          routeType: 'fastest',
          traffic: true,
          travelMode: 'bus'
        },
        timeout: 5000
      }
    );
    
    const normalTime = normalResponse.data.routes[0].summary.travelTimeInSeconds;
    const trafficTime = trafficResponse.data.routes[0].summary.travelTimeInSeconds;
    const delaySeconds = trafficTime - normalTime;
    const delayMinutes = Math.round(delaySeconds / 60);
    
    return {
      affected: true,
      routeName,
      normalTime: Math.round(normalTime / 60),
      currentTime: Math.round(trafficTime / 60),
      delayMinutes,
      delaySeverity: delayMinutes > 10 ? 'High' : delayMinutes > 5 ? 'Medium' : 'Low',
      segmentLength: trafficResponse.data.routes[0].summary.lengthInMeters,
      message: `Route ${routeName}: ${delayMinutes} minute delay expected`
    };
    
  } catch (error) {
    console.warn(`⚠️ Route impact calculation failed for ${routeName}:`, error.message);
    return null;
  }
}

// 4. Alternative Route Suggester - Find detours for affected routes
async function suggestAlternativeRoute(startLat, startLon, endLat, endLon, avoidLat, avoidLon) {
  if (!TOMTOM_KEY) return null;
  
  try {
    console.log('🗺️ Finding alternative route...');
    
    // Create avoid box around incident (roughly 500m square)
    const boxSize = 0.005; // ~500m in degrees
    const avoidBox = {
      southWest: `${avoidLat - boxSize},${avoidLon - boxSize}`,
      northEast: `${avoidLat + boxSize},${avoidLon + boxSize}`
    };
    
    // Get normal route
    const normalResponse = await axios.get(
      `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json`, {
        params: {
          key: TOMTOM_KEY,
          routeType: 'fastest',
          traffic: true,
          travelMode: 'bus',
          vehicleCommercial: true
        },
        timeout: 5000
      }
    );
    
    // Get alternative avoiding incident area
    const alternativeResponse = await axios.post(
      `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json?key=${TOMTOM_KEY}`, {
        avoidAreas: {
          rectangles: [avoidBox]
        }
      }, {
        params: {
          routeType: 'fastest',
          traffic: true,
          travelMode: 'bus',
          vehicleCommercial: true,
          maxAlternatives: 2
        },
        timeout: 5000
      }
    );
    
    const normal = normalResponse.data.routes[0];
    const alternative = alternativeResponse.data.routes[0];
    
    const timeDiff = alternative.summary.travelTimeInSeconds - normal.summary.travelTimeInSeconds;
    const distDiff = alternative.summary.lengthInMeters - normal.summary.lengthInMeters;
    
    // Extract key waypoints for the alternative route
    const waypoints = alternative.legs[0].points
      .filter((_, index) => index % Math.floor(alternative.legs[0].points.length / 5) === 0)
      .slice(0, 5);
    
    return {
      viable: timeDiff < 600, // Less than 10 minutes extra
      normalRoute: {
        time: Math.round(normal.summary.travelTimeInSeconds / 60),
        distance: Math.round(normal.summary.lengthInMeters / 1000 * 10) / 10
      },
      alternativeRoute: {
        time: Math.round(alternative.summary.travelTimeInSeconds / 60),
        distance: Math.round(alternative.summary.lengthInMeters / 1000 * 10) / 10,
        timeDifference: Math.round(timeDiff / 60),
        distanceDifference: Math.round(distDiff / 1000 * 10) / 10,
        waypoints: waypoints.map(p => `${p.latitude},${p.longitude}`),
        instructions: alternative.guidance?.instructions?.slice(0, 5).map(i => i.message) || []
      },
      recommendation: timeDiff < 300 
        ? `Use alternative route (only ${Math.round(timeDiff / 60)} min longer)`
        : 'Consider delaying service or waiting for incident to clear'
    };
    
  } catch (error) {
    console.warn('⚠️ Alternative route calculation failed:', error.message);
    return null;
  }
}

// Utility: Calculate distance between two points
function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Main enhancement function - enhance any incident with TomTom data
async function enhanceIncidentWithTomTom(incident) {
  const enhanced = { ...incident };
  
  try {
    // 1. Enhance location if only text provided
    if (incident.location && !incident.coordinates) {
      const locationData = await enhanceLocation(incident.location);
      if (locationData) {
        enhanced.enhancedLocation = locationData.enhancedLocation;
        enhanced.streetName = locationData.streetName;
        enhanced.coordinates = [locationData.coordinates.lat, locationData.coordinates.lon];
      }
    }
    
    // 2. Reverse geocode if only coordinates provided
    if (incident.coordinates && (!incident.streetName || incident.location === 'Unknown')) {
      const [lat, lon] = incident.coordinates;
      const reverseData = await reverseGeocodeWithLandmarks(lat, lon);
      if (reverseData) {
        enhanced.location = reverseData.description;
        enhanced.streetName = reverseData.streetName;
        enhanced.nearbyLandmarks = reverseData.nearbyLandmarks;
      }
    }
    
    // 3. Calculate route impacts if routes affected
    if (incident.affectsRoutes && incident.affectsRoutes.length > 0 && incident.coordinates) {
      const [lat, lon] = incident.coordinates;
      enhanced.routeImpacts = [];
      
      // Calculate impact for up to 3 routes (to save API calls)
      for (const route of incident.affectsRoutes.slice(0, 3)) {
        // In production, you'd load actual route geometry from GTFS
        // For now, we'll skip this as it needs route data
        console.log(`📊 Would calculate impact for route ${route}`);
      }
    }
    
    enhanced.enhancedWithTomTom = true;
    enhanced.enhancementTimestamp = new Date().toISOString();
    
  } catch (error) {
    console.warn('⚠️ TomTom enhancement failed:', error.message);
  }
  
  return enhanced;
}

// Check remaining quota
async function checkTomTomQuota() {
  // TomTom doesn't provide a quota API, but we can track usage
  // In production, you'd want to implement proper quota tracking
  return {
    searchAPI: { used: CACHE.size, limit: 2500, remaining: 2500 - CACHE.size },
    routingAPI: { used: 0, limit: 2500, remaining: 2500 },
    message: 'Quota tracking is approximate. Implement Redis for accurate tracking.'
  };
}

// Export all functions
export {
  enhanceLocation,
  reverseGeocodeWithLandmarks,
  calculateRouteImpact,
  suggestAlternativeRoute,
  enhanceIncidentWithTomTom,
  checkTomTomQuota
};

export default {
  enhanceLocation,
  reverseGeocodeWithLandmarks,
  calculateRouteImpact,
  suggestAlternativeRoute,
  enhanceIncidentWithTomTom,
  checkTomTomQuota
};
