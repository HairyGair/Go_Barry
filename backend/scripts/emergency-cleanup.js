#!/usr/bin/env node

/**
 * EMERGENCY Supabase Cleanup Script
 * Immediately removes old data to free up space and unpause database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const EMERGENCY_CLEANUP_RULES = [
  {
    table: 'supervisor_sessions',
    condition: `created_at < NOW() - INTERVAL '7 days'`,
    description: 'Old supervisor sessions (7+ days)'
  },
  {
    table: 'audit_logs', 
    condition: `created_at < NOW() - INTERVAL '7 days'`,
    description: 'Old audit logs (7+ days)'
  },
  {
    table: 'communication_logs',
    condition: `timestamp < NOW() - INTERVAL '7 days'`,
    description: 'Old communication logs (7+ days)'
  },
  {
    table: 'geocoding_cache',
    condition: `cached_at < NOW() - INTERVAL '30 days'`,
    description: 'Stale geocoding cache (30+ days)'
  },
  {
    table: 'street_manager_data',
    condition: `created_at < NOW() - INTERVAL '30 days'`,
    description: 'Old Street Manager data (30+ days)'
  },
  {
    table: 'roadwork_dismissals',
    condition: `created_at < NOW() - INTERVAL '30 days'`,
    description: 'Old roadwork dismissals (30+ days)'
  },
  {
    table: 'roadwork_acknowledgments',
    condition: `created_at < NOW() - INTERVAL '30 days'`,
    description: 'Old roadwork acknowledgments (30+ days)'
  },
  {
    table: 'weather_data',
    condition: `timestamp < NOW() - INTERVAL '7 days'`,
    description: 'Old weather data (7+ days)'
  }
];

async function emergencyCleanup() {
  console.log('🚨 EMERGENCY SUPABASE CLEANUP - STARTING NOW\n');
  console.log('⚠️  This will PERMANENTLY DELETE old data to free up space\n');
  
  let totalDeleted = 0;
  const results = [];
  
  for (const rule of EMERGENCY_CLEANUP_RULES) {
    console.log(`🧹 Cleaning: ${rule.description}`);
    
    try {
      // Delete old records using SQL for efficiency
      const { data, error, count } = await supabase.rpc('emergency_cleanup', {
        table_name: rule.table,
        condition_sql: rule.condition
      });
      
      if (error) {
        // Fallback: Use standard delete if RPC fails
        console.log(`   ⚠️  RPC failed, using standard delete...`);
        
        const { count: deletedCount, error: deleteError } = await performManualCleanup(rule);
        
        if (deleteError) {
          console.log(`   ❌ Failed: ${deleteError.message}`);
          results.push({ ...rule, success: false, error: deleteError.message, deleted: 0 });
        } else {
          console.log(`   ✅ Deleted: ${deletedCount || 0} records`);
          totalDeleted += deletedCount || 0;
          results.push({ ...rule, success: true, deleted: deletedCount || 0 });
        }
      } else {
        console.log(`   ✅ Deleted: ${count || 0} records`);
        totalDeleted += count || 0;
        results.push({ ...rule, success: true, deleted: count || 0 });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({ ...rule, success: false, error: error.message, deleted: 0 });
    }
    
    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 EMERGENCY CLEANUP COMPLETE`);
  console.log(`   Total records deleted: ${totalDeleted.toLocaleString()}`);
  console.log(`   Estimated space freed: ~${Math.round(totalDeleted * 0.5)} KB\n`);
  
  // Report results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('✅ Successful cleanups:');
    successful.forEach(r => {
      console.log(`   ${r.table}: ${r.deleted} records deleted`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed cleanups:');
    failed.forEach(r => {
      console.log(`   ${r.table}: ${r.error}`);
    });
  }
  
  return { totalDeleted, successful: successful.length, failed: failed.length };
}

async function performManualCleanup(rule) {
  const { table, condition } = rule;
  
  // Create appropriate delete query based on the condition
  if (condition.includes('created_at')) {
    const cutoffDate = new Date();
    if (condition.includes('7 days')) {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (condition.includes('30 days')) {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }
    
    return await supabase
      .from(table)
      .delete()
      .lt('created_at', cutoffDate.toISOString());
      
  } else if (condition.includes('timestamp')) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    return await supabase
      .from(table)
      .delete()
      .lt('timestamp', cutoffDate.toISOString());
      
  } else if (condition.includes('cached_at')) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    return await supabase
      .from(table)
      .delete()
      .lt('cached_at', cutoffDate.toISOString());
  }
  
  // Default fallback
  return { count: 0, error: null };
}

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...\n');
  
  try {
    // Try a simple query to see if database is accessible
    const { data, error } = await supabase
      .from('supervisors')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.log('❌ Database appears to be paused or inaccessible');
      console.log(`   Error: ${error.message}`);
      console.log('\n💡 Try refreshing the Supabase dashboard and restarting the database');
      return false;
    } else {
      console.log('✅ Database is accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function vacuumDatabase() {
  console.log('\n🔧 Attempting to reclaim freed space...\n');
  
  try {
    // Try to run VACUUM (might not work on managed Supabase)
    const { data, error } = await supabase.rpc('vacuum_tables');
    
    if (error) {
      console.log('⚠️  VACUUM command not available (normal for managed databases)');
      console.log('   Space will be reclaimed automatically by Supabase');
    } else {
      console.log('✅ Database vacuumed successfully');
    }
  } catch (error) {
    console.log('⚠️  Could not vacuum database (normal for managed services)');
  }
}

async function main() {
  console.log('🚀 Go BARRY - EMERGENCY DATABASE CLEANUP\n');
  
  // Check if database is accessible
  const isAccessible = await checkDatabaseStatus();
  
  if (!isAccessible) {
    console.log('\n🔄 Database may be paused. Try these steps:');
    console.log('   1. Go to Supabase dashboard');
    console.log('   2. Click "Unpause" or "Restart" database');
    console.log('   3. Wait 2-3 minutes for startup');
    console.log('   4. Run this script again\n');
    return;
  }
  
  // Perform emergency cleanup
  const results = await emergencyCleanup();
  
  // Try to vacuum/optimize
  await vacuumDatabase();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Check Supabase dashboard - database size should be reduced');
  console.log('   2. If still over quota, run deep-database-analysis.js');
  console.log('   3. Consider upgrading to paid plan if cleanup insufficient');
  console.log('   4. Set up automated cleanup jobs to prevent this issue\n');
  
  console.log('✅ Emergency cleanup complete!');
}

main().catch(console.error);