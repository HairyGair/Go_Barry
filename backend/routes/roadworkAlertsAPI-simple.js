import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('✅ roadworkAlertsAPI-simple.js loaded successfully');

// GET /api/roadwork-alerts - List all roadwork alerts with optional filtering
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/roadwork-alerts called');
    const { status, supervisor_id, active_only } = req.query;
    
    let query = supabase
      .from('roadworks')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (supervisor_id) {
      query = query.eq('created_by_supervisor_id', supervisor_id);
    }
    
    if (active_only === 'true') {
      query = query.in('status', ['pending', 'active']);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Add visual status indicators
    const roadworksWithVisuals = (data || []).map(roadwork => ({
      ...roadwork,
      statusColor: getStatusColor(roadwork.status),
      severityColor: getSeverityColor(roadwork.severity),
      isExpired: roadwork.end_date && new Date(roadwork.end_date) < new Date()
    }));

    console.log(`✅ Returning ${roadworksWithVisuals.length} roadworks`);
    res.json({ 
      success: true, 
      data: roadworksWithVisuals,
      count: roadworksWithVisuals.length 
    });

  } catch (error) {
    console.error('❌ Get roadwork alerts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/roadwork-alerts - Create new roadwork alert (SIMPLIFIED)
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/roadwork-alerts called with body:', req.body);
    
    const {
      title,
      description,
      location,
      areas,
      status = 'pending',
      start_date,
      end_date,
      all_day,
      routes_affected,
      severity = 'medium',
      contact_info,
      web_link,
      created_by_supervisor_id,
      created_by_name,
      email_groups = []
    } = req.body;

    // Basic validation
    if (!title || !location || !start_date || !created_by_supervisor_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, location, start_date, created_by_supervisor_id' 
      });
    }

    // Create roadwork alert (without complex validation for now)
    const { data: roadwork, error: createError } = await supabase
      .from('roadworks')
      .insert({
        title: title.trim(),
        description: description?.trim(),
        location: location.trim(),
        areas,
        status,
        start_date,
        end_date,
        all_day,
        routes_affected,
        severity,
        contact_info: contact_info?.trim(),
        web_link: web_link?.trim(),
        created_by_supervisor_id,
        created_by_name: created_by_name?.trim(),
        email_sent: false
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Create roadwork alert error:', createError);
      return res.status(500).json({ success: false, error: createError.message });
    }

    console.log(`✅ Roadwork alert created: ${title} by ${created_by_name}`);
    
    // Note: Email sending disabled in simplified version
    if (email_groups.length > 0) {
      console.log(`📧 Email sending requested for groups: ${email_groups.join(', ')} (disabled in simplified version)`);
    }
    
    res.status(201).json({ 
      success: true, 
      data: {
        ...roadwork,
        statusColor: getStatusColor(roadwork.status),
        severityColor: getSeverityColor(roadwork.severity)
      },
      message: 'Roadwork created successfully (email notifications disabled in simplified version)'
    });

  } catch (error) {
    console.error('❌ Create roadwork alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/roadwork-alerts/email-groups - Get email groups for notifications
router.get('/email-groups', async (req, res) => {
  try {
    console.log('📧 GET /api/roadwork-alerts/email-groups called');
    
    const { data, error } = await supabase
      .from('email_groups')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Get email groups error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ Returning ${(data || []).length} email groups`);
    res.json({ success: true, data: data || [] });

  } catch (error) {
    console.error('❌ Get email groups error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Simplified roadwork alerts API is working!',
    timestamp: new Date().toISOString(),
    features: {
      'GET /': 'List roadworks',
      'POST /': 'Create roadwork (simplified)',
      'GET /email-groups': 'List email groups',
      'GET /test': 'This test endpoint'
    },
    note: 'This is a simplified version without complex email dependencies'
  });
});

function getStatusColor(status) {
  const colors = {
    pending: '#f59e0b',  // amber
    active: '#ef4444',   // red  
    finished: '#22c55e'  // green
  };
  return colors[status] || '#6b7280';
}

function getSeverityColor(severity) {
  const colors = {
    low: '#22c55e',     // green
    medium: '#f59e0b',  // amber
    high: '#ef4444'     // red
  };
  return colors[severity] || '#6b7280';
}

export default router;