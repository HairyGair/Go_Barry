// backend/services/streetManagerEvents.js
// Process real-time events from manage-roadworks.service.gov.uk

import { convexSync } from './convexSync.js';
import { geocodeLocation } from './geocoding.js';

// North East England area bounds
const NORTH_EAST_BOUNDS = {
  north: 55.3,
  south: 54.5,
  east: -1.0,
  west: -2.5
};

// Event types from Street Manager
const EVENT_TYPES = {
  PERMIT_CREATED: 'PERMIT_CREATED',
  PERMIT_UPDATED: 'PERMIT_UPDATED',
  PERMIT_GRANTED: 'PERMIT_GRANTED',
  PERMIT_REFUSED: 'PERMIT_REFUSED',
  PERMIT_REVOKED: 'PERMIT_REVOKED',
  PERMIT_CANCELLED: 'PERMIT_CANCELLED',
  ACTIVITY_CREATED: 'ACTIVITY_CREATED',
  ACTIVITY_UPDATED: 'ACTIVITY_UPDATED',
  ACTIVITY_CANCELLED: 'ACTIVITY_CANCELLED',
  WORK_START: 'WORK_START',
  WORK_STOP: 'WORK_STOP',
  WORK_COMPLETE: 'WORK_COMPLETE'
};

// Map event types to alert severity
const EVENT_SEVERITY_MAP = {
  [EVENT_TYPES.WORK_START]: 'High',
  [EVENT_TYPES.ACTIVITY_CREATED]: 'High',
  [EVENT_TYPES.PERMIT_GRANTED]: 'Medium',
  [EVENT_TYPES.PERMIT_CREATED]: 'Medium',
  [EVENT_TYPES.ACTIVITY_UPDATED]: 'Medium',
  [EVENT_TYPES.PERMIT_UPDATED]: 'Medium',
  [EVENT_TYPES.WORK_STOP]: 'Low',
  [EVENT_TYPES.WORK_COMPLETE]: 'Low',
  [EVENT_TYPES.PERMIT_REFUSED]: 'Low',
  [EVENT_TYPES.PERMIT_REVOKED]: 'Low',
  [EVENT_TYPES.PERMIT_CANCELLED]: 'Low',
  [EVENT_TYPES.ACTIVITY_CANCELLED]: 'Low'
};

// Map event types to alert status
const EVENT_STATUS_MAP = {
  [EVENT_TYPES.WORK_START]: 'red',
  [EVENT_TYPES.ACTIVITY_CREATED]: 'red',
  [EVENT_TYPES.PERMIT_GRANTED]: 'amber',
  [EVENT_TYPES.PERMIT_CREATED]: 'amber',
  [EVENT_TYPES.ACTIVITY_UPDATED]: 'amber',
  [EVENT_TYPES.PERMIT_UPDATED]: 'amber',
  [EVENT_TYPES.WORK_STOP]: 'green',
  [EVENT_TYPES.WORK_COMPLETE]: 'green',
  [EVENT_TYPES.PERMIT_REFUSED]: 'green',
  [EVENT_TYPES.PERMIT_REVOKED]: 'green',
  [EVENT_TYPES.PERMIT_CANCELLED]: 'green',
  [EVENT_TYPES.ACTIVITY_CANCELLED]: 'green'
};

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
 * Extract coordinates from event data
 */
async function extractCoordinates(eventData) {
  const objectData = eventData.object_data || {};
  
  // Check for direct geometry
  if (objectData.geometry && objectData.geometry.coordinates) {
    const coords = objectData.geometry.coordinates;
    // Handle both Point and LineString geometries
    if (objectData.geometry.type === 'Point') {
      const [lng, lat] = coords;
      return isInNorthEast(lat, lng) ? [lat, lng] : null;
    } else if (objectData.geometry.type === 'LineString' && coords.length > 0) {
      // Use the midpoint of the line
      const midIndex = Math.floor(coords.length / 2);
      const [lng, lat] = coords[midIndex];
      return isInNorthEast(lat, lng) ? [lat, lng] : null;
    }
  }
  
  // Try to geocode from location description
  const location = objectData.location_description || 
                  objectData.street_name || 
                  objectData.area_name;
                  
  if (location) {
    try {
      const geocoded = await geocodeLocation(location);
      if (geocoded && isInNorthEast(geocoded.latitude, geocoded.longitude)) {
        return [geocoded.latitude, geocoded.longitude];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }
  
  return null;
}

/**
 * Transform Street Manager event to BARRY alert format
 */
async function transformEventToAlert(event) {
  try {
    const eventType = event.event_type;
    const objectData = event.object_data || {};
    const eventTime = event.event_time || new Date().toISOString();
    
    // Extract coordinates
    const coordinates = await extractCoordinates(event);
    if (!coordinates) {
      console.log('📍 Event outside North East England, skipping');
      return null;
    }
    
    // Build location string
    const location = objectData.location_description || 
                    objectData.street_name || 
                    objectData.area_name || 
                    'Unknown location';
    
    // Determine title based on event type
    let title = '';
    switch (eventType) {
      case EVENT_TYPES.WORK_START:
        title = `🚧 Roadworks Started: ${location}`;
        break;
      case EVENT_TYPES.WORK_COMPLETE:
        title = `✅ Roadworks Completed: ${location}`;
        break;
      case EVENT_TYPES.PERMIT_GRANTED:
        title = `📋 Permit Granted: ${location}`;
        break;
      case EVENT_TYPES.ACTIVITY_CREATED:
        title = `🆕 New Roadworks: ${location}`;
        break;
      default:
        title = `${eventType.replace(/_/g, ' ')}: ${location}`;
    }
    
    // Build description
    const description = objectData.description || 
                       objectData.activity_description || 
                       `${objectData.work_category_ref || 'Roadwork'} activity`;
    
    // Create alert object
    const alert = {
      id: `streetmanager_${event.object_reference || Date.now()}`,
      title: title,
      description: description,
      location: location,
      coordinates: coordinates,
      status: EVENT_STATUS_MAP[eventType] || 'amber',
      severity: EVENT_SEVERITY_MAP[eventType] || 'Medium',
      type: 'roadwork',
      source: 'StreetManager',
      dataSource: 'Street Manager Live',
      
      // Authority information
      authority: objectData.highway_authority || 
                objectData.promoter_organisation || 
                'Highway Authority',
      highwayAuthoritySwaCode: objectData.highway_authority_swa_code,
      
      // Reference numbers
      permitReference: objectData.permit_reference_number,
      activityReference: objectData.activity_reference_number,
      workReference: objectData.work_reference_number,
      
      // Work details
      workCategory: objectData.work_category_ref,
      workType: objectData.work_type_ref,
      isEmergency: objectData.is_emergency_works || false,
      trafficManagementType: objectData.traffic_management_type,
      
      // Timing
      startDate: objectData.actual_start_date || objectData.proposed_start_date,
      endDate: objectData.actual_end_date || objectData.proposed_end_date,
      lastUpdated: eventTime,
      
      // Additional metadata
      streetName: objectData.street_name,
      areaName: objectData.area_name,
      usrn: objectData.usrn,
      eventType: eventType,
      eventTime: eventTime,
      
      // Enhancement flags
      locationAccuracy: 'high',
      routeMatchMethod: 'streetmanager-realtime',
      officialSource: true,
      realTimeUpdate: true
    };
    
    return alert;
  } catch (error) {
    console.error('❌ Error transforming Street Manager event:', error);
    return null;
  }
}

/**
 * Store processed event to prevent duplicates
 */
const processedEvents = new Map();
const EVENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function cleanOldEvents() {
  const now = Date.now();
  for (const [key, timestamp] of processedEvents.entries()) {
    if (now - timestamp > EVENT_CACHE_DURATION) {
      processedEvents.delete(key);
    }
  }
}

/**
 * Process incoming Street Manager event
 */
export async function processStreetManagerEvent(eventData) {
  try {
    console.log('🔄 Processing Street Manager event:', {
      type: eventData.event_type,
      reference: eventData.object_reference,
      time: eventData.event_time
    });
    
    // Clean old events periodically
    if (processedEvents.size > 1000) {
      cleanOldEvents();
    }
    
    // Check if we've already processed this event
    const eventKey = `${eventData.event_type}_${eventData.object_reference}_${eventData.event_time}`;
    if (processedEvents.has(eventKey)) {
      console.log('⏭️ Event already processed, skipping');
      return { success: true, message: 'Duplicate event' };
    }
    
    // Transform event to alert
    const alert = await transformEventToAlert(eventData);
    
    if (!alert) {
      return { 
        success: true, 
        message: 'Event filtered (outside coverage area or invalid data)' 
      };
    }
    
    // Mark event as processed
    processedEvents.set(eventKey, Date.now());
    
    // Store alert in our system
    // TODO: Add to alerts database or memory store
    console.log('✅ Street Manager alert created:', {
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      location: alert.location
    });
    
    // Sync to Convex for real-time updates
    if (convexSync) {
      try {
        // Use syncAlerts with a single alert array
        if (typeof convexSync.syncAlerts === 'function') {
          await convexSync.syncAlerts([alert]);
          console.log('✅ Alert synced to Convex');
        } else {
          console.log('⚠️ Convex sync not available');
        }
      } catch (syncError) {
        console.error('⚠️ Failed to sync to Convex:', syncError);
      }
    }
    
    return {
      success: true,
      message: 'Event processed successfully',
      alertId: alert.id,
      alert: alert
    };
    
  } catch (error) {
    console.error('❌ Error processing Street Manager event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get event processing statistics
 */
export function getEventStats() {
  return {
    processedEvents: processedEvents.size,
    supportedEventTypes: Object.keys(EVENT_TYPES),
    lastCleanup: new Date().toISOString()
  };
}

export default {
  processStreetManagerEvent,
  getEventStats,
  EVENT_TYPES
};
