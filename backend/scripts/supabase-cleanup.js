#!/usr/bin/env node

/**
 * Supabase Data Cleanup Script
 * Removes old data to reduce storage and egress usage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const CLEANUP_RULES = [
  {
    table: 'supervisor_sessions',
    dateField: 'created_at',
    retentionDays: 7,
    description: 'Old supervisor sessions'
  },
  {
    table: 'audit_logs',
    dateField: 'created_at', 
    retentionDays: 30,
    description: 'Audit logs older than 30 days'
  },
  {
    table: 'communication_logs',
    dateField: 'timestamp',
    retentionDays: 30,
    description: 'Communication logs older than 30 days'
  },
  {
    table: 'geocoding_cache',
    dateField: 'cached_at',
    retentionDays: 90,
    description: 'Stale geocoding cache entries'
  },
  {
    table: 'roadworks',
    dateField: 'last_updated',
    retentionDays: 180,
    condition: { status: 'completed' },
    description: 'Completed roadworks older than 6 months'
  },
  {
    table: 'incidents',
    dateField: 'created_at',
    retentionDays: 60,
    condition: { status: 'resolved' },
    description: 'Resolved incidents older than 2 months'
  }
];

async function cleanupTable(rule) {
  const { table, dateField, retentionDays, condition, description } = rule;
  
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffISO = cutoffDate.toISOString();
    
    console.log(`\n🧹 Cleaning up: ${description}`);
    console.log(`   Table: ${table}`);
    console.log(`   Cutoff date: ${cutoffDate.toLocaleDateString()}`);
    
    // First, count how many records will be deleted
    let countQuery = supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .lt(dateField, cutoffISO);
    
    // Apply additional conditions if specified
    if (condition) {
      Object.entries(condition).forEach(([column, value]) => {
        countQuery = countQuery.eq(column, value);
      });
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error(`   ❌ Error counting records: ${countError.message}`);
      return { success: false, error: countError.message };
    }
    
    if (count === 0) {
      console.log(`   ✅ No records to clean up`);
      return { success: true, deleted: 0 };
    }
    
    console.log(`   🎯 Found ${count} records to delete`);
    
    // Perform the cleanup in batches to avoid timeouts
    const batchSize = 100;
    let totalDeleted = 0;
    
    while (totalDeleted < count) {
      let deleteQuery = supabase
        .from(table)
        .delete()
        .lt(dateField, cutoffISO)
        .limit(batchSize);
      
      // Apply additional conditions if specified
      if (condition) {
        Object.entries(condition).forEach(([column, value]) => {
          deleteQuery = deleteQuery.eq(column, value);
        });
      }
      
      const { error: deleteError, count: deletedCount } = await deleteQuery;
      
      if (deleteError) {
        console.error(`   ❌ Error deleting batch: ${deleteError.message}`);
        break;
      }
      
      totalDeleted += deletedCount || batchSize;
      console.log(`   📦 Deleted batch: ${deletedCount || batchSize} records (${totalDeleted}/${count})`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`   ✅ Cleanup complete: ${totalDeleted} records deleted`);
    return { success: true, deleted: totalDeleted };
    
  } catch (error) {
    console.error(`   ❌ Cleanup failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function generateCleanupReport() {
  console.log('📊 Generating cleanup impact report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    tables: [],
    totalRecordsToCleanup: 0,
    estimatedSpaceSaved: 0
  };
  
  for (const rule of CLEANUP_RULES) {
    const { table, dateField, retentionDays, condition } = rule;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      let query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .lt(dateField, cutoffDate.toISOString());
      
      if (condition) {
        Object.entries(condition).forEach(([column, value]) => {
          query = query.eq(column, value);
        });
      }
      
      const { count, error } = await query;
      
      if (!error) {
        const tableReport = {
          table,
          recordsToCleanup: count || 0,
          retentionDays,
          description: rule.description
        };
        
        report.tables.push(tableReport);
        report.totalRecordsToCleanup += count || 0;
        
        console.log(`📋 ${table}: ${count || 0} records to cleanup`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Error - ${error.message}`);
    }
  }
  
  // Estimate space saved (rough calculation)
  report.estimatedSpaceSaved = Math.round(report.totalRecordsToCleanup * 0.5); // Assume 0.5KB per record
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total records to cleanup: ${report.totalRecordsToCleanup}`);
  console.log(`   Estimated space saved: ~${report.estimatedSpaceSaved} KB`);
  
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isReport = args.includes('--report');
  
  console.log('🚀 Go BARRY - Supabase Data Cleanup\n');
  
  if (isReport || isDryRun) {
    await generateCleanupReport();
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN - No data was actually deleted');
      console.log('Run without --dry-run to perform actual cleanup');
    }
    
    return;
  }
  
  console.log('⚠️  This will permanently delete old data from Supabase');
  console.log('💡 Add --dry-run flag to see what would be deleted without actually deleting\n');
  
  const results = [];
  
  for (const rule of CLEANUP_RULES) {
    const result = await cleanupTable(rule);
    results.push({ ...rule, ...result });
  }
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);
  const failedTables = results.filter(r => !r.success);
  
  console.log(`   ✅ Total records deleted: ${totalDeleted}`);
  console.log(`   ❌ Failed tables: ${failedTables.length}`);
  
  if (failedTables.length > 0) {
    console.log('\n❌ Failed cleanups:');
    failedTables.forEach(f => {
      console.log(`   ${f.table}: ${f.error}`);
    });
  }
  
  console.log('\n🎉 Cleanup complete!');
}

// Handle command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}