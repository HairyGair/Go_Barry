import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// POST /api/wizards/progress - Log wizard progress step
router.post('/progress', async (req, res) => {
  try {
    const progressData = {
      ...req.body,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('wizard_progress')
      .insert(progressData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error logging wizard progress:', error);
    res.status(500).json({ error: 'Failed to log wizard progress' });
  }
});

// GET /api/wizards/progress/:breakdownId - Get wizard progress for breakdown
router.get('/progress/:breakdownId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wizard_progress')
      .select('*')
      .eq('breakdown_id', req.params.breakdownId)
      .order('created_at');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching wizard progress:', error);
    res.status(500).json({ error: 'Failed to fetch wizard progress' });
  }
});

// POST /api/wizards/complete - Complete wizard assessment
router.post('/complete', async (req, res) => {
  try {
    const {
      breakdown_id,
      wizard_type,
      decision,
      notes,
      assessment_data,
      supervisor_id,
      vehicle_fleet_number,
      location
    } = req.body;

    // Log the completion
    const completionData = {
      breakdown_id,
      wizard_type,
      step_type: 'completion',
      step_data: {
        decision,
        notes,
        assessment_data,
        completed_at: new Date().toISOString()
      },
      supervisor_id,
      vehicle_fleet_number,
      location,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('wizard_progress')
      .insert(completionData)
      .select()
      .single();

    if (error) throw error;

    // Update the breakdown record with the assessment result
    const { data: breakdown, error: breakdownError } = await supabase
      .from('breakdowns')
      .update({
        assessment_decision: decision,
        assessment_notes: notes,
        assessment_completed_at: new Date().toISOString(),
        status: decision === 'STOP' ? 'critical' : decision === 'AMBER' ? 'amber' : 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (breakdownError) {
      console.error('Error updating breakdown:', breakdownError);
      // Don't fail the request, just log the error
    }

    res.status(201).json({
      progress: data,
      breakdown: breakdown,
      message: 'Assessment completed successfully'
    });
  } catch (error) {
    console.error('Error completing wizard assessment:', error);
    res.status(500).json({ error: 'Failed to complete assessment' });
  }
});

// GET /api/wizards/stats/usage - Get wizard usage statistics
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

    const { data, error } = await supabase
      .from('wizard_progress')
      .select('wizard_type, step_type, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('step_type', 'completion');

    if (error) throw error;

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

// GET /api/wizards/decisions/summary - Get decision summary statistics
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

    const { data, error } = await supabase
      .from('wizard_progress')
      .select('step_data')
      .gte('created_at', startDate.toISOString())
      .eq('step_type', 'completion');

    if (error) throw error;

    // Extract decisions from step_data
    const decisions = data
      .map(progress => progress.step_data?.decision)
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