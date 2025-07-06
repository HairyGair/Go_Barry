#!/usr/bin/env node

/**
 * Investigate Database Size Issues
 * Uses Supabase client to safely query database size information
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkTableSizes() {
  console.log('🔍 Investigating Database Size Issues\n');
  
  // Known tables to check
  const tables = ['roadworks', 'supervisors', 'supervisor_sessions', 'message_templates'];
  const results = [];
  
  for (const table of tables) {
    try {
      // Get row count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`❌ ${table}: ${countError.message}`);
        continue;
      }
      
      // Get sample data to estimate size
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      let avgRowSize = 0;
      let hasLargeFields = false;
      
      if (!sampleError && sample && sample.length > 0) {
        const sizes = sample.map(row => {
          const jsonStr = JSON.stringify(row);
          
          // Check for unusually large fields
          Object.entries(row).forEach(([field, value]) => {
            if (value && typeof value === 'string' && value.length > 1000) {
              hasLargeFields = true;
              console.log(`   ⚠️  Large field detected: ${field} (${value.length} chars)`);
            }
          });
          
          return new Blob([jsonStr]).size;
        });
        
        avgRowSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      }
      
      const estimatedTotalSize = count * avgRowSize;
      const estimatedSizeMB = estimatedTotalSize / (1024 * 1024);
      
      results.push({
        table,
        rows: count,
        avgRowSize: Math.round(avgRowSize),
        estimatedSizeMB: estimatedSizeMB.toFixed(3),
        hasLargeFields
      });
      
      console.log(`📊 ${table}:`);
      console.log(`   Rows: ${count?.toLocaleString()}`);
      console.log(`   Avg row size: ${Math.round(avgRowSize)} bytes`);
      console.log(`   Estimated size: ${estimatedSizeMB.toFixed(3)} MB`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
  
  // Calculate totals
  const totalRows = results.reduce((sum, r) => sum + r.rows, 0);
  const totalEstimatedMB = results.reduce((sum, r) => sum + parseFloat(r.estimatedSizeMB), 0);
  
  console.log('📈 Summary:');
  console.log(`   Total rows across all tables: ${totalRows.toLocaleString()}`);
  console.log(`   Total estimated data size: ${totalEstimatedMB.toFixed(3)} MB`);
  console.log(`   Supabase reports database size: 524.25 MB`);
  console.log(`   Size discrepancy: ${(524.25 - totalEstimatedMB).toFixed(2)} MB unaccounted\n`);
  
  return results;
}

async function findHiddenTables() {
  console.log('🔍 Searching for other tables that might exist...\n');
  
  // Try common table names that might exist
  const possibleTables = [
    'alerts', 'incidents', 'disruptions', 'street_manager_data',
    'historical_incidents', 'audit_logs', 'geocoding_cache', 
    'weather_data', 'communication_logs', 'roadwork_dismissals',
    'roadwork_acknowledgments', 'saved_roadworks', 'auth',
    'storage', 'realtime', 'extensions'
  ];
  
  const existingTables = [];
  
  for (const table of possibleTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      if (!error) {
        existingTables.push({ table, rows: count });
        console.log(`✅ Found table: ${table} (${count || 0} rows)`);
      }
    } catch (error) {
      // Table doesn't exist, ignore
    }
  }
  
  if (existingTables.length === 0) {
    console.log('ℹ️  No additional tables found');
  }
  
  return existingTables;
}

async function analyzeBloatCauses() {
  console.log('\n🧐 Analyzing Potential Bloat Causes:\n');
  
  console.log('💡 Possible causes of 524MB database with minimal data:');
  console.log('   1. WAL (Write-Ahead Log) files not being cleaned');
  console.log('   2. PostgreSQL system catalogs bloated');
  console.log('   3. Deleted record space not reclaimed (needs VACUUM FULL)');
  console.log('   4. Large indexes relative to data size');
  console.log('   5. Supabase extensions or metadata overhead');
  console.log('   6. Temporary tables or cache not cleaned up');
  console.log('   7. Database transaction log files');
  
  console.log('\n🎯 Recommended Actions:');
  console.log('   1. PRIORITY: Contact Supabase support (they can run VACUUM FULL)');
  console.log('   2. TEMPORARY: Upgrade to Pro plan ($25/month) for immediate relief');
  console.log('   3. LAST RESORT: Database migration to fresh instance');
  
  console.log('\n📞 Support Ticket Template:');
  console.log('---');
  console.log('Subject: Database Bloat - 524MB Used with <1MB Data');
  console.log('');
  console.log('Our PostgreSQL database shows 524.25 MB usage but contains minimal data:');
  console.log('- roadworks: 66 rows (~60KB)');
  console.log('- supervisors: 9 rows (~2KB)'); 
  console.log('- message_templates: 5 rows (~3KB)');
  console.log('- supervisor_sessions: 1 row (<1KB)');
  console.log('');
  console.log('Total actual data: <100KB');
  console.log('Reported size: 524.25 MB'); 
  console.log('Discrepancy: >500MB unaccounted');
  console.log('');
  console.log('This appears to be PostgreSQL bloat requiring VACUUM FULL.');
  console.log('Could you please run database maintenance to reclaim this space?');
  console.log('---');
}

async function main() {
  console.log('🚀 Go BARRY Database Size Investigation\n');
  
  await checkTableSizes();
  await findHiddenTables();
  await analyzeBloatCauses();
  
  console.log('\n✅ Investigation complete!');
}

main().catch(console.error);