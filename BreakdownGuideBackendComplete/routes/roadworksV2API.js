// Roadworks Manager V2 API Routes
// Provides endpoints for the supervisor review queue and streetworks management

import express from 'express';
import { 
  getPendingStreetworks,
  updateStreetworkReview,
  getStreetworkStats,
  searchStreetworks
} from '../services/streetManagerProcessor.js';
import { createClient } from '@supabase/supabase-js';
import roadworksAnalyticsRouter from './roadworksAnalyticsAPI.js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Get pending streetworks for review
router.get('/pending', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = await getPendingStreetworks(parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error fetching pending streetworks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Review a streetwork
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      confirmedRoutes, 
      severity, 
      diversionRequired, 
      notes,
      supervisorId,
      supervisorName
    } = req.body;

    if (!supervisorId || !supervisorName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supervisor credentials required' 
      });
    }

    const reviewData = {
      status,
      confirmedRoutes,
      severity,
      diversionRequired,
      notes
    };

    const result = await updateStreetworkReview(
      id, 
      reviewData, 
      supervisorId, 
      supervisorName
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Streetwork reviewed successfully'
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error reviewing streetwork:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get streetwork statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await getStreetworkStats();
    
    if (result.success) {
      res.json({
        success: true,
        stats: result.stats
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error fetching streetwork stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search streetworks
router.post('/search', async (req, res) => {
  try {
    const criteria = req.body;
    const result = await searchStreetworks(criteria);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error searching streetworks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reviewed streetworks for monitoring tab
router.get('/reviewed', async (req, res) => {
  try {
    console.log('📡 Fetching reviewed streetworks for monitoring tab...');
    
    const { data: streetworks, error } = await supabase
      .from('streetworks')
      .select('*')
      .not('status', 'eq', 'pending_review') // Exclude pending reviews
      .not('reviewed_by', 'is', null) // Must have been reviewed
      .order('reviewed_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('❌ Error fetching reviewed streetworks:', error);
      throw error;
    }
    
    // Transform to frontend format
    const transformedRoadworks = (streetworks || []).map(sw => ({
      id: sw.id,
      title: sw.sm_street_name ? 
        `${sw.sm_street_name} - ${sw.sm_activity_type || 'Street Works'}` : 
        sw.sm_works_description || 'Reviewed Streetwork',
      location: sw.sm_street_name,
      description: sw.sm_works_description,
      status: sw.status, // This is the key field for monitoring tab
      severity: sw.severity || 'medium',
      source: 'ReviewedStreetworks',
      startDate: sw.sm_start_date,
      endDate: sw.sm_end_date,
      affectsRoutes: sw.confirmed_routes || [],
      hasDiversion: sw.diversion_required || false,
      reviewedBy: sw.reviewed_by,
      reviewedAt: sw.reviewed_at,
      notes: sw.notes,
      coordinates: sw.latitude && sw.longitude ? [sw.latitude, sw.longitude] : null,
      // Original Street Manager data
      originalData: {
        sm_street_name: sw.sm_street_name,
        sm_area_name: sw.sm_area_name,
        sm_town: sw.sm_town,
        sm_works_description: sw.sm_works_description,
        sm_activity_type: sw.sm_activity_type
      }
    }));
    
    console.log(`✅ Found ${transformedRoadworks.length} reviewed streetworks`);
    console.log('📊 Status breakdown:', {
      monitoring: transformedRoadworks.filter(r => r.status === 'monitoring').length,
      approved: transformedRoadworks.filter(r => r.status === 'approved').length,
      rejected: transformedRoadworks.filter(r => r.status === 'rejected').length,
      completed: transformedRoadworks.filter(r => r.status === 'completed').length
    });
    
    res.json({
      success: true,
      roadworks: transformedRoadworks,
      count: transformedRoadworks.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching reviewed streetworks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all diversion templates
router.get('/diversion-templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('diversion_templates')
      .select('*')
      .eq('active', true)
      .order('usage_count', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      templates: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching all diversion templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get diversion templates for a route
router.get('/diversion-templates/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const { data, error } = await supabase
      .from('diversion_templates')
      .select('*')
      .eq('route_id', routeId)
      .eq('active', true)
      .order('usage_count', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching diversion templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a diversion template
router.post('/diversion-templates', async (req, res) => {
  try {
    const {
      name,
      route_id,
      trigger_locations,
      diversion_text,
      diversion_points,
      severity_threshold,
      auto_apply,
      created_by,
      created_by_name
    } = req.body;

    if (!created_by || !created_by_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supervisor credentials required' 
      });
    }

    const { data, error } = await supabase
      .from('diversion_templates')
      .insert({
        name,
        route_id,
        trigger_locations,
        diversion_text,
        diversion_points,
        severity_threshold: severity_threshold || 'medium',
        auto_apply: auto_apply || false,
        created_by
      })
      .select()
      .single();

    if (error) throw error;

    // Log supervisor action
    await supabase
      .from('supervisor_actions')
      .insert({
        action_type: 'create_diversion_template',
        target_type: 'diversion_template',
        target_id: data.id,
        supervisor_id: created_by,
        supervisor_name: created_by_name,
        action_details: { name, route_id }
      });

    res.json({
      success: true,
      data,
      message: 'Diversion template created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating diversion template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply a diversion template to a streetwork
router.post('/:id/apply-diversion', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      templateId, 
      customText,
      supervisorId,
      supervisorName
    } = req.body;

    if (!supervisorId || !supervisorName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supervisor credentials required' 
      });
    }

    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('diversion_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Update streetwork with diversion
    const { data: streetwork, error: updateError } = await supabase
      .from('streetworks')
      .update({
        diversion_template_id: templateId,
        diversion_required: true,
        notes: customText || template.diversion_text,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update template usage
    await supabase
      .from('diversion_templates')
      .update({
        usage_count: template.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId);

    // Log supervisor action
    await supabase
      .from('supervisor_actions')
      .insert({
        action_type: 'apply_diversion',
        target_type: 'streetwork',
        target_id: id,
        supervisor_id: supervisorId,
        supervisor_name: supervisorName,
        action_details: {
          template_id: templateId,
          template_name: template.name,
          custom_text: customText
        }
      });

    res.json({
      success: true,
      data: streetwork,
      template,
      message: 'Diversion applied successfully'
    });
  } catch (error) {
    console.error('❌ Error applying diversion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch approve multiple streetworks
router.post('/batch-approve', async (req, res) => {
  try {
    const { 
      streetworkIds, 
      severity,
      supervisorId,
      supervisorName
    } = req.body;

    if (!supervisorId || !supervisorName || !streetworkIds?.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request data' 
      });
    }

    const results = [];
    
    for (const id of streetworkIds) {
      const reviewData = {
        status: 'approved',
        confirmedRoutes: [], // Will keep auto-matched
        severity: severity || 'medium',
        diversionRequired: false,
        notes: 'Batch approved'
      };

      const result = await updateStreetworkReview(
        id,
        reviewData,
        supervisorId,
        supervisorName
      );

      results.push({
        id,
        success: result.success,
        error: result.error
      });
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Approved ${successCount} of ${streetworkIds.length} streetworks`,
      results
    });
  } catch (error) {
    console.error('❌ Error batch approving streetworks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount analytics routes
router.use('/analytics', roadworksAnalyticsRouter);
console.log('✅ Roadworks analytics routes mounted at /api/roadworks-v2/analytics');

export default router;
