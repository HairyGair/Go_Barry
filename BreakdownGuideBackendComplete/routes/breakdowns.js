// backend/routes/breakdowns.js
// Vehicle Breakdown Logging and Analytics API
// Handles logging, retrieval, and analytics for vehicle breakdowns

import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Path to breakdown logs data file
const BREAKDOWN_LOGS_PATH = join(__dirname, '../data/breakdown-logs.json');

// Valid supervisor badges (from existing system)
const VALID_SUPERVISORS = [
  'AG003', 'BP009', 'JM004', 'KL007', 'ST012', 'DW015', 'NR018', 'MK021', 'CP024'
];

// Valid breakdown types
const VALID_BREAKDOWN_TYPES = [
  'Battery', 'Brakes', 'Engine', 'Transmission', 'Suspension', 'Steering',
  'Electrical', 'Cooling System', 'Fuel System', 'Exhaust', 'Lights',
  'Wipers', 'Doors', 'Windows', 'Air Conditioning', 'Heating',
  'Wheelchair Ramp', 'Destination Display', 'Buzzers', 'Interior Damage',
  'Exterior Damage', 'Puncture', 'Oil Warning', 'ABS Warning',
  'Gearbox', 'Non-Starter', 'Cutting Out', 'Excessive Smoke',
  'Wing Mirrors', 'Warning Lights', 'Road Traffic Incident', 'Other'
];

// Utility function to load breakdown logs
function loadBreakdownLogs() {
  try {
    const data = readFileSync(BREAKDOWN_LOGS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading breakdown logs:', error);
    // Return default structure if file doesn't exist or is corrupted
    return {
      logs: [],
      lastUpdated: null,
      version: "1.0"
    };
  }
}

// Utility function to save breakdown logs
function saveBreakdownLogs(logsData) {
  try {
    logsData.lastUpdated = new Date().toISOString();
    writeFileSync(BREAKDOWN_LOGS_PATH, JSON.stringify(logsData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving breakdown logs:', error);
    return false;
  }
}

// Utility function to validate supervisor
function isValidSupervisor(supervisorId) {
  return VALID_SUPERVISORS.includes(supervisorId?.toUpperCase());
}

// Utility function to generate unique ID
function generateId() {
  return 'breakdown_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

// Validation middleware
function validateBreakdownData(req, res, next) {
  const { supervisorId, vehicleReg, fleetNo, breakdownType } = req.body;
  
  // Check required fields
  if (!supervisorId || !vehicleReg || !fleetNo || !breakdownType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: supervisorId, vehicleReg, fleetNo, breakdownType'
    });
  }
  
  // Validate supervisor
  if (!isValidSupervisor(supervisorId)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid supervisor badge. Must be one of: ' + VALID_SUPERVISORS.join(', ')
    });
  }
  
  // Validate breakdown type
  if (!VALID_BREAKDOWN_TYPES.includes(breakdownType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid breakdown type. Must be one of: ' + VALID_BREAKDOWN_TYPES.join(', ')
    });
  }
  
  next();
}

// POST /api/breakdowns/log - Log a new breakdown
router.post('/log', validateBreakdownData, (req, res) => {
  try {
    const {
      supervisorId,
      vehicleReg,
      fleetNo,
      breakdownType,
      timestamp,
      location,
      description,
      severity,
      diagnosticSession,
      notes
    } = req.body;
    
    console.log('🔧 Logging new breakdown:', { supervisorId, vehicleReg, fleetNo, breakdownType });
    
    const logsData = loadBreakdownLogs();
    
    // Create new breakdown log entry
    const newLog = {
      id: generateId(),
      supervisorId: supervisorId.toUpperCase(),
      vehicleReg: vehicleReg.toUpperCase(),
      fleetNo: fleetNo,
      breakdownType: breakdownType,
      timestamp: timestamp || new Date().toISOString(),
      location: location || 'Unknown',
      description: description || '',
      severity: severity || 'medium',
      status: 'reported',
      resolution: null,
      resolvedAt: null,
      resolvedBy: null,
      diagnosticSession: diagnosticSession || null,
      notes: notes || '',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    // Add to logs array
    logsData.logs.push(newLog);
    
    // Save to file
    const saved = saveBreakdownLogs(logsData);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save breakdown log'
      });
    }
    
    console.log('✅ Breakdown logged successfully:', newLog.id);
    
    res.status(201).json({
      success: true,
      message: 'Breakdown logged successfully',
      data: {
        id: newLog.id,
        supervisorId: newLog.supervisorId,
        vehicleReg: newLog.vehicleReg,
        fleetNo: newLog.fleetNo,
        breakdownType: newLog.breakdownType,
        timestamp: newLog.timestamp,
        severity: newLog.severity,
        status: newLog.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error logging breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

// GET /api/breakdowns/logs - Get breakdown logs with filtering
router.get('/logs', (req, res) => {
  try {
    const {
      supervisorId,
      vehicleReg,
      fleetNo,
      breakdownType,
      status,
      severity,
      fromDate,
      toDate,
      limit = 100,
      offset = 0
    } = req.query;
    
    console.log('📊 Fetching breakdown logs with filters:', req.query);
    
    const logsData = loadBreakdownLogs();
    let logs = [...logsData.logs];
    
    // Apply filters
    if (supervisorId) {
      logs = logs.filter(log => log.supervisorId === supervisorId.toUpperCase());
    }
    
    if (vehicleReg) {
      logs = logs.filter(log => log.vehicleReg === vehicleReg.toUpperCase());
    }
    
    if (fleetNo) {
      logs = logs.filter(log => log.fleetNo === fleetNo);
    }
    
    if (breakdownType) {
      logs = logs.filter(log => log.breakdownType === breakdownType);
    }
    
    if (status) {
      logs = logs.filter(log => log.status === status);
    }
    
    if (severity) {
      logs = logs.filter(log => log.severity === severity);
    }
    
    if (fromDate) {
      const from = new Date(fromDate);
      logs = logs.filter(log => new Date(log.timestamp) >= from);
    }
    
    if (toDate) {
      const to = new Date(toDate);
      logs = logs.filter(log => new Date(log.timestamp) <= to);
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const total = logs.length;
    const paginatedLogs = logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    console.log(`✅ Returning ${paginatedLogs.length} of ${total} breakdown logs`);
    
    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching breakdown logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdown logs: ' + error.message
    });
  }
});

// GET /api/breakdowns/analytics - Get breakdown analytics and statistics
router.get('/analytics', (req, res) => {
  try {
    const { period = 'today', groupBy = 'type' } = req.query;
    
    console.log('📈 Generating breakdown analytics:', { period, groupBy });
    
    const logsData = loadBreakdownLogs();
    const logs = logsData.logs;
    
    // Filter by period
    let filteredLogs = logs;
    const now = new Date();
    
    switch (period) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredLogs = logs.filter(log => new Date(log.timestamp) >= today);
        break;
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= startOfYesterday && logDate < endOfYesterday;
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(log => new Date(log.timestamp) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(log => new Date(log.timestamp) >= monthAgo);
        break;
    }
    
    // Generate analytics
    const analytics = {
      period: period,
      totalBreakdowns: filteredLogs.length,
      periodStart: period === 'today' ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString() : null,
      periodEnd: new Date().toISOString(),
      
      // Breakdown by type
      breakdownTypes: {},
      
      // Breakdown by severity
      severity: {
        low: filteredLogs.filter(log => log.severity === 'low').length,
        medium: filteredLogs.filter(log => log.severity === 'medium').length,
        high: filteredLogs.filter(log => log.severity === 'high').length,
        critical: filteredLogs.filter(log => log.severity === 'critical').length
      },
      
      // Breakdown by status
      status: {
        reported: filteredLogs.filter(log => log.status === 'reported').length,
        'in-progress': filteredLogs.filter(log => log.status === 'in-progress').length,
        resolved: filteredLogs.filter(log => log.status === 'resolved').length
      },
      
      // Top supervisors (by number of reports)
      topSupervisors: {},
      
      // Top vehicles (by number of breakdowns)
      topVehicles: {},
      
      // Most common breakdown types
      commonTypes: []
    };
    
    // Count breakdowns by type
    filteredLogs.forEach(log => {
      analytics.breakdownTypes[log.breakdownType] = (analytics.breakdownTypes[log.breakdownType] || 0) + 1;
      analytics.topSupervisors[log.supervisorId] = (analytics.topSupervisors[log.supervisorId] || 0) + 1;
      analytics.topVehicles[log.vehicleReg] = (analytics.topVehicles[log.vehicleReg] || 0) + 1;
    });
    
    // Get most common breakdown types (top 5)
    analytics.commonTypes = Object.entries(analytics.breakdownTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    console.log(`✅ Generated analytics for ${filteredLogs.length} breakdowns (${period})`);
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('❌ Error generating breakdown analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics: ' + error.message
    });
  }
});

// PUT /api/breakdowns/logs/:id - Update an existing breakdown log
router.put('/logs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      resolution,
      resolvedBy,
      notes,
      severity
    } = req.body;
    
    console.log('🔄 Updating breakdown log:', id);
    
    const logsData = loadBreakdownLogs();
    const logIndex = logsData.logs.findIndex(log => log.id === id);
    
    if (logIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown log not found'
      });
    }
    
    const existingLog = logsData.logs[logIndex];
    
    // Update fields
    if (status) existingLog.status = status;
    if (resolution) existingLog.resolution = resolution;
    if (resolvedBy) existingLog.resolvedBy = resolvedBy;
    if (notes !== undefined) existingLog.notes = notes;
    if (severity) existingLog.severity = severity;
    
    // Set resolved timestamp if status is resolved
    if (status === 'resolved' && !existingLog.resolvedAt) {
      existingLog.resolvedAt = new Date().toISOString();
    }
    
    existingLog.updated = new Date().toISOString();
    
    // Save changes
    const saved = saveBreakdownLogs(logsData);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update breakdown log'
      });
    }
    
    console.log('✅ Breakdown log updated successfully:', id);
    
    res.json({
      success: true,
      message: 'Breakdown log updated successfully',
      data: existingLog
    });
    
  } catch (error) {
    console.error('❌ Error updating breakdown log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update breakdown log: ' + error.message
    });
  }
});

// DELETE /api/breakdowns/logs/:id - Delete a breakdown log (admin only)
router.delete('/logs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorId } = req.body;
    
    // Check if supervisor is admin (AG003 or BP009)
    if (!supervisorId || !['AG003', 'BP009'].includes(supervisorId.toUpperCase())) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required (AG003 or BP009)'
      });
    }
    
    console.log('🗑️ Deleting breakdown log:', id, 'by admin:', supervisorId);
    
    const logsData = loadBreakdownLogs();
    const logIndex = logsData.logs.findIndex(log => log.id === id);
    
    if (logIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown log not found'
      });
    }
    
    // Remove the log
    const deletedLog = logsData.logs.splice(logIndex, 1)[0];
    
    // Save changes
    const saved = saveBreakdownLogs(logsData);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete breakdown log'
      });
    }
    
    console.log('✅ Breakdown log deleted successfully:', id);
    
    res.json({
      success: true,
      message: 'Breakdown log deleted successfully',
      data: { id: deletedLog.id }
    });
    
  } catch (error) {
    console.error('❌ Error deleting breakdown log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete breakdown log: ' + error.message
    });
  }
});

// GET /api/breakdowns/types - Get list of valid breakdown types
router.get('/types', (req, res) => {
  res.json({
    success: true,
    data: VALID_BREAKDOWN_TYPES
  });
});

// GET /api/breakdowns/supervisors - Get list of valid supervisors
router.get('/supervisors', (req, res) => {
  res.json({
    success: true,
    data: VALID_SUPERVISORS
  });
});

// GET /api/breakdowns/health - Health check endpoint
router.get('/health', (req, res) => {
  try {
    const logsData = loadBreakdownLogs();
    res.json({
      success: true,
      status: 'healthy',
      data: {
        totalLogs: logsData.logs.length,
        lastUpdated: logsData.lastUpdated,
        version: logsData.version
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;