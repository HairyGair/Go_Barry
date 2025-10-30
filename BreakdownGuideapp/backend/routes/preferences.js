/**
 * User Preferences API Routes
 * Handles CRUD operations for supervisor preferences
 * Migrated from Supabase to MySQL
 */

import express from 'express';
import dotenv from 'dotenv';
import { from, query, insert, update } from '../utils/queryHelpers.js';
import { authenticateSupervisor } from '../middleware/authMiddleware.js';

// Load environment variables
dotenv.config();

const router = express.Router();

/**
 * GET /api/preferences
 * Get current user's preferences
 */
router.get('/', authenticateSupervisor, async (req, res) => {
  try {
    const supervisorId = req.supervisor.id;

    // Get preferences from database using query builder
    const { data: preferences, error } = await from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    // If no preferences exist, create with defaults
    if (error || !preferences) {
      const newPreferences = await insert('user_preferences', {
        supervisor_id: supervisorId
      });

      // Fetch the newly created preferences
      const { data: createdPrefs } = await from('user_preferences')
        .select('*')
        .eq('supervisor_id', supervisorId)
        .single();

      return res.json({
        success: true,
        preferences: createdPrefs
      });
    }

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Error in GET /api/preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * PUT /api/preferences
 * Update user's preferences
 */
router.put('/', authenticateSupervisor, async (req, res) => {
  try {
    const supervisorId = req.supervisor.id;
    const updates = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.supervisor_id;
    delete updates.created_at;
    delete updates.updated_at;

    // Check if preferences exist
    const { data: existingPrefs } = await from('user_preferences')
      .select('id')
      .eq('supervisor_id', supervisorId)
      .single();

    if (!existingPrefs) {
      // Create new preferences with provided updates
      const newPreferences = await insert('user_preferences', {
        supervisor_id: supervisorId,
        ...updates
      });

      // Fetch the created preferences
      const { data: createdPrefs } = await from('user_preferences')
        .select('*')
        .eq('supervisor_id', supervisorId)
        .single();

      return res.json({
        success: true,
        preferences: createdPrefs,
        created: true
      });
    }

    // Update existing preferences
    const affectedRows = await update('user_preferences', updates, {
      supervisor_id: supervisorId
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    // Fetch updated preferences
    const { data: updatedPreferences } = await from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    res.json({
      success: true,
      preferences: updatedPreferences
    });

  } catch (error) {
    console.error('Error in PUT /api/preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * PATCH /api/preferences
 * Partially update specific preference fields
 */
router.patch('/', authenticateSupervisor, async (req, res) => {
  try {
    const supervisorId = req.supervisor.id;
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: key'
      });
    }

    // Build update object
    const updates = { [key]: value };

    // Update single field
    const affectedRows = await update('user_preferences', updates, {
      supervisor_id: supervisorId
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    // Fetch updated preferences
    const { data: updatedPreferences } = await from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    res.json({
      success: true,
      preferences: updatedPreferences,
      updated: { [key]: value }
    });

  } catch (error) {
    console.error('Error in PATCH /api/preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * DELETE /api/preferences
 * Reset preferences to defaults
 */
router.delete('/', authenticateSupervisor, async (req, res) => {
  try {
    const supervisorId = req.supervisor.id;

    // Delete existing preferences using raw query
    await query(
      'DELETE FROM user_preferences WHERE supervisor_id = ?',
      [supervisorId]
    );

    // Create new default preferences
    await insert('user_preferences', {
      supervisor_id: supervisorId
    });

    // Fetch the newly created default preferences
    const { data: defaultPreferences } = await from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    res.json({
      success: true,
      message: 'Preferences reset to defaults',
      preferences: defaultPreferences
    });

  } catch (error) {
    console.error('Error in DELETE /api/preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/preferences/export
 * Export preferences as JSON backup
 */
router.post('/export', authenticateSupervisor, async (req, res) => {
  try {
    const supervisorId = req.supervisor.id;

    // Get all preferences
    const { data: preferences, error } = await from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    if (error || !preferences) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    // Build export object
    const exportData = {
      exportDate: new Date().toISOString(),
      supervisor: {
        id: req.supervisor.id,
        email: req.supervisor.email,
        name: req.supervisor.name,
        depot: req.supervisor.depot
      },
      preferences
    };

    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Error in POST /api/preferences/export:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/preferences/import
 * Import preferences from backup JSON
 */
router.post('/import', authenticateSupervisor, async (req, res) => {
  try {
    const supervisorId = req.supervisor.id;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Missing preferences data'
      });
    }

    // Remove fields that shouldn't be imported
    delete preferences.id;
    delete preferences.supervisor_id;
    delete preferences.created_at;
    delete preferences.updated_at;

    // Update with imported preferences
    const affectedRows = await update('user_preferences', preferences, {
      supervisor_id: supervisorId
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    // Fetch updated preferences
    const { data: updatedPreferences } = await from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    res.json({
      success: true,
      message: 'Preferences imported successfully',
      preferences: updatedPreferences
    });

  } catch (error) {
    console.error('Error in POST /api/preferences/import:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;
