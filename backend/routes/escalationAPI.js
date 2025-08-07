// backend/routes/escalationAPI.js
// API endpoints for roadworks alert escalation system

import express from 'express';
import escalationService from '../services/escalationService.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly for API routes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

const router = express.Router();

/**
 * POST /api/escalation/escalate
 * Main escalation endpoint - handles all escalation options
 */
router.post('/escalate', async (req, res) => {
  try {
    console.log('🚨 Processing escalation request...');
    
    const { 
      alertData, 
      options = {}, 
      supervisorBadge 
    } = req.body;

    // Comprehensive input validation
    if (!alertData || !supervisorBadge) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: alertData and supervisorBadge'
      });
    }

    if (!alertData.id) {
      return res.status(400).json({
        success: false,
        error: 'Alert data must include an ID'
      });
    }

    // Validate supervisor badge format (UK format: 2 letters + 3 digits)
    if (!/^[A-Z]{2}\d{3}$/.test(supervisorBadge)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid supervisor badge format. Expected format: AB123'
      });
    }

    // Input sanitisation for security
    if (typeof alertData.description === 'string') {
      alertData.description = alertData.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Set default escalation options
    const escalationOptions = {
      pushToDatabase: options.pushToDatabase !== false, // Default true
      pushToDisplay: options.pushToDisplay || false,
      emailManager: options.emailManager || false,
      reason: options.reason || 'Supervisor escalation',
      urgencyLevel: options.urgencyLevel || 'high',
      servicesAffected: options.servicesAffected || [],
      ticketMachineMessage: options.ticketMachineMessage || '',
      customerMessage: options.customerMessage || '',
      workflowNotes: options.workflowNotes || ''
    };

    console.log(`📋 Escalation options: ${JSON.stringify(escalationOptions, null, 2)}`);

    // Process escalation
    const result = await escalationService.handleEscalation(
      alertData, 
      escalationOptions, 
      supervisorBadge
    );

    res.json({
      success: true,
      message: 'Escalation completed successfully',
      alertId: alertData.id,
      supervisorBadge,
      results: result,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Escalation completed for alert ${alertData.id}`);

  } catch (error) {
    console.error('❌ Escalation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Escalation processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/escalation/push-to-display
 * Push alert to display screens with map zoom
 */
router.post('/push-to-display', async (req, res) => {
  try {
    const { alertData, displayConfig = {} } = req.body;
    
    if (!alertData) {
      return res.status(400).json({
        success: false,
        error: 'Missing alert data'
      });
    }

    const result = await escalationService.pushToDisplayScreen(alertData);
    
    res.json({
      success: true,
      message: 'Alert pushed to display screens successfully',
      displayId: result.id,
      displayConfig: result.display_config
    });

  } catch (error) {
    console.error('❌ Display screen push failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to push to display screens',
      details: error.message
    });
  }
});

/**
 * POST /api/escalation/email-manager
 * Send escalation email to Barry Perryman
 */
router.post('/email-manager', async (req, res) => {
  try {
    const { alertData, supervisorBadge } = req.body;
    
    if (!alertData || !supervisorBadge) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: alertData and supervisorBadge'
      });
    }

    const result = await escalationService.emailLineManager(alertData, supervisorBadge);
    
    res.json({
      success: true,
      message: 'Escalation email sent successfully',
      messageId: result.messageId,
      recipient: 'barry.perryman@gonortheast.co.uk'
    });

  } catch (error) {
    console.error('❌ Email escalation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send escalation email',
      details: error.message
    });
  }
});

/**
 * POST /api/escalation/disruption-database
 * Save alert to disruption database
 */
router.post('/disruption-database', async (req, res) => {
  try {
    const { alertData } = req.body;
    
    if (!alertData) {
      return res.status(400).json({
        success: false,
        error: 'Missing alert data'
      });
    }

    const result = await escalationService.pushToDisruptionDatabase(alertData);
    
    res.json({
      success: true,
      message: 'Alert saved to disruption database successfully',
      disruptionId: result.id
    });

  } catch (error) {
    console.error('❌ Disruption database save failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save to disruption database',
      details: error.message
    });
  }
});

/**
 * GET /api/escalation/status/:alertId
 * Get escalation status for an alert
 */
router.get('/status/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    // Check disruption database
    const { data: disruption, error: disruptionError } = await supabase
      .from('disruptions')
      .select('*')
      .eq('id', alertId)
      .single();

    // Check display screens
    const { data: display, error: displayError } = await supabase
      .from('display_screen_alerts')
      .select('*')
      .eq('alert_id', alertId)
      .single();

    // Check audit log
    const { data: auditLog, error: auditError } = await supabase
      .from('supervisor_audit_log')
      .select('*')
      .eq('alert_id', alertId)
      .eq('action', 'escalation')
      .order('created_at', { ascending: false })
      .limit(1);

    res.json({
      success: true,
      alertId,
      escalationStatus: {
        inDisruptionDatabase: !disruptionError && !!disruption,
        onDisplayScreens: !displayError && !!display,
        auditTrail: !auditError && auditLog ? auditLog[0] : null
      },
      details: {
        disruption: disruption || null,
        display: display || null,
        audit: auditLog ? auditLog[0] : null
      }
    });

  } catch (error) {
    console.error('❌ Failed to get escalation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve escalation status',
      details: error.message
    });
  }
});

/**
 * GET /api/escalation/history
 * Get escalation history for supervisor dashboard
 */
router.get('/history', async (req, res) => {
  try {
    const { 
      supervisorBadge,
      limit = 50,
      offset = 0,
      timeframe = '7d'
    } = req.query;

    let query = supabase
      .from('supervisor_audit_log')
      .select(`
        *,
        disruptions!inner(*)
      `)
      .eq('action', 'escalation')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by supervisor if specified
    if (supervisorBadge) {
      query = query.eq('supervisor_badge', supervisorBadge);
    }

    // Filter by timeframe
    const timeframeDays = parseInt(timeframe.replace('d', ''));
    const cutoffDate = new Date(Date.now() - (timeframeDays * 24 * 60 * 60 * 1000));
    query = query.gte('created_at', cutoffDate.toISOString());

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    res.json({
      success: true,
      history: data || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: data ? data.length : 0
      },
      timeframe
    });

  } catch (error) {
    console.error('❌ Failed to get escalation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve escalation history',
      details: error.message
    });
  }
});

/**
 * POST /api/escalation/test
 * Test escalation system (development only)
 */
router.post('/test', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test endpoint not available in production'
      });
    }

    const testAlert = {
      id: `test-${Date.now()}`,
      title: 'Test Roadwork Alert',
      location: 'A1 Newcastle Test Area',
      description: 'Test escalation for development purposes',
      coordinates: [54.9783, -1.6178], // Newcastle coordinates
      severity: 'medium',
      source: 'test'
    };

    const testOptions = {
      pushToDatabase: true,
      pushToDisplay: false, // Don't spam displays during testing
      emailManager: false, // Don't spam Barry during testing
      reason: 'Development test',
      urgencyLevel: 'low'
    };

    const result = await escalationService.handleEscalation(
      testAlert,
      testOptions,
      'AG003' // Test supervisor
    );

    res.json({
      success: true,
      message: 'Test escalation completed',
      testAlert,
      result
    });

  } catch (error) {
    console.error('❌ Test escalation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test escalation failed',
      details: error.message
    });
  }
});

export default router;