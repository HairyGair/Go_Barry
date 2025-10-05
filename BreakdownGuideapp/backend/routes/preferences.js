/**
 * User Preferences API Routes
 * Handles CRUD operations for supervisor preferences
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateSupervisor } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/preferences
 * Get current user's preferences
 */
router.get('/', authenticateSupervisor, async (req, res) => {
  try {
    const supervisorId = req.supervisor.id;

    // Get preferences from database
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    // If no preferences exist, create with defaults
    if (error && error.code === 'PGRST116') {
      const { data: newPreferences, error: insertError } = await supabase
        .from('user_preferences')
        .insert([{ supervisor_id: supervisorId }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create default preferences',
          details: insertError.message
        });
      }

      return res.json({
        success: true,
        preferences: newPreferences
      });
    }

    if (error) {
      console.error('Error fetching preferences:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch preferences',
        details: error.message
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
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.supervisor_id;
    delete updates.created_at;
    delete updates.updated_at;

    // Update preferences in database
    const { data: updatedPreferences, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('supervisor_id', supervisorId)
      .select()
      .single();

    if (error) {
      // If record doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { data: newPreferences, error: insertError } = await supabase
          .from('user_preferences')
          .insert([{ supervisor_id: supervisorId, ...updates }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
          return res.status(500).json({
            success: false,
            error: 'Failed to create preferences',
            details: insertError.message
          });
        }

        return res.json({
          success: true,
          preferences: newPreferences,
          created: true
        });
      }

      console.error('Error updating preferences:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update preferences',
        details: error.message
      });
    }

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
    const { data: updatedPreferences, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('supervisor_id', supervisorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preference:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update preference',
        details: error.message
      });
    }

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

    // Delete existing preferences
    const { error: deleteError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('supervisor_id', supervisorId);

    if (deleteError) {
      console.error('Error deleting preferences:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete preferences',
        details: deleteError.message
      });
    }

    // Create new default preferences
    const { data: defaultPreferences, error: createError } = await supabase
      .from('user_preferences')
      .insert([{ supervisor_id: supervisorId }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating default preferences:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create default preferences',
        details: createError.message
      });
    }

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
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .single();

    if (error) {
      console.error('Error fetching preferences for export:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch preferences',
        details: error.message
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
    const { data: updatedPreferences, error } = await supabase
      .from('user_preferences')
      .update(preferences)
      .eq('supervisor_id', supervisorId)
      .select()
      .single();

    if (error) {
      console.error('Error importing preferences:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to import preferences',
        details: error.message
      });
    }

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
