// Historical Analysis API Routes
// Endpoints for reports and analytics

import express from 'express';
import reportGenerator from '../services/reportGenerator.js';
import { authenticate, checkSupervisor } from '../middleware/auth.js';

const router = express.Router();

// Get current business period
router.get('/current-period', async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    
    // Go North East accounting periods for FY 2025
    const periods = [
      { period: 1, start: new Date('2025-01-05'), end: new Date('2025-02-01') },
      { period: 2, start: new Date('2025-02-02'), end: new Date('2025-03-01') },
      { period: 3, start: new Date('2025-03-02'), end: new Date('2025-03-29') },
      { period: 4, start: new Date('2025-03-30'), end: new Date('2025-04-26') },
      { period: 5, start: new Date('2025-04-27'), end: new Date('2025-05-24') },
      { period: 6, start: new Date('2025-05-25'), end: new Date('2025-06-21') },
      { period: 7, start: new Date('2025-06-22'), end: new Date('2025-07-19') },
      { period: 8, start: new Date('2025-07-20'), end: new Date('2025-08-16') },
      { period: 9, start: new Date('2025-08-17'), end: new Date('2025-09-13') },
      { period: 10, start: new Date('2025-09-14'), end: new Date('2025-10-11') },
      { period: 11, start: new Date('2025-10-12'), end: new Date('2025-11-08') },
      { period: 12, start: new Date('2025-11-09'), end: new Date('2025-12-06') },
      { period: 13, start: new Date('2025-12-07'), end: new Date('2026-01-03') }
    ];
    
    // Find current period
    let currentPeriod = 1;
    for (const p of periods) {
      if (currentDate >= p.start && currentDate <= p.end) {
        currentPeriod = p.period;
        break;
      }
    }
    
    // Handle year transition
    const fiscalYear = currentDate >= new Date('2025-01-05') ? 2025 : 2024;

    res.json({
      success: true,
      current_period: currentPeriod,
      year: fiscalYear,
      date: currentDate,
      note: 'Based on Go North East Accounting Calendar FY 2025'
    });
  } catch (error) {
    console.error('❌ Error getting current period:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate period report
router.get('/period-report/:year/:period', authenticate, async (req, res) => {
  try {
    const { year, period } = req.params;
    const report = await reportGenerator.generatePeriodReport(
      parseInt(period), 
      parseInt(year)
    );
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('❌ Error generating period report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate comparison report
router.get('/comparison-report', authenticate, async (req, res) => {
  try {
    const { period1, year1, period2, year2 } = req.query;
    
    if (!period1 || !year1 || !period2 || !year2) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: period1, year1, period2, year2'
      });
    }

    const report = await reportGenerator.generateComparisonReport(
      parseInt(period1),
      parseInt(year1),
      parseInt(period2),
      parseInt(year2)
    );
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('❌ Error generating comparison report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate route report
router.get('/route-report/:route', authenticate, async (req, res) => {
  try {
    const { route } = req.params;
    const { period, year } = req.query;
    
    const report = await reportGenerator.generateRouteReport(
      route,
      parseInt(period) || new Date().getMonth() + 1,
      parseInt(year) || new Date().getFullYear()
    );
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('❌ Error generating route report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate major disruptions report (for directors)
router.get('/major-disruptions/:year/:period', authenticate, async (req, res) => {
  try {
    const { year, period } = req.params;
    const { severity = 7 } = req.query;
    
    const report = await reportGenerator.generateMajorDisruptionsReport(
      parseInt(period),
      parseInt(year),
      parseInt(severity)
    );
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('❌ Error generating major disruptions report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quick stats endpoint
router.get('/quick-stats', authenticate, async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Go North East accounting periods for FY 2025
    const periods = [
      { period: 1, start: new Date('2025-01-05'), end: new Date('2025-02-01') },
      { period: 2, start: new Date('2025-02-02'), end: new Date('2025-03-01') },
      { period: 3, start: new Date('2025-03-02'), end: new Date('2025-03-29') },
      { period: 4, start: new Date('2025-03-30'), end: new Date('2025-04-26') },
      { period: 5, start: new Date('2025-04-27'), end: new Date('2025-05-24') },
      { period: 6, start: new Date('2025-05-25'), end: new Date('2025-06-21') },
      { period: 7, start: new Date('2025-06-22'), end: new Date('2025-07-19') },
      { period: 8, start: new Date('2025-07-20'), end: new Date('2025-08-16') },
      { period: 9, start: new Date('2025-08-17'), end: new Date('2025-09-13') },
      { period: 10, start: new Date('2025-09-14'), end: new Date('2025-10-11') },
      { period: 11, start: new Date('2025-10-12'), end: new Date('2025-11-08') },
      { period: 12, start: new Date('2025-11-09'), end: new Date('2025-12-06') },
      { period: 13, start: new Date('2025-12-07'), end: new Date('2026-01-03') }
    ];
    
    // Find current period
    let period = 1;
    for (const p of periods) {
      if (currentDate >= p.start && currentDate <= p.end) {
        period = p.period;
        break;
      }
    }
    
    const year = currentDate >= new Date('2025-01-05') ? 2025 : 2024;
    
    // Get current period report
    const report = await reportGenerator.generatePeriodReport(period, year);
    
    res.json({
      success: true,
      stats: {
        period: period,
        year: year,
        total_disruptions: report.summary.total_disruptions,
        avg_duration: report.summary.avg_duration_minutes,
        most_affected_route: report.route_analysis.most_affected?.route || 'N/A',
        critical_incidents: report.summary.critical_incidents
      }
    });
  } catch (error) {
    console.error('❌ Error getting quick stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export report as CSV/PDF (placeholder for now)
router.get('/export/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;
    const { period, year, type } = req.query;
    
    // TODO: Implement actual export functionality
    res.json({
      success: true,
      message: `Export to ${format} will be implemented`,
      parameters: { period, year, type }
    });
  } catch (error) {
    console.error('❌ Error exporting report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to check if routes are loaded
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Historical analysis API is working',
    endpoints: [
      'GET /api/historical/current-period',
      'GET /api/historical/period-report/:year/:period',
      'GET /api/historical/comparison-report',
      'GET /api/historical/route-report/:route',
      'GET /api/historical/major-disruptions/:year/:period',
      'GET /api/historical/quick-stats'
    ]
  });
});

export default router;
