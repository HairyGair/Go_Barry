// Activity Aggregator - Collects activities from all sources
import { apiConfig } from '../breakdown-guide/components/common/constants.js';

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
      const response = await fetch(`${apiConfig.baseUrl}/api/activity/feed?limit=${limit}`, {
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully fetched from unified activities table:', data.count, 'activities');

        return {
          activities: data.activities || [],
          sources: {
            unified_activities: true,
            breakdowns: false, // Legacy source disabled
            assessments: false,
            engineering: false,
            decisions: false,
            audit: false
          },
          total: data.count || 0,
          timestamp: data.timestamp || new Date().toISOString(),
          source: 'unified_activities_table'
        };
      }
    } catch (unifiedError) {
      console.log('⚠️ Unified activities endpoint not available, falling back to legacy:', unifiedError.message);
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
      // Live breakdowns (only working endpoint)
      fetch(`${apiConfig.baseUrl}/api/breakdowns/live`, {
        signal: AbortSignal.timeout(5000)
      })
    ]);

    // Process breakdowns
    if (requests[0].status === 'fulfilled' && requests[0].value.ok) {
      const data = await requests[0].value.json();
      sources.breakdowns = true;
      
      console.log('🔍 Activity aggregator received data:', data);
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

    // Skip other endpoints for now since they don't exist yet
    /*
    // Process assessments
    if (requests[1].status === 'fulfilled' && requests[1].value.ok) {
      const data = await requests[1].value.json();
      sources.assessments = true;
      
      if (data.assessments) {
        data.assessments.forEach(assessment => {
          const icon = typeof ACTIVITY_TYPES.ASSESSMENT_COMPLETED.icon === 'function' 
            ? ACTIVITY_TYPES.ASSESSMENT_COMPLETED.icon(assessment.decision)
            : ACTIVITY_TYPES.ASSESSMENT_COMPLETED.icon;
            
          activities.push({
            id: `assessment-${assessment.id}`,
            type: 'ASSESSMENT_COMPLETED',
            icon,
            message: `${assessment.supervisor_name} completed ${assessment.wizard_type} assessment - ${assessment.decision}`,
            time: formatTimeAgo(assessment.completed_at),
            timestamp: assessment.completed_at,
            depot: assessment.depot || 'SDC',
            decision: assessment.decision,
            severity: ACTIVITY_TYPES.ASSESSMENT_COMPLETED.severity(assessment),
            priority: ACTIVITY_TYPES.ASSESSMENT_COMPLETED.priority,
            metadata: {
              wizardType: assessment.wizard_type,
              fleetNo: assessment.fleet_no,
              notes: assessment.notes
            }
          });
        });
      }
    }

    // Process engineering activities
    if (requests[2].status === 'fulfilled' && requests[2].value.ok) {
      const data = await requests[2].value.json();
      sources.engineering = true;
      
      if (data.activities) {
        data.activities.forEach(activity => {
          let icon = '🔧';
          let message = '';
          let type = 'ENGINEER_ASSIGNED';
          
          switch(activity.action) {
            case 'assigned':
              icon = '👷';
              message = `${activity.engineer_name} assigned to ${activity.fleet_no}`;
              type = 'ENGINEER_ASSIGNED';
              break;
            case 'on_site':
              icon = '📍';
              message = `${activity.engineer_name} arrived on site for ${activity.fleet_no}`;
              type = 'ENGINEER_ON_SITE';
              break;
            case 'resolved':
              icon = '✅';
              message = `${activity.engineer_name} resolved breakdown on ${activity.fleet_no}`;
              type = 'BREAKDOWN_RESOLVED';
              break;
            case 'recovered':
              icon = '🚛';
              message = `${activity.fleet_no} recovered to ${activity.depot} depot`;
              type = 'VEHICLE_RECOVERED';
              break;
            default:
              message = activity.description || `Engineering update for ${activity.fleet_no}`;
          }
          
          activities.push({
            id: `engineering-${activity.id}`,
            type,
            icon,
            message,
            time: formatTimeAgo(activity.timestamp),
            timestamp: activity.timestamp,
            depot: activity.depot || 'Engineering',
            severity: type === 'BREAKDOWN_RESOLVED' ? 'success' : 'normal',
            priority: ACTIVITY_TYPES[type]?.priority || 4,
            metadata: {
              engineerId: activity.engineer_id,
              breakdownId: activity.breakdown_id,
              fleetNo: activity.fleet_no
            }
          });
        });
      }
    }

    // Process SDC decisions
    if (requests[3].status === 'fulfilled' && requests[3].value.ok) {
      const data = await requests[3].value.json();
      sources.decisions = true;
      
      if (data.activities) {
        data.activities.forEach(activity => {
          activities.push({
            id: `sdc-${activity.id}`,
            type: 'SDC_DECISION',
            icon: ACTIVITY_TYPES.SDC_DECISION.icon,
            message: `${activity.supervisor_name} ${activity.action}: ${activity.decision} for ${activity.fleet_no}`,
            time: formatTimeAgo(activity.timestamp),
            timestamp: activity.timestamp,
            depot: 'SDC',
            decision: activity.decision,
            severity: ACTIVITY_TYPES.SDC_DECISION.severity(activity),
            priority: ACTIVITY_TYPES.SDC_DECISION.priority,
            metadata: {
              breakdownId: activity.breakdown_id,
              fleetNo: activity.fleet_no,
              notes: activity.notes
            }
          });
        });
      }
    }

    // Process audit logs
    if (requests[4].status === 'fulfilled' && requests[4].value.ok) {
      const data = await requests[4].value.json();
      sources.audit = true;
      
      if (data.logs) {
        data.logs.forEach(log => {
          if (log.action === 'changeover_requested') {
            activities.push({
              id: `audit-${log.id}`,
              type: 'CHANGEOVER_REQUESTED',
              icon: ACTIVITY_TYPES.CHANGEOVER_REQUESTED.icon,
              message: `${log.user_name} requested changeover for ${log.fleet_no} at ${log.location}`,
              time: formatTimeAgo(log.timestamp),
              timestamp: log.timestamp,
              depot: log.depot || 'SDC',
              severity: ACTIVITY_TYPES.CHANGEOVER_REQUESTED.severity,
              priority: ACTIVITY_TYPES.CHANGEOVER_REQUESTED.priority,
              metadata: {
                fleetNo: log.fleet_no,
                location: log.location,
                reason: log.reason
              }
            });
          }
        });
      }
    }
    */

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

    const response = await fetch(`${apiConfig.baseUrl}/api/activity/feed?${params.toString()}`, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Activity API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

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

    const response = await fetch(`${apiConfig.baseUrl}/api/activity/live?${params.toString()}`, {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Live activity API responded with ${response.status}`);
    }

    const data = await response.json();

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

    const response = await fetch(`${apiConfig.baseUrl}/api/activity/search?${params.toString()}`, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Activity search API responded with ${response.status}`);
    }

    const data = await response.json();

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

    const response = await fetch(`${apiConfig.baseUrl}/api/activity/stats?${params.toString()}`, {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Activity stats API responded with ${response.status}`);
    }

    const data = await response.json();

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
    const response = await fetch(`${apiConfig.baseUrl}/api/activity/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityData),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Activity logging API responded with ${response.status}`);
    }

    const data = await response.json();

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
