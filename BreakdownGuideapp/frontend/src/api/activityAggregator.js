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

// Fetch activities from all sources
export async function fetchAllActivities(limit = 50) {
  const activities = [];
  const sources = {
    breakdowns: false,
    assessments: false,
    engineering: false,
    decisions: false,
    audit: false
  };

  try {
    // Fetch from multiple endpoints in parallel
    const requests = await Promise.allSettled([
      // Recent breakdowns
      fetch(`${apiConfig.baseUrl}/api/breakdowns/recent?limit=30`, {
        signal: AbortSignal.timeout(5000)
      }),
      // Recent assessments
      fetch(`${apiConfig.baseUrl}/api/assessments/recent?limit=30`, {
        signal: AbortSignal.timeout(5000)
      }),
      // Engineering activities
      fetch(`${apiConfig.baseUrl}/api/engineering/activities?limit=30`, {
        signal: AbortSignal.timeout(5000)
      }),
      // SDC decisions
      fetch(`${apiConfig.baseUrl}/api/sdc/activities?limit=30`, {
        signal: AbortSignal.timeout(5000)
      }),
      // Audit logs
      fetch(`${apiConfig.baseUrl}/api/audit/recent?limit=30`, {
        signal: AbortSignal.timeout(5000)
      })
    ]);

    // Process breakdowns
    if (requests[0].status === 'fulfilled' && requests[0].value.ok) {
      const data = await requests[0].value.json();
      sources.breakdowns = true;
      
      if (data.breakdowns) {
        data.breakdowns.forEach(breakdown => {
          activities.push({
            id: `breakdown-${breakdown.id}`,
            type: 'BREAKDOWN_REPORTED',
            icon: ACTIVITY_TYPES.BREAKDOWN_REPORTED.icon,
            message: `${breakdown.supervisor_name || 'Supervisor'} reported ${breakdown.issue_category || 'breakdown'} on ${breakdown.fleet_no}`,
            time: formatTimeAgo(breakdown.created_at),
            timestamp: breakdown.created_at,
            depot: breakdown.depot || 'SDC',
            decision: breakdown.severity,
            severity: ACTIVITY_TYPES.BREAKDOWN_REPORTED.severity(breakdown),
            priority: ACTIVITY_TYPES.BREAKDOWN_REPORTED.priority,
            metadata: {
              breakdownId: breakdown.id,
              fleetNo: breakdown.fleet_no,
              location: breakdown.location
            }
          });
        });
      }
    }

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

  } catch (error) {
    console.error('Error fetching activities:', error);
  }

  // Sort activities by timestamp and priority
  activities.sort((a, b) => {
    const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
    if (Math.abs(timeDiff) < 60000) { // Within 1 minute
      return a.priority - b.priority;
    }
    return timeDiff;
  });

  // Return limited number of activities
  return {
    activities: activities.slice(0, limit),
    sources,
    total: activities.length,
    timestamp: new Date().toISOString()
  };
}

// Get mock activities for testing
export function getMockActivities() {
  const now = new Date();
  const activities = [
    {
      id: 'mock-1',
      type: 'BREAKDOWN_REPORTED',
      icon: '🚨',
      message: 'John Smith reported steering issue on 6098',
      time: '2m ago',
      timestamp: new Date(now - 2 * 60000).toISOString(),
      depot: 'Washington',
      decision: 'STOP',
      severity: 'critical',
      priority: 1
    },
    {
      id: 'mock-2',
      type: 'ENGINEER_ASSIGNED',
      icon: '👷',
      message: 'Mike Johnson assigned to 6098',
      time: '5m ago',
      timestamp: new Date(now - 5 * 60000).toISOString(),
      depot: 'Washington',
      severity: 'normal',
      priority: 3
    },
    {
      id: 'mock-3',
      type: 'ASSESSMENT_COMPLETED',
      icon: '⚡',
      message: 'Sarah Wilson completed ABS Light assessment - AMBER',
      time: '12m ago',
      timestamp: new Date(now - 12 * 60000).toISOString(),
      depot: 'Percy Main',
      decision: 'AMBER',
      severity: 'warning',
      priority: 2
    },
    {
      id: 'mock-4',
      type: 'BREAKDOWN_RESOLVED',
      icon: '✅',
      message: 'Tom Davis resolved breakdown on 5342',
      time: '18m ago',
      timestamp: new Date(now - 18 * 60000).toISOString(),
      depot: 'Riverside',
      severity: 'success',
      priority: 2
    },
    {
      id: 'mock-5',
      type: 'SDC_DECISION',
      icon: '📋',
      message: 'Emma Brown approved changeover for 7234',
      time: '25m ago',
      timestamp: new Date(now - 25 * 60000).toISOString(),
      depot: 'SDC',
      severity: 'normal',
      priority: 4
    },
    {
      id: 'mock-6',
      type: 'ENGINEER_ON_SITE',
      icon: '📍',
      message: 'Alex Turner arrived on site for 6789',
      time: '32m ago',
      timestamp: new Date(now - 32 * 60000).toISOString(),
      depot: 'Consett',
      severity: 'normal',
      priority: 3
    },
    {
      id: 'mock-7',
      type: 'CHANGEOVER_REQUESTED',
      icon: '🔄',
      message: 'Lisa Anderson requested changeover for 5123 at Eldon Square',
      time: '45m ago',
      timestamp: new Date(now - 45 * 60000).toISOString(),
      depot: 'Percy Main',
      severity: 'warning',
      priority: 3
    },
    {
      id: 'mock-8',
      type: 'BREAKDOWN_REPORTED',
      icon: '🚨',
      message: 'David Clark reported brake issue on 8234',
      time: '1h ago',
      timestamp: new Date(now - 60 * 60000).toISOString(),
      depot: 'Riverside',
      decision: 'AMBER',
      severity: 'warning',
      priority: 2
    },
    {
      id: 'mock-9',
      type: 'VEHICLE_RECOVERED',
      icon: '🚛',
      message: '6098 recovered to Washington depot',
      time: '1h ago',
      timestamp: new Date(now - 65 * 60000).toISOString(),
      depot: 'Washington',
      severity: 'normal',
      priority: 3
    },
    {
      id: 'mock-10',
      type: 'ASSESSMENT_COMPLETED',
      icon: '✅',
      message: 'Rachel Green completed Oil Warning assessment - CONTINUE',
      time: '2h ago',
      timestamp: new Date(now - 120 * 60000).toISOString(),
      depot: 'Consett',
      decision: 'CONTINUE',
      severity: 'success',
      priority: 3
    }
  ];

  return {
    activities,
    sources: {
      breakdowns: true,
      assessments: true,
      engineering: true,
      decisions: true,
      audit: true
    },
    total: activities.length,
    timestamp: new Date().toISOString()
  };
}
