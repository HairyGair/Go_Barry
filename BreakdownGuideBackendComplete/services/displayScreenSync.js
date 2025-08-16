/**
 * Display Screen Sync Service
 * Handles pushing roadworks and incidents to the control room display screen
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import { createClient } from '@supabase/supabase-js';
import supervisorSync from './supervisorSync.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Push roadwork to display screen
 * @param {string} roadworkId - ID of roadwork to push
 * @param {string} supervisorBadge - Badge of supervisor making the push
 * @param {Object} options - Additional options
 * @returns {Object} Push result
 */
export async function pushRoadworkToDisplay(roadworkId, supervisorBadge, options = {}) {
  try {
    console.log(`📺 Pushing roadwork ${roadworkId} to display screen`);
    
    // 1. Get roadwork details from Supabase
    const { data: roadwork, error: roadworkError } = await supabase
      .from('streetworks')
      .select('*')
      .eq('id', roadworkId)
      .single();
    
    if (roadworkError || !roadwork) {
      throw new Error(`Roadwork not found: ${roadworkError?.message || 'Unknown error'}`);
    }
    
    // 2. Check if already on display
    if (roadwork.pushed_to_display) {
      return {
        success: false,
        error: 'Roadwork is already on display screen',
        alreadyDisplayed: true
      };
    }
    
    // 3. Format roadwork data for display
    const displayData = formatRoadworkForDisplay(roadwork, options);
    
    // 4. Push via supervisor sync WebSocket/Convex
    const pushResult = await broadcastToDisplay('ADD_ROADWORK', displayData);
    
    if (!pushResult.success) {
      throw new Error(pushResult.error || 'Failed to broadcast to display');
    }
    
    // 5. Update roadwork record
    const { error: updateError } = await supabase
      .from('streetworks')
      .update({
        pushed_to_display: true,
        display_pushed_by: supervisorBadge,
        display_pushed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', roadworkId);
    
    if (updateError) {
      console.error('Failed to update roadwork push status:', updateError);
      // Continue anyway - the display update succeeded
    }
    
    // 6. Log supervisor action
    await logDisplayAction(supervisorBadge, 'PUSH_ROADWORK', {
      roadworkId,
      permitRef: roadwork.permit_ref || roadwork.sm_reference,
      location: roadwork.location_description || roadwork.sm_location_description
    });
    
    console.log(`✅ Successfully pushed roadwork ${roadworkId} to display`);
    
    return {
      success: true,
      action: 'pushed',
      roadwork: displayData,
      broadcastId: pushResult.broadcastId
    };
    
  } catch (error) {
    console.error('Error pushing roadwork to display:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove roadwork from display screen
 * @param {string} roadworkId - ID of roadwork to remove
 * @param {string} supervisorBadge - Badge of supervisor making the removal
 * @param {string} reason - Reason for removal
 * @returns {Object} Removal result
 */
export async function removeRoadworkFromDisplay(roadworkId, supervisorBadge, reason = 'Manual removal') {
  try {
    console.log(`📺 Removing roadwork ${roadworkId} from display screen`);
    
    // 1. Get roadwork details
    const { data: roadwork, error: roadworkError } = await supabase
      .from('streetworks')
      .select('*')
      .eq('id', roadworkId)
      .single();
    
    if (roadworkError || !roadwork) {
      throw new Error(`Roadwork not found: ${roadworkError?.message || 'Unknown error'}`);
    }
    
    // 2. Check if on display
    if (!roadwork.pushed_to_display) {
      return {
        success: false,
        error: 'Roadwork is not currently on display screen',
        notDisplayed: true
      };
    }
    
    // 3. Remove from display
    const removeResult = await broadcastToDisplay('REMOVE_ROADWORK', {
      id: roadworkId,
      permitRef: roadwork.permit_ref || roadwork.sm_reference,
      reason
    });
    
    if (!removeResult.success) {
      throw new Error(removeResult.error || 'Failed to broadcast removal');
    }
    
    // 4. Update roadwork record
    const { error: updateError } = await supabase
      .from('streetworks')
      .update({
        pushed_to_display: false,
        display_removed_by: supervisorBadge,
        display_removed_at: new Date().toISOString(),
        display_removal_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', roadworkId);
    
    if (updateError) {
      console.error('Failed to update roadwork removal status:', updateError);
    }
    
    // 5. Log supervisor action
    await logDisplayAction(supervisorBadge, 'REMOVE_ROADWORK', {
      roadworkId,
      permitRef: roadwork.permit_ref || roadwork.sm_reference,
      reason
    });
    
    console.log(`✅ Successfully removed roadwork ${roadworkId} from display`);
    
    return {
      success: true,
      action: 'removed',
      roadworkId,
      reason
    };
    
  } catch (error) {
    console.error('Error removing roadwork from display:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Push incident to display screen
 * @param {Object} incidentData - Incident data to display
 * @param {string} supervisorBadge - Badge of supervisor making the push
 * @returns {Object} Push result
 */
export async function pushIncidentToDisplay(incidentData, supervisorBadge) {
  try {
    console.log(`📺 Pushing incident to display screen`);
    
    // Format incident data for display
    const displayData = formatIncidentForDisplay(incidentData);
    
    // Push via supervisor sync
    const pushResult = await broadcastToDisplay('ADD_INCIDENT', displayData);
    
    if (!pushResult.success) {
      throw new Error(pushResult.error || 'Failed to broadcast incident');
    }
    
    // Log supervisor action
    await logDisplayAction(supervisorBadge, 'PUSH_INCIDENT', {
      incidentId: incidentData.id,
      location: incidentData.location,
      severity: incidentData.severity
    });
    
    console.log(`✅ Successfully pushed incident to display`);
    
    return {
      success: true,
      action: 'pushed',
      incident: displayData,
      broadcastId: pushResult.broadcastId
    };
    
  } catch (error) {
    console.error('Error pushing incident to display:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format roadwork data for display screen
 * @param {Object} roadwork - Raw roadwork data
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted display data
 */
function formatRoadworkForDisplay(roadwork, options = {}) {
  const { priority = 'normal', duration = null } = options;
  
  // Determine display priority based on severity and traffic impact
  let displayPriority = priority;
  if (roadwork.severity === 'critical' || roadwork.sm_traffic_management_type?.includes('road_closure')) {
    displayPriority = 'high';
  } else if (roadwork.severity === 'high' || roadwork.sm_traffic_management_type?.includes('lane_closure')) {
    displayPriority = 'medium';
  }
  
  // Create readable title
  const location = roadwork.location_description || 
                  roadwork.sm_location_description ||
                  `${roadwork.sm_street_name || 'Unknown Street'}, ${roadwork.sm_area_name || 'Unknown Area'}`;
  
  const workType = roadwork.sm_traffic_management_type || roadwork.work_type || 'Roadworks';
  
  // Format affected routes
  const affectedRoutes = roadwork.confirmed_routes || 
                        roadwork.auto_matched_routes || 
                        roadwork.affected_routes || 
                        [];
  
  const routeText = affectedRoutes.length > 0 ? 
                   `Routes ${affectedRoutes.join(', ')} diverted` : 
                   'Route impacts being assessed';
  
  return {
    id: roadwork.id,
    type: 'roadwork',
    priority: displayPriority,
    title: `${location} - ${workType}`,
    subtitle: `${roadwork.sm_promoter_name || roadwork.promoter_organisation || 'Unknown'} | ${routeText}`,
    description: roadwork.sm_works_description || roadwork.description || 'Roadworks in progress',
    
    // Location and map data
    location: {
      lat: roadwork.latitude || roadwork.lat,
      lng: roadwork.longitude || roadwork.lng,
      description: location
    },
    
    // Map pin configuration
    mapPin: {
      type: 'roadwork',
      icon: '🚧',
      color: getSeverityColor(roadwork.severity),
      size: displayPriority === 'high' ? 'large' : 'medium'
    },
    
    // Timing information
    timing: {
      startDate: roadwork.sm_start_date,
      endDate: roadwork.sm_end_date,
      duration: duration || calculateDuration(roadwork.sm_start_date, roadwork.sm_end_date),
      isOverrun: isRoadworkOverrun(roadwork)
    },
    
    // Route information
    routes: {
      affected: affectedRoutes,
      diversions: roadwork.diversion_route || null,
      hasActiveDiversions: !!(roadwork.diversion_route || roadwork.diversion_id)
    },
    
    // Metadata
    metadata: {
      permitRef: roadwork.permit_ref || roadwork.sm_reference,
      source: 'StreetManager',
      pushedAt: new Date().toISOString(),
      pushedBy: roadwork.display_pushed_by,
      severity: roadwork.severity || 'medium',
      workCategory: roadwork.sm_works_category
    }
  };
}

/**
 * Format incident data for display screen
 * @param {Object} incident - Raw incident data
 * @returns {Object} Formatted display data
 */
function formatIncidentForDisplay(incident) {
  return {
    id: incident.id,
    type: 'incident',
    priority: getSeverityDisplayPriority(incident.severity),
    title: incident.title || `${incident.type} - ${incident.location}`,
    subtitle: incident.description || 'Live incident',
    description: incident.details || incident.description || 'Incident affecting traffic',
    
    location: {
      lat: incident.latitude || incident.lat,
      lng: incident.longitude || incident.lng,
      description: incident.location
    },
    
    mapPin: {
      type: 'incident',
      icon: getIncidentIcon(incident.type),
      color: getSeverityColor(incident.severity),
      size: incident.severity === 'critical' ? 'large' : 'medium'
    },
    
    timing: {
      reportedAt: incident.reportedAt || incident.created_at,
      duration: 'Ongoing'
    },
    
    routes: {
      affected: incident.affectedRoutes || [],
      diversions: incident.diversion || null
    },
    
    metadata: {
      source: 'Manual',
      pushedAt: new Date().toISOString(),
      severity: incident.severity,
      incidentType: incident.type
    }
  };
}

/**
 * Broadcast update to display screen via supervisor sync
 * @param {string} action - Action type (ADD_ROADWORK, REMOVE_ROADWORK, ADD_INCIDENT)
 * @param {Object} data - Data to broadcast
 * @returns {Object} Broadcast result
 */
async function broadcastToDisplay(action, data) {
  try {
    // Use supervisor sync to broadcast to all connected displays
    const broadcastData = {
      type: 'DISPLAY_UPDATE',
      action,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Send via WebSocket if available
    if (supervisorSync && supervisorSync.broadcast) {
      await supervisorSync.broadcast(broadcastData);
    }
    
    // Also store in Convex for persistence and real-time sync
    // This would integrate with the existing Convex sync system
    
    return {
      success: true,
      broadcastId: `${action}_${data.id}_${Date.now()}`
    };
    
  } catch (error) {
    console.error('Error broadcasting to display:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log display actions for audit trail
 * @param {string} supervisorBadge - Supervisor badge
 * @param {string} action - Action taken
 * @param {Object} details - Action details
 */
async function logDisplayAction(supervisorBadge, action, details) {
  try {
    // Log to supervisor_actions table if it exists
    const { error } = await supabase
      .from('supervisor_actions')
      .insert({
        action_type: action.toLowerCase(),
        target_type: action.includes('ROADWORK') ? 'roadwork' : 'incident',
        target_id: details.roadworkId || details.incidentId,
        supervisor_id: supervisorBadge,
        supervisor_name: supervisorBadge, // Would need to lookup full name
        action_details: details,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.warn('Failed to log display action:', error);
    }
    
  } catch (error) {
    console.error('Error logging display action:', error);
    // Don't throw - logging is important but not critical
  }
}

/**
 * Get current items on display screen
 * @returns {Object} Current display items
 */
export async function getCurrentDisplayItems() {
  try {
    // Get all roadworks currently pushed to display
    const { data: roadworks, error: roadworksError } = await supabase
      .from('streetworks')
      .select('*')
      .eq('pushed_to_display', true)
      .order('display_pushed_at', { ascending: false });
    
    if (roadworksError) throw roadworksError;
    
    // Format for display
    const displayRoadworks = (roadworks || []).map(rw => formatRoadworkForDisplay(rw));
    
    return {
      success: true,
      items: {
        roadworks: displayRoadworks,
        incidents: [], // Would get from incidents table if implemented
        total: displayRoadworks.length
      }
    };
    
  } catch (error) {
    console.error('Error getting current display items:', error);
    return {
      success: false,
      error: error.message,
      items: { roadworks: [], incidents: [], total: 0 }
    };
  }
}

/**
 * Auto-remove completed roadworks from display
 * This function should be called periodically (e.g., every hour)
 */
export async function autoRemoveCompletedRoadworks() {
  try {
    console.log('🔄 Auto-removing completed roadworks from display');
    
    // Find roadworks on display that are completed or well past end date
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 2); // 2 hours grace period
    
    const { data: roadworks, error } = await supabase
      .from('streetworks')
      .select('*')
      .eq('pushed_to_display', true)
      .or(`status.eq.completed,sm_end_date.lt.${cutoffDate.toISOString()}`);
    
    if (error) throw error;
    
    // Remove each completed roadwork
    for (const roadwork of roadworks || []) {
      await removeRoadworkFromDisplay(
        roadwork.id, 
        'SYSTEM', 
        roadwork.status === 'completed' ? 'Automatically removed - work completed' : 'Automatically removed - past end date'
      );
    }
    
    console.log(`✅ Auto-removed ${roadworks?.length || 0} completed roadworks`);
    
    return {
      success: true,
      removedCount: roadworks?.length || 0
    };
    
  } catch (error) {
    console.error('Error auto-removing completed roadworks:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper functions

function getSeverityColor(severity) {
  const colors = {
    critical: '#DC2626',
    high: '#EF4444', 
    medium: '#F59E0B',
    low: '#10B981'
  };
  return colors[severity?.toLowerCase()] || colors.medium;
}

function getSeverityDisplayPriority(severity) {
  const priorities = {
    critical: 'high',
    high: 'medium',
    medium: 'normal',
    low: 'low'
  };
  return priorities[severity?.toLowerCase()] || 'normal';
}

function getIncidentIcon(type) {
  const icons = {
    rtc: '🚗',
    breakdown: '🔧',
    roadworks: '🚧',
    weather: '🌧️',
    event: '🎪',
    emergency: '🚨'
  };
  return icons[type?.toLowerCase()] || '⚠️';
}

function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 'Unknown duration';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
}

function isRoadworkOverrun(roadwork) {
  if (!roadwork.sm_end_date) return false;
  
  const endDate = new Date(roadwork.sm_end_date);
  const now = new Date();
  
  return endDate < now && roadwork.status !== 'completed';
}

export default {
  pushRoadworkToDisplay,
  removeRoadworkFromDisplay,
  pushIncidentToDisplay,
  getCurrentDisplayItems,
  autoRemoveCompletedRoadworks
};