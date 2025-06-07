// backend/services/enhancedAlertProcessor.js
// Enhanced Alert Processing with Better Location Accuracy and Route Matching
// Now integrated with Enhanced GTFS Route Matcher for maximum accuracy

import axios from 'axios';
import { isAlertDismissed, getAlertDismissalInfo } from './supervisorManager.js';
import { enhancedFindRoutesNearCoordinates, enhancedLocationWithRoutes } from '../enhanced-gtfs-route-matcher.js';

// Enhanced geocoding with multiple fallbacks
export async function getEnhancedLocation(lat, lng, fallbackDescription = '') {
  if (!lat || !lng) {
    return fallbackDescription || 'Location coordinates not available';
  }

  try {
    // Primary: OpenStreetMap Nominatim (free, reliable)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`;
    
    const response = await axios.get(nominatimUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'BARRY-TrafficIntelligence/3.0 (Go North East Operations)'
      }
    });

    if (response.data && response.data.display_name) {
      const address = response.data.address || {};
      
      // Build enhanced location string
      const components = [];
      
      // Road/Street name (highest priority)
      if (address.road) {
        components.push(address.road);
      }
      
      // House number if available
      if (address.house_number) {
        components[0] = `${address.house_number} ${components[0] || ''}`.trim();
      }
      
      // Area/suburb
      if (address.suburb || address.neighbourhood || address.residential) {
        components.push(address.suburb || address.neighbourhood || address.residential);
      }
      
      // Town/City
      if (address.town || address.city || address.village) {
        components.push(address.town || address.city || address.village);
      }
      
      // County if different from standard North East areas
      if (address.county && !['Tyne and Wear', 'Durham', 'Northumberland'].includes(address.county)) {
        components.push(address.county);
      }

      let enhancedLocation = components.join(', ');
      
      // If we got a very generic result, try to be more specific
      if (enhancedLocation.length < 10 || !address.road) {
        // Use coordinates as fallback with nearby landmark if available
        const landmark = address.amenity || address.shop || address.building;
        if (landmark) {
          enhancedLocation = `Near ${landmark}, ${enhancedLocation}`;
        } else {
          enhancedLocation = `${enhancedLocation} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
      }

      console.log(`📍 Enhanced location: ${lat}, ${lng} → "${enhancedLocation}"`);
      return enhancedLocation;
    }
  } catch (error) {
    console.warn(`⚠️ Geocoding failed for ${lat}, ${lng}:`, error.message);
  }

  // Fallback: Use MapQuest if available
  if (process.env.MAPQUEST_API_KEY) {
    try {
      const mapquestUrl = `https://www.mapquestapi.com/geocoding/v1/reverse?key=${process.env.MAPQUEST_API_KEY}&location=${lat},${lng}&includeRoadMetadata=true&includeNearestIntersection=true`;
      
      const response = await axios.get(mapquestUrl, { timeout: 3000 });
      
      if (response.data?.results?.[0]?.locations?.[0]) {
        const location = response.data.results[0].locations[0];
        const street = location.street || '';
        const city = location.adminArea5 || location.adminArea4 || '';
        
        if (street || city) {
          const mapquestLocation = [street, city].filter(Boolean).join(', ');
          console.log(`📍 MapQuest fallback: ${lat}, ${lng} → "${mapquestLocation}"`);
          return mapquestLocation;
        }
      }
    } catch (error) {
      console.warn(`⚠️ MapQuest geocoding failed:`, error.message);
    }
  }

  // Final fallback
  return fallbackDescription || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Enhanced route matching using the new Enhanced GTFS Route Matcher
export async function getEnhancedRouteMatching(location, description, coordinates) {
  console.log(`🚌 Getting enhanced route matching for: "${location}"`);
  
  try {
    let routes = [];
    let accuracy = 'none';
    let method = 'none';
    let confidence = 0;
    
    // Try coordinate-based matching first if coordinates available
    if (coordinates) {
      let lat, lng;
      
      // Handle different coordinate formats
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        [lat, lng] = coordinates;
      } else if (coordinates.lat && coordinates.lng) {
        lat = coordinates.lat;
        lng = coordinates.lng;
      }
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        console.log(`📍 Using coordinate-based matching: ${lat}, ${lng}`);
        
        // Use our enhanced GTFS route finder
        routes = enhancedFindRoutesNearCoordinates(lat, lng, 250);
        
        if (routes.length > 0) {
          accuracy = 'high';
          method = 'Enhanced GTFS Coordinate Matching';
          confidence = 0.9;
          
          console.log(`✅ Enhanced GTFS found ${routes.length} routes: ${routes.join(', ')}`);
        }
      }
    }
    
    // If no coordinate-based matches, try text-based matching
    if (routes.length === 0) {
      console.log(`📝 Trying text-based route matching for: "${location}"`);
      const textRoutes = getTextBasedRoutes(location, description);
      
      if (textRoutes.length > 0) {
        routes = textRoutes;
        accuracy = 'medium';
        method = 'Text Pattern Matching';
        confidence = 0.6;
        
        console.log(`✅ Text matching found ${routes.length} routes: ${routes.join(', ')}`);
      }
    }
    
    if (routes.length > 0) {
      return {
        routes: routes,
        accuracy: accuracy,
        confidence: confidence,
        method: method,
        methodDetails: `Enhanced GTFS Route Matcher v1.0 - ${method}`
      };
    } else {
      console.log(`❌ Enhanced route matching found no routes for: "${location}"`);
      return {
        routes: [],
        accuracy: 'none',
        confidence: 0,
        method: 'none'
      };
    }
  } catch (error) {
    console.error(`❌ Enhanced route matching error for "${location}":`, error.message);
    
    // Fallback to basic route matching
    return getFallbackRouteMatching(location, description, coordinates);
  }
}

// Text-based route matching for fallback
function getTextBasedRoutes(location, description) {
  const routes = new Set();
  const textContent = `${location} ${description}`.toLowerCase();
  
  // Enhanced text patterns for Go North East routes
  const routePatterns = {
    // Major corridors
    'a1': ['21', 'X21', '25', '28', '28B'],
    'a19': ['1', '2', '307', '309', '317'],
    'a167': ['21', '22', 'X21', '6', '50'],
    'a184': ['1', '2', '307', '309'],
    'a693': ['X30', 'X31', '74', '84'],
    
    // Newcastle areas
    'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29'],
    'grainger': ['Q3', 'Q3X', '10', '12', '21', '22'],
    'central station': ['Q3', 'Q3X', '10', '21', '22'],
    'quayside': ['Q3', 'Q3X', '12'],
    
    // Gateshead areas
    'gateshead': ['10', '10A', '10B', '27', '28', '28B', 'Q3', 'Q3X'],
    'metrocentre': ['10', '10A', '10B', '27', '28', '100'],
    'teams': ['Q3', 'Q3X'],
    
    // North Tyneside
    'north shields': ['1', '2', '41', '42', '307', '309'],
    'tynemouth': ['1', '2', '41'],
    'whitley bay': ['1', '2', '307', '309'],
    'coast road': ['1', '2', '307', '309'],
    
    // Sunderland areas
    'sunderland': ['16', '20', '24', '35', '36', '56', '61', '62', '63'],
    'washington': ['4', '50', '85', '86', 'X1'],
    'houghton': ['35', '36', '4'],
    
    // Durham areas
    'durham': ['21', '22', 'X21', '6', '7', '50'],
    'chester le street': ['21', '22', 'X21', '28', '34'],
    'stanley': ['6', '7', '8', '78'],
    
    // Consett/West Durham
    'consett': ['X30', 'X31', 'X70', 'X71', 'X71A'],
    'shotley bridge': ['X30', 'X31'],
    'dipton': ['X30', 'X31'],
    
    // Hexham/West
    'hexham': ['X85', '684', 'AD122'],
    'corbridge': ['X85', '685'],
    'prudhoe': ['X85', '684']
  };
  
  // Apply pattern matching
  Object.entries(routePatterns).forEach(([pattern, routeList]) => {
    if (textContent.includes(pattern)) {
      routeList.forEach(route => routes.add(route));
    }
  });
  
  // Road-specific patterns
  if (textContent.includes('tyne tunnel')) {
    ['1', '2', '307', '309'].forEach(route => routes.add(route));
  }
  
  if (textContent.includes('birtley') || textContent.includes('angel of the north')) {
    ['21', 'X21', '25'].forEach(route => routes.add(route));
  }
  
  return Array.from(routes).sort();
}
function getFallbackRouteMatching(location, description, coordinates) {
  console.log(`🔄 Using fallback route matching for: "${location}"`);
  
  const routes = new Set();
  const textContent = `${location} ${description}`.toLowerCase();
  
  // Basic fallback patterns
  const basicPatterns = {
    'newcastle': ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    'gateshead': ['21', '25', '28', '29'],
    'sunderland': ['16', '18', '20', '61', '62'],
    'durham': ['21', '22', 'X21', '6', '7'],
    'coast road': ['1', '2', '308', '309'],
    'a1': ['21', 'X21', '10', '11'],
    'a19': ['1', '2', '308', '309'],
    'a167': ['21', '22', 'X21']
  };

  // Apply basic patterns
  Object.entries(basicPatterns).forEach(([pattern, routeList]) => {
    if (textContent.includes(pattern)) {
      routeList.forEach(route => routes.add(route));
    }
  });

  const foundRoutes = Array.from(routes).sort();
  console.log(`🔄 Fallback found ${foundRoutes.length} routes: ${foundRoutes.join(', ')}`);
  
  return {
    routes: foundRoutes,
    accuracy: 'low',
    confidence: 0.3,
    method: 'fallback'
  };
}

// Enhanced alert severity calculation
export function calculateAlertSeverity(alert) {
  let severityScore = 0;
  
  // Base severity from source
  const baseSeverity = {
    'High': 3,
    'Medium': 2,
    'Low': 1
  };
  severityScore += baseSeverity[alert.severity] || 1;
  
  // Route impact multiplier (enhanced with accuracy consideration)
  const routeCount = alert.affectsRoutes?.length || 0;
  const routeAccuracy = alert.routeMatchingAccuracy || 'low';
  
  if (routeCount > 5) {
    severityScore += routeAccuracy === 'high' ? 2 : 1.5;
  } else if (routeCount > 2) {
    severityScore += routeAccuracy === 'high' ? 1 : 0.7;
  }
  
  // Type-based adjustment
  const typeMultiplier = {
    'incident': 1.5,
    'congestion': 1.2,
    'roadwork': 1.0
  };
  severityScore *= typeMultiplier[alert.type] || 1.0;
  
  // Major road impact
  const majorRoads = ['a1', 'a19', 'a167', 'a184', 'a693'];
  const location = alert.location?.toLowerCase() || '';
  if (majorRoads.some(road => location.includes(road))) {
    severityScore += 1;
  }
  
  // Location accuracy bonus
  if (alert.locationAccuracy === 'high') {
    severityScore *= 1.1;
  }
  
  // Time-based adjustment (rush hours)
  const now = new Date();
  const hour = now.getHours();
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
  if (isRushHour) {
    severityScore *= 1.3;
  }
  
  // Convert score back to severity level
  if (severityScore >= 4.5) return 'High';
  if (severityScore >= 2.5) return 'Medium';
  return 'Low';
}

// Process and enhance alerts with all improvements
export async function processEnhancedAlerts(rawAlerts) {
  console.log(`🔄 Processing ${rawAlerts.length} alerts with enhanced route matching...`);
  
  const enhancedAlerts = [];
  let enhancedCount = 0;
  let routeMatchingStats = {
    high: 0,
    medium: 0,
    low: 0,
    none: 0
  };
  
  for (const alert of rawAlerts) {
    try {
      // Skip dismissed alerts
      if (isAlertDismissed(alert.id)) {
        continue;
      }
      
      let enhancedAlert = { ...alert };
      
      // Enhance location if coordinates available
      if (alert.coordinates?.lat && alert.coordinates?.lng) {
        const enhancedLocation = await getEnhancedLocation(
          alert.coordinates.lat,
          alert.coordinates.lng,
          alert.location
        );
        enhancedAlert.location = enhancedLocation;
        enhancedAlert.locationAccuracy = 'high';
      } else if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
        const [lat, lng] = alert.coordinates;
        const enhancedLocation = await getEnhancedLocation(lat, lng, alert.location);
        enhancedAlert.location = enhancedLocation;
        enhancedAlert.locationAccuracy = 'high';
      } else {
        enhancedAlert.locationAccuracy = 'low';
      }
      
      // Enhanced route matching using the new system
      const routeResult = await getEnhancedRouteMatching(
        enhancedAlert.location,
        enhancedAlert.description,
        alert.coordinates
      );
      
      if (routeResult.routes.length > 0) {
        enhancedAlert.affectsRoutes = routeResult.routes;
        enhancedAlert.routeMatchingAccuracy = routeResult.accuracy;
        enhancedAlert.routeMatchingConfidence = routeResult.confidence;
        enhancedAlert.routeMatchMethod = routeResult.method;
        enhancedAlert.routeMatchDetails = routeResult.methodDetails;
        
        // Update stats
        routeMatchingStats[routeResult.accuracy]++;
        enhancedCount++;
      } else {
        enhancedAlert.routeMatchingAccuracy = 'none';
        routeMatchingStats.none++;
      }
      
      // Recalculate severity with enhanced data
      enhancedAlert.calculatedSeverity = calculateAlertSeverity(enhancedAlert);
      
      // Add dismissal info if available
      const dismissalInfo = getAlertDismissalInfo(alert.id);
      if (dismissalInfo) {
        enhancedAlert.dismissalInfo = dismissalInfo;
      }
      
      // Add processing metadata
      enhancedAlert.processed = {
        enhancedAt: new Date().toISOString(),
        locationEnhanced: enhancedAlert.locationAccuracy === 'high',
        routesEnhanced: routeResult.routes.length > 0,
        severityRecalculated: true,
        enhancedRouteMatching: true,
        routeMatchingVersion: 'enhanced-gtfs-v1'
      };
      
      enhancedAlerts.push(enhancedAlert);
      
    } catch (error) {
      console.error('❌ Failed to enhance alert:', alert.id, error.message);
      // Include original alert if enhancement fails
      enhancedAlerts.push(alert);
    }
  }
  
  // Sort by calculated priority
  enhancedAlerts.sort((a, b) => {
    const priorityScore = (alert) => {
      let score = 0;
      
      // Status priority
      const statusPriority = { red: 3, amber: 2, green: 1 };
      score += (statusPriority[alert.status] || 0) * 100;
      
      // Severity priority
      const severityPriority = { High: 3, Medium: 2, Low: 1 };
      score += (severityPriority[alert.calculatedSeverity || alert.severity] || 0) * 10;
      
      // Route count (more affected routes = higher priority)
      score += (alert.affectsRoutes?.length || 0);
      
      // Route matching accuracy bonus
      const accuracyBonus = {
        high: 5,
        medium: 3,
        low: 1,
        none: 0
      };
      score += accuracyBonus[alert.routeMatchingAccuracy] || 0;
      
      return score;
    };
    
    return priorityScore(b) - priorityScore(a);
  });
  
  console.log(`✅ Enhanced ${enhancedAlerts.length} alerts with improved route matching`);
  console.log(`📊 Route matching accuracy: High: ${routeMatchingStats.high}, Medium: ${routeMatchingStats.medium}, Low: ${routeMatchingStats.low}, None: ${routeMatchingStats.none}`);
  console.log(`🎯 Enhanced ${enhancedCount}/${rawAlerts.length} alerts (${(enhancedCount/rawAlerts.length*100).toFixed(1)}%)`);
  
  return enhancedAlerts;
}

export default {
  getEnhancedLocation,
  getEnhancedRouteMatching,
  calculateAlertSeverity,
  processEnhancedAlerts
};
