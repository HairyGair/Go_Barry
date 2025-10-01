/*
 * Enhanced Breakdown Tracker API V2
 * Complete backend for breakdown lifecycle tracking
 * Mock implementation with in-memory storage for development
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage (replace with Supabase in production)
const breakdownsDB = new Map();
const eventsDB = new Map();
let dailyCounter = 0;
let lastResetDate = new Date().toDateString();

// Helper functions
function formatLocationDisplay(breakdown) {
  if (!breakdown.location) return '📍 Location unknown';
  
  if (breakdown.location_verified && breakdown.location_type === 'depot') {
    return `🏢 ${breakdown.location} ✓`;
  } else if (breakdown.location_verified && breakdown.location_type === 'bus_station') {
    return `🚏 ${breakdown.location} ✓`;
  } else if (breakdown.location_type === 'route') {
    return `🚌 ${breakdown.location} (On Route)`;
  } else if (breakdown.location_w3w) {
    return `📍 ${breakdown.location} (///${breakdown.location_w3w})`;
  } else if (breakdown.location_verified) {
    return `📍 ${breakdown.location} ✓`;
  } else {
    return `📍 ${breakdown.location}`;
  }
}

function getMinutesSince(timestamp) {
  if (!timestamp) return null;
  const diff = Date.now() - new Date(timestamp).getTime();
  return Math.floor(diff / 60000);
}

// Reset daily counter
function resetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyCounter = 0;
    lastResetDate = today;
  }
}

// Generate sequential breakdown ID
function generateBreakdownId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999);
  return `BD-${year}-${String(random).padStart(5, '0')}`;
}

// Get next daily ID
function getNextDailyId() {
  resetDailyCounter();
  dailyCounter++;
  return dailyCounter;
}

// Check for repeat breakdowns
function checkRepeatBreakdown(fleetNumber) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentBreakdowns = Array.from(breakdownsDB.values()).filter(b =>
    b.fleet_no === fleetNumber &&
    new Date(b.created_at) >= sevenDaysAgo
  );
  
  return {
    isRepeat: recentBreakdowns.length > 0,
    count: recentBreakdowns.length,
    previousBreakdownId: recentBreakdowns.length > 0 ? recentBreakdowns[0].breakdown_id : null,
    shouldFlag: recentBreakdowns.length >= 3
  };
}

// ROUTES

// Start new breakdown
router.post('/start', async (req, res) => {
  try {
    const {
      fleet_number,
      supervisor_badge,
      supervisor_name,
      location,
      location_coords,
      location_w3w,
      location_type,
      location_accuracy,
      depot_id,
      route_number,
      wizard_type
    } = req.body;

    const breakdownId = generateBreakdownId();
    const dailyId = getNextDailyId();
    const now = new Date().toISOString();
    
    // Check for repeat breakdowns
    const repeatCheck = checkRepeatBreakdown(fleet_number);
    
    // Create breakdown record
    const breakdown = {
      breakdown_id: breakdownId,
      daily_id: dailyId,
      fleet_no: fleet_number,
      supervisor_badge,
      supervisor_name,
      location,
      location_coords,
      location_w3w,
      location_type,
      location_accuracy,
      depot_id: depot_id || 'Washington',
      route_id: route_number,
      wizard_type: wizard_type || 'general',
      status: 'received',
      created_at: now,
      updated_at: now,
      repeat_breakdown: repeatCheck.isRepeat,
      previous_breakdown_id: repeatCheck.previousBreakdownId,
      is_priority: route_number && ['X10', 'X21'].includes(route_number),
      wizard_steps: [{
        type: 'wizard_opened',
        timestamp: now,
        data: { wizard_type: wizard_type || 'general', fleet_number }
      }]
    };
    
    breakdownsDB.set(breakdownId, breakdown);
    
    res.json({
      success: true,
      breakdown_id: breakdownId,
      daily_id: dailyId,
      message: 'Breakdown started successfully',
      data: {
        breakdown_id: breakdownId,
        daily_id: dailyId,
        fleet_number,
        supervisor_badge,
        supervisor_name,
        depot_id: depot_id || 'Washington',
        repeat_warning: repeatCheck.shouldFlag ? 
          `⚠️ Fleet ${fleet_number} has broken down ${repeatCheck.count} times in 7 days` : null
      }
    });
  } catch (error) {
    console.error('Error starting breakdown:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update location
router.put('/location/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      location, 
      location_coords, 
      location_w3w,
      location_type,
      location_accuracy,
      location_verified,
      updated_by,
      timestamp 
    } = req.body;
    
    const breakdown = breakdownsDB.get(id);
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }
    
    // Update location
    Object.assign(breakdown, {
      location,
      location_coords,
      location_w3w,
      location_type,
      location_accuracy,
      location_verified: location_verified || false,
      location_updated_at: timestamp || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    breakdownsDB.set(id, breakdown);
    
    // Log event
    const event = {
      breakdown_id: id,
      event_type: 'location_updated',
      occurred_at: timestamp || new Date().toISOString(),
      by_badge: updated_by || 'SYSTEM',
      notes: JSON.stringify({
        new_location: location,
        type: location_type,
        verified: location_verified,
        has_coords: !!location_coords,
        has_w3w: !!location_w3w
      })
    };
    
    eventsDB.set(uuidv4(), event);
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: breakdown
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Log wizard step
router.post('/step', async (req, res) => {
  try {
    const {
      breakdown_id,
      step_type,
      step_data,
      timestamp
    } = req.body;

    const breakdown = breakdownsDB.get(breakdown_id);
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Add new step
    if (!breakdown.wizard_steps) breakdown.wizard_steps = [];
    breakdown.wizard_steps.push({
      type: step_type,
      timestamp: timestamp || new Date().toISOString(),
      data: step_data || {}
    });
    
    breakdown.updated_at = new Date().toISOString();
    breakdownsDB.set(breakdown_id, breakdown);

    res.json({
      success: true,
      message: 'Step logged successfully',
      total_steps: breakdown.wizard_steps.length
    });
  } catch (error) {
    console.error('Error logging step:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark as diagnosed
router.post('/diagnose', async (req, res) => {
  try {
    const {
      breakdown_id,
      diagnosis,
      severity,
      passenger_cloud_required
    } = req.body;

    const breakdown = breakdownsDB.get(breakdown_id);
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    const diagnosedAt = new Date().toISOString();
    
    Object.assign(breakdown, {
      status: 'decision',
      diagnosed_at: diagnosedAt,
      diagnosis,
      severity: severity || 'AMBER',
      passenger_cloud_used: passenger_cloud_required || false,
      updated_at: diagnosedAt
    });
    
    breakdownsDB.set(breakdown_id, breakdown);

    res.json({
      success: true,
      message: 'Breakdown diagnosed - timer started',
      diagnosed_at: diagnosedAt
    });
  } catch (error) {
    console.error('Error in diagnose:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Resolve breakdown
router.put('/:breakdown_id/resolve', async (req, res) => {
  try {
    const { breakdown_id } = req.params;
    const {
      resolution_notes,
      resolving_supervisor,
      returned_to_service
    } = req.body;

    const breakdown = breakdownsDB.get(breakdown_id);
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    const resolvedAt = new Date().toISOString();
    
    Object.assign(breakdown, {
      status: 'cleared',
      resolved_at: resolvedAt,
      resolution_notes,
      resolving_supervisor,
      returned_to_service_at: returned_to_service ? resolvedAt : null,
      updated_at: resolvedAt
    });
    
    if (breakdown.created_at) {
      breakdown.total_duration_minutes = getMinutesSince(breakdown.created_at);
    }
    
    breakdownsDB.set(breakdown_id, breakdown);

    res.json({
      success: true,
      message: 'Breakdown resolved',
      resolved_at: resolvedAt
    });
  } catch (error) {
    console.error('Error resolving breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get live/active breakdowns
router.get('/live', async (req, res) => {
  try {
    const now = new Date();
    const activeBreakdowns = Array.from(breakdownsDB.values())
      .filter(b => b.status !== 'cleared' && !b.archived)
      .map(breakdown => {
        const minutesSinceStart = getMinutesSince(breakdown.created_at);
        const minutesSinceDiagnosis = breakdown.diagnosed_at ? 
          getMinutesSince(breakdown.diagnosed_at) : null;
        
        return {
          ...breakdown,
          minutes_since_start: minutesSinceStart,
          minutes_since_diagnosis: minutesSinceDiagnosis,
          location_display: formatLocationDisplay(breakdown),
          has_precise_location: !!(breakdown.location_coords || breakdown.location_w3w),
          maps_url: breakdown.location_coords ? 
            `https://www.google.com/maps?q=${breakdown.location_coords.lat},${breakdown.location_coords.lng}` : null,
          w3w_url: breakdown.location_w3w ? 
            `https://w3w.co/${breakdown.location_w3w}` : null
        };
      });

    res.json({
      success: true,
      breakdowns: activeBreakdowns,
      total: activeBreakdowns.length
    });
  } catch (error) {
    console.error('Error in live breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get today's breakdowns
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBreakdowns = Array.from(breakdownsDB.values())
      .filter(b => new Date(b.created_at) >= today)
      .sort((a, b) => a.daily_id - b.daily_id);

    res.json({
      success: true,
      breakdowns: todayBreakdowns,
      total: todayBreakdowns.length
    });
  } catch (error) {
    console.error('Error in today\'s breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get fleet history
router.get('/fleet/:fleetNumber/history', async (req, res) => {
  try {
    const { fleetNumber } = req.params;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const history = Array.from(breakdownsDB.values())
      .filter(b => 
        b.fleet_no === fleetNumber &&
        new Date(b.created_at) >= sevenDaysAgo
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      fleet_number: fleetNumber,
      breakdowns: history,
      count: history.length,
      should_flag: history.length >= 3
    });
  } catch (error) {
    console.error('Error in fleet history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get breakdown statistics
router.get('/stats', async (req, res) => {
  try {
    const breakdowns = Array.from(breakdownsDB.values());
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const thirtyMinsAgo = new Date(now - 30 * 60 * 1000);
    
    const stats = {
      active: breakdowns.filter(b => b.status !== 'cleared' && !b.archived).length,
      today: breakdowns.filter(b => new Date(b.created_at) >= todayStart).length,
      overdue: breakdowns.filter(b => 
        b.status === 'decision' && 
        b.diagnosed_at && 
        new Date(b.diagnosed_at) <= thirtyMinsAgo
      ).length,
      critical: breakdowns.filter(b => 
        b.severity === 'STOP' && 
        b.status !== 'cleared'
      ).length,
      demo_mode: true // Indicate this is mock data
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.json({
      active: 0,
      today: 0,
      overdue: 0,
      critical: 0,
      demo_mode: true,
      error: error.message
    });
  }
});

// Get breakdown hotspots
router.get('/hotspots', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    
    const breakdowns = Array.from(breakdownsDB.values())
      .filter(b => 
        b.location_coords &&
        new Date(b.created_at) >= startDate
      );
    
    // Group by location grid
    const hotspots = {};
    
    breakdowns.forEach(breakdown => {
      if (breakdown.location_coords) {
        const lat = breakdown.location_coords.lat || breakdown.location_coords.latitude;
        const lng = breakdown.location_coords.lng || breakdown.location_coords.longitude;
        
        if (lat && lng) {
          const gridKey = `${Math.round(lat * 1000) / 1000},${Math.round(lng * 1000) / 1000}`;
          
          if (!hotspots[gridKey]) {
            hotspots[gridKey] = {
              center: { lat, lng },
              count: 0,
              locations: [],
              fleet_numbers: []
            };
          }
          
          hotspots[gridKey].count++;
          if (!hotspots[gridKey].locations.includes(breakdown.location)) {
            hotspots[gridKey].locations.push(breakdown.location);
          }
          if (!hotspots[gridKey].fleet_numbers.includes(breakdown.fleet_no)) {
            hotspots[gridKey].fleet_numbers.push(breakdown.fleet_no);
          }
        }
      }
    });
    
    const hotspotArray = Object.entries(hotspots)
      .map(([key, data]) => ({
        ...data,
        gridKey: key,
        maps_url: `https://www.google.com/maps?q=${data.center.lat},${data.center.lng}`,
        severity: data.count >= 5 ? 'high' : data.count >= 3 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    res.json({
      success: true,
      hotspots: hotspotArray,
      period_days: daysNum,
      total_breakdowns: breakdowns.length,
      unique_locations: Object.keys(hotspots).length
    });
  } catch (error) {
    console.error('Error in hotspots:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete breakdown (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisor_badge, reason } = req.body;

    // Check if admin
    if (!['AG003', 'BP009'].includes(supervisor_badge)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const breakdown = breakdownsDB.get(id);
    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Soft delete
    breakdown.archived = true;
    breakdown.archived_at = new Date().toISOString();
    breakdown.resolution_notes = `Deleted by ${supervisor_badge}: ${reason || 'No reason provided'}`;
    breakdownsDB.set(id, breakdown);

    res.json({
      success: true,
      message: 'Breakdown archived successfully'
    });
  } catch (error) {
    console.error('Error deleting breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get active breakdowns (alias for live)
router.get('/active', async (req, res) => {
  return router.handle(req, res, () => router.get('/live')(req, res));
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Breakdown Tracker V2 is working',
    timestamp: new Date().toISOString(),
    breakdown_count: breakdownsDB.size
  });
});

export default router;
