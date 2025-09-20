// Fetch dashboard data utility function
import { apiConfig } from '../breakdown-guide/components/common/constants.js';

export async function fetchDashboardData() {
  try {
    console.log('🔍 DEBUG: Using API baseUrl:', apiConfig.baseUrl);

    // Fetch basic data sources that should be available on all backends
    const basicRequests = [
      fetch(`${apiConfig.baseUrl}/api/breakdowns/live`),
      fetch(`${apiConfig.baseUrl}/api/breakdowns/stats?period=today`).catch(e => ({ ok: false, error: e }))
    ];

    // Enhanced endpoints that may not be available on all backend versions
    const enhancedRequests = [
      fetch(`${apiConfig.baseUrl}/api/activity/feed?limit=50`).catch(e => ({ ok: false, error: e })),
      fetch(`${apiConfig.baseUrl}/api/engineering/depot-stats`).catch(e => ({ ok: false, error: e })),
      fetch(`${apiConfig.baseUrl}/api/analytics/kpis`).catch(e => ({ ok: false, error: e })),
      fetch(`${apiConfig.baseUrl}/api/wizards/recent?limit=10`).catch(e => ({ ok: false, error: e })),
      fetch(`${apiConfig.baseUrl}/api/auth/recent-sessions?limit=10`).catch(e => ({ ok: false, error: e }))
    ];

    // Execute all requests in parallel
    const [
      breakdownsResponse,
      statsResponse,
      activityResponse,
      engineeringResponse,
      analyticsResponse,
      wizardResponse,
      authResponse
    ] = await Promise.all([...basicRequests, ...enhancedRequests]);

    const breakdownsData = await breakdownsResponse.json();

    // Handle stats response safely
    let statsData = {};
    try {
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
      }
    } catch (e) {
      console.warn('Stats endpoint not available:', e.message);
    }

    // Handle activity response safely
    let activityData = {};
    try {
      if (activityResponse.ok) {
        activityData = await activityResponse.json();
      }
    } catch (e) {
      console.warn('Activity feed endpoint not available, will use breakdown data fallback');
    }
    
    // Calculate stats
    const activeBreakdowns = breakdownsData.breakdowns ? 
      breakdownsData.breakdowns.filter(b => 
        ['active', 'pending', 'in_progress', 'received', 'acknowledged', 'dispatched', 'on_site'].includes(b.status)
      ).length : 0;
    
    const todayTotal = statsData.total || 0;
    
    // Calculate average response time from breakdowns
    let totalResponseTime = 0;
    let responseCount = 0;
    
    if (breakdownsData.breakdowns) {
      breakdownsData.breakdowns.forEach(breakdown => {
        if (breakdown.acknowledged_at && breakdown.received_at) {
          const responseTime = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / (1000 * 60); // in minutes
          totalResponseTime += responseTime;
          responseCount++;
        }
      });
    }
    
    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    
    // Calculate fleet health (100 minus percentage of vehicles with active breakdowns)
    const fleetHealth = 100; // This would need vehicle data to calculate properly
    
    // Parse additional data sources (with error handling)
    let engineeringData = {};
    let analyticsData = {};
    let wizardData = {};
    let authData = {};

    try {
      if (engineeringResponse.ok) {
        engineeringData = await engineeringResponse.json();
      }
    } catch (e) {
      console.warn('Engineering data not available:', e.message);
    }

    try {
      if (analyticsResponse.ok) {
        analyticsData = await analyticsResponse.json();
      }
    } catch (e) {
      console.warn('Analytics data not available:', e.message);
    }

    try {
      if (wizardResponse.ok) {
        wizardData = await wizardResponse.json();
      }
    } catch (e) {
      console.warn('Wizard data not available:', e.message);
    }

    try {
      if (authResponse.ok) {
        authData = await authResponse.json();
      }
    } catch (e) {
      console.warn('Auth data not available:', e.message);
    }

    // Aggregate all activities from different sources
    let activities = [];

    // 1. Core breakdown activities (highest priority)
    if (activityData.success && activityData.activities) {
      console.log('✅ Using enhanced activity feed from API');
      activities.push(...activityData.activities.map(activity => ({
        ...activity,
        source: 'breakdowns',
        priority: 1
      })));
    } else {
      console.log('📋 Enhanced activity feed not available, using breakdown data fallback');
      // Always ensure we have breakdown activities even if enhanced endpoints fail
      if (breakdownsData.breakdowns) {
        const fallbackActivities = breakdownsData.breakdowns
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10)
          .map(breakdown => {
            let icon = '⚠️';
            let severity = 'normal';

            if (breakdown.severity === 'STOP' || breakdown.criticality === 'critical') {
              icon = '🚨';
              severity = 'critical';
            } else if (breakdown.severity === 'AMBER') {
              icon = '⚡';
              severity = 'warning';
            }

            const time = formatTimeFromTimestamp(breakdown.created_at);
            let message = `${breakdown.supervisor_name || 'Supervisor'} reported ${breakdown.issue_category || 'breakdown'} on ${breakdown.fleet_no || 'vehicle'}`;

            if (breakdown.location || breakdown.location_description) {
              message += ` at ${breakdown.location || breakdown.location_description}`;
            }

            return {
              id: breakdown.id || breakdown.breakdown_id,
              icon,
              message,
              time,
              timestamp: breakdown.created_at,
              depot: breakdown.depot_id || 'Unknown',
              decision: breakdown.wizard_decision || breakdown.severity,
              severity,
              source: 'breakdowns-fallback',
              priority: 1
            };
          });

        activities.push(...fallbackActivities);
      }
    }

    // 2. Engineering dashboard activities
    if (engineeringData.depots) {
      engineeringData.depots.forEach(depot => {
        if (depot.recent_assignments && depot.recent_assignments.length > 0) {
          depot.recent_assignments.forEach(assignment => {
            activities.push({
              id: `eng-assign-${assignment.id}`,
              type: 'engineer_assignment',
              icon: '👷',
              message: `Engineer ${assignment.engineer_name} assigned to ${assignment.fleet_no} at ${depot.name}`,
              time: formatTimeFromTimestamp(assignment.assigned_at),
              timestamp: assignment.assigned_at,
              depot: depot.code,
              severity: 'info',
              source: 'engineering',
              priority: 2,
              data: { depot: depot.name, engineer: assignment.engineer_name, vehicle: assignment.fleet_no }
            });
          });
        }

        if (depot.performance_alerts && depot.performance_alerts.length > 0) {
          depot.performance_alerts.forEach(alert => {
            activities.push({
              id: `eng-alert-${alert.id}`,
              type: 'performance_alert',
              icon: alert.severity === 'critical' ? '🚨' : '⚠️',
              message: `Performance alert: ${alert.message} (${depot.name})`,
              time: formatTimeFromTimestamp(alert.created_at),
              timestamp: alert.created_at,
              depot: depot.code,
              severity: alert.severity || 'warning',
              source: 'engineering',
              priority: 2,
              data: { depot: depot.name, alert_type: alert.type }
            });
          });
        }
      });
    }

    // 3. Analytics/Management dashboard activities
    if (analyticsData.kpis) {
      // Add KPI threshold breaches
      Object.entries(analyticsData.kpis).forEach(([kpiName, kpiData]) => {
        if (kpiData.threshold_breached) {
          activities.push({
            id: `kpi-breach-${kpiName}-${Date.now()}`,
            type: 'kpi_threshold_breach',
            icon: '📊',
            message: `KPI Alert: ${kpiName} ${kpiData.trend === 'up' ? 'exceeded' : 'below'} threshold (${kpiData.value})`,
            time: formatTimeFromTimestamp(kpiData.updated_at || new Date().toISOString()),
            timestamp: kpiData.updated_at || new Date().toISOString(),
            severity: kpiData.severity || 'warning',
            source: 'analytics',
            priority: 3,
            data: { kpi: kpiName, value: kpiData.value, threshold: kpiData.threshold }
          });
        }
      });
    }

    // 4. Wizard assessment activities
    if (wizardData.assessments && wizardData.assessments.length > 0) {
      wizardData.assessments.forEach(assessment => {
        activities.push({
          id: `wizard-${assessment.id}`,
          type: 'wizard_assessment',
          icon: assessment.decision === 'STOP' ? '🛑' : assessment.decision === 'AMBER' ? '⚡' : '✅',
          message: `${assessment.wizard_type} assessment: ${assessment.decision} for ${assessment.fleet_no}`,
          time: formatTimeFromTimestamp(assessment.completed_at),
          timestamp: assessment.completed_at,
          severity: assessment.decision === 'STOP' ? 'critical' : assessment.decision === 'AMBER' ? 'warning' : 'normal',
          source: 'wizards',
          priority: 2,
          data: { wizard_type: assessment.wizard_type, decision: assessment.decision, vehicle: assessment.fleet_no }
        });
      });
    }

    // 5. Authentication/Supervisor activities
    if (authData.sessions && authData.sessions.length > 0) {
      authData.sessions.forEach(session => {
        if (session.status === 'login') {
          activities.push({
            id: `auth-login-${session.id}`,
            type: 'supervisor_login',
            icon: '👤',
            message: `${session.supervisor_name} logged in (${session.depot})`,
            time: formatTimeFromTimestamp(session.created_at),
            timestamp: session.created_at,
            depot: session.depot,
            severity: 'info',
            source: 'auth',
            priority: 4,
            data: { supervisor: session.supervisor_name, badge: session.supervisor_badge }
          });
        }
      });
    }

    // Additional activities will be added above if enhanced endpoints are available

    // Sort activities by priority and timestamp, then limit to most recent 25
    activities.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then sort by timestamp (newer first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Take top 25 activities for performance
    activities = activities.slice(0, 25);
    
    return {
      stats: {
        activeBreakdowns,
        todayTotal,
        avgResponseTime,
        fleetHealth
      },
      activityFeed: activities,
      metadata: {
        sources: {
          breakdowns: breakdownsData.success !== false,
          activity: activityData.success === true,
          engineering: engineeringResponse?.ok === true,
          analytics: analyticsResponse?.ok === true,
          wizards: wizardResponse?.ok === true,
          auth: authResponse?.ok === true
        },
        totalActivities: activities.length,
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error fetching comprehensive dashboard data:', error);
    // Return safe defaults on error with fallback activity feed
    return {
      stats: {
        activeBreakdowns: 0,
        todayTotal: 0,
        avgResponseTime: 0,
        fleetHealth: 100
      },
      activityFeed: [{
        id: 'error-fallback',
        icon: '⚠️',
        message: 'Unable to load recent activities - check connection',
        time: 'Now',
        timestamp: new Date().toISOString(),
        severity: 'warning',
        source: 'error',
        priority: 1
      }],
      metadata: {
        sources: {
          breakdowns: false,
          activity: false,
          engineering: false,
          analytics: false,
          wizards: false,
          auth: false
        },
        totalActivities: 1,
        lastUpdated: new Date().toISOString(),
        error: error.message
      }
    };
  }
}

// Helper function to format timestamps consistently
function formatTimeFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  } else {
    return date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
