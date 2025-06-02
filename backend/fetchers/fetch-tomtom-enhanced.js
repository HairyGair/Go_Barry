// backend/fetchers/fetch-tomtom-enhanced.js
// Enhanced TomTom integration with improved location accuracy

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

// Enhanced North East bounding box for more precise filtering
const NORTH_EAST_BOUNDS = {
  // Expanded to include wider North East region
  minLat: 54.4, // Southern boundary (around Darlington)
  maxLat: 55.8, // Northern boundary (around Berwick)
  minLon: -2.8, // Western boundary (around Hexham)
  maxLon: -0.8  // Eastern boundary (North Sea coast)
};

// More granular location patterns for better route matching
const ENHANCED_LOCATION_MAPPING = {
  // Major A-roads with specific junction/area mapping
  'a1_north': {
    pattern: /a1.*north|a1.*newcastle|a1.*gateshead/i,
    routes: ['21', '22', 'X21', '25', '28', '29', 'X9', 'X10'],
    priority: 'high'
  },
  'a1_south': {
    pattern: /a1.*south|a1.*durham|a1.*washington/i,
    routes: ['21', '22', 'X21', '50', '6', '7'],
    priority: 'high'
  },
  'a19_tunnel': {
    pattern: /a19.*tunnel|tyne tunnel|a19.*jarrow/i,
    routes: ['1', '2', '308', '309', '311', '317'],
    priority: 'critical'
  },
  'a19_sunderland': {
    pattern: /a19.*sunderland|a19.*seaham|a19.*peterlee/i,
    routes: ['16', '18', '20', '61', '62', '63', '64', '65'],
    priority: 'high'
  },
  'coast_road': {
    pattern: /a1058|coast road|gosforth|wallsend|tynemouth/i,
    routes: ['1', '2', '308', '309', '311', '317'],
    priority: 'high'
  },
  'central_motorway': {
    pattern: /a167.*m|central motorway|newcastle.*centre/i,
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12'],
    priority: 'critical'
  },
  // City-specific patterns
  'newcastle_city': {
    pattern: /newcastle.*city|grainger.*street|monument|central station/i,
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40'],
    priority: 'critical'
  },
  'gateshead_centre': {
    pattern: /gateshead.*centre|metrocentre|team street/i,
    routes: ['21', '25', '28', '29', '53', '54', '56'],
    priority: 'high'
  }
};

/**
 * Enhanced location validation using multiple criteria
 */
function isInNorthEastEnhanced(incident) {
  const { geometry, properties } = incident;
  
  // 1. Geographic boundary check (most accurate)
  if (geometry && geometry.coordinates) {
    const [lon, lat] = geometry.coordinates;
    const inBounds = lat >= NORTH_EAST_BOUNDS.minLat && 
                     lat <= NORTH_EAST_BOUNDS.maxLat &&
                     lon >= NORTH_EAST_BOUNDS.minLon && 
                     lon <= NORTH_EAST_BOUNDS.maxLon;
    
    if (inBounds) return { inRegion: true, method: 'coordinates', confidence: 'high' };
  }
  
  // 2. Text-based location matching (backup method)
  const locationText = [
    properties?.description,
    properties?.address?.freeformAddress,
    properties?.address?.municipality,
    properties?.address?.localName
  ].filter(Boolean).join(' ').toUpperCase();
  
  const northEastKeywords = [
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'WASHINGTON',
    'CRAMLINGTON', 'HEXHAM', 'SEAHAM', 'PETERLEE', 'CONSETT',
    'BLYTH', 'WALLSEND', 'GOSFORTH', 'JESMOND', 'BYKER',
    'A1', 'A19', 'A69', 'A167', 'A1058', 'A183', 'A184', 'A690',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY'
  ];
  
  const matches = northEastKeywords.filter(keyword => 
    locationText.includes(keyword)
  );
  
  if (matches.length > 0) {
    return { 
      inRegion: true, 
      method: 'text_matching', 
      confidence: matches.length > 2 ? 'high' : 'medium',
      matchedKeywords: matches
    };
  }
  
  return { inRegion: false, method: 'no_match', confidence: 'none' };
}

/**
 * Enhanced route matching with priority and confidence scoring
 */
function matchRoutesEnhanced(incident) {
  const routes = new Set();
  let priority = 'low';
  let confidence = 'low';
  
  const locationText = [
    incident.properties?.description,
    incident.properties?.address?.freeformAddress,
    incident.properties?.address?.localName
  ].filter(Boolean).join(' ');
  
  // Check against enhanced location patterns
  for (const [key, config] of Object.entries(ENHANCED_LOCATION_MAPPING)) {
    if (config.pattern.test(locationText)) {
      config.routes.forEach(route => routes.add(route));
      if (config.priority === 'critical') priority = 'critical';
      else if (config.priority === 'high' && priority !== 'critical') priority = 'high';
      confidence = 'high';
    }
  }
  
  // If no specific pattern match, try coordinate-based matching
  if (routes.size === 0 && incident.geometry?.coordinates) {
    const [lon, lat] = incident.geometry.coordinates;
    
    // Newcastle city centre area
    if (lat >= 54.96 && lat <= 54.98 && lon >= -1.63 && lon <= -1.60) {
      ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12'].forEach(r => routes.add(r));
      priority = 'critical';
      confidence = 'medium';
    }
    // A19 corridor
    else if (lon >= -1.52 && lon <= -1.48 && lat >= 54.85 && lat <= 55.05) {
      ['1', '2', '308', '309', '311', '317'].forEach(r => routes.add(r));
      priority = 'high';
      confidence = 'medium';
    }
  }
  
  return {
    routes: Array.from(routes).sort(),
    priority,
    confidence,
    method: routes.size > 0 ? 'pattern_matching' : 'no_match'
  };
}

/**
 * Get precise address using TomTom Reverse Geocoding
 */
async function getEnhancedAddress(coordinates) {
  if (!coordinates || !TOMTOM_API_KEY) return null;
  
  try {
    const [lon, lat] = coordinates;
    const response = await axios.get(
      `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          returnSpeedLimit: true,
          returnRoadUse: true,
          allowFreeformNewLine: false
        },
        timeout: 5000
      }
    );
    
    if (response.data?.addresses?.[0]) {
      const addr = response.data.addresses[0];
      return {
        formattedAddress: addr.address?.freeformAddress,
        street: addr.address?.streetName,
        municipality: addr.address?.municipality,
        postalCode: addr.address?.postalCode,
        roadNumber: addr.address?.routeNumbers?.[0],
        speedLimit: addr.address?.speedLimit,
        confidence: addr.confidence || 'medium'
      };
    }
  } catch (error) {
    console.warn('⚠️ Reverse geocoding failed:', error.message);
  }
  
  return null;
}

/**
 * Fetch enhanced TomTom traffic incidents
 */
export async function fetchTomTomTrafficEnhanced() {
  if (!TOMTOM_API_KEY) {
    console.warn('⚠️ TomTom API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🌐 Fetching enhanced TomTom traffic data...');
    
    // Get traffic incidents with expanded bounding box
    const response = await axios.get(
      'https://api.tomtom.com/traffic/services/5/incidentDetails',
      {
        params: {
          key: TOMTOM_API_KEY,
          bbox: `${NORTH_EAST_BOUNDS.minLon},${NORTH_EAST_BOUNDS.minLat},${NORTH_EAST_BOUNDS.maxLon},${NORTH_EAST_BOUNDS.maxLat}`,
          fields: '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity,probabilityOfOccurrence,numberOfReports,lastReportTime,unitOfMeasurement}}}',
          language: 'en-GB',
          timeValidityFilter: 'present',
          categoryFilter: '0,1,2,3,4,5,6,7,8,9,10,11,14', // Include most incident types
          originalPosition: false
        },
        timeout: 15000
      }
    );
    
    if (!response.data?.incidents) {
      console.warn('⚠️ No incidents in TomTom response');
      return { success: false, data: [], error: 'No incidents data' };
    }
    
    const incidents = response.data.incidents;
    console.log(`📊 Total TomTom incidents: ${incidents.length}`);
    
    const processedIncidents = [];
    
    for (const incident of incidents) {
      // Enhanced location validation
      const locationCheck = isInNorthEastEnhanced(incident);
      
      if (!locationCheck.inRegion) continue;
      
      // Enhanced route matching
      const routeMatch = matchRoutesEnhanced(incident);
      
      // Get enhanced address information
      const enhancedAddress = await getEnhancedAddress(incident.geometry?.coordinates);
      
      // Determine severity based on delay and type
      let severity = 'Low';
      const delay = incident.properties?.delay || 0;
      const category = incident.properties?.iconCategory || 0;
      
      if (delay > 600 || [1, 2, 6].includes(category)) severity = 'High';
      else if (delay > 180 || [3, 4, 5].includes(category)) severity = 'Medium';
      
      // Determine status based on time validity
      let status = 'green';
      const now = new Date();
      const startTime = incident.properties?.startTime ? new Date(incident.properties.startTime) : null;
      const endTime = incident.properties?.endTime ? new Date(incident.properties.endTime) : null;
      
      if (startTime && endTime) {
        if (startTime <= now && endTime >= now) status = 'red';
        else if (startTime > now && (startTime - now) <= 24 * 60 * 60 * 1000) status = 'amber';
      } else if (delay > 0) {
        status = 'red'; // Assume active if there's current delay
      }
      
      const processedIncident = {
        id: `tomtom_${incident.properties?.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: category <= 2 ? 'incident' : category <= 8 ? 'congestion' : 'roadwork',
        title: incident.properties?.events?.[0]?.description || 'Traffic Incident',
        description: [
          incident.properties?.events?.[0]?.description,
          incident.properties?.from && incident.properties?.to ? 
            `From ${incident.properties.from} to ${incident.properties.to}` : null,
          delay > 0 ? `Current delay: ${Math.round(delay / 60)} minutes` : null
        ].filter(Boolean).join('. '),
        
        // Enhanced location information
        location: enhancedAddress?.formattedAddress || 
                 incident.properties?.from || 
                 'North East Region',
        
        // Coordinate information for mapping
        coordinates: incident.geometry?.coordinates,
        
        // Enhanced address details
        addressDetails: enhancedAddress,
        
        authority: 'TomTom Traffic Intelligence',
        source: 'tomtom_enhanced',
        severity,
        status,
        
        // Route impact with confidence
        affectsRoutes: routeMatch.routes,
        routeConfidence: routeMatch.confidence,
        routePriority: routeMatch.priority,
        
        // Timing information
        startDate: incident.properties?.startTime,
        endDate: incident.properties?.endTime,
        
        // Traffic-specific data
        delayMinutes: Math.round(delay / 60),
        iconCategory: incident.properties?.iconCategory,
        probabilityOfOccurrence: incident.properties?.probabilityOfOccurrence,
        numberOfReports: incident.properties?.numberOfReports,
        
        // Quality indicators
        locationMethod: locationCheck.method,
        locationConfidence: locationCheck.confidence,
        dataQuality: {
          hasCoordinates: !!incident.geometry?.coordinates,
          hasAddress: !!enhancedAddress,
          hasDelay: delay > 0,
          hasTiming: !!(startTime && endTime)
        },
        
        lastUpdated: new Date().toISOString(),
        dataSource: 'TomTom Traffic API v5 Enhanced'
      };
      
      processedIncidents.push(processedIncident);
      
      console.log(`✅ Processed TomTom incident: ${processedIncident.location} (${routeMatch.routes.length} routes affected)`);
    }
    
    // Sort by priority and delay
    processedIncidents.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      const aPriority = priorityOrder[a.routePriority] || 0;
      const bPriority = priorityOrder[b.routePriority] || 0;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return (b.delayMinutes || 0) - (a.delayMinutes || 0);
    });
    
    console.log(`✅ Processed ${processedIncidents.length} enhanced TomTom incidents`);
    
    return { 
      success: true, 
      data: processedIncidents, 
      count: processedIncidents.length,
      metadata: {
        totalFetched: incidents.length,
        northEastFiltered: processedIncidents.length,
        boundingBox: NORTH_EAST_BOUNDS,
        enhancementFeatures: [
          'Reverse geocoding for precise addresses',
          'Enhanced route matching with confidence scoring',
          'Geographic coordinate validation',
          'Priority-based incident classification'
        ]
      }
    };
    
  } catch (error) {
    console.error('❌ TomTom Enhanced API error:', error.message);
    if (error.response) {
      console.error(`📡 Response status: ${error.response.status}`);
      console.error(`📡 Response data:`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}