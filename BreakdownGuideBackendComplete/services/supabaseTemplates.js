// backend/services/supabaseTemplates.js
// Supabase integration for message templates

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class SupabaseTemplateService {
  // Get all active templates
  async getTemplates(category = null) {
    try {
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('use_count', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, templates: data || [] };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return { success: false, error: error.message, templates: [] };
    }
  }

  // Get most used templates
  async getMostUsedTemplates(limit = 5) {
    try {
      const { data, error } = await supabase
        .rpc('get_most_used_templates', { p_limit: limit });

      if (error) throw error;
      return { success: true, templates: data || [] };
    } catch (error) {
      console.error('Error fetching most used templates:', error);
      return { success: false, error: error.message, templates: [] };
    }
  }

  // Create a new template
  async createTemplate(templateData) {
    try {
      const templateId = `TPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          template_id: templateId,
          name: templateData.name,
          category: templateData.category,
          subject: templateData.subject,
          content: templateData.content,
          routes: templateData.routes || [],
          is_urgent: templateData.isUrgent || false,
          created_by: templateData.supervisorBadge,
          created_by_name: templateData.supervisorName,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, template: data };
    } catch (error) {
      console.error('Error creating template:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing template
  async updateTemplate(templateId, updates) {
    try {
      const updateData = {
        last_modified_by: updates.supervisorBadge,
        last_modified_by_name: updates.supervisorName,
        last_modified_at: new Date().toISOString(),
      };

      // Only update provided fields
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.subject !== undefined) updateData.subject = updates.subject;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.routes !== undefined) updateData.routes = updates.routes;
      if (updates.isUrgent !== undefined) updateData.is_urgent = updates.isUrgent;

      const { data, error } = await supabase
        .from('message_templates')
        .update(updateData)
        .eq('template_id', templateId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) throw error;
      return { success: true, template: data };
    } catch (error) {
      console.error('Error updating template:', error);
      return { success: false, error: error.message };
    }
  }

  // Soft delete a template
  async deleteTemplate(templateId, supervisorBadge) {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
          deleted_by: supervisorBadge,
        })
        .eq('template_id', templateId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, template: data };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: error.message };
    }
  }

  // Record template usage
  async recordTemplateUsage(templateId) {
    try {
      const { error } = await supabase
        .rpc('update_template_usage', { p_template_id: templateId });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error recording template usage:', error);
      return { success: false, error: error.message };
    }
  }

  // Search templates
  async searchTemplates(searchQuery) {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('use_count', { ascending: false });

      if (error) throw error;
      return { success: true, templates: data || [] };
    } catch (error) {
      console.error('Error searching templates:', error);
      return { success: false, error: error.message, templates: [] };
    }
  }

  // Get template by ID
  async getTemplateById(templateId) {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { success: true, template: data };
    } catch (error) {
      console.error('Error fetching template:', error);
      return { success: false, error: error.message };
    }
  }

  // Get templates by routes
  async getTemplatesByRoutes(routes) {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .contains('routes', routes)
        .order('use_count', { ascending: false });

      if (error) throw error;
      return { success: true, templates: data || [] };
    } catch (error) {
      console.error('Error fetching templates by routes:', error);
      return { success: false, error: error.message, templates: [] };
    }
  }
}

export default new SupabaseTemplateService();
