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
      activities.push({
        id: `breakdown-${breakdown.id}`,
        type: 'breakdown_created',
        icon: getSeverityIcon(breakdown.severity),
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
        issue_type: breakdown.issue_category
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

export default router;
