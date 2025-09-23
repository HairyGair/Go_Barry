import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// GET /api/activity/feed - Get activity feed for all supervisors
router.get('/feed', async (req, res) => {
  try {
    const { limit = 20, offset = 0, depot } = req.query;
    
    // Get recent breakdowns with supervisor info
    let breakdownQuery = supabase
      .from('breakdowns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (depot) {
      breakdownQuery = breakdownQuery.eq('depot', depot);
    }
    
    const { data: breakdowns, error: breakdownError } = await breakdownQuery;
    if (breakdownError) throw breakdownError;
    
    // Get recent breakdown events
    let eventsQuery = supabase
      .from('breakdown_events')
      .select(`
        *,
        breakdowns!breakdown_id (
          breakdown_id,
          fleet_no,
          issue_category,
          location_description,
          supervisor_name,
          depot
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const { data: events, error: eventsError } = await eventsQuery;
    
    // Combine and format activities
    const activities = [];
    
    // Add breakdown creation activities
    breakdowns.forEach(breakdown => {
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

// GET /api/activity/live - Get live activity stream (polling endpoint)
router.get('/live', async (req, res) => {
  try {
    const { since } = req.query;
    const sinceTime = since || new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Last 5 minutes by default
    
    // Get recent breakdowns
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', sinceTime)
      .order('created_at', { ascending: false });
    
    if (breakdownError) throw breakdownError;
    
    // Get recent events
    const { data: events, error: eventsError } = await supabase
      .from('breakdown_events')
      .select(`
        *,
        breakdowns!breakdown_id (
          breakdown_id,
          fleet_no,
          issue_category,
          location_description,
          supervisor_name,
          depot
        )
      `)
      .gte('created_at', sinceTime)
      .order('created_at', { ascending: false });
    
    // Format activities
    const activities = [];
    
    breakdowns.forEach(breakdown => {
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
    let query = supabase
      .from('breakdowns')
      .select('*')
      .eq('breakdown_source', 'wizard')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (supervisor_badge) {
      query = query.eq('supervisor_badge', supervisor_badge);
    }

    const { data: wizardBreakdowns, error: wizardError } = await query;
    if (wizardError) throw wizardError;

    // Get wizard assessment events
    const { data: assessmentEvents, error: eventsError } = await supabase
      .from('breakdown_events')
      .select(`
        *,
        breakdowns!breakdown_id (
          breakdown_id,
          fleet_no,
          issue_category,
          location_description,
          supervisor_name,
          supervisor_badge,
          depot,
          wizard_type,
          wizard_decision
        )
      `)
      .eq('event_type', 'wizard_assessment_completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    const activities = [];

    // Add wizard breakdown activities
    wizardBreakdowns.forEach(breakdown => {
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

    // Add assessment events
    if (assessmentEvents && !eventsError) {
      assessmentEvents.forEach(event => {
        const breakdown = event.breakdowns;
        if (breakdown) {
          activities.push({
            id: `guide-event-${event.id}`,
            type: 'breakdown_guide_assessment',
            icon: '📋🔍',
            message: `${breakdown.supervisor_name || 'Supervisor'} completed ${breakdown.wizard_type || 'breakdown'} assessment for ${breakdown.fleet_no || 'vehicle'}`,
            time: formatTime(event.created_at),
            timestamp: event.created_at,
            depot: breakdown.depot,
            supervisor: breakdown.supervisor_name,
            supervisor_badge: breakdown.supervisor_badge,
            decision: breakdown.wizard_decision,
            severity: 'info',
            breakdown_id: breakdown.breakdown_id,
            wizard_type: breakdown.wizard_type,
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

export default router;
