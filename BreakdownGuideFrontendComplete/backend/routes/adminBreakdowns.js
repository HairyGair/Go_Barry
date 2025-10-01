/*
 * Admin Breakdowns Routes
 * Administrative views and management of breakdowns
 */

import express from 'express';
const router = express.Router();

// Mock data store (shared with breakdownTrackerV2)
const getBreakdownsFromTracker = () => {
  // In production, this would access the same database
  // For now, generate mock data
  const mockBreakdowns = [];
  const types = ['Engine', 'Brakes', 'Electrical', 'Steering', 'Doors', 'Lights'];
  const statuses = ['received', 'decision', 'cleared'];
  const supervisors = ['AW001', 'AC002', 'AG003', 'CF004', 'DH005'];
  
  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    mockBreakdowns.push({
      id: `BD-2025-${String(i + 1).padStart(5, '0')}`,
      breakdown_type: types[Math.floor(Math.random() * types.length)],
      vehicle_reg: `NL${Math.floor(Math.random() * 90) + 10}ABC`,
      fleet_no: String(6000 + Math.floor(Math.random() * 500)),
      supervisor_badge: supervisors[Math.floor(Math.random() * supervisors.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: date.toISOString(),
      location: 'Newcastle Central Station',
      severity: ['STOP', 'AMBER', 'CONTINUE'][Math.floor(Math.random() * 3)]
    });
  }
  
  return mockBreakdowns;
};

// Get all breakdowns (admin view)
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, status, depot, supervisor } = req.query;
    
    let breakdowns = getBreakdownsFromTracker();
    
    // Apply filters
    if (status) {
      breakdowns = breakdowns.filter(b => b.status === status);
    }
    if (depot) {
      breakdowns = breakdowns.filter(b => b.depot === depot);
    }
    if (supervisor) {
      breakdowns = breakdowns.filter(b => b.supervisor_badge === supervisor);
    }
    
    // Sort by timestamp (newest first)
    breakdowns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const total = breakdowns.length;
    breakdowns = breakdowns.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      logs: breakdowns,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get breakdowns'
    });
  }
});

// Get breakdown statistics
router.get('/stats', async (req, res) => {
  try {
    const breakdowns = getBreakdownsFromTracker();
    
    const stats = {
      totalBreakdowns: breakdowns.length,
      byType: {},
      byStatus: {},
      bySeverity: {},
      bySupervisor: {},
      last24Hours: 0,
      last7Days: 0,
      last30Days: breakdowns.length
    };
    
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    breakdowns.forEach(b => {
      // Count by type
      if (!stats.byType[b.breakdown_type]) {
        stats.byType[b.breakdown_type] = 0;
      }
      stats.byType[b.breakdown_type]++;
      
      // Count by status
      if (!stats.byStatus[b.status]) {
        stats.byStatus[b.status] = 0;
      }
      stats.byStatus[b.status]++;
      
      // Count by severity
      if (!stats.bySeverity[b.severity]) {
        stats.bySeverity[b.severity] = 0;
      }
      stats.bySeverity[b.severity]++;
      
      // Count by supervisor
      if (!stats.bySupervisor[b.supervisor_badge]) {
        stats.bySupervisor[b.supervisor_badge] = 0;
      }
      stats.bySupervisor[b.supervisor_badge]++;
      
      // Time-based counts
      const timestamp = new Date(b.timestamp);
      if (timestamp > oneDayAgo) stats.last24Hours++;
      if (timestamp > sevenDaysAgo) stats.last7Days++;
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// Export breakdowns to CSV
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', from, to } = req.query;
    let breakdowns = getBreakdownsFromTracker();
    
    // Apply date filters
    if (from) {
      const fromDate = new Date(from);
      breakdowns = breakdowns.filter(b => new Date(b.timestamp) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      breakdowns = breakdowns.filter(b => new Date(b.timestamp) <= toDate);
    }
    
    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Type', 'Vehicle', 'Fleet', 'Supervisor', 'Status', 'Severity', 'Timestamp'];
      const rows = breakdowns.map(b => [
        b.id,
        b.breakdown_type,
        b.vehicle_reg,
        b.fleet_no,
        b.supervisor_badge,
        b.status,
        b.severity,
        b.timestamp
      ]);
      
      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell || ''}"`).join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=breakdowns.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        breakdowns,
        count: breakdowns.length
      });
    }
  } catch (error) {
    console.error('Error exporting breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export breakdowns'
    });
  }
});

// Delete breakdown (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisor_badge } = req.body;
    
    // Check if admin
    if (!['AG003', 'BP009'].includes(supervisor_badge)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // In production, this would delete from database
    res.json({
      success: true,
      message: 'Breakdown deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete breakdown'
    });
  }
});

export default router;
