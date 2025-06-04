// backend/services/enhancedAlertProcessor.js
// Enhanced Alert Processing with Better Location Accuracy and Route Matching

import axios from 'axios';
import { isAlertDismissed, getAlertDismissalInfo } from './supervisorManager.js';

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

// Enhanced route matching using GTFS data and smart patterns
export function getEnhancedRouteMatching(location, description, coordinates) {
  const routes = new Set();
  
  // GTFS coordinate-based matching if coordinates available
  if (coordinates && coordinates.lat && coordinates.lng) {
    const gtfsRoutes = findNearbyGTFSRoutes(coordinates.lat, coordinates.lng);
    gtfsRoutes.forEach(route => routes.add(route));
  }
  
  // Enhanced text-based route matching
  const textContent = `${location} ${description}`.toLowerCase();
  
  // Go North East route patterns (enhanced with common variations)
  const routePatterns = {
    // Main routes
    'X21': ['x21', 'x-21', 'x 21', 'durham road', 'newcastle to bishop auckland'],
    'X1': ['x1', 'x-1', 'x 1', 'easington', 'peterlee', 'newcastle to middlesbrough'],
    'Q3': ['q3', 'q-3', 'q 3', 'metrocentre', 'newcastle quayside'],
    '21': ['route 21', ' 21 ', '21,', 'chester le street', 'durham'],
    '22': ['route 22', ' 22 ', '22,', 'sunderland'],
    '10': ['route 10', ' 10 ', '10,', 'hexham', 'corbridge'],
    '56': ['route 56', ' 56 ', '56,', 'sunderland', 'concord'],
    
    // Major corridors
    'X30': ['x30', 'consett', 'stanley', 'metrocentre'],
    'X31': ['x31', 'consett', 'shotley bridge'],
    'X70': ['x70', 'durham', 'stanley', 'consett'],
    'X71': ['x71', 'durham', 'consett'],
    
    // Coast routes
    '1': ['route 1', ' 1 ', 'tynemouth', 'whitley bay', 'blyth'],
    '2': ['route 2', ' 2 ', 'ashington', 'cramlington'],
    
    // Newcastle city routes
    '12': ['route 12', ' 12 ', 'newcastle', 'wallsend'],
    '39': ['route 39', ' 39 ', 'newcastle', 'dinnington'],
    '40': ['route 40', ' 40 ', 'newcastle', 'gateshead'],
    
    // Sunderland routes
    '61': ['route 61', ' 61 ', 'sunderland', 'murton'],
    '62': ['route 62', ' 62 ', 'sunderland', 'seaham'],
    '9': ['route 9', ' 9 ', 'sunderland', 'south shields']
  };

  // Road-based route inference
  const roadRouteMapping = {
    'a1': ['X1', '21', '22', 'X21'],
    'a19': ['1', '2', '9', '56'],
    'a167': ['21', '22', 'X21'],
    'a184': ['9', '56'],
    'a693': ['X30', 'X31', 'X70', 'X71'],
    'durham road': ['21', '22', 'X21'],
    'chester road': ['21', '22'],
    'newcastle road': ['1', '2', '10'],
    'coast road': ['1', '309', '310'],
    'wrekenton': ['21', '25', '28'],
    'team valley': ['21', '25', '28'],
    'metrocentre': ['Q3', '10', '100'],
    'gateshead': ['21', '25', '28', 'Q3'],
    'heworth': ['21', '25', '28']
  };

  // Apply pattern matching
  Object.entries(routePatterns).forEach(([route, patterns]) => {
    patterns.forEach(pattern => {
      if (textContent.includes(pattern)) {
        routes.add(route);
      }
    });
  });

  // Apply road-based matching
  Object.entries(roadRouteMapping).forEach(([road, routeList]) => {
    if (textContent.includes(road)) {
      routeList.forEach(route => routes.add(route));
    }
  });

  // Area-based route matching for better accuracy
  const areaRoutes = {
    // Newcastle areas
    'newcastle': ['Q3', '10', '12', '21', '22', '39', '40'],
    'wallsend': ['12', '22', '39'],
    'gosforth': ['43', '44', '45'],
    'jesmond': ['Q3', '31', '32'],
    
    // Gateshead areas
    'gateshead': ['21', '25', '28', 'Q3'],
    'felling': ['25', '28'],
    'whickham': ['28B', '29'],
    'blaydon': ['10', '10A', '10B'],
    
    // Sunderland areas
    'sunderland': ['9', '20', '35', '36', '56', '61', '62'],
    'washington': ['4', '8', '50'],
    'houghton': ['35', '55'],
    
    // Durham areas
    'durham': ['21', '22', 'X21', 'X12'],
    'chester le street': ['21', '25', '28'],
    'stanley': ['X30', 'X31', 'X70', 'X71'],
    'consett': ['X30', 'X31', 'X70', 'X71'],
    
    // Coast areas
    'south shields': ['9', 'E1', 'E2', 'E6'],
    'tynemouth': ['1', '306', '308'],
    'whitley bay': ['1', '306', '308'],
    'blyth': ['1', '2', '308'],
    'cramlington': ['43', '44', '45', '52']
  };

  Object.entries(areaRoutes).forEach(([area, routeList]) => {
    if (textContent.includes(area)) {
      routeList.forEach(route => routes.add(route));
    }
  });

  return Array.from(routes).sort();
}

// Simplified GTFS route finder (would integrate with real GTFS data)
function findNearbyGTFSRoutes(lat, lng, radiusMeters = 200) {
  // This would integrate with the existing GTFS processing
  // For now, return empty array as fallback
  return [];
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
  
  // Route impact multiplier
  const routeCount = alert.affectsRoutes?.length || 0;
  if (routeCount > 5) severityScore += 2;
  else if (routeCount > 2) severityScore += 1;
  
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
  
  // Time-based adjustment (rush hours)
  const now = new Date();
  const hour = now.getHours();
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
  if (isRushHour) {
    severityScore *= 1.3;
  }
  
  // Convert score back to severity level
  if (severityScore >= 4) return 'High';
  if (severityScore >= 2.5) return 'Medium';
  return 'Low';
}

// Process and enhance alerts with all improvements
export async function processEnhancedAlerts(rawAlerts) {
  const enhancedAlerts = [];
  
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
      } else {
        enhancedAlert.locationAccuracy = 'low';
      }
      
      // Enhanced route matching
      const enhancedRoutes = getEnhancedRouteMatching(
        enhancedAlert.location,
        enhancedAlert.description,
        alert.coordinates
      );
      
      if (enhancedRoutes.length > 0) {
        enhancedAlert.affectsRoutes = enhancedRoutes;
        enhancedAlert.routeMatchMethod = 'enhanced';
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
        routesEnhanced: enhancedRoutes.length > 0,
        severityRecalculated: true
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
      
      return score;
    };
    
    return priorityScore(b) - priorityScore(a);
  });
  
  console.log(`✅ Enhanced ${enhancedAlerts.length} alerts with improved locations and route matching`);
  return enhancedAlerts;
}

export default {
  getEnhancedLocation,
  getEnhancedRouteMatching,
  calculateAlertSeverity,
  processEnhancedAlerts
};
