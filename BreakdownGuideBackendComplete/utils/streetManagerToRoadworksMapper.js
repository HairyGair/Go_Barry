// backend/utils/streetManagerToRoadworksMapper.js
// Mapper to convert StreetManager notification format to existing roadworks table format

/**
 * Maps StreetManager notification data to roadworks table format
 * @param {Object} notification - StreetManager notification object
 * @returns {Object} - Mapped object for roadworks table
 */
export function mapStreetManagerToRoadworks(notification) {
  return {
    // Map core fields (ensure ID is not too long)
    id: (notification.notification_id || `streetmanager_${Date.now()}`).substring(0, 255),
    title: (notification.title || `${notification.work_category || 'Roadwork'} - ${notification.street_name || 'Unknown Location'}`).substring(0, 255),
    description: (notification.description || notification.location_description || 'StreetManager roadwork notification').substring(0, 500),
    location: (notification.location_description || notification.street_name || notification.area_name || 'Unknown Location').substring(0, 255),
    
    // Map coordinates if available
    coordinates: notification.coordinates ? [
      notification.coordinates.lat, 
      notification.coordinates.lng
    ] : null,
    
    // Map route impacts
    affects_routes: notification.affected_routes || [],
    routes_affected: notification.affected_routes || [],
    
    // Map dates
    start_date: notification.start_date || notification.proposed_start_date,
    end_date: notification.end_date || notification.proposed_end_date,
    
    // Map status and severity
    status: mapWorkStatus(notification.work_status) || 'active',
    severity: notification.severity || determineSeverityFromCategory(notification.work_category),
    
    // Map type and source
    type: 'roadwork',
    source: 'street_manager',
    
    // Map StreetManager specific fields to roadworks table fields
    permit_reference: notification.permit_reference_number,
    work_reference: notification.activity_reference_number,
    promoter: notification.organisation_name,
    work_category: notification.work_category || notification.work_category_ref,
    traffic_impact: notification.traffic_management_type,
    work_status: notification.work_status,
    
    // Map authority info
    authority: notification.highway_authority || notification.organisation_name,
    
    // Map timestamps
    last_updated: notification.updated_at || new Date().toISOString(),
    processed_at: notification.processed_at || new Date().toISOString(),
    created_at: notification.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Map raw data for debugging
    raw_data: notification.raw_webhook_data || { source: 'streetmanager_service', notification },
    
    // Map system fields (match webhook format)
    created_by_supervisor_id: 'WEBHOOK',
    created_by_name: 'StreetManager System',
    email_sent: false,
    email_sent_at: null,
    all_day: false
  };
}

/**
 * Maps work_status from StreetManager to roadworks status
 * @param {string} workStatus - StreetManager work status
 * @returns {string} - Mapped status for roadworks table
 */
function mapWorkStatus(workStatus) {
  if (!workStatus) return 'active';
  
  const statusMap = {
    'proposed': 'active',
    'planned': 'active', 
    'in_progress': 'active',
    'in-progress': 'active',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'suspended': 'active',
    'postponed': 'active'
  };
  
  return statusMap[workStatus.toLowerCase()] || 'active';
}

/**
 * Determines severity based on work category
 * @param {string} workCategory - Work category from StreetManager
 * @returns {string} - Severity level
 */
function determineSeverityFromCategory(workCategory) {
  if (!workCategory) return 'medium';
  
  const category = workCategory.toLowerCase();
  
  if (category.includes('emergency') || category.includes('immediate')) {
    return 'high';
  }
  
  if (category.includes('major') || category.includes('standard')) {
    return 'medium';
  }
  
  if (category.includes('minor') || category.includes('inspection')) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Maps roadworks table data back to StreetManager notification format (reverse mapping)
 * @param {Object} roadwork - Roadworks table record
 * @returns {Object} - StreetManager notification format
 */
export function mapRoadworksToStreetManager(roadwork) {
  return {
    notification_id: roadwork.id,
    title: roadwork.title,
    description: roadwork.description,
    location_description: roadwork.location,
    street_name: extractStreetFromLocation(roadwork.location),
    coordinates: roadwork.coordinates ? {
      lat: roadwork.coordinates[0],
      lng: roadwork.coordinates[1]
    } : null,
    affected_routes: roadwork.routes_affected || roadwork.affects_routes || [],
    start_date: roadwork.start_date,
    end_date: roadwork.end_date,
    severity: roadwork.severity,
    work_status: roadwork.work_status || roadwork.status,
    permit_reference_number: roadwork.permit_reference,
    activity_reference_number: roadwork.work_reference,
    organisation_name: roadwork.promoter || roadwork.authority,
    work_category: roadwork.work_category,
    traffic_management_type: roadwork.traffic_impact,
    highway_authority: roadwork.authority,
    raw_webhook_data: roadwork.raw_data || { source: 'roadworks_table', roadwork },
    processing_status: 'processed',
    processed_at: roadwork.processed_at,
    webhook_received_at: roadwork.created_at,
    created_at: roadwork.created_at,
    updated_at: roadwork.updated_at
  };
}

/**
 * Extracts street name from location string
 * @param {string} location - Full location string
 * @returns {string} - Extracted street name
 */
function extractStreetFromLocation(location) {
  if (!location) return null;
  
  // Try to extract the first part before comma or dash
  const parts = location.split(/[,-]/);
  return parts[0]?.trim() || location;
}

export default {
  mapStreetManagerToRoadworks,
  mapRoadworksToStreetManager
};