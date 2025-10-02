// Activity Aggregator - Collects activities from all sources
// Now uses api-client.js which automatically handles authentication
import { apiClient } from '../services/api-client.js';

// Activity types configuration
const ACTIVITY_TYPES = {
  BREAKDOWN_REPORTED: {
    icon: '🚨',
    priority: 1,
    severity: (data) => data.severity === 'STOP' ? 'critical' : data.severity === 'AMBER' ? 'warning' : 'normal'
  },
  ASSESSMENT_COMPLETED: {
    icon: (decision) => decision === 'STOP' ? '🛑' : decision === 'AMBER' ? '⚡' : '✅',
    priority: 2,
    severity: (data) => data.decision === 'STOP' ? 'critical' : data.decision === 'AMBER' ? 'warning' : 'success'
  },
  ENGINEER_ASSIGNED: {
    icon: '👷',
    priority: 3,
    severity: 'normal'
  },
  ENGINEER_ON_SITE: {
    icon: '🔧',
    priority: 3,
    severity: 'normal'
  },
  BREAKDOWN_RESOLVED: {
    icon: '✅',
    priority: 2,
    severity: 'success'
  },
  SDC_DECISION: {
    icon: '📋',
    priority: 4,
    severity: (data) => data.priority === 'critical' ? 'critical' : 'normal'
  },
  CHANGEOVER_REQUESTED: {
    icon: '🔄',
    priority: 3,
    severity: 'warning'
  },
  VEHICLE_RECOVERED: {
    icon: '🚛',
    priority: 3,
    severity: 'normal'
  }
};

// Format time helper
function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fetch activities from unified activities table (new approach)
export async function fetchAllActivities(limit = 50) {
  try {
    console.log('🔍 Fetching activities from unified activities table...');

    // Try to fetch from the new unified activities endpoint first
    try {
      console.log('📡 Making API call to activity/feed (auth automatic via apiClient)');

      const data = await apiClient.get(`/api/activity/feed?limit=${limit}`);

      console.log('✅ Successfully fetched from unified activities table:', data);
      console.log('✅ Activities count:', data.activities?.length || 0);

        // Process activities for frontend compatibility
        const processedActivities = (data.activities || []).map(activity => ({
          // Core fields
          id: activity.id,
          type: activity.type || activity.activity_type || 'activity',
          icon: activity.icon || '📋',
          message: activity.message || 'Activity',
          time: activity.time || formatTimeAgo(activity.timestamp || activity.created_at),
          timestamp: activity.timestamp || activity.created_at,
          
          // Additional display fields
          depot: activity.depot,
          supervisor: activity.supervisor || activity.supervisor_name || activity.actor_name,
          supervisor_badge: activity.supervisor_badge || activity.actor_id,
          decision: activity.decision,
          severity: activity.severity || 'normal',
          priority: activity.priority || 5,
          
          // Breakdown specific fields
          breakdown_id: activity.breakdown_id || activity.entity_id,
          fleet_no: activity.fleet_no,
          location: activity.location,
          issue_type: activity.issue_type,
          
          // LiveActivityFeed expects these fields
          supervisorName: activity.supervisor || activity.supervisor_name || activity.actor_name,
          busNumber: activity.fleet_no,
          issue: activity.issue_type,
          route: activity.route,
          route_number: activity.route_number,
          passengersOnBoard: activity.passengers_on_board,
          status: activity.decision || activity.status,
          
          // Metadata
          source: activity.source || 'unified',
          metadata: activity.metadata || {}
        }));

      return {
        activities: processedActivities,
        sources: {
          unified_activities: true,
          breakdowns: false,
          assessments: false,
          engineering: false,
          decisions: false,
          audit: false
        },
        total: data.count || processedActivities.length,
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'unified_activities_table'
      };
    } catch (unifiedError) {
      console.log('⚠️ Unified activities endpoint error:', unifiedError.message);
    }

    // Fallback to legacy approach if unified endpoint fails
    console.log('🔄 Falling back to legacy breakdown activities...');
    return await fetchLegacyActivities(limit);

  } catch (error) {
    console.error('❌ Error in fetchAllActivities:', error);
    return {
      activities: [],
      sources: { error: true },
      total: 0,
      timestamp: new Date().toISOString(),
      source: 'error_no_fallback'
    };
  }
}

// Legacy method (kept as fallback)
export async function fetchLegacyActivities(limit = 50) {
  const activities = [];
  const sources = {
    breakdowns: false,
    assessments: false,
    engineering: false,
    decisions: false,
    audit: false
  };

  try {
    // For now, just fetch live breakdowns which we know works
    const requests = await Promise.allSettled([
      // Live breakdowns (auth automatic via apiClient)
      apiClient.get('/api/breakdowns/live')
    ]);

    // Process breakdowns
    if (requests[0].status === 'fulfilled') {
      const data = requests[0].value;
      sources.breakdowns = true;
      
      console.log('🔍 Legacy aggregator received data:', data);
      console.log('🔍 Number of breakdowns:', data.breakdowns?.length);
      
      if (data.breakdowns && data.breakdowns.length > 0) {
        console.log('🔍 Processing breakdowns for activities...');
        data.breakdowns.forEach(breakdown => {
          // Get the breakdown ID (could be 'id' or 'breakdown_id')
          const breakdownId = breakdown.breakdown_id || breakdown.id;
          const fleetNumber = breakdown.fleet_no || breakdown.fleet_number || 'Unknown';
          const supervisorName = breakdown.supervisor_name || breakdown.supervisor || 'Supervisor';

          // Check if this is a wizard assessment or regular breakdown
          // A wizard assessment has wizard_decision, wizard_type, or breakdown_source === 'wizard'
          const isWizardAssessment = !!(breakdown.wizard_decision ||
                                    breakdown.breakdown_source === 'wizard' ||
                                    breakdown.wizard_type);

          console.log(`🔍 Processing breakdown ID ${breakdownId}: fleet=${fleetNumber}, isWizard=${isWizardAssessment}, decision=${breakdown.wizard_decision}, type=${breakdown.wizard_type}`);

          if (isWizardAssessment) {
            // Create assessment activity
            const decision = breakdown.wizard_decision || breakdown.severity || 'CONTINUE';
            const decisionIcon = decision === 'STOP' ? '🛑' :
                                decision === 'AMBER' ? '⚡' : '✅';

            // Get the assessment type from wizard_type, issue_type, or issue_category
            const assessmentType = breakdown.wizard_type || breakdown.issue_type || breakdown.issue_category || 'General';
            const formattedType = assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1).replace(/-/g, ' ');

            activities.push({
              id: `assessment-${breakdownId}`,
              type: 'ASSESSMENT_COMPLETED',
              icon: decisionIcon,
              message: `${supervisorName} completed ${formattedType} assessment for ${fleetNumber} - Result: ${decision}`,
              time: formatTimeAgo(breakdown.created_at),
              timestamp: breakdown.created_at,
              depot: breakdown.depot || 'SDC',
              decision: decision,
              severity: decision === 'STOP' ? 'critical' :
                       decision === 'AMBER' ? 'warning' : 'success',
              priority: 2,
              // Fields for LiveActivityFeed
              supervisorName: supervisorName,
              busNumber: fleetNumber,
              fleet_no: fleetNumber,
              issue: breakdown.issue_category,
              issue_type: breakdown.issue_category,
              location: breakdown.location || breakdown.location_description,
              route: breakdown.route || breakdown.route_number,
              route_number: breakdown.route || breakdown.route_number,
              passengersOnBoard: breakdown.passengers_on_board,
              status: decision,
              metadata: {
                wizardType: breakdown.wizard_type,
                fleetNo: fleetNumber,
                location: breakdown.location || breakdown.location_description,
                breakdownId: breakdownId
              }
            });
          } else {
            // Create breakdown reported activity
            activities.push({
              id: `breakdown-${breakdownId}`,
              type: 'BREAKDOWN_REPORTED',
              icon: ACTIVITY_TYPES.BREAKDOWN_REPORTED.icon,
              message: `${supervisorName} reported ${breakdown.issue_category || 'breakdown'} on ${fleetNumber}`,
              time: formatTimeAgo(breakdown.created_at),
              timestamp: breakdown.created_at,
              depot: breakdown.depot || 'SDC',
              decision: breakdown.severity,
              severity: ACTIVITY_TYPES.BREAKDOWN_REPORTED.severity(breakdown),
              priority: ACTIVITY_TYPES.BREAKDOWN_REPORTED.priority,
              // Fields for LiveActivityFeed
              supervisorName: supervisorName,
              busNumber: fleetNumber,
              fleet_no: fleetNumber,
              issue: breakdown.issue_category,
              issue_type: breakdown.issue_category,
              location: breakdown.location || breakdown.location_description,
              route: breakdown.route || breakdown.route_number,
              route_number: breakdown.route || breakdown.route_number,
              passengersOnBoard: breakdown.passengers_on_board,
              status: breakdown.severity,
              metadata: {
                breakdownId: breakdownId,
                fleetNo: fleetNumber,
                location: breakdown.location || breakdown.location_description
              }
            });
          }
        });
      }
    }

  } catch (error) {
    console.error('Error fetching legacy activities:', error);
  }

  // Sort activities by timestamp and priority
  activities.sort((a, b) => {
    const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
    if (Math.abs(timeDiff) < 60000) { // Within 1 minute
      return a.priority - b.priority;
    }
    return timeDiff;
  });

  // Log the results
  console.log(`📦 Legacy activity aggregator returning ${activities.length} activities`);
  if (activities.length > 0) {
    console.log('🎆 First activity:', activities[0]);
  }

  // Return limited number of activities
  return {
    activities: activities.slice(0, limit),
    sources,
    total: activities.length,
    timestamp: new Date().toISOString(),
    source: 'legacy_breakdowns'
  };
}

// Direct API call to unified activities endpoint
export async function fetchUnifiedActivities(options = {}) {
  const {
    limit = 50,
    offset = 0,
    depot,
    actor_id,
    activity_type,
    severity,
    source
  } = options;

  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    if (depot) params.append('depot', depot);
    if (actor_id) params.append('actor_id', actor_id);
    if (activity_type) params.append('activity_type', activity_type);
    if (severity) params.append('severity', severity);
    if (source) params.append('source', source);

    const data = await apiClient.get(`/api/activity/feed?${params.toString()}`);

    return {
      success: true,
      activities: data.activities || [],
      count: data.count || 0,
      timestamp: data.timestamp,
      metadata: data.metadata,
      source: 'unified_activities_api'
    };
  } catch (error) {
    console.error('❌ Failed to fetch unified activities:', error);
    return {
      success: false,
      error: error.message,
      activities: [],
      count: 0,
      source: 'error'
    };
  }
}

// Live activities endpoint (for real-time polling)
export async function fetchLiveActivities(since = null, limit = 25) {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (since) params.append('since', since);

    const data = await apiClient.get(`/api/activity/live?${params.toString()}`);

    return {
      success: true,
      activities: data.activities || [],
      count: data.count || 0,
      since: data.since,
      timestamp: data.timestamp,
      source: 'live_activities_api'
    };
  } catch (error) {
    console.error('❌ Failed to fetch live activities:', error);
    return {
      success: false,
      error: error.message,
      activities: [],
      count: 0,
      source: 'error'
    };
  }
}

// Search activities
export async function searchActivities(searchTerm, options = {}) {
  const { limit = 20, offset = 0 } = options;

  try {
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const data = await apiClient.get(`/api/activity/search?${params.toString()}`);

    return {
      success: true,
      activities: data.activities || [],
      count: data.count || 0,
      searchTerm: data.searchTerm,
      source: 'activity_search_api'
    };
  } catch (error) {
    console.error('❌ Failed to search activities:', error);
    return {
      success: false,
      error: error.message,
      activities: [],
      count: 0,
      searchTerm,
      source: 'error'
    };
  }
}

// Get activity statistics
export async function getActivityStats(options = {}) {
  const { period = '24h', depot, actor_id } = options;

  try {
    const params = new URLSearchParams();
    params.append('period', period);
    if (depot) params.append('depot', depot);
    if (actor_id) params.append('actor_id', actor_id);

    const data = await apiClient.get(`/api/activity/stats?${params.toString()}`);

    return {
      success: true,
      stats: data.stats,
      timestamp: data.timestamp,
      source: 'activity_stats_api'
    };
  } catch (error) {
    console.error('❌ Failed to get activity stats:', error);
    return {
      success: false,
      error: error.message,
      stats: null,
      source: 'error'
    };
  }
}

// Log new activity
export async function logActivity(activityData) {
  try {
    const data = await apiClient.post('/api/activity/log', activityData);

    return {
      success: true,
      activity: data.activity,
      timestamp: data.timestamp,
      source: 'activity_log_api'
    };
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    return {
      success: false,
      error: error.message,
      source: 'error'
    };
  }
}

// Mock activities function removed - now using unified activities system exclusively
