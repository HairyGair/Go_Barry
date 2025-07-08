// Dashboard Activity API - Live feed for Disruptions Centre
// Aggregates activities from multiple sources for dashboard display

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/dashboard/activity - Get recent activity for dashboard
router.get('/activity', async (req, res) => {
  try {
    const { limit = 10, hours = 24 } = req.query;
    
    // Calculate time window
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours));
    
    // Fetch recent activity logs
    const { data: activityLogs, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .gte('created_at', hoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) * 2); // Get more than we need for filtering
    
    if (activityError) {
      console.error('Error fetching activity logs:', activityError);
    }
    
    // Fetch recent roadwork status transitions
    const { data: roadworkTransitions, error: transitionError } = await supabase
      .from('roadwork_status_transitions')
      .select('*')
      .gte('created_at', hoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (transitionError) {
      console.error('Error fetching roadwork transitions:', transitionError);
    }
    
    // Process and format activities
    const activities = [];
    
    // Process activity logs
    (activityLogs || []).forEach(log => {
      const activity = formatActivityLog(log);
      if (activity) {
        activities.push(activity);
      }
    });
    
    // Process roadwork transitions
    (roadworkTransitions || []).forEach(transition => {
      const activity = formatRoadworkTransition(transition);
      if (activity) {
        activities.push(activity);
      }
    });
    
    // Sort by timestamp and limit results
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedActivities,
      count: limitedActivities.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dashboard activity API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard activity',
      data: []
    });
  }
});

// Helper function to format activity logs
function formatActivityLog(log) {
  const { action, details, supervisor_name, created_at, screen_type } = log;
  
  // Skip certain noisy actions
  const skipActions = ['display_screen_viewed', 'session_heartbeat', 'data_refresh'];
  if (skipActions.some(skip => action.toLowerCase().includes(skip))) {
    return null;
  }
  
  let description, icon, color, type;
  
  switch (action.toLowerCase()) {
    case 'supervisor_login':
      description = `${supervisor_name} logged in`;
      icon = 'login';
      color = '#10b981';
      type = 'auth';
      break;
      
    case 'supervisor_logout':
      description = `${supervisor_name} logged out`;
      icon = 'logout';
      color = '#6b7280';
      type = 'auth';
      break;
      
    case 'roadwork_acknowledged':
      const location = details?.location || details?.street_name || 'Unknown location';
      description = `${supervisor_name} acknowledged roadwork: ${location}`;
      icon = 'road-variant';
      color = '#3b82f6';
      type = 'roadwork';
      break;
      
    case 'diversion_plan_created':
      const route = details?.route || 'Unknown route';
      description = `${supervisor_name} created diversion plan for route ${route}`;
      icon = 'map-marker-path';
      color = '#8b5cf6';
      type = 'diversion';
      break;
      
    case 'alert_dismissed':
      const alertType = details?.alert_type || 'alert';
      description = `${supervisor_name} dismissed ${alertType}`;
      icon = 'bell-off';
      color = '#f59e0b';
      type = 'alert';
      break;
      
    case 'driver_notification_sent':
      const notificationType = details?.type || 'notification';
      description = `${supervisor_name} sent ${notificationType} to drivers`;
      icon = 'account-voice';
      color = '#06b6d4';
      type = 'communication';
      break;
      
    case 'emergency_alert_created':
      description = `${supervisor_name} created emergency alert`;
      icon = 'alert-octagon';
      color = '#ef4444';
      type = 'emergency';
      break;
      
    case 'roadwork_reviewed':
      const status = details?.status || 'reviewed';
      const workLocation = details?.location || 'roadwork';
      description = `${supervisor_name} ${status} ${workLocation}`;
      icon = status === 'approved' ? 'check-circle' : status === 'rejected' ? 'close-circle' : 'eye';
      color = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
      type = 'review';
      break;
      
    default:
      // Generic activity
      description = `${supervisor_name}: ${action.replace(/_/g, ' ')}`;
      icon = 'account-circle';
      color = '#6b7280';
      type = 'general';
  }
  
  return {
    id: `activity_${log.id || Date.now()}`,
    timestamp: created_at,
    description,
    icon,
    color,
    type,
    supervisor: supervisor_name,
    details: details || {},
    source: 'activity_log'
  };
}

// Helper function to format roadwork transitions
function formatRoadworkTransition(transition) {
  const { 
    from_status, 
    to_status, 
    triggered_by, 
    created_at, 
    roadwork_id,
    transition_reason 
  } = transition;
  
  let description, icon, color;
  
  switch (to_status) {
    case 'approved':
      description = `${triggered_by} approved roadwork #${roadwork_id}`;
      icon = 'check-circle';
      color = '#10b981';
      break;
      
    case 'rejected':
      description = `${triggered_by} rejected roadwork #${roadwork_id}`;
      icon = 'close-circle';
      color = '#ef4444';
      break;
      
    case 'monitoring':
      description = `${triggered_by} set roadwork #${roadwork_id} for monitoring`;
      icon = 'eye';
      color = '#f59e0b';
      break;
      
    case 'active':
      description = `Roadwork #${roadwork_id} is now active`;
      icon = 'play-circle';
      color = '#3b82f6';
      break;
      
    case 'completed':
      description = `Roadwork #${roadwork_id} completed`;
      icon = 'check-circle-outline';
      color = '#10b981';
      break;
      
    default:
      description = `Roadwork #${roadwork_id} status: ${from_status} → ${to_status}`;
      icon = 'arrow-right-circle';
      color = '#6b7280';
  }
  
  return {
    id: `transition_${transition.id || Date.now()}`,
    timestamp: created_at,
    description,
    icon,
    color,
    type: 'roadwork_transition',
    supervisor: triggered_by,
    details: {
      roadwork_id,
      from_status,
      to_status,
      reason: transition_reason
    },
    source: 'roadwork_transition'
  };
}

// Helper function to calculate relative time
function getRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / 1000 / 60);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
}

export default router;