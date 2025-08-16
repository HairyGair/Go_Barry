// backend/routes/disruptionAPI.js
// API endpoints for the Disruption Database system

import express from 'express';
import axios from 'axios';

const router = express.Router();

// Helper function to get Supabase client
async function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return { supabaseUrl, supabaseKey };
}

// POST /api/disruptions/create - Create a new disruption record
router.post('/create', async (req, res) => {
  try {
    const {
      alert,
      pushedBy,
      pushedByName,
      reason,
      sessionId
    } = req.body;
    
    console.log(`📋 Creating disruption record for alert ${alert.id}`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    // Prepare disruption data
    const disruptionData = {
      alert_id: alert.id,
      alert_type: 'roadwork',
      status: 'Active',
      location: alert.location || alert.sm_street_name || 'Unknown location',
      street_name: alert.sm_street_name,
      town: alert.sm_town,
      highway_authority: alert.sm_highway_authority,
      coordinates: alert.coordinates,
      affected_routes: alert.affectedRoutes?.map(r => r.routeNumber) || [],
      pushed_by: pushedBy,
      pushed_by_name: pushedByName,
      pushed_reason: reason,
      original_alert_data: alert,
      notes: alert.sm_description || alert.sm_location_description
    };
    
    // Create disruption record
    const createResponse = await axios.post(
      `${supabaseUrl}/rest/v1/disruptions`,
      disruptionData,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    const disruption = createResponse.data[0];
    
    // Log the creation action
    if (disruption) {
      await axios.post(
        `${supabaseUrl}/rest/v1/rpc/log_disruption_action`,
        {
          p_disruption_id: disruption.id,
          p_action: 'CREATE',
          p_action_details: { reason, alert_id: alert.id },
          p_performed_by: pushedBy,
          p_performed_by_name: pushedByName,
          p_session_id: sessionId
        },
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`✅ Disruption created with ID: ${disruption?.id}`);
    
    res.json({
      success: true,
      disruption,
      message: 'Disruption record created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating disruption:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/disruptions/active - Get all active disruptions
router.get('/active', async (req, res) => {
  try {
    console.log('📋 Fetching active disruptions...');
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/active_disruptions`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const disruptions = response.data;
    console.log(`✅ Found ${disruptions.length} active disruptions`);
    
    res.json({
      success: true,
      disruptions,
      count: disruptions.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching active disruptions:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      disruptions: []
    });
  }
});

// GET /api/disruptions/all - Get all disruptions with pagination
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    console.log(`📋 Fetching all disruptions (page ${page})...`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    // Build query parameters
    const params = {
      limit,
      offset,
      order: 'created_at.desc'
    };
    
    if (status) {
      params.status = `eq.${status}`;
    }
    
    if (search) {
      params.or = `(location.ilike.%${search}%,street_name.ilike.%${search}%)`;
    }
    
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/disruptions`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        },
        params
      }
    );
    
    const disruptions = response.data;
    const totalCount = response.headers['content-range']?.split('/')[1] || disruptions.length;
    
    res.json({
      success: true,
      disruptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount),
        hasMore: offset + disruptions.length < totalCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching disruptions:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      disruptions: []
    });
  }
});

// GET /api/disruptions/:id - Get a specific disruption
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching disruption ${id}...`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/disruptions?id=eq.${id}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const disruption = response.data[0];
    
    if (!disruption) {
      return res.status(404).json({
        success: false,
        error: 'Disruption not found'
      });
    }
    
    res.json({
      success: true,
      disruption
    });
    
  } catch (error) {
    console.error('❌ Error fetching disruption:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/disruptions/:id/end - End a disruption
router.put('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { endedBy, endedByName, reason, sessionId } = req.body;
    
    console.log(`📋 Ending disruption ${id}...`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    // Update disruption status
    const updateResponse = await axios.patch(
      `${supabaseUrl}/rest/v1/disruptions?id=eq.${id}`,
      {
        status: 'Ended',
        ended_at: new Date().toISOString()
      },
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    const disruption = updateResponse.data[0];
    
    // Log the action
    if (disruption) {
      await axios.post(
        `${supabaseUrl}/rest/v1/rpc/log_disruption_action`,
        {
          p_disruption_id: id,
          p_action: 'END',
          p_action_details: { reason },
          p_performed_by: endedBy,
          p_performed_by_name: endedByName,
          p_session_id: sessionId
        },
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`✅ Disruption ${id} ended`);
    
    res.json({
      success: true,
      disruption,
      message: 'Disruption ended successfully'
    });
    
  } catch (error) {
    console.error('❌ Error ending disruption:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/disruptions/:id/reactivate - Reactivate a disruption
router.put('/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const { reactivatedBy, reactivatedByName, reason, sessionId } = req.body;
    
    console.log(`📋 Reactivating disruption ${id}...`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    // Call the reactivate function
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/rpc/reactivate_disruption`,
      {
        p_disruption_id: id,
        p_reactivated_by: reactivatedBy,
        p_reactivated_by_name: reactivatedByName,
        p_reason: reason
      },
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const disruption = response.data;
    
    console.log(`✅ Disruption ${id} reactivated (count: ${disruption?.reactivation_count})`);
    
    res.json({
      success: true,
      disruption,
      message: 'Disruption reactivated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error reactivating disruption:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/disruptions/:id/update - Update disruption details
router.put('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { updates, updatedBy, updatedByName, sessionId } = req.body;
    
    console.log(`📋 Updating disruption ${id}...`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    // Update disruption
    const updateResponse = await axios.patch(
      `${supabaseUrl}/rest/v1/disruptions?id=eq.${id}`,
      updates,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    const disruption = updateResponse.data[0];
    
    // Log the action
    if (disruption) {
      await axios.post(
        `${supabaseUrl}/rest/v1/rpc/log_disruption_action`,
        {
          p_disruption_id: id,
          p_action: 'UPDATE',
          p_action_details: { updates },
          p_performed_by: updatedBy,
          p_performed_by_name: updatedByName,
          p_session_id: sessionId
        },
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`✅ Disruption ${id} updated`);
    
    res.json({
      success: true,
      disruption,
      message: 'Disruption updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating disruption:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/disruptions/check-duplicate/:alertId - Check if alert already has disruption
router.get('/check-duplicate/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    console.log(`📋 Checking for duplicate disruption for alert ${alertId}...`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/disruptions`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          alert_id: `eq.${alertId}`,
          status: 'in.(Active,Reactivated)',
          limit: 1
        }
      }
    );
    
    const existingDisruption = response.data[0];
    
    res.json({
      success: true,
      isDuplicate: !!existingDisruption,
      disruption: existingDisruption || null
    });
    
  } catch (error) {
    console.error('❌ Error checking duplicate:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      isDuplicate: false
    });
  }
});

// GET /api/disruptions/:id/audit-log - Get audit log for a disruption
router.get('/:id/audit-log', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching audit log for disruption ${id}...`);
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    const response = await axios.get(
      `${supabaseUrl}/rest/v1/disruption_audit_log`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          disruption_id: `eq.${id}`,
          order: 'performed_at.desc'
        }
      }
    );
    
    const auditLog = response.data;
    
    res.json({
      success: true,
      auditLog,
      count: auditLog.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching audit log:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      auditLog: []
    });
  }
});

// GET /api/disruptions/stats - Get disruption statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Calculating disruption statistics...');
    
    const { supabaseUrl, supabaseKey } = await getSupabaseClient();
    
    // Get counts by status
    const statusResponse = await axios.get(
      `${supabaseUrl}/rest/v1/disruptions?select=status`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const statusCounts = statusResponse.data.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});
    
    // Get today's disruptions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayResponse = await axios.get(
      `${supabaseUrl}/rest/v1/disruptions`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          created_at: `gte.${today.toISOString()}`,
          select: 'id'
        }
      }
    );
    
    const stats = {
      total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      active: statusCounts['Active'] || 0,
      reactivated: statusCounts['Reactivated'] || 0,
      ended: statusCounts['Ended'] || 0,
      completed: statusCounts['Completed'] || 0,
      todayCount: todayResponse.data.length,
      statusBreakdown: statusCounts
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error calculating stats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: {}
    });
  }
});

export default router;
