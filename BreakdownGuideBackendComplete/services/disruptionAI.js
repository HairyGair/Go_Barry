// backend/services/disruptionAI.js
// AI-Powered Disruption Management Service for Go Barry
// Provides intelligent route diversion suggestions and disruption analysis
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { getRouteVisualization, getAvailableRoutes } from './routeVisualizationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for AI analysis data
let routeNetworkCache = null;
let stopProximityCache = null;
let diversionPatternsCache = null;
let historicalDisruptionsCache = null;
let isAIInitialized = false;

// AI Analysis Configuration
const AI_CONFIG = {
  MAX_DIVERSION_DISTANCE: 5000,     // meters - maximum acceptable diversion
  PROXIMITY_THRESHOLD: 500,         // meters - stops considered "close"
  PASSENGER_IMPACT_WEIGHTS: {
    HIGH_FREQUENCY_ROUTE: 3,        // Routes with <15min frequency get higher weight
    PEAK_HOURS: 2,                  // Peak hour disruptions weighted higher
    MAJOR_DESTINATION: 2,           // Routes serving hospitals, schools, etc.
    WHEELCHAIR_ACCESS: 1.5          // Routes with wheelchair access
  },
  DIVERSION_TYPES: {
    SHORT_DIVERSION: 'minor_detour',     // <1km extra
    MEDIUM_DIVERSION: 'standard_detour', // 1-3km extra  
    LONG_DIVERSION: 'major_detour',      // 3-5km extra
    REPLACEMENT_SERVICE: 'replacement'    // >5km or no viable diversion
  }
};

/**
 * Initialize AI disruption management system
 */
export async function initializeDisruptionAI() {
  if (isAIInitialized) return true;
  
  try {
    console.log('🤖 Initializing AI Disruption Management System...');
    
    await Promise.all([
      buildRouteNetwork(),
      buildStopProximityMap(),
      loadDiversionPatterns(),
      loadHistoricalDisruptions()
    ]);
    
    isAIInitialized = true;
    console.log('✅ AI Disruption Management System Ready');
    console.log(`   🗺️ Network analysis for ${Object.keys(routeNetworkCache || {}).length} routes`);
    console.log(`   📍 Stop proximity mapping completed`);
    console.log(`   🔄 Diversion patterns loaded`);
    
    return true;
  } catch (error) {
    console.error('❌ AI disruption initialization failed:', error.message);
    return false;
  }
}

/**
 * Build comprehensive route network for AI analysis
 */
async function buildRouteNetwork() {
  try {
    console.log('🗺️ Building route network for AI analysis...');
    
    // Get all available routes
    const routesData = await getAvailableRoutes();
    
    if (!routesData.success) {
      throw new Error('Failed to load routes data');
    }
    
    routeNetworkCache = {};
    
    // Build detailed network analysis for each route
    for (const route of routesData.routes) {
      const routeViz = await getRouteVisualization(route.routeNumber);
      
      if (routeViz.success) {
        routeNetworkCache[route.routeNumber] = {
          metadata: route,
          visualization: routeViz,
          stops: routeViz.stops,
          shapes: routeViz.shapes,
          servesKeyDestinations: identifyKeyDestinations(routeViz.stops),
          parallelRoutes: findParallelRoutes(routeViz, routesData.routes),
          networkImportance: calculateNetworkImportance(route, routeViz),
          diversions: []  // Will be populated during analysis
        };
      }
    }
    
    console.log(`✅ Built network analysis for ${Object.keys(routeNetworkCache).length} routes`);
    
  } catch (error) {
    console.error('❌ Failed to build route network:', error.message);
    routeNetworkCache = {};
  }
}

/**
 * Build stop proximity mapping for alternative stop suggestions
 */
async function buildStopProximityMap() {
  try {
    console.log('📍 Building stop proximity map...');
    
    stopProximityCache = {};
    
    if (!routeNetworkCache) return;
    
    // Create a flat list of all stops with route info
    const allStops = [];
    
    for (const [routeNumber, routeData] of Object.entries(routeNetworkCache)) {
      routeData.stops.forEach(stop => {
        allStops.push({
          ...stop,
          routeNumber: routeNumber,
          wheelchair: stop.wheelchair || false
        });
      });
    }
    
    // Build proximity mapping for each stop
    allStops.forEach(stop => {
      if (!stopProximityCache[stop.id]) {
        stopProximityCache[stop.id] = {
          stop: stop,
          nearbyStops: [],
          alternativeRoutes: new Set()
        };
      }
      
      // Find nearby stops from other routes
      allStops.forEach(otherStop => {
        if (stop.id !== otherStop.id && stop.routeNumber !== otherStop.routeNumber) {
          const distance = calculateDistance(
            stop.coordinates[0], stop.coordinates[1],
            otherStop.coordinates[0], otherStop.coordinates[1]
          );
          
          if (distance <= AI_CONFIG.PROXIMITY_THRESHOLD) {
            stopProximityCache[stop.id].nearbyStops.push({
              ...otherStop,
              distance: Math.round(distance)
            });
            stopProximityCache[stop.id].alternativeRoutes.add(otherStop.routeNumber);
          }
        }
      });
      
      // Convert Set to Array and sort by proximity
      stopProximityCache[stop.id].alternativeRoutes = Array.from(stopProximityCache[stop.id].alternativeRoutes);
      stopProximityCache[stop.id].nearbyStops.sort((a, b) => a.distance - b.distance);
    });
    
    console.log(`✅ Built proximity map for ${Object.keys(stopProximityCache).length} stops`);
    
  } catch (error) {
    console.error('❌ Failed to build stop proximity map:', error.message);
    stopProximityCache = {};
  }
}

/**
 * Load common diversion patterns (could be enhanced with machine learning)
 */
async function loadDiversionPatterns() {
  try {
    console.log('🔄 Loading diversion patterns...');
    
    // For now, create intelligent patterns based on route analysis
    // In a real implementation, this would use historical data and ML
    diversionPatternsCache = {
      // Common diversion scenarios for Tyne and Wear Metro region
      'A1_NORTHBOUND': {
        affectedCoordinates: [[54.9783, -1.6178], [54.9980, -1.6160]],
        alternativeRoutes: ['A167', 'A19', 'B1318'],
        typicalDelay: 12,
        affectedRoutes: ['21', 'X21', '25']
      },
      'TYNE_BRIDGE': {
        affectedCoordinates: [[54.9689, -1.6007]],
        alternativeRoutes: ['A167', 'Redheugh Bridge', 'Swing Bridge'],
        typicalDelay: 20,
        affectedRoutes: ['21', '22', 'X21', '10', '11']
      },
      'METRO_CENTRE': {
        affectedCoordinates: [[54.9590, -1.6726]],
        alternativeRoutes: ['A1_Western_Bypass', 'Team Valley'],
        typicalDelay: 15,
        affectedRoutes: ['100', '101', '95']
      },
      'DURHAM_ROAD': {
        affectedCoordinates: [[54.9445, -1.5764], [54.9234, -1.5523]],
        alternativeRoutes: ['A167', 'Chester Road', 'Old Durham Road'],
        typicalDelay: 10,
        affectedRoutes: ['21', 'X21', '28', '29']
      },
      'CITY_CENTRE': {
        affectedCoordinates: [[54.9738, -1.6131]],
        alternativeRoutes: ['Bypass_via_A1', 'A696_Northern'],
        typicalDelay: 25,
        affectedRoutes: ['1', '12', '39', '40', '54', '56']
      }
    };
    
    console.log(`✅ Loaded ${Object.keys(diversionPatternsCache).length} diversion patterns`);
    
  } catch (error) {
    console.error('❌ Failed to load diversion patterns:', error.message);
    diversionPatternsCache = {};
  }
}

/**
 * Load historical disruption data for pattern analysis
 */
async function loadHistoricalDisruptions() {
  try {
    console.log('📊 Loading historical disruption patterns...');
    
    // Simulate historical disruption patterns
    // In real implementation, this would query the disruptionLogger database
    historicalDisruptionsCache = {
      commonIncidentTypes: {
        'vehicle_breakdown': { frequency: 45, avgResolutionTime: 25 },
        'roadworks': { frequency: 30, avgResolutionTime: 120 },
        'accident': { frequency: 15, avgResolutionTime: 35 },
        'weather': { frequency: 10, avgResolutionTime: 60 }
      },
      successfulDiversions: {
        'A1_via_A167': { success_rate: 0.85, passenger_satisfaction: 0.75 },
        'Durham_Road_via_Chester': { success_rate: 0.90, passenger_satisfaction: 0.80 },
        'City_Centre_bypass': { success_rate: 0.70, passenger_satisfaction: 0.65 }
      },
      peakIncidentTimes: {
        'morning_peak': '07:30-09:30',
        'afternoon_peak': '16:30-18:30',
        'friday_evening': '17:00-20:00'
      }
    };
    
    console.log('✅ Historical disruption patterns loaded');
    
  } catch (error) {
    console.error('❌ Failed to load historical disruptions:', error.message);
    historicalDisruptionsCache = {};
  }
}

/**
 * Main AI function: Suggest optimal diversion for a disrupted route
 */
export async function suggestDiversion(affectedRoute, incidentLocation, incidentType = 'incident', additionalInfo = {}) {
  if (!isAIInitialized) {
    await initializeDisruptionAI();
  }
  
  try {
    console.log(`🤖 AI analyzing diversion for route ${affectedRoute} at ${incidentLocation}`);
    
    const routeData = routeNetworkCache[affectedRoute];
    
    if (!routeData) {
      return {
        success: false,
        error: `Route ${affectedRoute} not found in network analysis`,
        availableRoutes: Object.keys(routeNetworkCache).slice(0, 10)
      };
    }
    
    // Parse incident location (could be coordinates, stop name, or address)
    const incidentCoords = await parseIncidentLocation(incidentLocation);
    
    // Analyze impact on route
    const impactAnalysis = analyzeRouteImpact(routeData, incidentCoords, incidentType);
    
    // Generate diversion options
    const diversionOptions = await generateDiversionOptions(routeData, incidentCoords, impactAnalysis);
    
    // Rank options using AI scoring
    const rankedOptions = rankDiversionOptions(diversionOptions, routeData, additionalInfo);
    
    // Get best recommendation
    const bestOption = rankedOptions[0];
    
    if (!bestOption) {
      return {
        success: false,
        error: 'No viable diversion options found',
        analysis: impactAnalysis,
        suggestions: ['Consider replacement shuttle service', 'Direct passengers to alternative routes']
      };
    }
    
    return {
      success: true,
      route: affectedRoute,
      incidentLocation: incidentLocation,
      incidentCoords: incidentCoords,
      timestamp: new Date().toISOString(),
      
      recommendedDiversion: {
        route: affectedRoute,
        diversionVia: bestOption.path,
        addedDistance: `${bestOption.addedDistance} miles`,
        addedDistanceKm: bestOption.addedDistanceKm,
        estimatedDelay: `${bestOption.estimatedDelay} minutes`,
        missedStops: bestOption.missedStops,
        alternativeStopsPassengers: bestOption.alternativeStopsInfo,
        diversionType: bestOption.type,
        confidenceScore: bestOption.score
      },
      
      reasoning: bestOption.reasoning,
      
      impactAssessment: {
        stopsAffected: impactAnalysis.stopsAffected,
        passengersAffected: impactAnalysis.passengersAffected,
        serviceDisruption: impactAnalysis.serviceDisruption,
        wheelchairImpact: impactAnalysis.wheelchairImpact,
        peakHourMultiplier: impactAnalysis.peakHourMultiplier
      },
      
      alternatives: rankedOptions.slice(1, 4).map(option => ({
        description: option.description,
        estimatedDelay: `${option.estimatedDelay} minutes`,
        pros: option.pros,
        cons: option.cons
      })),
      
      operationalRecommendations: generateOperationalRecommendations(bestOption, impactAnalysis, additionalInfo),
      
      aiConfidence: calculateAIConfidence(bestOption, impactAnalysis, routeData)
    };
    
  } catch (error) {
    console.error('❌ AI diversion analysis failed:', error);
    return {
      success: false,
      error: `AI analysis failed: ${error.message}`,
      fallbackSuggestion: 'Manual diversion assessment required'
    };
  }
}

/**
 * Analyze passenger flow disruption and suggest optimal messaging
 */
export async function analyzePassengerImpact(affectedRoute, incidentLocation, estimatedDuration) {
  if (!isAIInitialized) {
    await initializeDisruptionAI();
  }
  
  try {
    const routeData = routeNetworkCache[affectedRoute];
    
    if (!routeData) {
      return { success: false, error: `Route ${affectedRoute} not found` };
    }
    
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19);
    
    // Estimate passenger numbers (simplified model)
    const basePassengers = routeData.metadata.stopCount * 15; // Rough estimate
    const peakMultiplier = isPeakHour ? 2.5 : 1;
    const durationMultiplier = Math.min(estimatedDuration / 30, 3); // Cap at 3x for long disruptions
    
    const estimatedAffected = Math.round(basePassengers * peakMultiplier * durationMultiplier);
    
    return {
      success: true,
      route: affectedRoute,
      impact: {
        estimatedPassengersAffected: estimatedAffected,
        impactLevel: estimatedAffected > 200 ? 'HIGH' : estimatedAffected > 100 ? 'MEDIUM' : 'LOW',
        isPeakHour: isPeakHour,
        wheelchairAccessAffected: routeData.metadata.wheelchairAccessible,
        keyDestinationsAffected: routeData.servesKeyDestinations,
        alternativeRoutes: routeData.parallelRoutes.slice(0, 3),
        recommendedActions: generatePassengerActions(estimatedAffected, isPeakHour, routeData)
      }
    };
    
  } catch (error) {
    console.error('❌ Passenger impact analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get AI-powered network-wide disruption insights
 */
export async function getNetworkDisruptionInsights(currentDisruptions = []) {
  if (!isAIInitialized) {
    await initializeDisruptionAI();
  }
  
  try {
    const insights = {
      networkStatus: 'NORMAL',
      criticalRoutes: [],
      cascadingEffects: [],
      proactiveRecommendations: [],
      capacityAnalysis: {},
      timestamp: new Date().toISOString()
    };
    
    // Analyze each disruption for cascading effects
    for (const disruption of currentDisruptions) {
      const cascadeAnalysis = analyzeCascadingEffects(disruption);
      insights.cascadingEffects.push(cascadeAnalysis);
      
      if (cascadeAnalysis.severity === 'HIGH') {
        insights.criticalRoutes.push(disruption.route);
      }
    }
    
    // Determine overall network status
    if (insights.criticalRoutes.length > 3) {
      insights.networkStatus = 'CRITICAL';
    } else if (insights.criticalRoutes.length > 1) {
      insights.networkStatus = 'DEGRADED';
    } else if (currentDisruptions.length > 0) {
      insights.networkStatus = 'MINOR_DISRUPTION';
    }
    
    // Generate proactive recommendations
    insights.proactiveRecommendations = generateProactiveRecommendations(currentDisruptions, insights.networkStatus);
    
    // Analyze remaining network capacity
    insights.capacityAnalysis = analyzeRemainingCapacity(currentDisruptions);
    
    return {
      success: true,
      insights: insights
    };
    
  } catch (error) {
    console.error('❌ Network insights analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper Functions
 */

function identifyKeyDestinations(stops) {
  const keyTerms = [
    'hospital', 'college', 'university', 'school', 'station', 'metro', 
    'shopping', 'centre', 'airport', 'interchange', 'stadium'
  ];
  
  return stops.filter(stop => 
    keyTerms.some(term => stop.name.toLowerCase().includes(term))
  ).map(stop => stop.name);
}

function findParallelRoutes(routeViz, allRoutes) {
  // Simplified parallel route detection based on stop proximity
  // In real implementation, this would use sophisticated spatial analysis
  
  const routeStops = routeViz.stops.map(stop => stop.coordinates);
  const parallelRoutes = [];
  
  for (const otherRoute of allRoutes) {
    if (otherRoute.routeNumber === routeViz.route) continue;
    
    // This is simplified - would need actual route comparison logic
    parallelRoutes.push(otherRoute.routeNumber);
  }
  
  return parallelRoutes.slice(0, 5); // Return top 5 parallel routes
}

function calculateNetworkImportance(route, routeViz) {
  let importance = 0;
  
  // Base importance on stop count
  importance += routeViz.stops.length * 2;
  
  // Boost for longer routes (key connections)
  importance += routeViz.metadata.stopCount > 30 ? 20 : 0;
  
  // Boost for wheelchair accessible routes
  importance += routeViz.metadata.wheelchairAccessible ? 15 : 0;
  
  // Boost for routes serving key destinations
  const keyDestinations = identifyKeyDestinations(routeViz.stops);
  importance += keyDestinations.length * 10;
  
  return Math.min(importance, 100); // Cap at 100
}

async function parseIncidentLocation(location) {
  // Simple parsing - in real implementation would use geocoding
  if (typeof location === 'string') {
    // Try to extract coordinates if provided
    const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      return [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
    }
    
    // Otherwise return default coordinates (could geocode the address)
    return [54.9783, -1.6178]; // Newcastle city center
  }
  
  return location; // Assume already coordinates
}

function analyzeRouteImpact(routeData, incidentCoords, incidentType) {
  const currentHour = new Date().getHours();
  const isPeakHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19);
  
  // Find affected stops (within 1km of incident)
  const affectedStops = routeData.stops.filter(stop => {
    const distance = calculateDistance(
      incidentCoords[0], incidentCoords[1],
      stop.coordinates[0], stop.coordinates[1]
    );
    return distance <= 1000; // 1km radius
  });
  
  return {
    stopsAffected: affectedStops.length,
    passengersAffected: Math.round(affectedStops.length * (isPeakHour ? 25 : 10)),
    serviceDisruption: affectedStops.length > 3 ? 'HIGH' : affectedStops.length > 1 ? 'MEDIUM' : 'LOW',
    wheelchairImpact: affectedStops.some(stop => stop.wheelchair),
    peakHourMultiplier: isPeakHour ? 2.5 : 1,
    incidentType: incidentType,
    affectedStopNames: affectedStops.map(stop => stop.name)
  };
}

async function generateDiversionOptions(routeData, incidentCoords, impactAnalysis) {
  const options = [];
  
  // Option 1: Short diversion around incident
  options.push({
    type: AI_CONFIG.DIVERSION_TYPES.SHORT_DIVERSION,
    path: ['Current route', 'Minor detour', 'Resume normal route'],
    addedDistance: 0.8,
    addedDistanceKm: 1.3,
    estimatedDelay: 8,
    missedStops: impactAnalysis.affectedStopNames.slice(0, 2),
    score: 85,
    reasoning: 'Minimal impact short diversion maintaining most of route',
    pros: ['Quick implementation', 'Minimal passenger disruption'],
    cons: ['May not avoid all congestion'],
    description: 'Short detour around incident area'
  });
  
  // Option 2: Alternative route via major roads
  options.push({
    type: AI_CONFIG.DIVERSION_TYPES.MEDIUM_DIVERSION,
    path: ['A167', 'Chester Road', 'Resume at Durham Road'],
    addedDistance: 2.3,
    addedDistanceKm: 3.7,
    estimatedDelay: 12,
    missedStops: impactAnalysis.affectedStopNames,
    score: 75,
    reasoning: 'Reliable alternative using major road network',
    pros: ['Avoids congestion', 'Predictable timing'],
    cons: ['Longer journey', 'More stops missed'],
    description: 'Diversion via major alternative route'
  });
  
  // Option 3: Partial service with turning point
  options.push({
    type: AI_CONFIG.DIVERSION_TYPES.REPLACEMENT_SERVICE,
    path: ['Service to incident point', 'Terminate and reverse', 'Separate service from other end'],
    addedDistance: 0,
    addedDistanceKm: 0,
    estimatedDelay: 20,
    missedStops: impactAnalysis.affectedStopNames,
    score: 60,
    reasoning: 'Split service to maintain connections where possible',
    pros: ['Maintains service to unaffected areas'],
    cons: ['Passengers need to find alternative', 'Complex operation'],
    description: 'Split service with replacement transport'
  });
  
  return options;
}

function rankDiversionOptions(options, routeData, additionalInfo) {
  return options.sort((a, b) => {
    // Adjust scores based on route importance and passenger impact
    let scoreA = a.score;
    let scoreB = b.score;
    
    // Boost shorter diversions for high-importance routes
    if (routeData.networkImportance > 70) {
      scoreA += a.type === AI_CONFIG.DIVERSION_TYPES.SHORT_DIVERSION ? 10 : 0;
      scoreB += b.type === AI_CONFIG.DIVERSION_TYPES.SHORT_DIVERSION ? 10 : 0;
    }
    
    // Adjust for time of day
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19);
    
    if (isPeakHour) {
      scoreA += a.estimatedDelay < 15 ? 5 : -5;
      scoreB += b.estimatedDelay < 15 ? 5 : -5;
    }
    
    return scoreB - scoreA; // Sort by highest score first
  });
}

function generateOperationalRecommendations(bestOption, impactAnalysis, additionalInfo) {
  const recommendations = [];
  
  // Communication recommendations
  if (impactAnalysis.passengersAffected > 100) {
    recommendations.push('🔊 Activate enhanced passenger communication systems');
    recommendations.push('📱 Send push notifications to mobile app users');
  }
  
  // Resource recommendations
  if (bestOption.estimatedDelay > 15) {
    recommendations.push('🚌 Consider deploying additional vehicles');
    recommendations.push('👮 Request traffic management support');
  }
  
  // Staff recommendations
  if (impactAnalysis.stopsAffected > 3) {
    recommendations.push('👥 Deploy customer service staff to affected stops');
    recommendations.push('📋 Brief drivers on diversion route and passenger information');
  }
  
  // Accessibility recommendations
  if (impactAnalysis.wheelchairImpact) {
    recommendations.push('♿ Ensure alternative stops are wheelchair accessible');
    recommendations.push('🚐 Arrange accessible transport for affected passengers');
  }
  
  return recommendations;
}

function generatePassengerActions(estimatedAffected, isPeakHour, routeData) {
  const actions = [];
  
  if (estimatedAffected > 200) {
    actions.push('Activate crisis communication protocol');
    actions.push('Deploy field staff for passenger assistance');
  }
  
  if (isPeakHour) {
    actions.push('Increase service frequency on alternative routes');
    actions.push('Coordinate with other transport operators');
  }
  
  if (routeData.parallelRoutes.length > 0) {
    actions.push(`Direct passengers to routes: ${routeData.parallelRoutes.slice(0, 3).join(', ')}`);
  }
  
  return actions;
}

function analyzeCascadingEffects(disruption) {
  // Simplified cascading effect analysis
  return {
    route: disruption.route,
    severity: disruption.estimatedDelay > 20 ? 'HIGH' : 'LOW',
    affectedConnections: [],
    passengerFlow: 'DISRUPTED',
    networkLoad: 'INCREASED'
  };
}

function generateProactiveRecommendations(disruptions, networkStatus) {
  const recommendations = [];
  
  if (networkStatus === 'CRITICAL') {
    recommendations.push('Consider implementing emergency bus services');
    recommendations.push('Activate backup communication channels');
  }
  
  if (disruptions.length > 2) {
    recommendations.push('Monitor alternative route capacity');
    recommendations.push('Prepare contingency plans for extended disruptions');
  }
  
  return recommendations;
}

function analyzeRemainingCapacity(disruptions) {
  return {
    overallCapacity: disruptions.length > 3 ? 'STRAINED' : 'ADEQUATE',
    alternativeRoutes: 'AVAILABLE',
    resourceUtilization: disruptions.length * 15 // Simplified percentage
  };
}

function calculateAIConfidence(bestOption, impactAnalysis, routeData) {
  let confidence = bestOption.score;
  
  // Reduce confidence for complex scenarios
  if (impactAnalysis.stopsAffected > 5) confidence -= 10;
  if (bestOption.estimatedDelay > 20) confidence -= 5;
  
  // Increase confidence for well-analyzed routes
  if (routeData.networkImportance > 80) confidence += 5;
  
  return Math.max(0, Math.min(100, confidence));
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Get AI system statistics
 */
export function getDisruptionAIStats() {
  return {
    initialized: isAIInitialized,
    routeNetworkSize: Object.keys(routeNetworkCache || {}).length,
    stopProximityMappings: Object.keys(stopProximityCache || {}).length,
    diversionPatterns: Object.keys(diversionPatternsCache || {}).length,
    aiConfig: AI_CONFIG,
    memoryUsage: {
      routeNetwork: routeNetworkCache ? 'loaded' : 'not loaded',
      stopProximity: stopProximityCache ? 'loaded' : 'not loaded',
      diversionPatterns: diversionPatternsCache ? 'loaded' : 'not loaded',
      historicalData: historicalDisruptionsCache ? 'loaded' : 'not loaded'
    }
  };
}

export default {
  initializeDisruptionAI,
  suggestDiversion,
  analyzePassengerImpact,
  getNetworkDisruptionInsights,
  getDisruptionAIStats
};
