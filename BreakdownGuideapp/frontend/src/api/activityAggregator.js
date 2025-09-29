// Activity Aggregator - Collects activities from all sources
import { apiConfig } from '../breakdown-guide/components/common/constants.js';
import { supabase } from '../services/supabase-client.js';

// Helper function to get auth headers with fallback to sync method
async function getAuthHeaders() {
  try {
    // First try to get current Supabase session (most reliable method)
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.access_token) {
        console.log('📡 Using current Supabase session token');
        console.log('📡 Token preview:', session.access_token.substring(0, 20) + '...');
        return {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };
      }

      if (error) {
        console.warn('⚠️ Supabase session error:', error.message);
      } else {
        console.warn('⚠️ No Supabase session found');
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase auth error:', supabaseError.message);
    }

    // Fallback: Try legacy auth tokens
    const token = localStorage.getItem('auth_token') || 
                 localStorage.getItem('supervisorToken') || 
                 localStorage.getItem('gne_auth_token') ||
                 sessionStorage.getItem('auth_token') ||
                 sessionStorage.getItem('supervisorToken');

    // Try to get supervisor data
    const supervisorData = localStorage.getItem('currentSupervisor') || 
                          localStorage.getItem('supervisorData') ||
                          sessionStorage.getItem('currentSupervisor');

    if (token) {
      console.log('📡 Using legacy auth token');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }

    if (supervisorData) {
      try {
        const supervisor = JSON.parse(supervisorData);
        if (supervisor.token) {
          console.log('📡 Using supervisor session token');
          return {
            'Authorization': `Bearer ${supervisor.token}`,
            'Content-Type': 'application/json'
          };
        }
      } catch (e) {
        console.warn('Failed to parse supervisor data');
      }
    }

    console.log('⚠️ No auth token found - using basic headers');
    // Return basic headers if no auth available
    return {
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.warn('Error getting auth headers:', error);
    return {
      'Content-Type': 'application/json'
    };
  }
}

// Synchronous fallback for when async auth headers fail
function getAuthHeadersSync() {
  try {
    // Try to get Supabase token from localStorage directly
    try {
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.includes('supabase') && key.includes('auth-token')) {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.access_token) {
            console.log('📡 Using Supabase token from localStorage');
            return {
              'Authorization': `Bearer ${data.access_token}`,
              'Content-Type': 'application/json'
            };
          }
        }
      }
    } catch (e) {
      // Continue to fallbacks
    }

    // Fallback: Try legacy auth tokens
    const token = localStorage.getItem('auth_token') || 
                 localStorage.getItem('supervisorToken') || 
                 localStorage.getItem('gne_auth_token') ||
                 sessionStorage.getItem('auth_token') ||
                 sessionStorage.getItem('supervisorToken');

    if (token) {
      console.log('📡 Using legacy auth token (sync)');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }

    console.log('⚠️ No auth token found (sync) - using basic headers');
    return {
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.warn('Error getting auth headers (sync):', error);
    return {
      'Content-Type': 'application/json'
    };
  }
}

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
      const headers = await getAuthHeaders();
      console.log('📡 Making API call to activity/feed with auth headers');
      
      const response = await fetch(`${apiConfig.baseUrl}/api/activity/feed?limit=${limit}`, {
        method: 'GET',
        headers: headers,
        signal: AbortSignal.timeout(8000)
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
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
      } else if (response.status === 401) {
        console.warn('⚠️ Authentication required for activity feed, falling back to legacy');
      } else {
        console.warn(`⚠️ Activity feed returned status ${response.status}`);
      }
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
    const headers = await getAuthHeaders();
    
    // For now, just fetch live breakdowns which we know works
    const requests = await Promise.allSettled([
      // Live breakdowns (only working endpoint)
      fetch(`${apiConfig.baseUrl}/api/breakdowns/live`, {
        headers: headers,
        signal: AbortSignal.timeout(5000)
      })
    ]);

    // Process breakdowns
    if (requests[0].status === 'fulfilled' && requests[0].value.ok) {
      const data = await requests[0].value.json();
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

    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseUrl}/api/activity/feed?${params.toString()}`, {
      method: 'GET',
      headers: headers,
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

    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseUrl}/api/activity/live?${params.toString()}`, {
      method: 'GET',
      headers: headers,
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

    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseUrl}/api/activity/search?${params.toString()}`, {
      method: 'GET',
      headers: headers,
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

    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseUrl}/api/activity/stats?${params.toString()}`, {
      method: 'GET',
      headers: headers,
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
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseUrl}/api/activity/log`, {
      method: 'POST',
      headers: headers,
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
