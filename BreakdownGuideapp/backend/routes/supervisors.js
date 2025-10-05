import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/supervisors/:id/stats - Get supervisor statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'today' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'today':
      default:
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Get supervisor info
    const { data: supervisor, error: supervisorError } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (supervisorError) {
      console.error('Error fetching supervisor:', supervisorError);
      return res.status(500).json({
        success: false,
        error: 'Database error while fetching supervisor'
      });
    }

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    // Get breakdowns handled by this supervisor
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('supervisor_badge', supervisor.badge_number)
      .gte('created_at', startDate.toISOString());

    if (breakdownError) {
      console.error('Error fetching breakdowns:', breakdownError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch breakdown data'
      });
    }

    // Calculate supervisor statistics
    const totalBreakdowns = breakdowns.length;
    const criticalBreakdowns = breakdowns.filter(b =>
      b.severity === 'STOP' || b.status === 'critical'
    ).length;
    const resolvedBreakdowns = breakdowns.filter(b =>
      b.status === 'resolved' || b.status === 'completed'
    ).length;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const breakdown of breakdowns) {
      if (breakdown.acknowledged_at && breakdown.received_at) {
        const responseTime = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / 60000;
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    const resolutionRate = totalBreakdowns > 0 ? Math.round((resolvedBreakdowns / totalBreakdowns) * 100) : 0;

    // Group breakdowns by issue category
    const issueCategories = {};
    breakdowns.forEach(b => {
      const category = b.issue_category || 'Other';
      issueCategories[category] = (issueCategories[category] || 0) + 1;
    });

    const stats = {
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge_number,
        depot: supervisor.depot,
        shift: supervisor.shift_pattern
      },
      performance: {
        totalBreakdowns: totalBreakdowns,
        criticalBreakdowns: criticalBreakdowns,
        resolvedBreakdowns: resolvedBreakdowns,
        avgResponseTime: avgResponseTime,
        resolutionRate: resolutionRate
      },
      breakdown_categories: Object.entries(issueCategories).map(([category, count]) => ({
        category,
        count,
        percentage: totalBreakdowns > 0 ? Math.round((count / totalBreakdowns) * 100) : 0
      })),
      period: period,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor statistics'
    });
  }
});

// GET /api/supervisors/:id - Get supervisor profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: supervisor, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching supervisor:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error while fetching supervisor'
      });
    }

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    res.json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor'
    });
  }
});

// GET /api/supervisors - Get all supervisors
router.get('/', async (req, res) => {
  try {
    const { data: supervisors, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching supervisors:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch supervisors'
      });
    }

    res.json({
      success: true,
      data: supervisors
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});

export default router;