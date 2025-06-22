// backend/services/supabaseRoadworksStorage.js
// Supabase-powered storage for manual roadworks with 3-month retention

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
 * Get all roadworks with optional filtering
 */
export async function getAllRoadworks(filters = {}) {
  try {
    let query = supabase
      .from('manual_roadworks')
      .select('*');

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters.dateFrom) {
      query = query.gte('planned_start_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('planned_start_date', filters.dateTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching roadworks from Supabase:', error);
      return [];
    }

    console.log(`📖 Loaded ${data.length} roadworks from Supabase`);
    return data.map(convertToAPIFormat);
  } catch (error) {
    console.error('❌ Failed to fetch roadworks:', error.message);
    return [];
  }
}

/**
 * Add a new roadwork
 */
export async function addRoadwork(roadwork) {
  try {
    // Map API format to database format
    const roadworkData = {
      id: roadwork.id || `roadwork_${Date.now()}`,
      title: roadwork.title,
      description: roadwork.description || '',
      location: roadwork.location,
      coordinates: roadwork.coordinates,
      
      // Authority/Contact Information
      authority: roadwork.authority || 'Unknown Authority',
      contact_person: roadwork.contactPerson || '',
      contact_phone: roadwork.contactPhone || '',
      contact_email: roadwork.contactEmail || '',
      
      // Timing
      planned_start_date: roadwork.plannedStartDate,
      planned_end_date: roadwork.plannedEndDate,
      estimated_duration: roadwork.estimatedDuration || 'Unknown',
      actual_start_date: roadwork.actualStartDate,
      actual_end_date: roadwork.actualEndDate,
      
      // Classification
      roadwork_type: roadwork.roadworkType || 'general',
      traffic_management: roadwork.trafficManagement || 'traffic_control',
      priority: roadwork.priority || 'medium',
      
      // Route Impact
      affected_routes: roadwork.affectedRoutes || [],
      impact_assessment: roadwork.impactAssessment || null,
      
      // Workflow
      status: roadwork.status || 'reported',
      assigned_to: roadwork.assignedTo,
      assigned_to_name: roadwork.assignedToName,
      
      // Task Management
      tasks: roadwork.tasks || [],
      communications: roadwork.communications || [],
      diversions: roadwork.diversions || [],
      council_coordination: roadwork.councilCoordination || [],
      
      // Audit Trail
      created_by: roadwork.createdBy,
      created_by_name: roadwork.createdByName,
      created_by_role: roadwork.createdByRole,
      status_history: roadwork.statusHistory || [],
      
      // Source Information
      source_type: roadwork.sourceType || 'manual',
      source_reference: roadwork.sourceReference || '',
      notification_method: roadwork.notificationMethod || 'manual',
      
      // Display Control
      promoted_to_display: roadwork.promotedToDisplay || false,
      display_notes: roadwork.displayNotes || '',
      
      // Timestamps
      created_at: roadwork.createdAt || new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('manual_roadworks')
      .insert([roadworkData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving roadwork to Supabase:', error);
      throw new Error(`Failed to save roadwork: ${error.message}`);
    }

    console.log(`✅ Saved roadwork to Supabase: ${data.id} (${data.location})`);

    // Log supervisor action
    await logSupervisorAction(
      roadwork.createdBy || 'unknown',
      roadwork.createdByName || 'Unknown',
      'roadwork_created',
      'roadwork',
      data.id,
      {
        location: data.location,
        priority: data.priority,
        affected_routes: data.affected_routes?.length || 0
      }
    );

    return convertToAPIFormat(data);
  } catch (error) {
    console.error('❌ Failed to add roadwork:', error.message);
    throw error;
  }
}

/**
 * Update an existing roadwork
 */
export async function updateRoadwork(id, updates) {
  try {
    const updateData = {
      ...updates,
      last_updated: new Date().toISOString()
    };

    // Convert API field names to database field names
    const fieldMapping = {
      contactPerson: 'contact_person',
      contactPhone: 'contact_phone',
      contactEmail: 'contact_email',
      plannedStartDate: 'planned_start_date',
      plannedEndDate: 'planned_end_date',
      estimatedDuration: 'estimated_duration',
      actualStartDate: 'actual_start_date',
      actualEndDate: 'actual_end_date',
      roadworkType: 'roadwork_type',
      trafficManagement: 'traffic_management',
      affectedRoutes: 'affected_routes',
      impactAssessment: 'impact_assessment',
      assignedTo: 'assigned_to',
      assignedToName: 'assigned_to_name',
      councilCoordination: 'council_coordination',
      createdBy: 'created_by',
      createdByName: 'created_by_name',
      createdByRole: 'created_by_role',
      statusHistory: 'status_history',
      sourceType: 'source_type',
      sourceReference: 'source_reference',
      notificationMethod: 'notification_method',
      promotedToDisplay: 'promoted_to_display',
      displayNotes: 'display_notes',
      displayPromotedBy: 'display_promoted_by',
      displayPromotedByName: 'display_promoted_by_name',
      displayPromotedAt: 'display_promoted_at',
      displayPromotionReason: 'display_promotion_reason',
      displayRemovedBy: 'display_removed_by',
      displayRemovedByName: 'display_removed_by_name',
      displayRemovedAt: 'display_removed_at',
      displayRemovalReason: 'display_removal_reason'
    };

    Object.keys(fieldMapping).forEach(apiField => {
      if (updates[apiField] !== undefined) {
        updateData[fieldMapping[apiField]] = updates[apiField];
        delete updateData[apiField];
      }
    });

    const { data, error } = await supabase
      .from('manual_roadworks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating roadwork in Supabase:', error);
      return null;
    }

    console.log(`✅ Updated roadwork in Supabase: ${id}`);

    // Log supervisor action for important changes
    if (updates.status) {
      await logSupervisorAction(
        updates.updatedBy || 'unknown',
        updates.updatedByName || 'Unknown',
        'roadwork_status_changed',
        'roadwork',
        id,
        {
          new_status: updates.status,
          notes: updates.notes
        }
      );
    }

    return convertToAPIFormat(data);
  } catch (error) {
    console.error('❌ Failed to update roadwork:', error.message);
    throw error;
  }
}

/**
 * Delete a roadwork
 */
export async function deleteRoadwork(id) {
  try {
    // Get the roadwork first to return it
    const { data: roadwork, error: selectError } = await supabase
      .from('manual_roadworks')
      .select('*')
      .eq('id', id)
      .single();

    if (selectError || !roadwork) {
      console.error('❌ Roadwork not found for deletion:', id);
      return null;
    }

    const { error } = await supabase
      .from('manual_roadworks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting roadwork from Supabase:', error);
      return null;
    }

    console.log(`✅ Deleted roadwork from Supabase: ${id}`);

    // Log supervisor action
    await logSupervisorAction(
      'system',
      'System',
      'roadwork_deleted',
      'roadwork',
      id,
      {
        location: roadwork.location,
        priority: roadwork.priority
      }
    );

    return convertToAPIFormat(roadwork);
  } catch (error) {
    console.error('❌ Failed to delete roadwork:', error.message);
    throw error;
  }
}

/**
 * Get a specific roadwork by ID
 */
export async function getRoadworkById(id) {
  try {
    const { data, error } = await supabase
      .from('manual_roadworks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return convertToAPIFormat(data);
  } catch (error) {
    console.error('❌ Failed to get roadwork by ID:', error.message);
    return null;
  }
}

/**
 * Get roadworks for display screen
 */
export async function getDisplayRoadworks() {
  try {
    const { data, error } = await supabase
      .from('manual_roadworks')
      .select('*')
      .eq('promoted_to_display', true)
      .in('status', ['active', 'planning', 'approved'])
      .order('display_promoted_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching display roadworks:', error);
      return [];
    }

    return data.map(roadwork => ({
      id: roadwork.id,
      title: roadwork.title,
      location: roadwork.location,
      status: roadwork.status,
      priority: roadwork.priority,
      affectedRoutes: roadwork.affected_routes,
      displayNotes: roadwork.display_notes,
      promotedBy: roadwork.display_promoted_by_name,
      promotedAt: roadwork.display_promoted_at,
      lastUpdated: roadwork.last_updated
    }));
  } catch (error) {
    console.error('❌ Failed to get display roadworks:', error.message);
    return [];
  }
}

/**
 * Get roadworks statistics
 */
export async function getRoadworksStats() {
  try {
    const { data: roadworks, error } = await supabase
      .from('manual_roadworks')
      .select('*');

    if (error) {
      console.error('❌ Error fetching roadworks for stats:', error);
      return getEmptyStats();
    }

    const stats = {
      total: roadworks.length,
      byStatus: {},
      byPriority: {},
      promotedToDisplay: roadworks.filter(rw => rw.promoted_to_display).length,
      affectedRoutesTotal: new Set(),
      activeDiversions: 0,
      pendingTasks: 0
    };

    roadworks.forEach(rw => {
      // Count by status
      stats.byStatus[rw.status] = (stats.byStatus[rw.status] || 0) + 1;
      
      // Count by priority
      stats.byPriority[rw.priority] = (stats.byPriority[rw.priority] || 0) + 1;
      
      // Collect affected routes
      if (rw.affected_routes) {
        rw.affected_routes.forEach(route => stats.affectedRoutesTotal.add(route));
      }
      
      // Count active diversions
      if (rw.diversions && rw.diversions.length > 0) {
        stats.activeDiversions += rw.diversions.filter(d => d.status === 'active').length;
      }
      
      // Count pending tasks
      if (rw.tasks) {
        stats.pendingTasks += rw.tasks.filter(t => t.status === 'pending').length;
      }
    });

    stats.affectedRoutesTotal = stats.affectedRoutesTotal.size;

    return stats;
  } catch (error) {
    console.error('❌ Failed to get roadworks stats:', error.message);
    return getEmptyStats();
  }
}

/**
 * Clean up old roadworks (3+ months)
 */
export async function cleanupOldRoadworks() {
  try {
    console.log('🧹 Starting roadworks cleanup...');

    const { data, error } = await supabase
      .rpc('cleanup_old_data');

    if (error) {
      console.error('❌ Error during cleanup:', error);
      return { success: false, error: error.message };
    }

    const roadworksCleanup = data.find(row => row.table_name === 'manual_roadworks');
    const deletedCount = roadworksCleanup ? roadworksCleanup.deleted_count : 0;

    console.log(`✅ Cleanup completed: ${deletedCount} old roadworks removed`);

    return {
      success: true,
      deletedCount: parseInt(deletedCount),
      cleanedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to cleanup old roadworks:', error.message);
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
    title: dbRecord.title,
    description: dbRecord.description,
    location: dbRecord.location,
    coordinates: dbRecord.coordinates,
    
    // Authority/Contact Information
    authority: dbRecord.authority,
    contactPerson: dbRecord.contact_person,
    contactPhone: dbRecord.contact_phone,
    contactEmail: dbRecord.contact_email,
    
    // Timing
    plannedStartDate: dbRecord.planned_start_date,
    plannedEndDate: dbRecord.planned_end_date,
    estimatedDuration: dbRecord.estimated_duration,
    actualStartDate: dbRecord.actual_start_date,
    actualEndDate: dbRecord.actual_end_date,
    
    // Classification
    roadworkType: dbRecord.roadwork_type,
    trafficManagement: dbRecord.traffic_management,
    priority: dbRecord.priority,
    
    // Route Impact
    affectedRoutes: dbRecord.affected_routes,
    impactAssessment: dbRecord.impact_assessment,
    
    // Workflow
    status: dbRecord.status,
    assignedTo: dbRecord.assigned_to,
    assignedToName: dbRecord.assigned_to_name,
    
    // Task Management
    tasks: dbRecord.tasks,
    communications: dbRecord.communications,
    diversions: dbRecord.diversions,
    councilCoordination: dbRecord.council_coordination,
    
    // Audit Trail
    createdBy: dbRecord.created_by,
    createdByName: dbRecord.created_by_name,
    createdByRole: dbRecord.created_by_role,
    statusHistory: dbRecord.status_history,
    
    // Source Information
    sourceType: dbRecord.source_type,
    sourceReference: dbRecord.source_reference,
    notificationMethod: dbRecord.notification_method,
    
    // Display Control
    promotedToDisplay: dbRecord.promoted_to_display,
    displayPromotedBy: dbRecord.display_promoted_by,
    displayPromotedByName: dbRecord.display_promoted_by_name,
    displayPromotedAt: dbRecord.display_promoted_at,
    displayNotes: dbRecord.display_notes,
    displayPromotionReason: dbRecord.display_promotion_reason,
    displayRemovedBy: dbRecord.display_removed_by,
    displayRemovedByName: dbRecord.display_removed_by_name,
    displayRemovedAt: dbRecord.display_removed_at,
    displayRemovalReason: dbRecord.display_removal_reason,
    
    // Timestamps
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
    byStatus: {},
    byPriority: {},
    promotedToDisplay: 0,
    affectedRoutesTotal: 0,
    activeDiversions: 0,
    pendingTasks: 0
  };
}

/**
 * Initialize the storage system
 */
export async function initializeStorage() {
  try {
    // Test connection
    const { data, error } = await supabase
      .from('manual_roadworks')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Failed to initialize Supabase roadworks storage:', error.message);
      return false;
    }

    console.log('✅ Supabase roadworks storage initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase roadworks storage:', error.message);
    return false;
  }
}

export default {
  getAllRoadworks,
  addRoadwork,
  updateRoadwork,
  deleteRoadwork,
  getRoadworkById,
  getDisplayRoadworks,
  getRoadworksStats,
  cleanupOldRoadworks,
  initializeStorage
};
