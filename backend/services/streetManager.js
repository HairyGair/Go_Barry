// backend/services/streetManager.js
// StreetManager API Integration for Official UK Roadworks & Permit Data

import dotenv from 'dotenv';
import { geocodeLocation } from './geocoding.js';
import enhancedGTFSMatcher, { getDetailedRouteMatches } from './enhancedGTFSMatcher.js';
import { parseLineStringToBNG, parsePointToBNG } from '../utils/bngToLatLng.js';
import { analyzeServiceFrequency } from './serviceFrequencyService.js';
import { convexSync } from './convexSync.js';
import intelligenceEngine from './intelligenceEngine.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// StreetManager API Configuration
const STREET_MANAGER_BASE_URL = 'https://api.streetmanager.service.gov.uk';
const STREET_MANAGER_API_KEY = process.env.STREET_MANAGER_API_KEY;

// North East England area filters (approximate bounding box)
const NORTH_EAST_BOUNDS = {
  north: 55.3,
  south: 54.5,
  east: -1.0,
  west: -2.5
};

// Cache for StreetManager data
let activitiesCache = new Map();
let permitsCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Make authenticated request to StreetManager API
 */
async function streetManagerRequest(endpoint, params = {}) {
  if (!STREET_MANAGER_API_KEY) {
    console.warn('⚠️ StreetManager API key not configured');
    return {
      success: false,
      error: 'StreetManager API key not configured',
      data: []
    };
  }

  try {
    const queryParams = new URLSearchParams(params);
    const url = `${STREET_MANAGER_BASE_URL}${endpoint}?${queryParams}`;
    
    console.log(`🚧 StreetManager API call: ${endpoint}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STREET_MANAGER_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'BARRY-TrafficIntelligence/3.0'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`StreetManager API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ StreetManager ${endpoint} success:`, {
      recordCount: data?.length || data?.activities?.length || data?.permits?.length || 0,
      status: response.status
    });

    return {
      success: true,
      data: data,
      source: 'streetmanager',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ StreetManager ${endpoint} error:`, error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Check if coordinates are within North East England
 */
function isInNorthEast(lat, lng) {
  return lat >= NORTH_EAST_BOUNDS.south && 
         lat <= NORTH_EAST_BOUNDS.north && 
         lng >= NORTH_EAST_BOUNDS.west && 
         lng <= NORTH_EAST_BOUNDS.east;
}

/**
 * Transform StreetManager activity to BARRY alert format
 */
async function transformActivityToAlert(activity) {
  try {
    // Extract location information
    const location = activity.location_description || 
                    activity.street_name || 
                    activity.area_name || 
                    'Location not specified';

    // Extract coordinates if available
    let coordinates = null;
    if (activity.geometry && activity.geometry.coordinates) {
      const [lng, lat] = activity.geometry.coordinates;
      if (isInNorthEast(lat, lng)) {
        coordinates = [lat, lng];
      }
    } else if (location !== 'Location not specified') {
      // Try to geocode the location
      const geocoded = await geocodeLocation(location);
      if (geocoded && isInNorthEast(geocoded.latitude, geocoded.longitude)) {
        coordinates = [geocoded.latitude, geocoded.longitude];
      }
    }

    // Skip if not in North East England
    if (!coordinates) {
      return null;
    }

    // Determine activity status and severity
    const status = activity.activity_status?.toLowerCase() || 'unknown';
    let alertStatus = 'green';
    let severity = 'Low';

    switch (status) {
      case 'in_progress':
      case 'active':
        alertStatus = 'red';
        severity = 'High';
        break;
      case 'proposed':
      case 'planned':
        alertStatus = 'amber';
        severity = 'Medium';
        break;
      case 'completed':
      case 'cancelled':
        alertStatus = 'green';
        severity = 'Low';
        break;
    }

    // Determine work category
    const workCategory = activity.work_category_ref || activity.activity_type || 'roadwork';
    const isEmergency = activity.is_emergency_works || false;
    
    if (isEmergency) {
      alertStatus = 'red';
      severity = 'High';
    }

    return {
      id: `streetmanager_${activity.permit_reference_number || activity.activity_reference_number || Date.now()}`,
      title: activity.description || `${workCategory} - ${activity.work_category_ref || 'Roadworks'}`,
      description: activity.detailed_description || activity.description || 'Roadworks activity reported via StreetManager',
      location: location,
      coordinates: coordinates,
      status: alertStatus,
      severity: severity,
      type: 'roadwork',
      source: 'StreetManager',
      dataSource: 'StreetManager',
      authority: activity.highway_authority || activity.promoter_organisation || 'Highway Authority',
      
      // StreetManager specific fields
      permitReference: activity.permit_reference_number,
      activityReference: activity.activity_reference_number,
      workCategory: workCategory,
      isEmergency: isEmergency,
      proposedStartDate: activity.proposed_start_date,
      proposedEndDate: activity.proposed_end_date,
      actualStartDate: activity.actual_start_date,
      actualEndDate: activity.actual_end_date,
      
      // Timing
      startDate: activity.actual_start_date || activity.proposed_start_date,
      endDate: activity.actual_end_date || activity.proposed_end_date,
      lastUpdated: activity.last_updated || new Date().toISOString(),
      
      // Additional metadata
      streetName: activity.street_name,
      areaName: activity.area_name,
      usrn: activity.usrn, // Unique Street Reference Number
      workflowStatus: activity.workflow_status,
      
      // Enhancement flags
      locationAccuracy: coordinates ? 'high' : 'medium',
      routeMatchMethod: 'streetmanager',
      officialSource: true
    };
  } catch (error) {
    console.error('❌ Error transforming StreetManager activity:', error);
    return null;
  }
}

/**
 * Transform StreetManager permit to BARRY alert format
 */
async function transformPermitToAlert(permit) {
  try {
    const location = permit.location_description || 
                    permit.street_name || 
                    'Permit location';

    // Try to geocode permit location
    let coordinates = null;
    if (permit.geometry && permit.geometry.coordinates) {
      const [lng, lat] = permit.geometry.coordinates;
      if (isInNorthEast(lat, lng)) {
        coordinates = [lat, lng];
      }
    } else if (location !== 'Permit location') {
      const geocoded = await geocodeLocation(location);
      if (geocoded && isInNorthEast(geocoded.latitude, geocoded.longitude)) {
        coordinates = [geocoded.latitude, geocoded.longitude];
      }
    }

    if (!coordinates) {
      return null;
    }

    const status = permit.permit_status?.toLowerCase() || 'unknown';
    let alertStatus = 'green';
    let severity = 'Low';

    switch (status) {
      case 'granted':
      case 'permit_modification_request':
        alertStatus = 'amber';
        severity = 'Medium';
        break;
      case 'received':
      case 'under_review':
        alertStatus = 'amber';
        severity = 'Low';
        break;
      case 'rejected':
      case 'revoked':
        alertStatus = 'green';
        severity = 'Low';
        break;
    }

    return {
      id: `streetmanager_permit_${permit.permit_reference_number || Date.now()}`,
      title: `Permit: ${permit.work_category_ref || 'Roadworks'} - ${permit.permit_status || 'Unknown Status'}`,
      description: permit.description || `Roadworks permit ${permit.permit_reference_number || 'application'}`,
      location: location,
      coordinates: coordinates,
      status: alertStatus,
      severity: severity,
      type: 'roadwork',
      source: 'StreetManager',
      dataSource: 'StreetManager Permits',
      authority: permit.highway_authority || permit.promoter_organisation || 'Highway Authority',
      
      // Permit specific fields
      permitReference: permit.permit_reference_number,
      permitStatus: permit.permit_status,
      workCategory: permit.work_category_ref,
      proposedStartDate: permit.proposed_start_date,
      proposedEndDate: permit.proposed_end_date,
      
      // Timing
      startDate: permit.proposed_start_date,
      endDate: permit.proposed_end_date,
      lastUpdated: permit.last_updated || new Date().toISOString(),
      
      // Additional metadata
      streetName: permit.street_name,
      usrn: permit.usrn,
      
      // Enhancement flags
      locationAccuracy: coordinates ? 'high' : 'medium',
      routeMatchMethod: 'streetmanager',
      officialSource: true,
      permitType: true
    };
  } catch (error) {
    console.error('❌ Error transforming StreetManager permit:', error);
    return null;
  }
}

/**
 * Fetch StreetManager activities (roadworks in progress)
 */
export async function fetchStreetManagerActivities(forceRefresh = false) {
  const cacheKey = 'streetmanager_activities';
  
  // Check cache first
  if (!forceRefresh && activitiesCache.has(cacheKey)) {
    const cached = activitiesCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Returning cached StreetManager activities');
      return cached;
    }
  }

  try {
    console.log('🚧 Fetching StreetManager activities...');
    
    // API parameters for North East England area
    const params = {
      'geographical_area_reference': 'north-east-england', // Adjust as needed
      'start_date': new Date().toISOString().split('T')[0], // Today
      'end_date': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next 30 days
      'activity_status': 'in_progress,proposed,planned',
      'page_size': 100
    };

    const result = await streetManagerRequest('/activities', params);
    
    if (!result.success) {
      return result;
    }

    // Transform activities to BARRY alert format
    const activities = result.data.activities || result.data || [];
    const transformedAlerts = [];

    for (const activity of activities) {
      const alert = await transformActivityToAlert(activity);
      if (alert) {
        transformedAlerts.push(alert);
      }
    }

    const response = {
      success: true,
      data: transformedAlerts,
      metadata: {
        source: 'StreetManager Activities',
        totalActivities: activities.length,
        northEastActivities: transformedAlerts.length,
        lastUpdated: new Date().toISOString(),
        coverage: 'North East England',
        official: true
      }
    };

    // Cache the result
    activitiesCache.set(cacheKey, {
      ...response,
      timestamp: Date.now()
    });

    console.log(`✅ StreetManager activities: ${transformedAlerts.length} relevant activities found`);
    return response;

  } catch (error) {
    console.error('❌ StreetManager activities fetch error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Fetch StreetManager permits (planned roadworks)
 */
export async function fetchStreetManagerPermits(forceRefresh = false) {
  const cacheKey = 'streetmanager_permits';
  
  // Check cache first
  if (!forceRefresh && permitsCache.has(cacheKey)) {
    const cached = permitsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Returning cached StreetManager permits');
      return cached;
    }
  }

  try {
    console.log('📋 Fetching StreetManager permits...');
    
    // API parameters for permits in North East
    const params = {
      'geographical_area_reference': 'north-east-england',
      'start_date': new Date().toISOString().split('T')[0],
      'end_date': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next 60 days
      'permit_status': 'granted,received,under_review',
      'page_size': 100
    };

    const result = await streetManagerRequest('/permits', params);
    
    if (!result.success) {
      return result;
    }

    // Transform permits to BARRY alert format
    const permits = result.data.permits || result.data || [];
    const transformedAlerts = [];

    for (const permit of permits) {
      const alert = await transformPermitToAlert(permit);
      if (alert) {
        transformedAlerts.push(alert);
      }
    }

    const response = {
      success: true,
      data: transformedAlerts,
      metadata: {
        source: 'StreetManager Permits',
        totalPermits: permits.length,
        northEastPermits: transformedAlerts.length,
        lastUpdated: new Date().toISOString(),
        coverage: 'North East England',
        official: true
      }
    };

    // Cache the result
    permitsCache.set(cacheKey, {
      ...response,
      timestamp: Date.now()
    });

    console.log(`✅ StreetManager permits: ${transformedAlerts.length} relevant permits found`);
    return response;

  } catch (error) {
    console.error('❌ StreetManager permits fetch error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Get specific permit details by reference number
 */
export async function getPermitDetails(permitReference) {
  try {
    console.log(`🔍 Fetching permit details: ${permitReference}`);
    
    const result = await streetManagerRequest(`/permits/${permitReference}`);
    
    if (result.success) {
      const alert = await transformPermitToAlert(result.data);
      return {
        success: true,
        data: alert,
        metadata: {
          source: 'StreetManager Permit Detail',
          permitReference,
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
    return result;
  } catch (error) {
    console.error('❌ Permit details fetch error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Get activity details by reference number
 */
export async function getActivityDetails(activityReference) {
  try {
    console.log(`🔍 Fetching activity details: ${activityReference}`);
    
    const result = await streetManagerRequest(`/activities/${activityReference}`);
    
    if (result.success) {
      const alert = await transformActivityToAlert(result.data);
      return {
        success: true,
        data: alert,
        metadata: {
          source: 'StreetManager Activity Detail',
          activityReference,
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
    return result;
  } catch (error) {
    console.error('❌ Activity details fetch error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Clear StreetManager caches
 */
export function clearStreetManagerCache() {
  activitiesCache.clear();
  permitsCache.clear();
  console.log('🗑️ StreetManager caches cleared');
}

/**
 * Get StreetManager cache statistics
 */
export function getStreetManagerCacheStats() {
  return {
    activitiesCache: activitiesCache.size,
    permitsCache: permitsCache.size,
    configured: !!STREET_MANAGER_API_KEY
  };
}

/**
 * Poll StreetManager API and save to Supabase
 * This is an alternative to webhooks - run periodically
 */
export async function pollAndSaveToSupabase() {
  console.log('🔄 Polling StreetManager API and saving to Supabase...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    let totalSaved = 0;
    
    // 1. Fetch activities
    const activitiesResult = await fetchStreetManagerActivities(true);
    if (activitiesResult.success && activitiesResult.data) {
      console.log(`🔍 Processing ${activitiesResult.data.length} activities...`);
      
      for (const activity of activitiesResult.data) {
        // Convert to notification format
        const notification = {
          notification_id: activity.id,
          activity_reference_number: activity.activityReference,
          permit_reference_number: activity.permitReference,
          title: activity.title,
          description: activity.description,
          location_description: activity.location,
          street_name: activity.streetName,
          area_name: activity.areaName,
          usrn: activity.usrn,
          coordinates: activity.coordinates ? 
            { lat: activity.coordinates[0], lng: activity.coordinates[1] } : null,
          work_category_ref: activity.workCategory,
          activity_type: activity.workType,
          is_emergency_works: activity.isEmergency,
          activity_status: activity.activityStatus || 'active',
          severity: activity.severity,
          alert_status: activity.status,
          proposed_start_date: activity.proposedStartDate,
          proposed_end_date: activity.proposedEndDate,
          actual_start_date: activity.actualStartDate,
          actual_end_date: activity.actualEndDate,
          highway_authority: activity.authority,
          webhook_event_type: 'POLLED',
          raw_webhook_data: { source: 'api_poll', activity },
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
          webhook_received_at: new Date().toISOString()
        };
        
        // Upsert to Supabase
        const { error } = await supabase
          .from('streetmanager_notifications')
          .upsert(notification, {
            onConflict: 'notification_id',
            ignoreDuplicates: false
          });
        
        if (!error) {
          totalSaved++;
        } else {
          console.error(`⚠️ Failed to save ${activity.id}:`, error.message);
        }
      }
    }
    
    // 2. Fetch permits  
    const permitsResult = await fetchStreetManagerPermits(true);
    if (permitsResult.success && permitsResult.data) {
      console.log(`🔍 Processing ${permitsResult.data.length} permits...`);
      
      for (const permit of permitsResult.data) {
        // Convert to notification format
        const notification = {
          notification_id: permit.id,
          permit_reference_number: permit.permitReference,
          title: permit.title,
          description: permit.description,
          location_description: permit.location,
          street_name: permit.streetName,
          area_name: permit.areaName,
          usrn: permit.usrn,
          coordinates: permit.coordinates ? 
            { lat: permit.coordinates[0], lng: permit.coordinates[1] } : null,
          work_category_ref: permit.workCategory,
          permit_status: permit.permitStatus,
          severity: permit.severity,
          alert_status: permit.status,
          proposed_start_date: permit.proposedStartDate,
          proposed_end_date: permit.proposedEndDate,
          highway_authority: permit.authority,
          webhook_event_type: 'POLLED',
          raw_webhook_data: { source: 'api_poll', permit },
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
          webhook_received_at: new Date().toISOString()
        };
        
        // Upsert to Supabase
        const { error } = await supabase
          .from('streetmanager_notifications')
          .upsert(notification, {
            onConflict: 'notification_id',
            ignoreDuplicates: false
          });
        
        if (!error) {
          totalSaved++;
        } else {
          console.error(`⚠️ Failed to save ${permit.id}:`, error.message);
        }
      }
    }
    
    console.log(`✅ StreetManager poll complete: ${totalSaved} records saved to Supabase`);
    
    return {
      success: true,
      totalSaved,
      activities: activitiesResult.data?.length || 0,
      permits: permitsResult.data?.length || 0,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ StreetManager poll error:', error);
    return {
      success: false,
      error: error.message,
      totalSaved: 0
    };
  }
}

/**
 * Get StreetManager API configuration status
 */
export function getApiStatus() {
  return {
    configured: !!STREET_MANAGER_API_KEY,
    apiKey: STREET_MANAGER_API_KEY ? 'Set' : 'Not configured',
    baseUrl: STREET_MANAGER_BASE_URL,
    cacheStats: getStreetManagerCacheStats(),
    polling: {
      available: !!STREET_MANAGER_API_KEY,
      recommendation: 'Poll every 30 minutes for updates',
      endpoints: [
        '/api/streetmanager/poll',
        '/api/streetmanager/activities', 
        '/api/streetmanager/permits'
      ]
    }
  };
}

/**
 * Parse LINESTRING coordinates from StreetManager notification
 * Format: "LINESTRING(x1 y1,x2 y2,...)"
 */
export function parseLineStringCoordinates(lineString) {
  // Use the proper BNG to lat/lng conversion
  return parseLineStringToBNG(lineString);
}

/**
 * Match roadwork coordinates against bus routes
 * Returns affected routes with confidence scores
 */
export async function findAffectedBusRoutes(coordinates, bufferMeters = 100) {
  if (!coordinates || coordinates.length === 0) {
    return { affectedRoutes: [], totalMatches: 0 };
  }
  
  console.log(`🚌 Analyzing ${coordinates.length} roadwork points for bus route impacts...`);
  
  const routeMatches = new Map(); // route -> match details
  const routeSegments = new Map(); // route -> affected segments
  
  // Sample coordinates (every 5th point to reduce API calls)
  const sampleInterval = Math.max(1, Math.floor(coordinates.length / 20));
  const sampledCoords = coordinates.filter((_, i) => i % sampleInterval === 0);
  
  // Check each sampled coordinate
  for (const coord of sampledCoords) {
    const matches = await getDetailedRouteMatches(coord.lat, coord.lng, bufferMeters);
    
    for (const match of matches) {
      const routeKey = match.routeId;
      
      if (!routeMatches.has(routeKey)) {
        routeMatches.set(routeKey, {
          routeId: match.routeId,
          shortName: match.shortName,
          matchCount: 0,
          minDistance: Infinity,
          maxConfidence: 0,
          segments: []
        });
      }
      
      const routeData = routeMatches.get(routeKey);
      routeData.matchCount++;
      routeData.minDistance = Math.min(routeData.minDistance, match.distance);
      routeData.maxConfidence = Math.max(routeData.maxConfidence, match.confidence);
      routeData.segments.push({
        lat: coord.lat,
        lng: coord.lng,
        distance: match.distance,
        confidence: match.confidence
      });
    }
  }
  
  // Calculate impact scores and sort results
  const affectedRoutes = Array.from(routeMatches.values())
    .map(route => ({
      ...route,
      impactScore: calculateRouteImpactScore(route, sampledCoords.length),
      affectedLength: estimateAffectedLength(route.segments)
    }))
    .filter(route => route.impactScore > 0.3) // Min threshold
    .sort((a, b) => b.impactScore - a.impactScore);
  
  console.log(`✅ Found ${affectedRoutes.length} affected bus routes from ${routeMatches.size} candidates`);
  
  return {
    affectedRoutes,
    totalMatches: affectedRoutes.length,
    sampledPoints: sampledCoords.length,
    totalPoints: coordinates.length
  };
}

/**
 * Calculate impact score for a route based on matches
 */
function calculateRouteImpactScore(routeData, totalSamples) {
  const matchRatio = routeData.matchCount / totalSamples;
  const avgConfidence = routeData.segments.reduce((sum, s) => sum + s.confidence, 0) / routeData.segments.length;
  const distanceFactor = Math.max(0, 1 - (routeData.minDistance / 100));
  
  // Weighted score
  const score = (matchRatio * 0.4) + (avgConfidence * 0.4) + (distanceFactor * 0.2);
  return Math.round(score * 100) / 100;
}

/**
 * Estimate affected route length based on segments
 */
function estimateAffectedLength(segments) {
  if (segments.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < segments.length; i++) {
    const dist = haversineDistance(
      segments[i-1].lat, segments[i-1].lng,
      segments[i].lat, segments[i].lng
    );
    totalDistance += dist;
  }
  
  return Math.round(totalDistance);
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate intelligent severity score for roadworks
 * Considers multiple factors with weighted scoring
 */
function calculateIntelligentSeverity(object_data, affectedRoutes) {
  let severityScore = 0;
  let factors = [];
  
  // 1. Traffic Management Type (0-40 points)
  const trafficType = object_data.traffic_management_type_ref?.toLowerCase() || '';
  if (trafficType === 'road_closure') {
    severityScore += 40;
    factors.push('Full road closure');
  } else if (trafficType === 'contraflow' || trafficType === 'convoy_working') {
    severityScore += 30;
    factors.push('Major traffic restriction');
  } else if (trafficType === 'lane_closure' || trafficType === 'multi_way_signals') {
    severityScore += 20;
    factors.push('Lane restrictions');
  } else if (trafficType === 'give_and_take' || trafficType === 'priority_working') {
    severityScore += 15;
    factors.push('Minor traffic management');
  } else if (trafficType === 'some_carriageway_incursion') {
    severityScore += 10;
    factors.push('Carriageway incursion');
  }
  
  // 2. Work Category (0-20 points)  
  const workCategory = object_data.work_category_ref?.toLowerCase() || '';
  if (workCategory === 'immediate_urgent' || workCategory === 'immediate_emergency') {
    severityScore += 20;
    factors.push('Emergency works');
  } else if (workCategory === 'major' || workCategory === 'major_paa') {
    severityScore += 15;
    factors.push('Major works');
  } else if (workCategory === 'standard') {
    severityScore += 10;
    factors.push('Standard works');
  } else if (workCategory === 'minor') {
    severityScore += 5;
    factors.push('Minor works');
  }
  
  // 3. Route Importance (0-30 points)
  // Analyze affected routes for high-frequency services
  const highFrequencyRoutes = ['1', '2', '21', 'X21', '307', 'Q3', '39', '40', '56', '58'];
  let highFreqCount = 0;
  let totalImpactScore = 0;
  
  for (const route of affectedRoutes) {
    if (highFrequencyRoutes.includes(route.shortName)) {
      highFreqCount++;
    }
    totalImpactScore += route.impactScore || 0;
  }
  
  if (highFreqCount >= 3) {
    severityScore += 30;
    factors.push(`${highFreqCount} high-frequency routes affected`);
  } else if (highFreqCount >= 2) {
    severityScore += 20;
    factors.push(`${highFreqCount} high-frequency routes affected`);
  } else if (highFreqCount >= 1) {
    severityScore += 15;
    factors.push('High-frequency route affected');
  } else if (affectedRoutes.length > 5) {
    severityScore += 25;
    factors.push(`${affectedRoutes.length} routes affected`);
  } else if (affectedRoutes.length > 2) {
    severityScore += 10;
    factors.push(`${affectedRoutes.length} routes affected`);
  }
  
  // 4. Duration Impact (0-10 points)
  const startDate = new Date(object_data.actual_start_date_time || object_data.proposed_start_date);
  const endDate = new Date(object_data.actual_end_date_time || object_data.proposed_end_date);
  const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  
  if (durationDays > 30) {
    severityScore += 10;
    factors.push('Long-term works (>30 days)');
  } else if (durationDays > 14) {
    severityScore += 7;
    factors.push('Extended works (>2 weeks)');
  } else if (durationDays > 7) {
    severityScore += 5;
    factors.push('Week-long works');
  } else if (durationDays > 3) {
    severityScore += 3;
    factors.push(`${Math.round(durationDays)} day works`);
  }
  
  // 5. Additional factors
  if (object_data.is_traffic_sensitive === 'Yes') {
    severityScore += 5;
    factors.push('Traffic sensitive location');
  }
  
  if (object_data.is_ttro_required === 'Yes') {
    severityScore += 5;
    factors.push('TTRO required');
  }
  
  // Convert score to severity level
  let severity, alertStatus;
  if (severityScore >= 70) {
    severity = 'Critical';
    alertStatus = 'red';
  } else if (severityScore >= 50) {
    severity = 'High';
    alertStatus = 'red';
  } else if (severityScore >= 30) {
    severity = 'Medium';
    alertStatus = 'amber';
  } else {
    severity = 'Low';
    alertStatus = 'amber';
  }
  
  return {
    severity,
    alertStatus,
    severityScore,
    factors,
    analysis: {
      trafficManagement: trafficType,
      workCategory,
      highFrequencyRoutesAffected: highFreqCount,
      totalRoutesAffected: affectedRoutes.length,
      durationDays: Math.round(durationDays),
      isTrafficSensitive: object_data.is_traffic_sensitive === 'Yes',
      isTTRORequired: object_data.is_ttro_required === 'Yes'
    }
  };
}

/**
 * Calculate total daily services affected
 */
async function calculateDailyServices(affectedRoutes) {
  try {
    // Load trips data
    const tripsPath = path.join(__dirname, '../data/trips.txt');
    const tripsContent = await fs.readFile(tripsPath, 'utf8');
    const tripsData = parse(tripsContent, { columns: true, skip_empty_lines: true });
    
    // Count trips per route
    const routeServiceCount = {};
    for (const trip of tripsData) {
      if (trip.route_id) {
        routeServiceCount[trip.route_id] = (routeServiceCount[trip.route_id] || 0) + 1;
      }
    }
    
    // Calculate total services
    let totalServices = 0;
    for (const route of affectedRoutes) {
      totalServices += routeServiceCount[route.routeId] || 0;
    }
    
    return totalServices;
  } catch (error) {
    console.error('Error calculating daily services:', error);
    return 0;
  }
}

/**
 * Check if roadwork times overlap with peak hours
 */
function checkPeakHourOverlap(startTime, endTime) {
  const morningPeakStart = 7 * 60; // 7:00 AM in minutes
  const morningPeakEnd = 9 * 60;   // 9:00 AM
  const eveningPeakStart = 16 * 60; // 4:00 PM
  const eveningPeakEnd = 19 * 60;   // 7:00 PM
  
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  // Check each day in the roadwork period
  const dayMs = 24 * 60 * 60 * 1000;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends for peak hour analysis
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Always overlaps with peak if roadwork spans full day
      if (endDate - startDate > dayMs) {
        return true;
      }
      
      // Check specific time overlap
      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      
      // Check morning peak overlap
      if ((startMinutes <= morningPeakEnd && endMinutes >= morningPeakStart) ||
          (startMinutes <= eveningPeakEnd && endMinutes >= eveningPeakStart)) {
        return true;
      }
    }
    
    currentDate = new Date(currentDate.getTime() + dayMs);
  }
  
  return false;
}

/**
 * Estimate delays based on traffic management type and severity
 */
function estimateDelayMinutes(trafficManagement, severity, peakHour) {
  let baseDelay = 0;
  
  // Base delay by traffic management type
  const trafficType = trafficManagement?.toLowerCase() || '';
  if (trafficType.includes('road_closure')) {
    baseDelay = 15;
  } else if (trafficType.includes('contraflow') || trafficType.includes('convoy')) {
    baseDelay = 10;
  } else if (trafficType.includes('lane_closure') || trafficType.includes('multi_way_signals')) {
    baseDelay = 7;
  } else if (trafficType.includes('give_and_take') || trafficType.includes('priority')) {
    baseDelay = 5;
  } else {
    baseDelay = 3;
  }
  
  // Multiply by 1.5x during peak hours
  if (peakHour) {
    baseDelay = Math.round(baseDelay * 1.5);
  }
  
  // Adjust by severity
  if (severity === 'Critical') {
    baseDelay = Math.round(baseDelay * 1.3);
  } else if (severity === 'High') {
    baseDelay = Math.round(baseDelay * 1.1);
  }
  
  return baseDelay;
}

/**
 * Calculate passenger impact based on services and delays
 */
function calculatePassengerImpact(totalDailyServices, delayMinutes, peakHour) {
  // Estimate average passengers per service
  const avgPassengersPerService = peakHour ? 45 : 25;
  const estimatedDailyPassengers = totalDailyServices * avgPassengersPerService;
  
  // Calculate impact score
  let impactLevel = 'Low';
  let estimatedAffected = Math.round(estimatedDailyPassengers * 0.7); // 70% affected
  
  if (estimatedAffected > 5000 || (delayMinutes > 10 && peakHour)) {
    impactLevel = 'Critical';
  } else if (estimatedAffected > 2000 || delayMinutes > 10) {
    impactLevel = 'High';
  } else if (estimatedAffected > 500 || delayMinutes > 5) {
    impactLevel = 'Medium';
  }
  
  return {
    level: impactLevel,
    estimatedPassengersAffected: estimatedAffected,
    delayMinutes: delayMinutes,
    peakHourImpact: peakHour,
    description: `${impactLevel} - Est. ${estimatedAffected.toLocaleString()} passengers affected`
  };
}

/**
 * Generate predictive alerts based on start date
 */
function generatePredictiveAlert(proposedStartDate, location, affectedRoutes) {
  const startDate = new Date(proposedStartDate);
  const now = new Date();
  const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  
  let alertText = '';
  
  if (daysUntilStart > 0 && daysUntilStart <= 7) {
    const routeNames = affectedRoutes.slice(0, 3).map(r => r.shortName).join(', ');
    const dateStr = startDate.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
    
    if (affectedRoutes.length > 0) {
      alertText = `⚠️ ADVANCE WARNING: Roadworks will affect ${routeNames}${affectedRoutes.length > 3 ? ' and others' : ''} starting ${dateStr} (${daysUntilStart} days)`;
    } else {
      alertText = `⚠️ ADVANCE WARNING: Roadworks at ${location} starting ${dateStr} (${daysUntilStart} days)`;
    }
  }
  
  return alertText;
}

/**
 * Generate suggested action based on severity and impact
 */
function generateSuggestedAction(severity, delayMinutes, peakHour) {
  if (severity === 'Critical' || (delayMinutes > 15 && peakHour)) {
    return 'Implement immediate diversion plan and notify all drivers';
  } else if (severity === 'High' || delayMinutes > 10) {
    return 'Consider diversion routes and issue passenger warnings';
  } else if (peakHour && delayMinutes > 5) {
    return 'Monitor closely and prepare contingency plans';
  } else if (delayMinutes > 5) {
    return 'Update passenger information systems';
  } else {
    return 'Monitor and log for operational records';
  }
}

/**
 * Process StreetManager webhook notification
 * Convert to BARRY alert with route matching and enhanced analysis
 */
export async function processStreetManagerWebhook(notification) {
  try {
    console.log('🔄 Processing StreetManager webhook notification...');
    
    const { object_data, event_type, event_time } = notification;
    if (!object_data) {
      throw new Error('No object_data in notification');
    }
    
    // Parse coordinates if available
    let coordinates = [];
    let affectedRoutes = [];
    
    if (object_data.works_location_coordinates) {
      coordinates = parseLineStringCoordinates(object_data.works_location_coordinates);
      
      // Find affected bus routes
      const routeAnalysis = await findAffectedBusRoutes(coordinates, 150);
      affectedRoutes = routeAnalysis.affectedRoutes;
    }
    
    // Calculate intelligent severity
    const severityAnalysis = calculateIntelligentSeverity(object_data, affectedRoutes);
    
    // Calculate operational impacts
    const startDate = object_data.actual_start_date_time || object_data.proposed_start_date;
    const endDate = object_data.actual_end_date_time || object_data.proposed_end_date;
    const peakHourImpact = checkPeakHourOverlap(startDate, endDate);
    
    // Calculate total daily services affected
    const totalDailyServices = await calculateDailyServices(affectedRoutes);
    
    // Estimate delays
    const estimatedDelayMinutes = estimateDelayMinutes(
      object_data.traffic_management_type,
      severityAnalysis.severity,
      peakHourImpact
    );
    
    // Calculate passenger impact
    const passengerImpact = calculatePassengerImpact(
      totalDailyServices,
      estimatedDelayMinutes,
      peakHourImpact
    );
    
    // Generate predictive alert if applicable
    const predictiveAlert = generatePredictiveAlert(
      object_data.proposed_start_date,
      object_data.street_name || object_data.area_name,
      affectedRoutes
    );
    
    // Enhanced description with operational insights
    let enhancedDescription = `${object_data.activity_type || 'Roadworks'} affecting ${affectedRoutes.length} bus routes`;
    if (totalDailyServices > 0) {
      enhancedDescription += ` (${totalDailyServices}+ daily services)`;
    }
    if (peakHourImpact) {
      enhancedDescription += ' during PEAK HOURS';
    }
    if (estimatedDelayMinutes > 0) {
      enhancedDescription += `. Est. delays: ${estimatedDelayMinutes} mins`;
    }
    enhancedDescription += `. ${severityAnalysis.factors.join(', ')}`;
    
    // Create BARRY alert with enhanced severity and operational data
    const alert = {
      id: `streetmanager_webhook_${object_data.permit_reference_number || Date.now()}`,
      title: `${object_data.work_category || 'Roadwork'} - ${object_data.street_name || 'Unknown Location'}`,
      description: enhancedDescription,
      predictiveAlert: predictiveAlert,
      location: object_data.street_name || object_data.area_name || 'Unknown',
      coordinates: coordinates.length > 0 ? [coordinates[0].lat, coordinates[0].lng] : null,
      status: severityAnalysis.alertStatus,
      severity: severityAnalysis.severity,
      severityScore: severityAnalysis.severityScore,
      severityFactors: severityAnalysis.factors,
      severityAnalysis: severityAnalysis.analysis,
      type: 'roadwork',
      source: 'StreetManager',
      dataSource: 'StreetManager Webhook',
      
      // Route impact data
      affectedRoutes: affectedRoutes.map(r => ({
        routeId: r.routeId,
        shortName: r.shortName,
        impactScore: r.impactScore,
        affectedLength: r.affectedLength
      })),
      routeImpactSummary: `${affectedRoutes.length} routes affected`,
      
      // StreetManager specific
      permitReference: object_data.permit_reference_number,
      workReference: object_data.work_reference_number,
      workCategory: object_data.work_category_ref,
      trafficManagement: object_data.traffic_management_type,
      workStatus: object_data.work_status,
      
      // Timing
      startDate: object_data.actual_start_date_time || object_data.proposed_start_date,
      endDate: object_data.actual_end_date_time || object_data.proposed_end_date,
      eventTime: event_time,
      lastUpdated: new Date().toISOString(),
      
      // Metadata
      authority: object_data.highway_authority || object_data.promoter_organisation,
      town: object_data.town,
      usrn: object_data.usrn,
      isTrafficSensitive: object_data.is_traffic_sensitive === 'Yes',
      isTTRORequired: object_data.is_ttro_required === 'Yes',
      
      // Operational insights
      estimatedDelayMinutes: estimatedDelayMinutes,
      peakHourImpact: peakHourImpact,
      totalDailyServices: totalDailyServices,
      passengerImpact: passengerImpact,
      operationalAnalysis: {
        servicesPerHour: Math.round(totalDailyServices / 18), // Assuming 18-hour service day
        peakHourServices: Math.round(totalDailyServices * 0.3), // 30% in peak
        delayImpactScore: Math.min(100, (estimatedDelayMinutes * affectedRoutes.length * (peakHourImpact ? 2 : 1))),
        requiresDiversion: estimatedDelayMinutes > 10 || severityAnalysis.severity === 'Critical',
        suggestedAction: generateSuggestedAction(severityAnalysis.severity, estimatedDelayMinutes, peakHourImpact)
      },
      
      // Enhancement flags
      locationAccuracy: coordinates.length > 0 ? 'high' : 'low',
      routeMatchMethod: 'linestring_analysis',
      officialSource: true,
      webhookEvent: event_type,
      enhancedAnalysis: true
    };
    
    console.log(`✅ Processed webhook: ${alert.title} affecting ${affectedRoutes.length} routes`);
    
    // Get ML prediction from Intelligence Engine
    const mlPrediction = intelligenceEngine.predictSeverity(alert);
    alert.mlPrediction = mlPrediction;
    alert.mlSeverity = mlPrediction.severity;
    alert.mlConfidence = mlPrediction.confidence;
    
    // Sync high-impact roadworks to Convex for real-time updates
    if (severityAnalysis.severity === 'Critical' || severityAnalysis.severity === 'High' || affectedRoutes.length > 3) {
      try {
        await convexSync.syncUrgentRoadwork({
          ...alert,
          urgentReason: `${severityAnalysis.severity} severity: ${affectedRoutes.length} routes affected, ${estimatedDelayMinutes} min delays`,
          details: {
            ...severityAnalysis.analysis,
            ...alert.operationalAnalysis,
            impactScore: severityAnalysis.severityScore,
            predictedDelay: estimatedDelayMinutes,
            duration: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
            isEmergency: object_data.work_category_ref?.includes('emergency'),
            hasNightWork: false, // Could be enhanced
            affectedRoutes: affectedRoutes.map(r => r.shortName),
            totalPassengerImpact: passengerImpact.estimatedPassengersAffected
          }
        });
        console.log('🚨 High-impact roadwork synced to Convex for real-time updates');
      } catch (syncError) {
        console.error('⚠️ Failed to sync to Convex:', syncError.message);
      }
    }
    
    return alert;
    
  } catch (error) {
    console.error('❌ Error processing StreetManager webhook:', error);
    throw error;
  }
}

/**
 * Sync all StreetManager alerts to Intelligence Engine and Convex
 * Called periodically to update ML predictions and real-time sync
 */
export async function syncStreetManagerToSystems() {
  try {
    console.log('🔄 Syncing StreetManager alerts to Intelligence Engine and Convex...');
    
    // Fetch latest activities
    const activitiesResult = await fetchStreetManagerActivities(true);
    if (!activitiesResult.success || !activitiesResult.data) {
      console.error('❌ Failed to fetch StreetManager activities');
      return { success: false, error: 'Failed to fetch activities' };
    }
    
    const allAlerts = activitiesResult.data;
    const enhancedAlerts = [];
    
    // Process each alert through Intelligence Engine
    for (const alert of allAlerts) {
      // Get ML prediction
      const mlPrediction = intelligenceEngine.predictSeverity(alert);
      
      // Enhance alert with ML data
      const enhancedAlert = {
        ...alert,
        mlPrediction,
        mlSeverity: mlPrediction.severity,
        mlConfidence: mlPrediction.confidence,
        mlRecommendation: mlPrediction.recommendation,
        enhancedAt: new Date().toISOString()
      };
      
      enhancedAlerts.push(enhancedAlert);
      
      // Record in Intelligence Engine for learning
      intelligenceEngine.recordIncident(enhancedAlert);
    }
    
    // Sync high-impact alerts to Convex
    const convexResult = await convexSync.syncStreetManagerRoadworks(enhancedAlerts);
    
    console.log(`✅ StreetManager sync complete:`);
    console.log(`   - ${allAlerts.length} total roadworks`);
    console.log(`   - ${convexResult.count || 0} high-impact synced to Convex`);
    console.log(`   - ${convexResult.criticalCount || 0} critical alerts`);
    
    return {
      success: true,
      totalAlerts: allAlerts.length,
      enhancedAlerts: enhancedAlerts.length,
      convexSynced: convexResult.count || 0,
      criticalCount: convexResult.criticalCount || 0
    };
    
  } catch (error) {
    console.error('❌ StreetManager sync error:', error);
    return { success: false, error: error.message };
  }
}

export default {
  fetchStreetManagerActivities,
  fetchStreetManagerPermits,
  getPermitDetails,
  getActivityDetails,
  clearStreetManagerCache,
  getStreetManagerCacheStats,
  pollAndSaveToSupabase,
  getApiStatus,
  parseLineStringCoordinates,
  findAffectedBusRoutes,
  processStreetManagerWebhook,
  syncStreetManagerToSystems
};
