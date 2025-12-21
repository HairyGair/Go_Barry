/**
 * Assessment Broadcast Routes
 * Handles real-time assessment progress broadcasts from breakdown guide wizards
 * to SDC Dashboard and other connected clients
 */

import express from 'express';
import webSocketHandler from './webSocketHandler.js';

const router = express.Router();

/**
 * POST /api/assessment/broadcast
 * Broadcasts assessment progress to all connected clients
 * No authentication required - assessment updates are public broadcasts
 */
router.post('/broadcast', (req, res) => {
  try {
    const {
      type,
      assessmentId,
      breakdownId,
      wizardType,
      totalSteps,
      currentStep,
      stepDescription,
      progress,
      supervisor,
      vehicle,
      location,
      route,
      decision,
      severity,
      result,
      startTime,
      estimatedCompletion,
      completedAt
    } = req.body;

    // Validate required fields
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Broadcast type is required'
      });
    }

    // Build broadcast data
    const broadcastData = {
      type,
      assessmentId,
      breakdownId,
      wizardType,
      totalSteps,
      currentStep,
      stepDescription,
      progress,
      supervisor,
      vehicle,
      location,
      route,
      decision,
      severity,
      result,
      startTime,
      estimatedCompletion,
      completedAt,
      timestamp: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(broadcastData).forEach(key => {
      if (broadcastData[key] === undefined) {
        delete broadcastData[key];
      }
    });

    // Broadcast to SDC Dashboard
    const sdcCount = webSocketHandler.broadcast('sdc-dashboard', {
      type: 'assessment_update',
      data: broadcastData
    });

    // Also broadcast to control room for visibility
    const controlCount = webSocketHandler.broadcast('control-room', {
      type: 'assessment_update',
      data: broadcastData
    });

    // Log significant events
    if (type === 'assessment_started' || type === 'assessment_completed') {
      console.log(`📡 Assessment broadcast [${type}]:`, {
        assessmentId,
        wizardType,
        vehicle: vehicle?.fleet_no || vehicle?.fleetNumber,
        supervisor: supervisor?.name || supervisor?.badge,
        sdcClients: sdcCount,
        controlClients: controlCount
      });
    }

    res.json({
      success: true,
      message: 'Broadcast sent',
      clients: {
        sdc: sdcCount,
        control: controlCount,
        total: sdcCount + controlCount
      }
    });

  } catch (error) {
    console.error('Assessment broadcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast assessment update'
    });
  }
});

/**
 * GET /api/assessment/active
 * Returns list of currently active assessments (in progress)
 */
router.get('/active', (req, res) => {
  try {
    // Active assessments would be tracked via WebSocket handler
    // For now, return empty array - this could be enhanced to track active assessments
    res.json({
      success: true,
      assessments: [],
      message: 'Active assessments tracking not implemented'
    });
  } catch (error) {
    console.error('Error fetching active assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active assessments'
    });
  }
});

export default router;
