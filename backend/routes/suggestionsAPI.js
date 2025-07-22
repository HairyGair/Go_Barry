import express from 'express';
import { actionSuggestions } from '../services/actionSuggestions.js';
import { supervisorManager } from '../services/supervisorManager.js';

const router = express.Router();

// Get AI action suggestions for an incident
router.post('/api/suggestions/actions', async (req, res) => {
  try {
    const { incident, supervisorBadge } = req.body;

    // Validate supervisor session
    if (supervisorBadge) {
      const supervisor = supervisorManager.getSupervisor(supervisorBadge);
      if (!supervisor) {
        return res.status(401).json({
          success: false,
          error: 'Invalid supervisor session'
        });
      }
    }

    // Validate incident data
    if (!incident || !incident.location) {
      return res.status(400).json({
        success: false,
        error: 'Incident location is required'
      });
    }

    // Get suggestions
    const result = await actionSuggestions.getSuggestions(incident);

    // Log usage for analytics
    console.log(`📊 Action suggestions requested by ${supervisorBadge || 'anonymous'} for incident at ${incident.location}`);

    res.json(result);
  } catch (error) {
    console.error('❌ Action suggestions API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get suggestions for a specific alert ID
router.get('/api/suggestions/alert/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    // TODO: Fetch alert from database
    // For now, return mock suggestions
    const mockIncident = {
      id: alertId,
      location: 'A1 Newcastle',
      severity: 'high',
      type: 'accident',
      created_at: new Date().toISOString()
    };

    const result = await actionSuggestions.getSuggestions(mockIncident);
    res.json(result);
  } catch (error) {
    console.error('❌ Alert suggestions API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;