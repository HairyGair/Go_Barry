/**
 * Wizard Progress API Routes
 * Tracks wizard assessment progress and completions
 * Migrated from Supabase to MySQL
 */

import express from 'express';
import { from, query, insert, update } from '../utils/queryHelpers.js';
import webSocketHandler from './webSocketHandler.js';

const router = express.Router();

/**
 * POST /api/wizards/progress - Log wizard progress step
 */
router.post('/progress', async (req, res) => {
  try {
    const progressData = {
      ...req.body,
      created_at: new Date().toISOString()
    };

    // Insert wizard progress using MySQL
    const insertId = await insert('wizard_progress', progressData);

    // Fetch the inserted record
    const { data } = await from('wizard_progress')
      .select('*')
      .eq('id', insertId)
      .single();

    res.status(201).json(data);
  } catch (error) {
    console.error('Error logging wizard progress:', error);
    res.status(500).json({ error: 'Failed to log wizard progress' });
  }
});

/**
 * GET /api/wizards/progress/:breakdownId - Get wizard progress for breakdown
 */
router.get('/progress/:breakdownId', async (req, res) => {
  try {
    const { data, error } = await from('wizard_progress')
      .select('*')
      .eq('breakdown_id', req.params.breakdownId)
      .order('created_at', 'ASC')
      .execute();

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching wizard progress:', error);
    res.status(500).json({ error: 'Failed to fetch wizard progress' });
  }
});

/**
 * POST /api/wizards/complete - Complete wizard assessment
 */
router.post('/complete', async (req, res) => {
  try {
    const {
      breakdown_id,
      wizard_type,
      decision,
      notes,
      assessment_data,
      supervisor_id,
      supervisor_badge,
      supervisor_name,
      depot,
      vehicle_fleet_number,
      location
    } = req.body;

    // Log the completion
    const completionData = {
      breakdown_id,
      wizard_type,
      step_type: 'completion',
      step_data: JSON.stringify({
        decision,
        notes,
        assessment_data,
        completed_at: new Date().toISOString()
      }),
      supervisor_id,
      supervisor_badge,
      supervisor_name,
      vehicle_fleet_number,
      location,
      depot,
      created_at: new Date().toISOString()
    };

    const progressInsertId = await insert('wizard_progress', completionData);

    // Fetch the inserted progress record
    const { data: progressRecord } = await from('wizard_progress')
      .select('*')
      .eq('id', progressInsertId)
      .single();

    // Update the breakdown record with the assessment result
    const updateData = {
      assessment_decision: decision,
      assessment_notes: notes,
      assessment_completed_at: new Date().toISOString(),
      status: 'active', // Keep breakdown active for SDC to manage
      updated_at: new Date().toISOString(),
      wizard_decision: decision,
      wizard_type: wizard_type
    };

    // Add supervisor info if provided (helps with accountability)
    if (supervisor_name) updateData.supervisor_name = supervisor_name;
    if (supervisor_badge) updateData.supervisor_badge = supervisor_badge;
    if (depot) updateData.depot = depot;

    // Also store in wizard_assessment_data for backup
    const existingWizardData = assessment_data || {};
    updateData.wizard_assessment_data = JSON.stringify({
      ...existingWizardData,
      supervisorName: supervisor_name,
      supervisorBadge: supervisor_badge,
      supervisor_id: supervisor_id,
      depot: depot,
      completed_at: new Date().toISOString(),
      wizard_type: wizard_type,
      decision: decision
    });

    // Update breakdown
    const affectedRows = await update('breakdowns', updateData, {
      breakdown_id: breakdown_id
    });

    if (affectedRows === 0) {
      console.error('Error updating breakdown: No rows affected');
      // Return success for wizard progress but note breakdown update failed
      return res.status(201).json({
        progress: progressRecord,
        breakdown: null,
        warning: 'Assessment completed but breakdown update failed',
        message: 'Assessment logged successfully'
      });
    }

    // Fetch updated breakdown
    const { data: breakdown } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    // Broadcast breakdown update to WebSocket clients
    try {
      // Use 'wizard_completed' event type that SDC Dashboard listens for
      const broadcastData = {
        type: 'wizard_completed',
        action: 'wizard_completed',
        breakdown: breakdown,
        breakdown_id: breakdown_id,
        decision: decision,
        timestamp: new Date().toISOString(),
        // Add additional data for dashboard compatibility
        vehicle: {
          fleetNumber: vehicle_fleet_number
        },
        // Use breakdown's supervisor_name if available, otherwise supervisor_id
        supervisor_name: breakdown?.supervisor_name || breakdown?.supervisor_badge || supervisor_id,
        wizardType: wizard_type
      };

      // Broadcast to both dashboards
      const sdcCount = webSocketHandler.broadcast('sdc-dashboard', broadcastData);
      const controlCount = webSocketHandler.broadcast('control-room', broadcastData);

      console.log(`📡 Broadcasted wizard_completed event for breakdown ${breakdown_id}:`, {
        type: broadcastData.type,
        decision: decision,
        channels: ['sdc-dashboard', 'control-room'],
        recipients: { sdc: sdcCount, controlRoom: controlCount }
      });
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast wizard completion:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    res.status(201).json({
      progress: progressRecord,
      breakdown: breakdown,
      message: 'Assessment completed successfully'
    });
  } catch (error) {
    console.error('Error completing wizard assessment:', error);
    res.status(500).json({ error: 'Failed to complete assessment' });
  }
});

/**
 * GET /api/wizards/stats/usage - Get wizard usage statistics
 */
router.get('/stats/usage', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get completion records
    const { data, error } = await from('wizard_progress')
      .select('wizard_type, step_type, breakdown_id, created_at')
      .gte('breakdown_id', 1)
      .eq('step_type', 'completion')
      .gte('created_at', startDate.toISOString())
      .execute();

    if (error) {
      throw error;
    }

    // Aggregate statistics
    const stats = {
      total_assessments: data.length,
      by_wizard_type: {},
      by_day: {}
    };

    data.forEach(progress => {
      // Count by wizard type
      if (progress.wizard_type) {
        stats.by_wizard_type[progress.wizard_type] = (stats.by_wizard_type[progress.wizard_type] || 0) + 1;
      }

      // Count by day
      const day = new Date(progress.created_at).toISOString().split('T')[0];
      stats.by_day[day] = (stats.by_day[day] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching wizard stats:', error);
    res.status(500).json({ error: 'Failed to fetch wizard statistics' });
  }
});

/**
 * GET /api/wizards/recent - Get recent wizard assessments
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Use the wizard_recent_assessments view for better performance
    const results = await query(
      `SELECT * FROM wizard_recent_assessments LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: results || [],
      count: results?.length || 0,
      message: results?.length > 0 ? 'Recent assessments retrieved' : 'No recent wizard assessments found'
    });
  } catch (error) {
    console.error('Error fetching recent wizard assessments:', error);
    // Return empty data gracefully to prevent dashboard errors
    res.json({
      success: true,
      data: [],
      count: 0,
      message: 'No recent wizard assessments found'
    });
  }
});

/**
 * GET /api/wizards/decisions/summary - Get decision summary statistics
 */
router.get('/decisions/summary', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get completion records with step_data
    const { data, error } = await from('wizard_progress')
      .select('step_data')
      .gte('breakdown_id', 1)
      .eq('step_type', 'completion')
      .gte('created_at', startDate.toISOString())
      .execute();

    if (error) {
      throw error;
    }

    // Extract decisions from step_data (parse JSON if stored as string)
    const decisions = data
      .map(progress => {
        try {
          const stepData = typeof progress.step_data === 'string'
            ? JSON.parse(progress.step_data)
            : progress.step_data;
          return stepData?.decision;
        } catch (e) {
          return null;
        }
      })
      .filter(decision => decision);

    const decisionStats = {
      total: decisions.length,
      STOP: decisions.filter(d => d === 'STOP').length,
      AMBER: decisions.filter(d => d === 'AMBER').length,
      CONTINUE: decisions.filter(d => d === 'CONTINUE').length
    };

    res.json(decisionStats);
  } catch (error) {
    console.error('Error fetching decision stats:', error);
    res.status(500).json({ error: 'Failed to fetch decision statistics' });
  }
});

export default router;
