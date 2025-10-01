/*
 * Breakdown Assessment Routes
 * Handles supervisor assessment logging
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage
const assessmentsDB = new Map();

// Log assessment
router.post('/log', async (req, res) => {
  try {
    const {
      supervisorId,
      supervisorName,
      vehicleReg,
      fleetNo,
      breakdownType,
      decision,
      location,
      notes,
      wizardData
    } = req.body;
    
    const assessmentId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const assessment = {
      id: assessmentId,
      supervisorId,
      supervisorName,
      vehicleReg,
      fleetNo,
      breakdownType,
      decision,
      location,
      notes,
      wizardData,
      timestamp,
      duration: wizardData?.duration || null
    };
    
    assessmentsDB.set(assessmentId, assessment);
    
    res.json({
      success: true,
      message: 'Assessment logged successfully',
      assessmentId,
      timestamp
    });
  } catch (error) {
    console.error('Error logging assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log assessment'
    });
  }
});

// Get recent assessments
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20, supervisorId } = req.query;
    
    let assessments = Array.from(assessmentsDB.values());
    
    // Filter by supervisor if specified
    if (supervisorId) {
      assessments = assessments.filter(a => a.supervisorId === supervisorId);
    }
    
    // Sort by timestamp (newest first)
    assessments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit results
    assessments = assessments.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      assessments,
      count: assessments.length
    });
  } catch (error) {
    console.error('Error getting recent assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent assessments'
    });
  }
});

// Get assessment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = assessmentsDB.get(id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }
    
    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Error getting assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessment'
    });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const assessments = Array.from(assessmentsDB.values());
    
    // Calculate statistics
    const stats = {
      total: assessments.length,
      byDecision: {
        STOP: assessments.filter(a => a.decision === 'STOP').length,
        AMBER: assessments.filter(a => a.decision === 'AMBER').length,
        CONTINUE: assessments.filter(a => a.decision === 'CONTINUE').length
      },
      bySupervisor: {},
      byType: {},
      avgDuration: 0
    };
    
    // Count by supervisor
    assessments.forEach(a => {
      if (!stats.bySupervisor[a.supervisorId]) {
        stats.bySupervisor[a.supervisorId] = 0;
      }
      stats.bySupervisor[a.supervisorId]++;
      
      // Count by type
      if (!stats.byType[a.breakdownType]) {
        stats.byType[a.breakdownType] = 0;
      }
      stats.byType[a.breakdownType]++;
    });
    
    // Calculate average duration
    const durations = assessments
      .filter(a => a.duration)
      .map(a => parseInt(a.duration));
    
    if (durations.length > 0) {
      stats.avgDuration = Math.round(
        durations.reduce((sum, d) => sum + d, 0) / durations.length
      );
    }
    
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

export default router;
