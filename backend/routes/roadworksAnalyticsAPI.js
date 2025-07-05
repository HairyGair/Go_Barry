/**
 * Go Barry - Roadworks Analytics API
 * Provides analytics data for roadworks dashboard
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch roadworks data
    const { data: roadworks, error: roadworksError } = await supabase
      .from('streetworks')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (roadworksError) throw roadworksError;

    // Fetch supervisor actions
    const { data: actions, error: actionsError } = await supabase
      .from('supervisor_actions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (actionsError) throw actionsError;

    // Calculate analytics
    const analytics = {
      overview: {
        totalRoadworks: roadworks.length,
        avgResolutionTime: calculateAvgResolutionTime(roadworks),
        routesAffected: countAffectedRoutes(roadworks),
        diversionsCreated: roadworks.filter(r => r.diversion_required).length,
        supervisorActions: actions.length,
        dataQuality: calculateDataQuality(roadworks)
      },
      trends: {
        roadworksByDay: groupRoadworksByDay(roadworks, range),
        severityDistribution: calculateSeverityDistribution(roadworks),
        sourceBreakdown: calculateSourceBreakdown(roadworks),
        routeImpact: calculateRouteImpact(roadworks)
      },
      performance: {
        reviewSpeed: calculateReviewSpeed(roadworks),
        approvalRate: calculateApprovalRate(roadworks),
        diversionEffectiveness: 87, // Mock data
        supervisorActivity: calculateSupervisorActivity(actions)
      },
      predictions: {
        nextWeekVolume: predictNextWeekVolume(roadworks),
        criticalHotspots: identifyCriticalHotspots(roadworks),
        peakTimes: calculatePeakTimes(roadworks)
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Helper functions
function calculateAvgResolutionTime(roadworks) {
  const resolved = roadworks.filter(r => r.actual_end_date);
  if (resolved.length === 0) return 0;
  
  const totalHours = resolved.reduce((sum, r) => {
    const start = new Date(r.created_at);
    const end = new Date(r.actual_end_date);
    return sum + (end - start) / (1000 * 60 * 60);
  }, 0);
  
  return Math.round(totalHours / resolved.length);
}

function countAffectedRoutes(roadworks) {
  const routes = new Set();
  roadworks.forEach(r => {
    if (r.affected_routes) {
      r.affected_routes.forEach(route => routes.add(route));
    }
  });
  return routes.size;
}

function calculateDataQuality(roadworks) {
  const scores = roadworks.map(r => {
    let score = 0;
    if (r.description) score += 20;
    if (r.affected_routes?.length > 0) score += 20;
    if (r.coordinates) score += 20;
    if (r.severity) score += 20;
    if (r.estimated_end_date) score += 20;
    return score;
  });
  
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function groupRoadworksByDay(roadworks, range) {
  const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
  const result = [];
  
  for (let i = 0; i < Math.min(days, 7); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const count = roadworks.filter(r => {
      const created = new Date(r.created_at);
      return created >= dayStart && created <= dayEnd;
    }).length;
    
    result.unshift({
      label: dayStart.toLocaleDateString('en', { weekday: 'short' }),
      value: count
    });
  }
  
  return result;
}

function calculateSeverityDistribution(roadworks) {
  const severities = { critical: 0, high: 0, medium: 0, low: 0 };
  const colors = {
    critical: '#e74c3c',
    high: '#e67e22',
    medium: '#f39c12',
    low: '#27ae60'
  };
  
  roadworks.forEach(r => {
    if (severities[r.severity] !== undefined) {
      severities[r.severity]++;
    }
  });
  
  return Object.entries(severities).map(([severity, count]) => ({
    label: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
    color: colors[severity]
  }));
}

function calculateSourceBreakdown(roadworks) {
  const sources = {};
  
  roadworks.forEach(r => {
    const source = r.works_reference_number ? 'Street Manager' : 'Manual Entry';
    sources[source] = (sources[source] || 0) + 1;
  });
  
  return Object.entries(sources).map(([source, count]) => ({
    label: source,
    value: count,
    color: source === 'Street Manager' ? '#3498db' : '#9b59b6'
  }));
}

function calculateRouteImpact(roadworks) {
  const routeImpacts = {};
  
  roadworks.forEach(r => {
    if (r.affected_routes) {
      r.affected_routes.forEach(route => {
        if (!routeImpacts[route]) {
          routeImpacts[route] = {
            routeId: route,
            roadworksCount: 0,
            totalDuration: 0,
            impactScore: 0
          };
        }
        routeImpacts[route].roadworksCount++;
        
        // Calculate duration
        if (r.estimated_end_date) {
          const duration = (new Date(r.estimated_end_date) - new Date(r.created_at)) / (1000 * 60 * 60);
          routeImpacts[route].totalDuration += duration;
        }
      });
    }
  });
  
  // Calculate impact scores and averages
  return Object.values(routeImpacts).map(impact => {
    impact.avgDuration = Math.round(impact.totalDuration / impact.roadworksCount);
    impact.impactScore = Math.min(100, impact.roadworksCount * 10 + impact.avgDuration);
    impact.trend = Math.floor(Math.random() * 40) - 20; // Mock trend data
    return impact;
  }).sort((a, b) => b.impactScore - a.impactScore);
}

function calculateReviewSpeed(roadworks) {
  const reviewed = roadworks.filter(r => r.review_status === 'approved');
  const withinTwoHours = reviewed.filter(r => {
    const created = new Date(r.created_at);
    const reviewed = new Date(r.reviewed_at || r.updated_at);
    return (reviewed - created) <= (2 * 60 * 60 * 1000);
  });
  
  return reviewed.length > 0 ? Math.round((withinTwoHours.length / reviewed.length) * 100) : 0;
}

function calculateApprovalRate(roadworks) {
  const reviewed = roadworks.filter(r => r.review_status !== 'pending');
  const approved = roadworks.filter(r => r.review_status === 'approved');
  
  return reviewed.length > 0 ? Math.round((approved.length / reviewed.length) * 100) : 0;
}

function calculateSupervisorActivity(actions) {
  const supervisorStats = {};
  
  actions.forEach(action => {
    const name = action.supervisor_name || 'Unknown';
    if (!supervisorStats[name]) {
      supervisorStats[name] = {
        name,
        reviews: 0,
        totalTime: 0
      };
    }
    supervisorStats[name].reviews++;
  });
  
  return Object.values(supervisorStats).map(stat => ({
    ...stat,
    avgTime: Math.round(Math.random() * 10 + 5) // Mock average time
  })).sort((a, b) => b.reviews - a.reviews).slice(0, 6);
}

function predictNextWeekVolume(roadworks) {
  // Simple prediction based on recent trend
  const lastWeek = roadworks.filter(r => {
    const created = new Date(r.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;
  
  // Add some variation
  return Math.round(lastWeek * (0.9 + Math.random() * 0.2));
}

function identifyCriticalHotspots(roadworks) {
  const locations = {};
  
  roadworks.forEach(r => {
    if (r.severity === 'critical' || r.severity === 'high') {
      const location = r.street_name || r.location || 'Unknown';
      locations[location] = (locations[location] || 0) + 1;
    }
  });
  
  return Object.entries(locations)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function calculatePeakTimes(roadworks) {
  const hourCounts = {};
  const dayCounts = {};
  
  roadworks.forEach(r => {
    const created = new Date(r.created_at);
    const hour = created.getHours();
    const day = created.toLocaleDateString('en', { weekday: 'long' });
    
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  
  // Find peak hours
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return peakHours.map(([hour, count]) => ({
    day: 'Weekdays', // Simplified
    hour: `${hour}:00`,
    percentage: Math.round((count / roadworks.length) * 100)
  }));
}

export default router;