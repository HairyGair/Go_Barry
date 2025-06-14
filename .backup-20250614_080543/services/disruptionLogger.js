// backend/services/disruptionLogger.js
// Disruption Achievement Logging Service for BARRY
// Tracks disruptions that have been successfully resolved or managed

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseConfigured = false;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ Missing Supabase configuration for DisruptionLogger - running in offline mode');
  supabaseConfigured = false;
} else {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    supabaseConfigured = true;
    console.log('✅ DisruptionLogger: Supabase connected');
  } catch (error) {
    console.error('❌ DisruptionLogger: Supabase connection failed:', error.message);
    supabaseConfigured = false;
  }
}

/**
 * DisruptionLogger Service
 * Manages logging of disruptions that have been successfully handled
 */
class DisruptionLogger {
  constructor() {
    this.tableName = 'disruption_logs';
  }

  /**
   * Log a successfully handled disruption
   * @param {Object} disruptionData - The disruption data to log
   * @returns {Object} Result object with success status
   */
  async logDisruption(disruptionData) {
    // Check if Supabase is configured
    if (!supabaseConfigured) {
      console.log('📋 DisruptionLogger: Offline mode - would log:', disruptionData.title);
      return {
        success: true,
        data: { id: 'offline_' + Date.now(), ...disruptionData },
        message: 'Disruption logged in offline mode (Supabase not configured)'
      };
    }

    try {
      console.log('📝 Logging disruption achievement:', disruptionData.title);

      // Validate required fields
      const requiredFields = ['title', 'type', 'location', 'supervisor_id'];
      const missingFields = requiredFields.filter(field => !disruptionData[field]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      // Prepare disruption log entry
      const logEntry = {
        // Core disruption details
        title: disruptionData.title,
        description: disruptionData.description || '',
        type: disruptionData.type, // 'incident', 'roadwork', 'diversion', 'service_change', 'weather', 'other'
        location: disruptionData.location,
        affected_routes: disruptionData.affected_routes || [],
        
        // Resolution details
        resolution_method: disruptionData.resolution_method || '', // How it was resolved
        actions_taken: disruptionData.actions_taken || '', // What actions were taken
        resources_used: disruptionData.resources_used || [], // Resources that were deployed
        
        // Timing
        disruption_started: disruptionData.disruption_started ? new Date(disruptionData.disruption_started).toISOString() : null,
        disruption_resolved: disruptionData.disruption_resolved ? new Date(disruptionData.disruption_resolved).toISOString() : new Date().toISOString(),
        resolution_time_minutes: disruptionData.resolution_time_minutes || null,
        
        // Responsibility and accountability
        supervisor_id: disruptionData.supervisor_id,
        supervisor_name: disruptionData.supervisor_name || '',
        depot: disruptionData.depot || '',
        shift: disruptionData.shift || '',
        
        // Impact assessment
        services_affected_count: disruptionData.services_affected_count || 0,
        passengers_affected_estimate: disruptionData.passengers_affected_estimate || 0,
        severity_level: disruptionData.severity_level || 'medium', // 'low', 'medium', 'high', 'critical'
        
        // Operational details
        diversion_route: disruptionData.diversion_route || '',
        replacement_services: disruptionData.replacement_services || [],
        customer_communications: disruptionData.customer_communications || [],
        driver_notifications: disruptionData.driver_notifications || '',
        
        // External factors
        weather_conditions: disruptionData.weather_conditions || '',
        external_agencies: disruptionData.external_agencies || [], // Police, Highways, etc.
        coordination_required: disruptionData.coordination_required || false,
        
        // Lessons learned and improvements
        lessons_learned: disruptionData.lessons_learned || '',
        improvement_suggestions: disruptionData.improvement_suggestions || '',
        preventable: disruptionData.preventable || false,
        recurring_issue: disruptionData.recurring_issue || false,
        
        // Administrative
        cost_estimate: disruptionData.cost_estimate || null,
        insurance_claim: disruptionData.insurance_claim || false,
        follow_up_required: disruptionData.follow_up_required || false,
        
        // Metadata
        logged_at: new Date().toISOString(),
        logged_by: disruptionData.logged_by || disruptionData.supervisor_id,
        related_alert_id: disruptionData.related_alert_id || null,
        
        // Performance metrics
        response_time_minutes: disruptionData.response_time_minutes || null,
        communication_delay_minutes: disruptionData.communication_delay_minutes || null,
        service_restoration_time: disruptionData.service_restoration_time || null
      };

      // Insert into database
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(logEntry)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to log disruption:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      console.log('✅ Disruption logged successfully:', data.id);
      
      return {
        success: true,
        data: data,
        message: 'Disruption logged successfully'
      };

    } catch (error) {
      console.error('❌ DisruptionLogger error:', error);
      return {
        success: false,
        error: `Service error: ${error.message}`
      };
    }
  }

  /**
   * Get disruption logs with filtering options
   * @param {Object} filters - Filter options
   * @returns {Object} Result with disruption logs
   */
  async getDisruptionLogs(filters = {}) {
    // Check if Supabase is configured
    if (!supabaseConfigured) {
      console.log('📋 DisruptionLogger: Offline mode - returning empty logs');
      return {
        success: true,
        data: [],
        metadata: {
          total_returned: 0,
          filters_applied: filters,
          fetched_at: new Date().toISOString(),
          offline_mode: true
        }
      };
    }

    try {
      console.log('📊 Fetching disruption logs with filters:', filters);

      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      if (filters.supervisor_id) {
        query = query.eq('supervisor_id', filters.supervisor_id);
      }

      if (filters.depot) {
        query = query.eq('depot', filters.depot);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.severity_level) {
        query = query.eq('severity_level', filters.severity_level);
      }

      if (filters.date_from) {
        query = query.gte('logged_at', new Date(filters.date_from).toISOString());
      }

      if (filters.date_to) {
        query = query.lte('logged_at', new Date(filters.date_to).toISOString());
      }

      if (filters.route) {
        query = query.contains('affected_routes', [filters.route]);
      }

      // Sorting
      const sortBy = filters.sort_by || 'logged_at';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const limit = Math.min(filters.limit || 50, 100); // Max 100 records
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch disruption logs:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      return {
        success: true,
        data: data || [],
        metadata: {
          total_returned: data?.length || 0,
          filters_applied: filters,
          fetched_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ GetDisruptionLogs error:', error);
      return {
        success: false,
        error: `Service error: ${error.message}`
      };
    }
  }

  /**
   * Get disruption statistics
   * @param {Object} timeframe - Time period for stats
   * @returns {Object} Statistics summary
   */
  async getDisruptionStatistics(timeframe = {}) {
    // Check if Supabase is configured
    if (!supabaseConfigured) {
      console.log('📋 DisruptionLogger: Offline mode - returning empty statistics');
      return {
        success: true,
        statistics: {
          total_disruptions: 0,
          offline_mode: true,
          message: 'Statistics not available - Supabase not configured'
        }
      };
    }

    try {
      console.log('📈 Generating disruption statistics');

      const { date_from, date_to } = timeframe;
      
      let query = supabase
        .from(this.tableName)
        .select('*');

      if (date_from) {
        query = query.gte('logged_at', new Date(date_from).toISOString());
      }

      if (date_to) {
        query = query.lte('logged_at', new Date(date_to).toISOString());
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      // Calculate statistics
      const logs = data || [];
      
      const stats = {
        total_disruptions: logs.length,
        by_type: this.groupByField(logs, 'type'),
        by_severity: this.groupByField(logs, 'severity_level'),
        by_depot: this.groupByField(logs, 'depot'),
        by_supervisor: this.groupByField(logs, 'supervisor_name'),
        
        // Performance metrics
        average_resolution_time: this.calculateAverage(logs, 'resolution_time_minutes'),
        average_response_time: this.calculateAverage(logs, 'response_time_minutes'),
        average_affected_services: this.calculateAverage(logs, 'services_affected_count'),
        
        // Learning metrics
        preventable_count: logs.filter(log => log.preventable).length,
        recurring_issues: logs.filter(log => log.recurring_issue).length,
        follow_up_required: logs.filter(log => log.follow_up_required).length,
        
        // Time period
        period: {
          from: date_from || 'all_time',
          to: date_to || new Date().toISOString(),
          generated_at: new Date().toISOString()
        }
      };

      return {
        success: true,
        statistics: stats
      };

    } catch (error) {
      console.error('❌ GetDisruptionStatistics error:', error);
      return {
        success: false,
        error: `Service error: ${error.message}`
      };
    }
  }

  /**
   * Update an existing disruption log
   * @param {string} logId - The log ID to update
   * @param {Object} updateData - Data to update
   * @returns {Object} Result object
   */
  async updateDisruptionLog(logId, updateData) {
    // Check if Supabase is configured
    if (!supabaseConfigured) {
      console.log('📋 DisruptionLogger: Offline mode - cannot update log:', logId);
      return {
        success: false,
        error: 'Cannot update disruption log - Supabase not configured (offline mode)'
      };
    }

    try {
      console.log(`📝 Updating disruption log: ${logId}`);

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', logId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      return {
        success: true,
        data: data,
        message: 'Disruption log updated successfully'
      };

    } catch (error) {
      console.error('❌ UpdateDisruptionLog error:', error);
      return {
        success: false,
        error: `Service error: ${error.message}`
      };
    }
  }

  /**
   * Delete a disruption log (admin only)
   * @param {string} logId - The log ID to delete
   * @returns {Object} Result object
   */
  async deleteDisruptionLog(logId) {
    // Check if Supabase is configured
    if (!supabaseConfigured) {
      console.log('📋 DisruptionLogger: Offline mode - cannot delete log:', logId);
      return {
        success: false,
        error: 'Cannot delete disruption log - Supabase not configured (offline mode)'
      };
    }

    try {
      console.log(`🗑️ Deleting disruption log: ${logId}`);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', logId);

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Disruption log deleted successfully'
      };

    } catch (error) {
      console.error('❌ DeleteDisruptionLog error:', error);
      return {
        success: false,
        error: `Service error: ${error.message}`
      };
    }
  }

  // Helper methods
  groupByField(items, field) {
    const grouped = {};
    items.forEach(item => {
      const value = item[field] || 'Unknown';
      grouped[value] = (grouped[value] || 0) + 1;
    });
    return grouped;
  }

  calculateAverage(items, field) {
    const values = items
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined && !isNaN(value));
    
    if (values.length === 0) return 0;
    
    const sum = values.reduce((total, value) => total + Number(value), 0);
    return Math.round((sum / values.length) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Health check for the disruption logger service
   * @returns {Object} Health status
   */
  async healthCheck() {
    if (!supabaseConfigured) {
      return {
        service: 'DisruptionLogger',
        status: 'offline',
        connected: false,
        table_accessible: false,
        error: 'Supabase not configured - running in offline mode',
        offline_mode: true,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .limit(1);

      return {
        service: 'DisruptionLogger',
        status: error ? 'error' : 'healthy',
        connected: !error,
        table_accessible: !error,
        error: error?.message,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'DisruptionLogger',
        status: 'error',
        connected: false,
        table_accessible: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create and export singleton instance
const disruptionLogger = new DisruptionLogger();

export default disruptionLogger;
export { DisruptionLogger };
