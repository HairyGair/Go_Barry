#!/usr/bin/env node

/**
 * Deep Database Analysis for Supabase
 * Identifies what's consuming the 0.5GB database quota
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function analyzeTableSizes() {
  console.log('🔍 Deep Database Size Analysis\n');
  
  try {
    // Try to get actual table sizes using pg_total_relation_size
    console.log('📊 Attempting to get real table sizes...\n');
    
    // Get all user tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.log('❌ Could not access information_schema:', tablesError.message);
      return await fallbackAnalysis();
    }
    
    console.log(`Found ${tables.length} tables to analyze:\n`);
    
    const tableAnalysis = [];
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        // Get row count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.log(`❌ ${tableName}: ${countError.message}`);
          continue;
        }
        
        // Get a sample to analyze field sizes
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        let avgRowSize = 0;
        let largeFields = [];
        
        if (!sampleError && sample && sample.length > 0) {
          // Analyze each sample record
          const rowSizes = sample.map(row => {
            const jsonStr = JSON.stringify(row);
            
            // Check for large fields
            Object.entries(row).forEach(([field, value]) => {
              if (value && typeof value === 'string' && value.length > 1000) {
                largeFields.push({
                  field,
                  size: value.length,
                  type: typeof value,
                  sample: value.substring(0, 100) + '...'
                });
              }
            });
            
            return new Blob([jsonStr]).size;
          });
          
          avgRowSize = rowSizes.reduce((a, b) => a + b, 0) / rowSizes.length;
        }
        
        const estimatedTotalSize = count * avgRowSize;
        const estimatedSizeMB = estimatedTotalSize / (1024 * 1024);
        
        tableAnalysis.push({
          table: tableName,
          rows: count,
          avgRowSize: Math.round(avgRowSize),
          estimatedTotalSize,
          estimatedSizeMB: estimatedSizeMB.toFixed(2),
          largeFields: largeFields.slice(0, 3) // Top 3 large fields
        });
        
        console.log(`📦 ${tableName}:`);
        console.log(`   Rows: ${count?.toLocaleString()}`);
        console.log(`   Avg row size: ${Math.round(avgRowSize)} bytes`);
        console.log(`   Estimated total: ${estimatedSizeMB.toFixed(2)} MB`);
        
        if (largeFields.length > 0) {
          console.log(`   ⚠️  Large fields detected:`);
          largeFields.slice(0, 2).forEach(field => {
            console.log(`      ${field.field}: ${field.size} chars`);
          });
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      }
    }
    
    // Sort by size
    tableAnalysis.sort((a, b) => b.estimatedTotalSize - a.estimatedTotalSize);
    
    console.log('\n🔥 Largest Tables:');
    tableAnalysis.slice(0, 10).forEach((table, index) => {
      console.log(`${index + 1}. ${table.table}: ${table.estimatedSizeMB} MB (${table.rows} rows)`);
    });
    
    const totalEstimatedMB = tableAnalysis.reduce((sum, t) => sum + parseFloat(t.estimatedSizeMB), 0);
    console.log(`\n📊 Total Estimated Database Size: ${totalEstimatedMB.toFixed(2)} MB`);
    
    if (totalEstimatedMB < 50) {
      console.log('\n🤔 Size discrepancy detected!');
      console.log('   Estimated: ' + totalEstimatedMB.toFixed(2) + ' MB');
      console.log('   Supabase reports: >500 MB');
      console.log('\n💡 Possible causes:');
      console.log('   - Large indexes or system tables');
      console.log('   - Database bloat from deleted records');
      console.log('   - WAL (Write-Ahead Log) files');
      console.log('   - Temporary tables or cache');
    }
    
    return tableAnalysis;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return await fallbackAnalysis();
  }
}

async function fallbackAnalysis() {
  console.log('\n🔄 Performing fallback analysis...\n');
  
  const commonTables = [
    'roadworks', 'alerts', 'incidents', 'supervisors',
    'supervisor_sessions', 'disruptions', 'street_manager_data',
    'historical_incidents', 'audit_logs', 'geocoding_cache',
    'weather_data', 'message_templates', 'communication_logs',
    'roadwork_dismissals', 'roadwork_acknowledgments', 'saved_roadworks'
  ];
  
  for (const table of commonTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`📦 ${table}: ${count || 0} rows`);
      }
    } catch (error) {
      // Table doesn't exist, skip
    }
  }
}

async function identifyCleanupTargets() {
  console.log('\n🎯 Identifying Immediate Cleanup Targets...\n');
  
  const cleanupTargets = [];
  
  // Check for tables that commonly accumulate large amounts of data
  const highRiskTables = [
    { table: 'audit_logs', reason: 'Logs can accumulate quickly' },
    { table: 'street_manager_data', reason: 'Large external API responses' },
    { table: 'communication_logs', reason: 'Message history' },
    { table: 'geocoding_cache', reason: 'Cached geocoding responses' },
    { table: 'supervisor_sessions', reason: 'Old session data' },
    { table: 'roadwork_dismissals', reason: 'Historical user actions' },
    { table: 'roadwork_acknowledgments', reason: 'Historical user actions' }
  ];
  
  for (const { table, reason } of highRiskTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error && count > 0) {
        // Check for old records
        const { count: oldCount, error: oldError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        cleanupTargets.push({
          table,
          totalRows: count,
          oldRows: oldCount || 0,
          reason,
          priority: count > 1000 ? 'HIGH' : count > 100 ? 'MEDIUM' : 'LOW'
        });
        
        console.log(`🗑️  ${table}:`);
        console.log(`   Total: ${count} rows`);
        console.log(`   Old (30+ days): ${oldCount || 0} rows`);
        console.log(`   Priority: ${count > 1000 ? 'HIGH' : count > 100 ? 'MEDIUM' : 'LOW'}`);
        console.log(`   Reason: ${reason}\n`);
      }
    } catch (error) {
      // Table doesn't exist or error, skip
    }
  }
  
  return cleanupTargets;
}

async function generateEmergencyCleanupPlan(cleanupTargets) {
  console.log('\n🚨 EMERGENCY CLEANUP PLAN\n');
  
  const highPriorityTargets = cleanupTargets.filter(t => t.priority === 'HIGH');
  const mediumPriorityTargets = cleanupTargets.filter(t => t.priority === 'MEDIUM');
  
  if (highPriorityTargets.length > 0) {
    console.log('🔥 IMMEDIATE ACTION REQUIRED:');
    highPriorityTargets.forEach(target => {
      console.log(`   1. DELETE FROM ${target.table} WHERE created_at < NOW() - INTERVAL '30 days';`);
      console.log(`      Expected cleanup: ${target.oldRows} rows\n`);
    });
  }
  
  if (mediumPriorityTargets.length > 0) {
    console.log('⚠️  MEDIUM PRIORITY:');
    mediumPriorityTargets.forEach(target => {
      console.log(`   2. DELETE FROM ${target.table} WHERE created_at < NOW() - INTERVAL '7 days';`);
      console.log(`      Expected cleanup: ${target.oldRows} rows\n`);
    });
  }
  
  console.log('💡 ADDITIONAL RECOMMENDATIONS:');
  console.log('   - Check for large text/json fields in remaining tables');
  console.log('   - Consider VACUUM FULL to reclaim deleted space');
  console.log('   - Monitor after cleanup to verify size reduction');
  console.log('   - Implement automated cleanup jobs\n');
}

async function main() {
  console.log('🚀 Go BARRY - Emergency Database Analysis\n');
  
  const tableAnalysis = await analyzeTableSizes();
  const cleanupTargets = await identifyCleanupTargets();
  await generateEmergencyCleanupPlan(cleanupTargets);
  
  console.log('✅ Analysis complete! Take immediate action on HIGH priority items.');
}

main().catch(console.error);