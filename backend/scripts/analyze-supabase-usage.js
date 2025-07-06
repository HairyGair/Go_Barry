#!/usr/bin/env node

/**
 * Supabase Usage Analysis Script
 * Analyzes table sizes and data usage to optimize database usage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeTableSizes() {
  console.log('🔍 Analyzing Supabase table sizes...\n');
  
  try {
    // Get table sizes using pg_stat_user_tables
    const { data: tableStats, error: statsError } = await supabase
      .from('pg_stat_user_tables')
      .select('*');

    if (statsError) {
      console.warn('⚠️ Could not access pg_stat_user_tables:', statsError.message);
    }

    // Get table sizes using information_schema
    const { data: tableSizes, error: sizeError } = await supabase.rpc('get_table_sizes');
    
    if (sizeError) {
      console.warn('⚠️ Could not get table sizes via RPC');
      // Fallback: check individual tables
      await checkIndividualTables();
    } else {
      console.log('📊 Table Sizes:');
      tableSizes.forEach(table => {
        console.log(`  ${table.table_name}: ${formatBytes(table.size_bytes)}`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing table sizes:', error.message);
    await checkIndividualTables();
  }
}

async function checkIndividualTables() {
  console.log('\n📋 Checking individual table row counts...\n');
  
  const tables = [
    'roadworks',
    'alerts', 
    'incidents',
    'supervisors',
    'supervisor_sessions',
    'disruptions',
    'street_manager_data',
    'historical_incidents',
    'audit_logs',
    'geocoding_cache',
    'weather_data',
    'message_templates',
    'communication_logs'
  ];

  const tableAnalysis = [];

  for (const table of tables) {
    try {
      // Get row count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`  ❌ ${table}: Error - ${countError.message}`);
        continue;
      }

      // Get sample record to estimate size
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      let estimatedSizePerRow = 0;
      if (!sampleError && sample && sample.length > 0) {
        const sampleJson = JSON.stringify(sample[0]);
        estimatedSizePerRow = new Blob([sampleJson]).size;
      }

      const estimatedTotalSize = count * estimatedSizePerRow;

      tableAnalysis.push({
        table,
        rows: count,
        estimatedSizePerRow,
        estimatedTotalSize
      });

      console.log(`  📦 ${table}: ${count?.toLocaleString() || 0} rows (~${formatBytes(estimatedTotalSize)})`);

    } catch (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    }
  }

  // Sort by estimated size
  tableAnalysis.sort((a, b) => b.estimatedTotalSize - a.estimatedTotalSize);

  console.log('\n🔥 Largest Tables by Estimated Size:');
  tableAnalysis.slice(0, 5).forEach((table, index) => {
    console.log(`  ${index + 1}. ${table.table}: ${formatBytes(table.estimatedTotalSize)} (${table.rows?.toLocaleString()} rows)`);
  });

  return tableAnalysis;
}

async function analyzeDataRetention() {
  console.log('\n📅 Analyzing data age for retention opportunities...\n');

  const retentionChecks = [
    { table: 'audit_logs', dateField: 'created_at', suggestedRetention: '30 days' },
    { table: 'roadworks', dateField: 'last_updated', suggestedRetention: '90 days for completed' },
    { table: 'incidents', dateField: 'created_at', suggestedRetention: '60 days' },
    { table: 'supervisor_sessions', dateField: 'created_at', suggestedRetention: '7 days' },
    { table: 'communication_logs', dateField: 'timestamp', suggestedRetention: '30 days' },
    { table: 'geocoding_cache', dateField: 'cached_at', suggestedRetention: '90 days' }
  ];

  for (const check of retentionChecks) {
    try {
      // Check data older than suggested retention
      const cutoffDays = check.suggestedRetention.includes('30') ? 30 :
                        check.suggestedRetention.includes('60') ? 60 :
                        check.suggestedRetention.includes('90') ? 90 : 7;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);

      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true })
        .lt(check.dateField, cutoffDate.toISOString());

      if (!error) {
        console.log(`  🗑️  ${check.table}: ${count?.toLocaleString() || 0} records older than ${cutoffDays} days`);
      }

    } catch (error) {
      console.log(`  ❌ ${check.table}: ${error.message}`);
    }
  }
}

async function generateOptimizationRecommendations(tableAnalysis) {
  console.log('\n💡 Optimization Recommendations:\n');

  const recommendations = [];

  // Check for large tables
  const largeTables = tableAnalysis.filter(t => t.estimatedTotalSize > 10 * 1024 * 1024); // > 10MB
  
  if (largeTables.length > 0) {
    recommendations.push({
      type: 'Large Tables',
      action: `Consider archiving or cleaning up: ${largeTables.map(t => t.table).join(', ')}`,
      impact: 'High'
    });
  }

  // Check for high row count tables
  const highRowTables = tableAnalysis.filter(t => t.rows > 10000);
  
  if (highRowTables.length > 0) {
    recommendations.push({
      type: 'High Row Count',
      action: `Implement pagination and data retention: ${highRowTables.map(t => t.table).join(', ')}`,
      impact: 'Medium'
    });
  }

  // Specific recommendations
  recommendations.push(
    {
      type: 'Data Retention',
      action: 'Implement automated cleanup for logs older than 30 days',
      impact: 'High'
    },
    {
      type: 'API Optimization', 
      action: 'Add LIMIT clauses to all SELECT queries to reduce egress',
      impact: 'Medium'
    },
    {
      type: 'Caching',
      action: 'Implement local caching to reduce repeated Supabase queries',
      impact: 'Medium'
    },
    {
      type: 'Data Archival',
      action: 'Move historical data (>90 days) to cheaper storage',
      impact: 'High'
    }
  );

  recommendations.forEach(rec => {
    console.log(`  🎯 ${rec.type} (${rec.impact} Impact):`);
    console.log(`     ${rec.action}\n`);
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  console.log('🚀 Go BARRY - Supabase Usage Analysis\n');
  
  await analyzeTableSizes();
  const tableAnalysis = await checkIndividualTables();
  await analyzeDataRetention();
  await generateOptimizationRecommendations(tableAnalysis);
  
  console.log('✅ Analysis complete!');
}

main().catch(console.error);