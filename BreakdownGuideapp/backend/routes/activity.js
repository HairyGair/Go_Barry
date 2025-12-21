import express from 'express';
import { from, query } from '../utils/queryHelpers.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// GET /api/activity/feed - Get unified activity feed from activities table
router.get('/feed', async (req, res) => {
  try {
    const { limit = 50, offset = 0, depot, actor_id, activity_type, severity, source, duty_code } = req.query;

    // Use the new activity logger service
    const result = await activityLogger.getRecentActivities(parseInt(limit), parseInt(offset), {
      depot,
      actorId: actor_id,
      activityType: activity_type,
      severity,
      source,
      dutyCode: duty_code
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        activities: []
      });
    }

    // Format activities for frontend compatibility
    const formattedActivities = result.activities.map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      icon: activity.icon,
      message: activity.message,
      time: formatTimeAgo(activity.created_at),
      timestamp: activity.created_at,
      depot: activity.depot,
      supervisor: activity.actor_name,
      supervisor_badge: activity.actor_id,
      decision: activity.metadata?.decision,
      severity: activity.severity,
      breakdown_id: activity.entity_id,
      fleet_no: activity.entity_details?.fleetNo,
      location: activity.entity_details?.location,
      source: activity.source,
      priority: activity.priority,
      actor_type: activity.actor_type,
      metadata: activity.metadata,
      // Include duty context for shift-based filtering
      duty_code: activity.metadata?.duty_code || activity.entity_details?.duty_code || null,
      duty_name: activity.metadata?.duty_name || activity.entity_details?.duty_name || null
    }));

    res.json({
      success: true,
      activities: formattedActivities,
      count: result.count,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'unified_activities_table',
        filters: { depot, actor_id, activity_type, severity, source, duty_code }
      }
    });

  } catch (error) {
    console.error('Error fetching unified activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
      activities: []
    });
  }
});

// GET /api/activity/feed/legacy - Legacy activity feed from breakdowns table (fallback)
router.get('/feed/legacy', async (req, res) => {
  try {
    const { limit = 20, offset = 0, depot } = req.query;

    // Get recent breakdowns with supervisor info
    let breakdownQuery = from('breakdowns')
      .select('*')
      .order('created_at', 'DESC')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (depot) {
      breakdownQuery = breakdownQuery.eq('depot', depot);
    }

    const { data: breakdowns, error: breakdownError } = await breakdownQuery.execute();
    if (breakdownError) throw breakdownError;
    
    // Get recent breakdown events with JOIN to breakdowns table
    const eventsSql = `
      SELECT
        be.*,
        b.breakdown_id,
        b.fleet_no,
        b.issue_category,
        b.location_description,
        b.supervisor_name,
        b.depot
      FROM breakdown_events be
      LEFT JOIN breakdowns b ON be.breakdown_id = b.breakdown_id
      ORDER BY be.created_at DESC
      LIMIT ?
    `;

    let events = [];
    let eventsError = null;
    try {
      events = await query(eventsSql, [parseInt(limit)]);
    } catch (error) {
      eventsError = error;
    }
    
    // Combine and format activities
    const activities = [];
    
    // Add breakdown creation activities
    (breakdowns || []).forEach(breakdown => {
      const isWizardBreakdown = breakdown.breakdown_source === 'wizard' || breakdown.wizard_type;

      activities.push({
        id: `breakdown-${breakdown.id}`,
        type: isWizardBreakdown ? 'breakdown_guide_assessment' : 'breakdown_created',
        icon: getBreakdownIcon(breakdown),
        message: formatBreakdownMessage(breakdown),
        time: new Date(breakdown.created_at).toLocaleString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: breakdown.created_at,
        depot: breakdown.depot,
        supervisor: breakdown.supervisor_name,
        supervisor_badge: breakdown.supervisor_badge,
        decision: breakdown.wizard_decision || breakdown.severity,
        severity: getSeverityClass(breakdown.severity),
        breakdown_id: breakdown.breakdown_id,
        fleet_no: breakdown.fleet_no,
        location: breakdown.location_description,
        issue_type: breakdown.issue_category,
        wizard_type: breakdown.wizard_type,
        wizard_data: breakdown.wizard_assessment_data,
        is_guide_assessment: isWizardBreakdown
      });
    });
    
    // Add breakdown events as activities
    if (events && !eventsError) {
      events.forEach(event => {
        const activity = formatEventActivity(event);
        if (activity) {
          activities.push(activity);
        }
      });
    }
    
    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);
    
    res.json({
      success: true,
      activities: limitedActivities,
      count: limitedActivities.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
      activities: []
    });
  }
});

// GET /api/activity/live - Get live activity stream from unified activities table
router.get('/live', async (req, res) => {
  try {
    const { since, limit = 25 } = req.query;
    const sinceTime = since || new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Last 5 minutes by default

    // Get activities from unified table since the specified time
    const { data: activities, error } = await from('activities')
      .select('*')
      .gte('created_at', sinceTime)
      .order('created_at', 'DESC')
      .limit(parseInt(limit))
      .execute();

    if (error) throw error;

    // Format activities for frontend
    const formattedActivities = (activities || []).map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      icon: activity.icon,
      message: activity.message,
      time: formatTimeAgo(activity.created_at),
      timestamp: activity.created_at,
      depot: activity.depot,
      supervisor: activity.actor_name,
      supervisor_badge: activity.actor_id,
      decision: activity.metadata?.decision,
      severity: activity.severity,
      priority: activity.priority,
      source: activity.source,
      metadata: activity.metadata,
      data: {
        breakdown_id: activity.entity_id,
        fleet_no: activity.entity_details?.fleetNo,
        location: activity.entity_details?.location,
        issue_type: activity.entity_details?.issueCategory
      }
    }));

    res.json({
      success: true,
      activities: formattedActivities,
      count: formattedActivities.length,
      since: sinceTime,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'unified_activities_table',
        real_time_ready: true
      }
    });

  } catch (error) {
    console.error('Error fetching live activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live activities',
      activities: []
    });
  }
});

// GET /api/activity/live/legacy - Legacy live activity stream (fallback)
router.get('/live/legacy', async (req, res) => {
  try {
    const { since } = req.query;
    const sinceTime = since || new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Last 5 minutes by default

    // Get recent breakdowns
    const { data: breakdowns, error: breakdownError } = await from('breakdowns')
      .select('*')
      .gte('created_at', sinceTime)
      .order('created_at', 'DESC')
      .execute();

    if (breakdownError) throw breakdownError;

    // Get recent events with JOIN
    const eventsSql = `
      SELECT
        be.*,
        b.breakdown_id,
        b.fleet_no,
        b.issue_category,
        b.location_description,
        b.supervisor_name,
        b.depot
      FROM breakdown_events be
      LEFT JOIN breakdowns b ON be.breakdown_id = b.breakdown_id
      WHERE be.created_at >= ?
      ORDER BY be.created_at DESC
    `;

    let events = [];
    let eventsError = null;
    try {
      events = await query(eventsSql, [sinceTime]);
    } catch (error) {
      eventsError = error;
    }
    
    // Format activities
    const activities = [];

    (breakdowns || []).forEach(breakdown => {
      activities.push({
        id: `breakdown-${breakdown.id}`,
        type: 'breakdown_created',
        icon: getSeverityIcon(breakdown.severity),
        message: formatBreakdownMessage(breakdown),
        time: formatTime(breakdown.created_at),
        timestamp: breakdown.created_at,
        depot: breakdown.depot,
        supervisor: breakdown.supervisor_name,
        decision: breakdown.wizard_decision || breakdown.severity,
        severity: getSeverityClass(breakdown.severity),
        data: {
          breakdown_id: breakdown.breakdown_id,
          fleet_no: breakdown.fleet_no,
          location: breakdown.location_description,
          issue_type: breakdown.issue_category
        }
      });
    });
    
    if (events && !eventsError) {
      events.forEach(event => {
        const activity = formatEventActivity(event);
        if (activity && new Date(activity.timestamp) >= new Date(sinceTime)) {
          activities.push(activity);
        }
      });
    }
    
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      activities,
      count: activities.length,
      since: sinceTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching live activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live activity',
      activities: []
    });
  }
});

// Helper functions
function getBreakdownIcon(breakdown) {
  // Special icons for breakdown guide assessments
  if (breakdown.breakdown_source === 'wizard' || breakdown.wizard_type) {
    switch (breakdown.wizard_decision || breakdown.severity) {
      case 'STOP':
        return '📋🚨'; // Guide assessment + critical
      case 'AMBER':
        return '📋⚡'; // Guide assessment + warning
      case 'CONTINUE':
        return '📋✅'; // Guide assessment + ok
      default:
        return '📋'; // Guide assessment
    }
  }

  // Fallback to severity icons
  return getSeverityIcon(breakdown.severity);
}

function getSeverityIcon(severity) {
  switch (severity) {
    case 'STOP':
    case 'critical':
      return '🚨';
    case 'AMBER':
    case 'warning':
      return '⚡';
    case 'CONTINUE':
    case 'normal':
      return '✅';
    default:
      return '⚠️';
  }
}

function getSeverityClass(severity) {
  switch (severity) {
    case 'STOP':
    case 'critical':
      return 'critical';
    case 'AMBER':
    case 'warning':
      return 'warning';
    case 'CONTINUE':
      return 'normal';
    default:
      return 'info';
  }
}

function formatBreakdownMessage(breakdown) {
  const supervisor = breakdown.supervisor_name || 'A supervisor';
  const vehicle = breakdown.fleet_no || 'a vehicle';
  const issue = breakdown.issue_category || 'an issue';
  const location = breakdown.location_description || breakdown.location;

  // Prioritize breakdown guide information
  if (breakdown.wizard_type && breakdown.wizard_decision) {
    let message = `${supervisor} completed ${breakdown.wizard_type} guide for ${vehicle}`;
    if (location) {
      message += ` at ${location}`;
    }
    message += ` - Decision: ${breakdown.wizard_decision}`;
    return message;
  }

  // Check if this came from breakdown guide (even without wizard_type)
  if (breakdown.breakdown_source === 'wizard' || breakdown.wizard_decision) {
    let message = `${supervisor} used Breakdown Guide for ${vehicle}`;
    if (issue !== 'an issue') {
      message += ` (${issue})`;
    }
    if (location) {
      message += ` at ${location}`;
    }
    if (breakdown.wizard_decision) {
      message += ` - Assessment: ${breakdown.wizard_decision}`;
    }
    return message;
  }

  // Fallback to standard breakdown message
  let message = `${supervisor} reported ${issue} on ${vehicle}`;

  if (location) {
    message += ` at ${location}`;
  }

  if (breakdown.wizard_decision) {
    message += ` - Decision: ${breakdown.wizard_decision}`;
  }

  return message;
}

function formatEventActivity(event) {
  if (!event) return null;
  
  const breakdown = event.breakdowns;
  const time = formatTime(event.created_at);
  
  let icon = '📝';
  let message = '';
  let severity = 'info';
  
  switch (event.event_type) {
    case 'wizard_assessment_completed':
      icon = '✅';
      message = `Assessment completed for ${breakdown?.fleet_no || 'vehicle'}`;
      severity = 'success';
      break;
      
    case 'engineer_assigned':
      icon = '👷';
      message = `Engineer assigned to ${breakdown?.fleet_no || 'breakdown'}`;
      severity = 'info';
      break;
      
    case 'engineer_dispatched':
      icon = '🚗';
      message = `Engineer dispatched to ${breakdown?.fleet_no || 'breakdown'}`;
      severity = 'warning';
      break;
      
    case 'engineer_on_site':
      icon = '🔧';
      message = `Engineer arrived at ${breakdown?.fleet_no || 'breakdown'}`;
      severity = 'info';
      break;
      
    case 'resolved':
      icon = '✔️';
      message = `Breakdown resolved for ${breakdown?.fleet_no || 'vehicle'}`;
      severity = 'success';
      break;
      
    case 'status_update':
      icon = '📊';
      const newStatus = event.event_data?.new_status || 'updated';
      message = `Status changed to ${newStatus} for ${breakdown?.fleet_no || 'vehicle'}`;
      severity = 'info';
      break;
      
    default:
      message = `${event.event_type} for ${breakdown?.fleet_no || 'vehicle'}`;
  }
  
  if (event.event_data?.supervisor_name) {
    message = `${event.event_data.supervisor_name}: ${message}`;
  }
  
  return {
    id: `event-${event.id}`,
    type: event.event_type,
    icon,
    message,
    time,
    timestamp: event.created_at,
    depot: breakdown?.depot || event.event_data?.depot,
    supervisor: event.event_data?.supervisor_name,
    severity,
    breakdown_id: event.breakdown_id,
    data: event.event_data
  };
}

function formatTime(timestamp) {
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

// GET /api/activity/breakdown-guide - Get breakdown guide specific activities
router.get('/breakdown-guide', async (req, res) => {
  try {
    const { limit = 20, offset = 0, supervisor_badge } = req.query;

    // Get breakdowns that were created through the wizard/guide
    let breakdownQuery = from('breakdowns')
      .select('*')
      .eq('breakdown_source', 'wizard')
      .order('created_at', 'DESC')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (supervisor_badge) {
      breakdownQuery = breakdownQuery.eq('supervisor_badge', supervisor_badge);
    }

    const { data: wizardBreakdowns, error: wizardError } = await breakdownQuery.execute();
    if (wizardError) throw wizardError;

    // Get wizard assessment events with JOIN
    const eventsSql = `
      SELECT
        be.*,
        b.breakdown_id,
        b.fleet_no,
        b.issue_category,
        b.location_description,
        b.supervisor_name,
        b.supervisor_badge,
        b.depot,
        b.wizard_type,
        b.wizard_decision
      FROM breakdown_events be
      LEFT JOIN breakdowns b ON be.breakdown_id = b.breakdown_id
      WHERE be.event_type = ?
      ORDER BY be.created_at DESC
      LIMIT ?
    `;

    let assessmentEvents = [];
    let eventsError = null;
    try {
      assessmentEvents = await query(eventsSql, ['wizard_assessment_completed', parseInt(limit)]);
    } catch (error) {
      eventsError = error;
    }

    const activities = [];

    // Add wizard breakdown activities
    (wizardBreakdowns || []).forEach(breakdown => {
      activities.push({
        id: `guide-assessment-${breakdown.id}`,
        type: 'breakdown_guide_completed',
        icon: '📋✅',
        message: formatGuideActivityMessage(breakdown),
        time: formatTime(breakdown.created_at),
        timestamp: breakdown.created_at,
        depot: breakdown.depot,
        supervisor: breakdown.supervisor_name,
        supervisor_badge: breakdown.supervisor_badge,
        decision: breakdown.wizard_decision,
        severity: 'success',
        breakdown_id: breakdown.breakdown_id,
        fleet_no: breakdown.fleet_no,
        location: breakdown.location_description,
        wizard_type: breakdown.wizard_type,
        guide_data: {
          assessment_type: breakdown.wizard_type,
          decision: breakdown.wizard_decision,
          issue_category: breakdown.issue_category,
          assessment_data: breakdown.wizard_assessment_data
        }
      });
    });

    // Add assessment events (breakdown data is now in same row due to JOIN)
    if (assessmentEvents && !eventsError) {
      assessmentEvents.forEach(event => {
        if (event.breakdown_id) {
          activities.push({
            id: `guide-event-${event.id}`,
            type: 'breakdown_guide_assessment',
            icon: '📋🔍',
            message: `${event.supervisor_name || 'Supervisor'} completed ${event.wizard_type || 'breakdown'} assessment for ${event.fleet_no || 'vehicle'}`,
            time: formatTime(event.created_at),
            timestamp: event.created_at,
            depot: event.depot,
            supervisor: event.supervisor_name,
            supervisor_badge: event.supervisor_badge,
            decision: event.wizard_decision,
            severity: 'info',
            breakdown_id: event.breakdown_id,
            wizard_type: event.wizard_type,
            guide_data: event.event_data
          });
        }
      });
    }

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      activities: limitedActivities,
      count: limitedActivities.length,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'breakdown_guide_activities',
        wizard_breakdowns: wizardBreakdowns.length,
        assessment_events: assessmentEvents ? assessmentEvents.length : 0
      }
    });

  } catch (error) {
    console.error('Error fetching breakdown guide activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdown guide activities',
      activities: []
    });
  }
});

// Helper function to format guide-specific activity messages
function formatGuideActivityMessage(breakdown) {
  const supervisor = breakdown.supervisor_name || 'Supervisor';
  const vehicle = breakdown.fleet_no || 'vehicle';
  const wizardType = breakdown.wizard_type || 'Breakdown Guide';
  const decision = breakdown.wizard_decision;
  const location = breakdown.location_description || breakdown.location;

  let message = `${supervisor} completed ${wizardType} assessment for ${vehicle}`;

  if (location) {
    message += ` at ${location}`;
  }

  if (decision) {
    message += ` - Result: ${decision}`;
  }

  return message;
}

// POST /api/activity/log - Log a new activity
router.post('/log', async (req, res) => {
  try {
    const {
      activityType,
      action,
      actorType,
      actorId,
      actorName,
      entityType,
      entityId,
      entityDetails = {},
      depot,
      severity = 'info',
      priority = 5,
      source,
      sourceUrl,
      metadata = {},
      icon,
      message
    } = req.body;

    // Validate required fields
    if (!activityType || !action || !actorType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityType, action, actorType'
      });
    }

    const result = await activityLogger.logActivity({
      activityType,
      action,
      actorType,
      actorId,
      actorName,
      entityType,
      entityId,
      entityDetails,
      depot,
      severity,
      priority,
      source,
      sourceUrl,
      metadata,
      icon,
      message
    });

    if (result) {
      res.json({
        success: true,
        activity: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to log activity'
      });
    }

  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/activity/batch - Log multiple activities in batch
router.post('/batch', async (req, res) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'activities must be a non-empty array'
      });
    }

    const results = await activityLogger.logActivities(activities);

    res.json({
      success: true,
      activities: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error batch logging activities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/activity/search - Search activities
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, limit = 20, offset = 0 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term (q) is required'
      });
    }

    const result = await activityLogger.searchActivities(searchTerm, parseInt(limit), parseInt(offset));

    res.json({
      success: result.success,
      activities: result.activities || [],
      count: result.count || 0,
      searchTerm: result.searchTerm,
      error: result.error
    });

  } catch (error) {
    console.error('Error searching activities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/activity/stats - Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = '24h', depot, actor_id } = req.query;

    let timeFilter;
    switch (period) {
      case '1h':
        timeFilter = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    let activitiesQuery = from('activities')
      .select('activity_type, severity, actor_type, depot, created_at')
      .gte('created_at', timeFilter);

    if (depot) {
      activitiesQuery = activitiesQuery.eq('depot', depot);
    }
    if (actor_id) {
      activitiesQuery = activitiesQuery.eq('actor_id', actor_id);
    }

    const { data: activities, error } = await activitiesQuery.execute();

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: activities?.length || 0,
      byType: {},
      bySeverity: { critical: 0, warning: 0, normal: 0, success: 0, info: 0 },
      byActorType: {},
      byDepot: {},
      byHour: Array(24).fill(0),
      period,
      timeFilter
    };

    (activities || []).forEach(activity => {
      // By type
      stats.byType[activity.activity_type] = (stats.byType[activity.activity_type] || 0) + 1;

      // By severity
      stats.bySeverity[activity.severity] = (stats.bySeverity[activity.severity] || 0) + 1;

      // By actor type
      stats.byActorType[activity.actor_type] = (stats.byActorType[activity.actor_type] || 0) + 1;

      // By depot
      if (activity.depot) {
        stats.byDepot[activity.depot] = (stats.byDepot[activity.depot] || 0) + 1;
      }

      // By hour
      const hour = new Date(activity.created_at).getHours();
      stats.byHour[hour]++;
    });

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/activity/:id - Delete a specific activity (for cleanup)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Activity ID is required'
      });
    }

    // First, get the activity to return in response
    const activitySql = 'SELECT * FROM activities WHERE id = ? LIMIT 1';
    const activities = await query(activitySql, [id]);

    if (!activities || activities.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    const deletedActivity = activities[0];

    // Delete the activity
    const deleteSql = 'DELETE FROM activities WHERE id = ?';
    await query(deleteSql, [id]);

    res.json({
      success: true,
      message: `Activity ${id} deleted successfully`,
      deleted_activity: deletedActivity
    });

  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to format time ago
function formatTimeAgo(timestamp) {
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
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export default router;
