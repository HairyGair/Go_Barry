// backend/routes/disruptionsAPI.js
// API endpoints for disruption tracking and communication storage

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create a new disruption from roadwork
router.post('/create', async (req, res) => {
  try {
    const {
      sourceId,
      sourceType = 'roadwork',
      title,
      description,
      location,
      coordinates,
      affectedRoutes = [],
      severity = 'medium',
      supervisorBadge,
      supervisorName
    } = req.body;

    if (!sourceId || !title || !supervisorBadge) {
      return res.status(400).json({
        success: false,
        error: 'Source ID, title, and supervisor badge are required'
      });
    }

    // Check if disruption already exists for this source
    const { data: existing } = await supabase
      .from('disruptions')
      .select('*')
      .eq('source_id', sourceId)
      .eq('source_type', sourceType)
      .single();

    if (existing) {
      return res.json({
        success: true,
        disruption: existing,
        message: 'Disruption already exists for this source'
      });
    }

    // Create new disruption
    const disruptionData = {
      id: `disruption_${Date.now()}`,
      source_id: sourceId,
      source_type: sourceType,
      title,
      description: description || '',
      location,
      coordinates,
      affected_routes: affectedRoutes,
      severity,
      status: 'active',
      created_by: supervisorBadge,
      created_by_name: supervisorName,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('disruptions')
      .insert([disruptionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating disruption:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create disruption'
      });
    }

    console.log(`✅ Created disruption: ${data.id} for ${sourceType} ${sourceId}`);

    res.json({
      success: true,
      disruption: data
    });

  } catch (error) {
    console.error('❌ Error in disruption creation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add communication to disruption
router.post('/communications', async (req, res) => {
  try {
    const {
      disruptionId,
      sourceId,
      sourceType = 'roadwork',
      messageType,
      subject,
      content,
      platform,
      supervisorBadge,
      supervisorName,
      recipientCount = 0,
      routes = []
    } = req.body;

    if (!sourceId || !messageType || !supervisorBadge) {
      return res.status(400).json({
        success: false,
        error: 'Source ID, message type, and supervisor badge are required'
      });
    }

    // Get or create disruption
    let disruption;
    if (disruptionId) {
      const { data } = await supabase
        .from('disruptions')
        .select('*')
        .eq('id', disruptionId)
        .single();
      disruption = data;
    } else {
      // Find by source
      const { data } = await supabase
        .from('disruptions')
        .select('*')
        .eq('source_id', sourceId)
        .eq('source_type', sourceType)
        .single();
      disruption = data;
    }

    if (!disruption) {
      return res.status(404).json({
        success: false,
        error: 'Disruption not found'
      });
    }

    // Create communication record
    const communicationData = {
      id: `comm_${Date.now()}`,
      disruption_id: disruption.id,
      source_id: sourceId,
      source_type: sourceType,
      message_type: messageType,
      subject: subject || '',
      content: content || '',
      platform: platform || 'unknown',
      supervisor_badge: supervisorBadge,
      supervisor_name: supervisorName,
      recipient_count: recipientCount,
      routes: routes,
      sent_at: new Date().toISOString(),
      status: 'sent'
    };

    const { data, error } = await supabase
      .from('roadwork_communications')
      .insert([communicationData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating communication:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create communication record'
      });
    }

    // Update disruption last_updated
    await supabase
      .from('disruptions')
      .update({ last_updated: new Date().toISOString() })
      .eq('id', disruption.id);

    console.log(`✅ Created communication: ${data.id} for disruption ${disruption.id}`);

    res.json({
      success: true,
      communication: data,
      disruptionId: disruption.id
    });

  } catch (error) {
    console.error('❌ Error creating communication:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get communications for a specific source
router.get('/communications/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { sourceType = 'roadwork' } = req.query;

    const { data, error } = await supabase
      .from('roadwork_communications')
      .select('*')
      .eq('source_id', sourceId)
      .eq('source_type', sourceType)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching communications:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch communications'
      });
    }

    res.json({
      success: true,
      communications: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('❌ Error in communications fetch:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get disruptions by source
router.get('/by-source/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { sourceType = 'roadwork' } = req.query;

    const { data: disruptions, error: disruptionsError } = await supabase
      .from('disruptions')
      .select('*')
      .eq('source_id', sourceId)
      .eq('source_type', sourceType)
      .order('created_at', { ascending: false });

    if (disruptionsError) {
      console.error('❌ Error fetching disruptions:', disruptionsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch disruptions'
      });
    }

    // Get communication counts for each disruption
    const disruptionsWithCounts = await Promise.all(
      (disruptions || []).map(async (disruption) => {
        const { count } = await supabase
          .from('roadwork_communications')
          .select('*', { count: 'exact', head: true })
          .eq('disruption_id', disruption.id);

        return {
          ...disruption,
          messageCount: count || 0
        };
      })
    );

    res.json({
      success: true,
      disruptions: disruptionsWithCounts,
      count: disruptionsWithCounts.length
    });

  } catch (error) {
    console.error('❌ Error in disruptions fetch:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all disruptions with communication history
router.get('/all', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, supervisor } = req.query;

    let query = supabase
      .from('disruptions')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (supervisor) {
      query = query.eq('created_by', supervisor);
    }

    const { data: disruptions, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching all disruptions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch disruptions'
      });
    }

    // Get communication counts for each disruption
    const disruptionsWithDetails = await Promise.all(
      (disruptions || []).map(async (disruption) => {
        const { data: communications } = await supabase
          .from('roadwork_communications')
          .select('*')
          .eq('disruption_id', disruption.id)
          .order('sent_at', { ascending: false });

        return {
          ...disruption,
          communications: communications || [],
          messageCount: communications?.length || 0,
          lastMessageAt: communications?.[0]?.sent_at || null
        };
      })
    );

    res.json({
      success: true,
      disruptions: disruptionsWithDetails,
      count: disruptionsWithDetails.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('❌ Error in all disruptions fetch:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update disruption status
router.patch('/:disruptionId/status', async (req, res) => {
  try {
    const { disruptionId } = req.params;
    const { status, supervisorBadge, notes } = req.body;

    if (!status || !supervisorBadge) {
      return res.status(400).json({
        success: false,
        error: 'Status and supervisor badge are required'
      });
    }

    const { data, error } = await supabase
      .from('disruptions')
      .update({
        status,
        last_updated: new Date().toISOString(),
        updated_by: supervisorBadge,
        notes: notes || null
      })
      .eq('id', disruptionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating disruption status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update disruption status'
      });
    }

    console.log(`✅ Updated disruption ${disruptionId} status to ${status}`);

    res.json({
      success: true,
      disruption: data
    });

  } catch (error) {
    console.error('❌ Error in disruption status update:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete disruption and all related communications
router.delete('/:disruptionId', async (req, res) => {
  try {
    const { disruptionId } = req.params;
    const { supervisorBadge } = req.body;

    if (!supervisorBadge) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor badge is required'
      });
    }

    // Delete communications first (foreign key constraint)
    await supabase
      .from('roadwork_communications')
      .delete()
      .eq('disruption_id', disruptionId);

    // Delete disruption
    const { error } = await supabase
      .from('disruptions')
      .delete()
      .eq('id', disruptionId);

    if (error) {
      console.error('❌ Error deleting disruption:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete disruption'
      });
    }

    console.log(`✅ Deleted disruption ${disruptionId} and related communications`);

    res.json({
      success: true,
      message: 'Disruption and related communications deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in disruption deletion:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { error } = await supabase
      .from('disruptions')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }

    res.json({
      success: true,
      message: 'Disruptions API is healthy',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;