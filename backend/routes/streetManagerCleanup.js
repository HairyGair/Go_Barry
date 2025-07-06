/**
 * Street Manager Cleanup API
 * Provides endpoints for managing hybrid storage cleanup operations
 */

import express from 'express';
import HybridStreetManagerStorage from '../services/hybridStreetManagerStorage.js';

const router = express.Router();
const hybridStorage = new HybridStreetManagerStorage();

// Manual cleanup endpoint
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 Manual cleanup requested via API');
    
    const result = await hybridStorage.runCleanupJob();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Cleanup completed: ${result.cleanedCount} old notifications removed`,
        cleanedCount: result.cleanedCount,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Cleanup job failed'
      });
    }
  } catch (error) {
    console.error('❌ Cleanup API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error during cleanup'
    });
  }
});

// Get cleanup stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await hybridStorage.getStorageStats();
    
    // Get cleanup job history
    const { data: cleanupHistory } = await hybridStorage.supabase
      .from('cleanup_jobs')
      .select('*')
      .eq('job_type', 'streetmanager_cleanup')
      .order('run_date', { ascending: false })
      .limit(10);
    
    res.json({
      success: true,
      storage: stats,
      cleanup_history: cleanupHistory || [],
      retention_policy: '7 days after roadwork completion',
      next_cleanup: 'Automatic daily at 2 AM',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active notifications (dashboard data)
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await hybridStorage.getActiveNotifications();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      active_notifications: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Active notifications API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get full notification details (summary + payload)
router.get('/notification/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { summary, fullPayload } = await hybridStorage.getNotificationWithDetails(notificationId);
    
    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      summary,
      full_payload: fullPayload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Notification details API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Message templates endpoints
router.get('/templates', async (req, res) => {
  try {
    const { data, error } = await hybridStorage.supabase
      .from('driver_message_templates')
      .select('*')
      .order('last_used', { ascending: false });
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      templates: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Templates API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { location_key, message_template, supervisor_badge } = req.body;
    
    if (!location_key || !message_template) {
      return res.status(400).json({
        success: false,
        message: 'location_key and message_template are required'
      });
    }
    
    const result = await hybridStorage.storeMessageTemplate(
      location_key,
      message_template,
      supervisor_badge
    );
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Template saved successfully',
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Template save API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;