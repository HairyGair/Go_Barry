// backend/services/streetManager.js
// StreetManager API Integration for Official UK Roadworks & Permit Data

import dotenv from 'dotenv';
import { geocodeLocation } from './geocoding.js';

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

export default {
  fetchStreetManagerActivities,
  fetchStreetManagerPermits,
  getPermitDetails,
  getActivityDetails,
  clearStreetManagerCache,
  getStreetManagerCacheStats,
  pollAndSaveToSupabase,
  getApiStatus
};
