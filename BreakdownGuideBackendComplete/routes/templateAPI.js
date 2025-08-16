// backend/routes/templateAPI.js
// API endpoints for message templates using Supabase

import express from 'express';
import supabaseTemplates from '../services/supabaseTemplates.js';

const router = express.Router();

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;
    const result = await supabaseTemplates.getTemplates(category);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get most used templates
router.get('/templates/most-used', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const result = await supabaseTemplates.getMostUsedTemplates(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Error in GET /templates/most-used:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search templates
router.get('/templates/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }
    const result = await supabaseTemplates.searchTemplates(q);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /templates/search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get template by ID
router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await supabaseTemplates.getTemplateById(templateId);
    
    if (!result.success || !result.template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in GET /templates/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new template
router.post('/templates', async (req, res) => {
  try {
    const templateData = req.body;
    
    // Validate required fields
    if (!templateData.name || !templateData.subject || !templateData.content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, subject, and content are required' 
      });
    }
    
    const result = await supabaseTemplates.createTemplate(templateData);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Error in POST /templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a template
router.put('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;
    
    if (!updates.supervisorBadge || !updates.supervisorName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supervisor badge and name are required' 
      });
    }
    
    const result = await supabaseTemplates.updateTemplate(templateId, updates);
    res.json(result);
  } catch (error) {
    console.error('Error in PUT /templates/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a template (soft delete)
router.delete('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { supervisorBadge } = req.query;
    
    if (!supervisorBadge) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supervisor badge is required' 
      });
    }
    
    const result = await supabaseTemplates.deleteTemplate(templateId, supervisorBadge);
    res.json(result);
  } catch (error) {
    console.error('Error in DELETE /templates/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record template usage
router.post('/templates/:templateId/use', async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await supabaseTemplates.recordTemplateUsage(templateId);
    res.json(result);
  } catch (error) {
    console.error('Error in POST /templates/:id/use:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get templates by routes
router.post('/templates/by-routes', async (req, res) => {
  try {
    const { routes } = req.body;
    
    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Routes array is required' 
      });
    }
    
    const result = await supabaseTemplates.getTemplatesByRoutes(routes);
    res.json(result);
  } catch (error) {
    console.error('Error in POST /templates/by-routes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
