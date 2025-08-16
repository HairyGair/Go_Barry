import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../services/supabaseHelper.js';

const router = express.Router();

// Push alert to display screen
router.post('/push-to-display', async (req, res) => {
  try {
    const { alert } = req.body;
    
    if (!alert) {
      return res.status(400).json({
        success: false,
        error: 'Alert data is required'
      });
    }
    
    // Here you would typically update Convex or another real-time system
    // For now, we'll log the action
    console.log('📺 Alert pushed to display:', {
      id: alert.id,
      location: alert.street_name || alert.location,
      pushedBy: alert.pushedBy,
      pushedAt: alert.pushedAt
    });
    
    res.json({
      success: true,
      message: 'Alert pushed to display screen',
      alertId: alert.id
    });
  } catch (error) {
    console.error('Error pushing alert to display:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;