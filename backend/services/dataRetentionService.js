// backend/services/dataRetentionService.js
// Automated 3-month data retention cleanup service for Go BARRY

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
 * Configuration for retention periods
 */
const RETENTION_CONFIG = {
  manual_incidents: {
    enabled: true,
    months: 3,
    description: 'Manual incidents from Incident Manager'
  },
  manual_roadworks: {
    enabled: true,
    months: 3,
    description: 'Manual roadworks from Roadworks Manager'
  },
  supervisor_actions: {
    enabled: true,
    months: 3,
    description: 'Supervisor audit trail actions'
  },
  historical_incidents: {
    enabled: true,
    months: 3,
    description: 'Historical incidents from APIs'
  },
  dismissed_alerts: {
    enabled: true,
    months: 3,
    description: 'Dismissed alert records'
  }
};

/**
 * Run full data retention cleanup
 */
export async function runDataRetentionCleanup() {
  console.log('🧹 Starting Go BARRY data retention cleanup...');
  console.log(`📅 Cleaning up data older than 3 months`);
  
  const startTime = new Date();
  const results = {
    success: true,
    startTime: startTime.toISOString(),
    endTime: null,
    duration: null,
    totalDeleted: 0,
    tables: {},
    errors: []
  };

  try {
    // Run the Supabase cleanup function
    console.log('🔧 Executing Supabase cleanup function...');
    
    const { data, error } = await supabase.rpc('cleanup_old_alerts');

    if (error) {
      console.error('❌ Error during Supabase cleanup:', error);
      results.success = false;
      results.errors.push(`Supabase cleanup failed: ${error.message}`);
      return results;
    }

    // Process results
    if (data && Array.isArray(data)) {
      data.forEach(row => {
        const tableName = row.table_name;
        const deletedCount = parseInt(row.deleted_count) || 0;
        
        results.tables[tableName] = {
          deletedCount,
          enabled: RETENTION_CONFIG[tableName]?.enabled || false,
          description: RETENTION_CONFIG[tableName]?.description || 'Unknown table'
        };
        
        results.totalDeleted += deletedCount;
        
        console.log(`✅ ${tableName}: ${deletedCount} records deleted`);
      });
    }

    // Additional manual cleanup for any edge cases
    await cleanupOrphanedRecords();

    const endTime = new Date();
    results.endTime = endTime.toISOString();
    results.duration = Math.round((endTime - startTime) / 1000);

    console.log(`🎉 Data retention cleanup completed successfully!`);
    console.log(`⏱️  Duration: ${results.duration} seconds`);
    console.log(`🗑️  Total records deleted: ${results.totalDeleted}`);

    // Log cleanup activity
    await logCleanupActivity(results);

    return results;

  } catch (error) {
    console.error('❌ Data retention cleanup failed:', error);
    
    const endTime = new Date();
    results.success = false;
    results.endTime = endTime.toISOString();
    results.duration = Math.round((endTime - startTime) / 1000);
    results.errors.push(error.message);

    return results;
  }
}

/**
 * Clean up orphaned records (referential integrity)
 */
async function cleanupOrphanedRecords() {
  console.log('🔗 Checking for orphaned records...');

  try {
    // Clean up supervisor_actions for deleted incidents/roadworks
    const { data: orphanedActions, error: actionsError } = await supabase
      .from('supervisor_actions')
      .select('id, target_type, target_id')
      .in('target_type', ['incident', 'roadwork']);

    if (actionsError) {
      console.warn('⚠️ Could not check orphaned actions:', actionsError.message);
      return;
    }

    let orphanedCount = 0;

    for (const action of orphanedActions) {
      let targetExists = false;

      if (action.target_type === 'incident') {
        const { data } = await supabase
          .from('manual_incidents')
          .select('id')
          .eq('id', action.target_id)
          .single();
        targetExists = !!data;
      } else if (action.target_type === 'roadwork') {
        const { data } = await supabase
          .from('manual_roadworks')
          .select('id')
          .eq('id', action.target_id)
          .single();
        targetExists = !!data;
      }

      if (!targetExists) {
        await supabase
          .from('supervisor_actions')
          .delete()
          .eq('id', action.id);
        orphanedCount++;
      }
    }

    if (orphanedCount > 0) {
      console.log(`✅ Cleaned up ${orphanedCount} orphaned supervisor actions`);
    } else {
      console.log('✅ No orphaned records found');
    }

  } catch (error) {
    console.warn('⚠️ Failed to clean orphaned records:', error.message);
  }
}

/**
 * Get retention status for all tables
 */
export async function getRetentionStatus() {
  console.log('📊 Checking data retention status...');

  const status = {
    tables: {},
    upcomingDeletions: {},
    totalRecords: 0,
    oldestRecords: {}
  };

  try {
    for (const [tableName, config] of Object.entries(RETENTION_CONFIG)) {
      if (!config.enabled) continue;

      console.log(`📋 Checking ${tableName}...`);

      // Count total records
      const { count: totalCount, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.warn(`⚠️ Could not count records in ${tableName}:`, countError.message);
        continue;
      }

      // Find oldest and newest records
      const { data: oldestData, error: oldestError } = await supabase
        .from(tableName)
        .select('created_at, retention_date')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const { data: newestData, error: newestError } = await supabase
        .from(tableName)
        .select('created_at, retention_date')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Count records that will be deleted soon (within 7 days)
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 7);

      const { count: soonCount, error: soonError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .lt('retention_date', soonDate.toISOString());

      status.tables[tableName] = {
        enabled: config.enabled,
        description: config.description,
        totalRecords: totalCount || 0,
        upcomingDeletions: soonCount || 0,
        oldestRecord: oldestData?.created_at || null,
        newestRecord: newestData?.created_at || null,
        retentionMonths: config.months
      };

      status.totalRecords += totalCount || 0;
      status.upcomingDeletions[tableName] = soonCount || 0;

      if (oldestData) {
        status.oldestRecords[tableName] = oldestData.created_at;
      }

      console.log(`   📈 ${totalCount || 0} total records, ${soonCount || 0} expire soon`);
    }

    return status;

  } catch (error) {
    console.error('❌ Failed to get retention status:', error);
    return { error: error.message };
  }
}

/**
 * Schedule automatic cleanup (call this from a cron job or scheduler)
 */
export async function scheduleRetentionCleanup() {
  console.log('⏰ Scheduling data retention cleanup...');

  // Run cleanup every 24 hours
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const runCleanup = async () => {
    console.log('🔔 Scheduled cleanup triggered...');
    
    try {
      const results = await runDataRetentionCleanup();
      
      if (results.success) {
        console.log(`✅ Scheduled cleanup completed: ${results.totalDeleted} records deleted`);
      } else {
        console.error('❌ Scheduled cleanup failed:', results.errors);
      }
    } catch (error) {
      console.error('❌ Scheduled cleanup error:', error);
    }
  };

  // Initial run
  setTimeout(runCleanup, 5000); // Run after 5 seconds

  // Then run every 24 hours
  setInterval(runCleanup, CLEANUP_INTERVAL);

  console.log('✅ Data retention cleanup scheduled (every 24 hours)');
}

/**
 * Log cleanup activity for audit trail
 */
async function logCleanupActivity(results) {
  try {
    const { error } = await supabase
      .from('supervisor_actions')
      .insert([{
        supervisor_badge: 'SYSTEM',
        supervisor_name: 'Data Retention Service',
        action_type: 'data_cleanup',
        target_type: 'system',
        target_id: 'retention_cleanup',
        details: {
          duration_seconds: results.duration,
          total_deleted: results.totalDeleted,
          tables: results.tables,
          success: results.success,
          errors: results.errors
        }
      }]);

    if (error) {
      console.warn('⚠️ Failed to log cleanup activity:', error.message);
    } else {
      console.log('📝 Cleanup activity logged successfully');
    }
  } catch (error) {
    console.warn('⚠️ Failed to log cleanup activity:', error.message);
  }
}

/**
 * Extend retention for specific records (emergency use)
 */
export async function extendRetention(tableName, recordId, additionalMonths = 3) {
  try {
    console.log(`⏳ Extending retention for ${tableName}/${recordId} by ${additionalMonths} months`);

    const { data, error } = await supabase
      .rpc('extend_retention', {
        table_name: tableName,
        record_id: recordId,
        additional_months: additionalMonths
      });

    if (error) {
      console.error('❌ Failed to extend retention:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Retention extended successfully`);
    return { success: true, extended: true };

  } catch (error) {
    console.error('❌ Failed to extend retention:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test retention system (dry run)
 */
export async function testRetentionSystem() {
  console.log('🧪 Testing retention system...');

  try {
    const status = await getRetentionStatus();
    
    console.log('📊 Current retention status:');
    console.table(status.tables);

    console.log('📅 Upcoming deletions (next 7 days):');
    console.table(status.upcomingDeletions);

    console.log('✅ Retention system test completed');
    return { success: true, status };

  } catch (error) {
    console.error('❌ Retention system test failed:', error);
    return { success: false, error: error.message };
  }
}

export default {
  runDataRetentionCleanup,
  getRetentionStatus,
  scheduleRetentionCleanup,
  extendRetention,
  testRetentionSystem,
  RETENTION_CONFIG
};
