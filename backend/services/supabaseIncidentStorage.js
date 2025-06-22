// backend/services/supabaseIncidentStorage.js
// Supabase-powered storage for manual incidents with 3-month retention

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all manual incidents
 */
export async function getAllIncidents() {
  try {
    const { data, error } = await supabase
      .from('manual_incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching incidents from Supabase:', error);
      return [];
    }

    console.log(`📖 Loaded ${data.length} incidents from Supabase`);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch incidents:', error.message);
    return [];
  }
}

/**
 * Add a new manual incident
 */
export async function addIncident(incident) {
  try {
    // Ensure incident has required fields with proper mapping
    const incidentData = {
      id: incident.id || `incident_${Date.now()}`,
      type: incident.type,
      subtype: incident.subtype,
      location: incident.location,
      coordinates: incident.coordinates,
      description: incident.description || '',
      start_time: incident.startTime || new Date().toISOString(),
      end_time: incident.endTime,
      severity: incident.severity || 'Medium',
      notes: incident.notes || '',
      affected_routes: incident.affectsRoutes || [],
      status: incident.status || 'active',
      created_by: incident.createdBy || 'Unknown',
      created_by_name: incident.createdByName || 'Unknown',
      created_by_role: incident.createdByRole || 'Supervisor',
      enhanced_with_tomtom: incident.enhancedWithTomTom || false,
      tomtom_features: incident.tomtomFeatures || null,
      source: incident.source || 'manual',
      created_at: incident.createdAt || new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('manual_incidents')
      .insert([incidentData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving incident to Supabase:', error);
      throw new Error(`Failed to save incident: ${error.message}`);
    }

    console.log(`✅ Saved incident to Supabase: ${data.id} (${data.location})`);

    // Log supervisor action
    await logSupervisorAction(
      incident.createdBy || 'unknown',
      incident.createdByName || 'Unknown',
      'incident_created',
      'incident',
      data.id,
      {
        location: data.location,
        severity: data.severity,
        affected_routes: data.affected_routes?.length || 0
      }
    );

    return convertToAPIFormat(data);
  } catch (error) {
    console.error('❌ Failed to add incident:', error.message);
    throw error;
  }
}

/**
 * Update an existing incident
 */
export async function updateIncident(id, updates) {
  try {
    const updateData = {
      ...updates,
      last_updated: new Date().toISOString()
    };

    // Convert API field names to database field names
    if (updates.startTime) updateData.start_time = updates.startTime;
    if (updates.endTime) updateData.end_time = updates.endTime;
    if (updates.affectsRoutes) updateData.affected_routes = updates.affectsRoutes;
    if (updates.createdBy) updateData.created_by = updates.createdBy;
    if (updates.createdByName) updateData.created_by_name = updates.createdByName;
    if (updates.createdByRole) updateData.created_by_role = updates.createdByRole;
    if (updates.enhancedWithTomTom) updateData.enhanced_with_tomtom = updates.enhancedWithTomTom;
    if (updates.tomtomFeatures) updateData.tomtom_features = updates.tomtomFeatures;

    const { data, error } = await supabase
      .from('manual_incidents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating incident in Supabase:', error);
      return null;
    }

    console.log(`✅ Updated incident in Supabase: ${id}`);

    // Log supervisor action if it's a status change
    if (updates.status) {
      await logSupervisorAction(
        updates.updatedBy || 'unknown',
        updates.updatedByName || 'Unknown',
        'incident_status_changed',
        'incident',
        id,
        {
          old_status: data.status,
          new_status: updates.status,
          notes: updates.notes
        }
      );
    }

    return convertToAPIFormat(data);
  } catch (error) {
    console.error('❌ Failed to update incident:', error.message);
    throw error;
  }
}

/**
 * Delete an incident
 */
export async function deleteIncident(id) {
  try {
    // Get the incident first to return it
    const { data: incident, error: selectError } = await supabase
      .from('manual_incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (selectError || !incident) {
      console.error('❌ Incident not found for deletion:', id);
      return null;
    }

    const { error } = await supabase
      .from('manual_incidents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting incident from Supabase:', error);
      return null;
    }

    console.log(`✅ Deleted incident from Supabase: ${id}`);

    // Log supervisor action
    await logSupervisorAction(
      'system',
      'System',
      'incident_deleted',
      'incident',
      id,
      {
        location: incident.location,
        severity: incident.severity
      }
    );

    return convertToAPIFormat(incident);
  } catch (error) {
    console.error('❌ Failed to delete incident:', error.message);
    throw error;
  }
}

/**
 * Get a specific incident by ID
 */
export async function getIncidentById(id) {
  try {
    const { data, error } = await supabase
      .from('manual_incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return convertToAPIFormat(data);
  } catch (error) {
    console.error('❌ Failed to get incident by ID:', error.message);
    return null;
  }
}

/**
 * Get incident statistics
 */
export async function getIncidentStats() {
  try {
    const { data: incidents, error } = await supabase
      .from('manual_incidents')
      .select('*');

    if (error) {
      console.error('❌ Error fetching incidents for stats:', error);
      return getEmptyStats();
    }

    const stats = {
      total: incidents.length,
      active: incidents.filter(inc => inc.status === 'active').length,
      monitoring: incidents.filter(inc => inc.status === 'monitoring').length,
      resolved: incidents.filter(inc => inc.status === 'resolved').length,
      byType: {},
      bySeverity: {},
      recentCount: 0
    };

    // Count by type and severity
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    incidents.forEach(incident => {
      // Count by type
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[incident.severity || 'Unknown'] = (stats.bySeverity[incident.severity || 'Unknown'] || 0) + 1;

      // Count recent incidents
      if (new Date(incident.created_at) > oneDayAgo) {
        stats.recentCount++;
      }
    });

    return stats;
  } catch (error) {
    console.error('❌ Failed to get incident stats:', error.message);
    return getEmptyStats();
  }
}

/**
 * Clean up old incidents (3+ months)
 */
export async function cleanupOldIncidents() {
  try {
    console.log('🧹 Starting incident cleanup...');

    const { data, error } = await supabase
      .rpc('cleanup_old_data');

    if (error) {
      console.error('❌ Error during cleanup:', error);
      return { success: false, error: error.message };
    }

    const incidentCleanup = data.find(row => row.table_name === 'manual_incidents');
    const deletedCount = incidentCleanup ? incidentCleanup.deleted_count : 0;

    console.log(`✅ Cleanup completed: ${deletedCount} old incidents removed`);

    return {
      success: true,
      deletedCount: parseInt(deletedCount),
      cleanedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to cleanup old incidents:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Log supervisor action for audit trail
 */
async function logSupervisorAction(supervisorBadge, supervisorName, actionType, targetType, targetId, details) {
  try {
    const { error } = await supabase
      .from('supervisor_actions')
      .insert([{
        supervisor_badge: supervisorBadge,
        supervisor_name: supervisorName,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        details: details
      }]);

    if (error) {
      console.warn('⚠️ Failed to log supervisor action:', error.message);
    }
  } catch (error) {
    console.warn('⚠️ Failed to log supervisor action:', error.message);
  }
}

/**
 * Convert database format to API format for backward compatibility
 */
function convertToAPIFormat(dbRecord) {
  return {
    id: dbRecord.id,
    type: dbRecord.type,
    subtype: dbRecord.subtype,
    location: dbRecord.location,
    coordinates: dbRecord.coordinates,
    description: dbRecord.description,
    startTime: dbRecord.start_time,
    endTime: dbRecord.end_time,
    severity: dbRecord.severity,
    notes: dbRecord.notes,
    affectsRoutes: dbRecord.affected_routes,
    status: dbRecord.status,
    createdBy: dbRecord.created_by,
    createdByName: dbRecord.created_by_name,
    createdByRole: dbRecord.created_by_role,
    enhancedWithTomTom: dbRecord.enhanced_with_tomtom,
    tomtomFeatures: dbRecord.tomtom_features,
    source: dbRecord.source,
    createdAt: dbRecord.created_at,
    lastUpdated: dbRecord.last_updated
  };
}

/**
 * Get empty stats structure
 */
function getEmptyStats() {
  return {
    total: 0,
    active: 0,
    monitoring: 0,
    resolved: 0,
    byType: {},
    bySeverity: {},
    recentCount: 0
  };
}

/**
 * Clear the cache (for compatibility with existing code)
 */
export function clearCache() {
  console.log('🔄 Cache clearing not needed with Supabase - data is always fresh');
}

/**
 * Initialize the storage system
 */
export async function initializeStorage() {
  try {
    // Test connection
    const { data, error } = await supabase
      .from('manual_incidents')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Failed to initialize Supabase incident storage:', error.message);
      return false;
    }

    console.log('✅ Supabase incident storage initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase incident storage:', error.message);
    return false;
  }
}

export default {
  getAllIncidents,
  addIncident,
  updateIncident,
  deleteIncident,
  getIncidentById,
  getIncidentStats,
  cleanupOldIncidents,
  clearCache,
  initializeStorage
};
