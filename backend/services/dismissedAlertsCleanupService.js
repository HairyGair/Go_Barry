// backend/services/dismissedAlertsCleanupService.js
// Automated cleanup service for dismissed alerts to prevent database bloat
// Memory optimized for Render.com 2GB RAM constraint

import { supabaseOptimizer } from './supabaseOptimizer.js';

/**
 * Configurable retention periods for different dismissal reasons (in days)
 * These can be overridden via environment variables
 */
const DEFAULT_RETENTION_PERIODS = {
  'data_error': 7,              // Data error/duplicate - quick cleanup
  'duplicate': 7,               // Duplicate entries - quick cleanup
  'not_affecting_routes': 30,   // Not affecting routes - moderate cleanup
  'work_completed_early': 30,   // Work completed early - moderate cleanup
  'supervisor_override': 90,    // Supervisor override - keep longer for audit
  'default': 60                 // Default retention for other reasons
};

/**
 * Service for cleaning up dismissed alerts based on configurable retention periods
 */
class DismissedAlertsCleanupService {
  constructor() {
    this.retentionPeriods = this.loadRetentionConfig();
    this.batchSize = parseInt(process.env.CLEANUP_BATCH_SIZE) || 100;
    this.maxOperationTime = parseInt(process.env.CLEANUP_MAX_TIME_MS) || 30000; // 30 seconds max
    this.dryRun = process.env.CLEANUP_DRY_RUN === 'true';
    
    console.log('🧹 Dismissed Alerts Cleanup Service initialized');
    console.log('📋 Retention periods:', this.retentionPeriods);
    console.log('📦 Batch size:', this.batchSize);
    console.log('⏱️ Max operation time:', this.maxOperationTime, 'ms');
    console.log('🔍 Dry run mode:', this.dryRun);
  }

  /**
   * Load retention configuration from environment variables or use defaults
   */
  loadRetentionConfig() {
    const config = { ...DEFAULT_RETENTION_PERIODS };
    
    // Override with environment variables if present
    Object.keys(config).forEach(key => {
      const envKey = `CLEANUP_RETENTION_${key.toUpperCase()}_DAYS`;
      const envValue = process.env[envKey];
      if (envValue && !isNaN(parseInt(envValue))) {
        config[key] = parseInt(envValue);
        console.log(`📝 Using custom retention for ${key}: ${config[key]} days (from ${envKey})`);
      }
    });
    
    return config;
  }

  /**
   * Determine retention period based on dismissal reason
   */
  getRetentionPeriod(dismissalReason) {
    if (!dismissalReason) return this.retentionPeriods.default;
    
    const reason = dismissalReason.toLowerCase().trim();
    
    // Map common reason patterns to retention periods
    if (reason.includes('data error') || reason.includes('duplicate')) {
      return this.retentionPeriods.data_error;
    }
    if (reason.includes('not affecting') || reason.includes('no impact')) {
      return this.retentionPeriods.not_affecting_routes;
    }
    if (reason.includes('completed') || reason.includes('finished')) {
      return this.retentionPeriods.work_completed_early;
    }
    if (reason.includes('supervisor') || reason.includes('override')) {
      return this.retentionPeriods.supervisor_override;
    }
    
    return this.retentionPeriods.default;
  }

  /**
   * Get cleanup statistics for monitoring
   */
  async getCleanupStats() {
    try {
      const supabaseClient = await supabaseOptimizer.getOptimizedClient();
      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }

      const stats = {
        dismissed_alerts: {},
        streetworks: {},
        manual_incidents: {}
      };

      // Count dismissed alerts by age
      const { data: dismissedAlertsStats, error: dismissedError } = await supabaseClient
        .from('dismissed_alerts')
        .select('timestamp, reason')
        .order('timestamp', { ascending: false });

      if (!dismissedError && dismissedAlertsStats) {
        const now = new Date();
        const ageGroups = { '0-7d': 0, '8-30d': 0, '31-60d': 0, '61-90d': 0, '90d+': 0 };
        
        dismissedAlertsStats.forEach(alert => {
          const alertDate = new Date(alert.timestamp);
          const ageInDays = Math.floor((now - alertDate) / (1000 * 60 * 60 * 24));
          
          if (ageInDays <= 7) ageGroups['0-7d']++;
          else if (ageInDays <= 30) ageGroups['8-30d']++;
          else if (ageInDays <= 60) ageGroups['31-60d']++;
          else if (ageInDays <= 90) ageGroups['61-90d']++;
          else ageGroups['90d+']++;
        });
        
        stats.dismissed_alerts = {
          total: dismissedAlertsStats.length,
          ageGroups
        };
      }

      // Count dismissed streetworks
      const { count: dismissedStreetworks } = await supabaseClient
        .from('streetworks')
        .select('*', { count: 'exact', head: true })
        .eq('is_dismissed', true);

      stats.streetworks.dismissed_count = dismissedStreetworks || 0;

      // Count dismissed manual incidents
      const { count: dismissedManualIncidents } = await supabaseClient
        .from('manual_incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dismissed');

      stats.manual_incidents.dismissed_count = dismissedManualIncidents || 0;

      return {
        success: true,
        stats,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find dismissed alerts eligible for cleanup
   */
  async findEligibleRecords() {
    try {
      const supabaseClient = await supabaseOptimizer.getOptimizedClient();
      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }

      const eligibleRecords = {
        dismissed_alerts: [],
        streetworks: [],
        manual_incidents: []
      };

      // Find eligible dismissed_alerts records
      const { data: dismissedAlerts, error: dismissedError } = await supabaseClient
        .from('dismissed_alerts')
        .select('id, timestamp, reason, alert_data')
        .order('timestamp', { ascending: true }); // Oldest first for cleanup

      if (!dismissedError && dismissedAlerts) {
        const now = new Date();
        
        dismissedAlerts.forEach(alert => {
          const alertDate = new Date(alert.timestamp);
          const ageInDays = Math.floor((now - alertDate) / (1000 * 60 * 60 * 24));
          const retentionPeriod = this.getRetentionPeriod(alert.reason);
          
          if (ageInDays > retentionPeriod) {
            eligibleRecords.dismissed_alerts.push({
              id: alert.id,
              age_days: ageInDays,
              retention_period: retentionPeriod,
              reason: alert.reason,
              timestamp: alert.timestamp
            });
          }
        });
      }

      // Find eligible streetworks records (dismissed)
      const { data: streetworks, error: streetworksError } = await supabaseClient
        .from('streetworks')
        .select('id, dismissed_at, dismissal_reason, is_dismissed')
        .eq('is_dismissed', true)
        .not('dismissed_at', 'is', null)
        .order('dismissed_at', { ascending: true });

      if (!streetworksError && streetworks) {
        const now = new Date();
        
        streetworks.forEach(work => {
          const dismissalDate = new Date(work.dismissed_at);
          const ageInDays = Math.floor((now - dismissalDate) / (1000 * 60 * 60 * 24));
          const retentionPeriod = this.getRetentionPeriod(work.dismissal_reason);
          
          if (ageInDays > retentionPeriod) {
            eligibleRecords.streetworks.push({
              id: work.id,
              age_days: ageInDays,
              retention_period: retentionPeriod,
              reason: work.dismissal_reason,
              dismissed_at: work.dismissed_at
            });
          }
        });
      }

      // Find eligible manual_incidents records (dismissed)
      const { data: manualIncidents, error: manualError } = await supabaseClient
        .from('manual_incidents')
        .select('id, dismissed_at, dismissal_reason, status')
        .eq('status', 'dismissed')
        .not('dismissed_at', 'is', null)
        .order('dismissed_at', { ascending: true });

      if (!manualError && manualIncidents) {
        const now = new Date();
        
        manualIncidents.forEach(incident => {
          const dismissalDate = new Date(incident.dismissed_at);
          const ageInDays = Math.floor((now - dismissalDate) / (1000 * 60 * 60 * 24));
          const retentionPeriod = this.getRetentionPeriod(incident.dismissal_reason);
          
          if (ageInDays > retentionPeriod) {
            eligibleRecords.manual_incidents.push({
              id: incident.id,
              age_days: ageInDays,
              retention_period: retentionPeriod,
              reason: incident.dismissal_reason,
              dismissed_at: incident.dismissed_at
            });
          }
        });
      }

      const totalEligible = eligibleRecords.dismissed_alerts.length + 
                           eligibleRecords.streetworks.length + 
                           eligibleRecords.manual_incidents.length;

      console.log(`🔍 Found ${totalEligible} records eligible for cleanup:`);
      console.log(`  - ${eligibleRecords.dismissed_alerts.length} dismissed_alerts`);
      console.log(`  - ${eligibleRecords.streetworks.length} streetworks`);
      console.log(`  - ${eligibleRecords.manual_incidents.length} manual_incidents`);

      return {
        success: true,
        eligible_records: eligibleRecords,
        total_eligible: totalEligible
      };

    } catch (error) {
      console.error('❌ Error finding eligible records:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform cleanup of dismissed alerts in batches
   */
  async performCleanup(eligibleRecords = null) {
    const startTime = Date.now();
    const cleanupResults = {
      deleted_count: 0,
      errors: [],
      processed_tables: [],
      execution_time_ms: 0,
      dry_run: this.dryRun
    };

    try {
      // Find eligible records if not provided
      if (!eligibleRecords) {
        const findResult = await this.findEligibleRecords();
        if (!findResult.success) {
          throw new Error(`Failed to find eligible records: ${findResult.error}`);
        }
        eligibleRecords = findResult.eligible_records;
      }

      const supabaseClient = await supabaseOptimizer.getOptimizedClient();
      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }

      // Cleanup dismissed_alerts table
      if (eligibleRecords.dismissed_alerts.length > 0) {
        await this.cleanupTable('dismissed_alerts', eligibleRecords.dismissed_alerts, supabaseClient, cleanupResults);
      }

      // Cleanup streetworks table (delete dismissed records)
      if (eligibleRecords.streetworks.length > 0) {
        await this.cleanupTable('streetworks', eligibleRecords.streetworks, supabaseClient, cleanupResults);
      }

      // Cleanup manual_incidents table (delete dismissed records)
      if (eligibleRecords.manual_incidents.length > 0) {
        await this.cleanupTable('manual_incidents', eligibleRecords.manual_incidents, supabaseClient, cleanupResults);
      }

      cleanupResults.execution_time_ms = Date.now() - startTime;
      
      console.log(`✅ Cleanup completed in ${cleanupResults.execution_time_ms}ms`);
      console.log(`🗑️ ${this.dryRun ? 'Would delete' : 'Deleted'} ${cleanupResults.deleted_count} records`);
      
      if (cleanupResults.errors.length > 0) {
        console.log(`⚠️ ${cleanupResults.errors.length} errors encountered during cleanup`);
      }

      return {
        success: true,
        results: cleanupResults
      };

    } catch (error) {
      cleanupResults.execution_time_ms = Date.now() - startTime;
      cleanupResults.errors.push(error.message);
      
      console.error('❌ Cleanup operation failed:', error);
      return {
        success: false,
        error: error.message,
        results: cleanupResults
      };
    }
  }

  /**
   * Cleanup a specific table in batches
   */
  async cleanupTable(tableName, records, supabaseClient, cleanupResults) {
    console.log(`🧹 Cleaning up ${records.length} records from ${tableName} table`);
    
    let processedCount = 0;
    const batches = this.createBatches(records, this.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchIds = batch.map(record => record.id);
      
      try {
        if (this.dryRun) {
          console.log(`[DRY RUN] Would delete ${batchIds.length} records from ${tableName}:`, batchIds.slice(0, 3));
        } else {
          const { error: deleteError } = await supabaseClient
            .from(tableName)
            .delete()
            .in('id', batchIds);

          if (deleteError) {
            throw new Error(`Batch ${i + 1} deletion failed: ${deleteError.message}`);
          }
        }
        
        processedCount += batchIds.length;
        cleanupResults.deleted_count += batchIds.length;
        
        console.log(`✅ ${this.dryRun ? '[DRY RUN] ' : ''}Processed batch ${i + 1}/${batches.length} from ${tableName} (${processedCount}/${records.length} records)`);
        
        // Check execution time limit
        if (Date.now() - cleanupResults.start_time > this.maxOperationTime) {
          console.log(`⏱️ Reached maximum operation time, stopping cleanup of ${tableName}`);
          break;
        }
        
        // Small delay between batches to prevent overwhelming the database
        if (!this.dryRun && i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        const errorMsg = `Error processing batch ${i + 1} of ${tableName}: ${error.message}`;
        console.error('❌', errorMsg);
        cleanupResults.errors.push(errorMsg);
        
        // Continue with next batch instead of failing completely
        continue;
      }
    }
    
    cleanupResults.processed_tables.push({
      table: tableName,
      processed_count: processedCount,
      total_eligible: records.length
    });
  }

  /**
   * Create batches of records for processing
   */
  createBatches(records, batchSize) {
    const batches = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Log cleanup operation for monitoring
   */
  async logCleanupOperation(results, initiatedBy = 'system') {
    try {
      const supabaseClient = await supabaseOptimizer.getOptimizedClient();
      if (!supabaseClient) {
        console.warn('⚠️ Could not log cleanup operation - Supabase client unavailable');
        return;
      }

      const logEntry = {
        id: `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation_type: 'dismissed_alerts_cleanup',
        initiated_by: initiatedBy,
        execution_time_ms: results.execution_time_ms,
        deleted_count: results.deleted_count,
        processed_tables: results.processed_tables,
        errors: results.errors,
        dry_run: results.dry_run,
        timestamp: new Date().toISOString(),
        retention_config: this.retentionPeriods
      };

      // Try to create cleanup_logs table if it doesn't exist
      const { error: insertError } = await supabaseClient
        .from('cleanup_logs')
        .insert(logEntry);

      if (insertError) {
        // If table doesn't exist, just log to console
        if (insertError.code === '42P01') {
          console.log('📝 Cleanup logs table not found, logging to console only');
          console.log('🧹 Cleanup operation logged:', JSON.stringify(logEntry, null, 2));
        } else {
          console.error('⚠️ Failed to insert cleanup log:', insertError);
        }
      } else {
        console.log('📝 Cleanup operation logged to database');
      }

    } catch (error) {
      console.error('⚠️ Error logging cleanup operation:', error);
    }
  }
}

// Export singleton instance
export const dismissedAlertsCleanupService = new DismissedAlertsCleanupService();
export default dismissedAlertsCleanupService;