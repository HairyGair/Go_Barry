// backend/services/incidentService.js
// Service for fetching and managing incident data

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

class IncidentService {
  async getActiveIncidents() {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not configured, returning empty incidents');
        return [];
      }

      // Fetch active incidents from Supabase
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('status', 'active')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Supabase incidents error:', error);
        return [];
      }

      // Transform to consistent format
      return data.map(inc => ({
        id: inc.id,
        title: inc.title,
        incidentType: inc.incident_type,
        location: inc.location,
        description: inc.description,
        severity: inc.severity || 'medium',
        coordinates: inc.coordinates ? {
          lat: inc.coordinates.latitude || inc.coordinates.lat,
          lng: inc.coordinates.longitude || inc.coordinates.lng
        } : null,
        affectedRoutes: inc.affected_routes || [],
        createdAt: inc.created_at,
        updatedAt: inc.updated_at,
        estimatedClearTime: inc.estimated_clear_time,
        supervisorId: inc.supervisor_id,
        supervisorName: inc.supervisor_name,
        source: inc.source || 'supervisor',
        status: inc.status
      }));

    } catch (error) {
      console.error('❌ Incident service error:', error);
      return [];
    }
  }

  async getIncidentById(id) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not configured');
        return null;
      }

      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Get incident error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Incident service error:', error);
      return null;
    }
  }

  async createIncident(incidentData) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not configured');
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('incidents')
        .insert([{
          ...incidentData,
          created_at: new Date().toISOString(),
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Create incident error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Incident service error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateIncident(id, updates) {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not configured');
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('incidents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Update incident error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Incident service error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new IncidentService();
export { IncidentService };
