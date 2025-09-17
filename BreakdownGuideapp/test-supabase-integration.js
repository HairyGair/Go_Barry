#!/usr/bin/env node

/**
 * Supabase Integration Test Script
 * Tests production Supabase connection and table structure for Go North East Breakdown Guide
 * 
 * Usage: node test-supabase-integration.js
 * 
 * Tests:
 * 1. Database connectivity
 * 2. Table existence and structure
 * 3. Data retrieval and operations
 * 4. API endpoint functionality
 * 5. Table name mappings
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}🔍 ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.cyan}   ${msg}${colors.reset}`)
};

// Test configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  apiUrl: process.env.VITE_API_URL || 'https://breakdown-guide.onrender.com',
  
  // Expected table mappings
  tables: {
    production: ['fleet_vehicles', 'breakdowns', 'users', 'wizard_progress'],
    legacy: ['vehicles', 'supervisors', 'assessment_logs'] // Should NOT exist
  },
  
  // Test data limits
  limits: {
    fleet: 5,
    breakdowns: 3,
    users: 2,
    wizard_progress: 2
  }
};

// Initialize Supabase client
let supabase;

/**
 * Test 1: Database Connectivity
 */
async function testDatabaseConnectivity() {
  log.header('Testing Database Connectivity');
  
  try {
    // Check environment variables
    if (!config.supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable not set');
    }
    if (!config.supabaseKey) {
      throw new Error('SUPABASE_ANON_KEY environment variable not set');
    }
    
    log.success('Environment variables loaded');
    log.data(`Supabase URL: ${config.supabaseUrl}`);
    log.data(`API URL: ${config.apiUrl}`);
    
    // Initialize Supabase client
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
    log.success('Supabase client initialized');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
    
    log.success('Database connection established');
    return true;
    
  } catch (error) {
    log.error(`Database connectivity failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Table Structure Verification
 */
async function testTableStructure() {
  log.header('Testing Table Structure');
  
  const results = {
    production: {},
    legacy: {},
    errors: []
  };
  
  // Test production tables (should exist)
  for (const table of config.tables.production) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results.errors.push(`${table}: ${error.message}`);
        log.error(`Table '${table}' - ${error.message}`);
      } else {
        results.production[table] = count;
        log.success(`Table '${table}' exists with ${count} records`);
      }
    } catch (error) {
      results.errors.push(`${table}: ${error.message}`);
      log.error(`Table '${table}' - ${error.message}`);
    }
  }
  
  // Test legacy tables (should NOT exist)
  for (const table of config.tables.legacy) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { head: true });
      
      if (error) {
        log.success(`Legacy table '${table}' correctly does not exist`);
        results.legacy[table] = 'not_exists';
      } else {
        log.warning(`Legacy table '${table}' still exists (should be migrated)`);
        results.legacy[table] = 'exists';
      }
    } catch (error) {
      log.success(`Legacy table '${table}' correctly does not exist`);
      results.legacy[table] = 'not_exists';
    }
  }
  
  return results;
}

/**
 * Test 3: Data Retrieval and Structure
 */
async function testDataRetrieval() {
  log.header('Testing Data Retrieval and Structure');
  
  const tests = [];
  
  // Test fleet_vehicles table
  try {
    const { data: fleet, error: fleetError } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .limit(config.limits.fleet);
    
    if (fleetError) throw fleetError;
    
    log.success(`Retrieved ${fleet.length} fleet vehicles`);
    if (fleet.length > 0) {
      const vehicle = fleet[0];
      log.data(`Sample vehicle: Fleet ${vehicle.fleet_number} (${vehicle.registration || vehicle.reg_number})`);
      log.data(`Vehicle columns: ${Object.keys(vehicle).join(', ')}`);
    }
    tests.push({ table: 'fleet_vehicles', status: 'success', count: fleet.length });
    
  } catch (error) {
    log.error(`Fleet vehicles test failed: ${error.message}`);
    tests.push({ table: 'fleet_vehicles', status: 'error', error: error.message });
  }
  
  // Test breakdowns table
  try {
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('breakdowns')
      .select('*')
      .limit(config.limits.breakdowns)
      .order('created_at', { ascending: false });
    
    if (breakdownError) throw breakdownError;
    
    log.success(`Retrieved ${breakdowns.length} breakdown records`);
    if (breakdowns.length > 0) {
      const breakdown = breakdowns[0];
      log.data(`Latest breakdown: ${breakdown.breakdown_id} - Fleet ${breakdown.fleet_no || breakdown.fleet_number}`);
      log.data(`Status: ${breakdown.status}, Diagnosis: ${breakdown.diagnosis || 'N/A'}`);
      log.data(`Breakdown columns: ${Object.keys(breakdown).slice(0, 10).join(', ')}...`);
    }
    tests.push({ table: 'breakdowns', status: 'success', count: breakdowns.length });
    
  } catch (error) {
    log.error(`Breakdowns test failed: ${error.message}`);
    tests.push({ table: 'breakdowns', status: 'error', error: error.message });
  }
  
  // Test users table (supervisors)
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, depot, is_active')
      .eq('role', 'supervisor')
      .eq('is_active', true)
      .limit(config.limits.users);
    
    if (usersError) throw usersError;
    
    log.success(`Retrieved ${users.length} active supervisors`);
    if (users.length > 0) {
      const user = users[0];
      log.data(`Sample supervisor: ${user.full_name} (${user.username})`);
      log.data(`Depot: ${user.depot || 'Not assigned'}, Role: ${user.role}`);
    }
    tests.push({ table: 'users', status: 'success', count: users.length });
    
  } catch (error) {
    log.error(`Users test failed: ${error.message}`);
    tests.push({ table: 'users', status: 'error', error: error.message });
  }
  
  // Test wizard_progress table
  try {
    const { data: progress, error: progressError } = await supabase
      .from('wizard_progress')
      .select('*')
      .limit(config.limits.wizard_progress)
      .order('created_at', { ascending: false });
    
    if (progressError) throw progressError;
    
    log.success(`Retrieved ${progress.length} wizard progress records`);
    if (progress.length > 0) {
      const record = progress[0];
      log.data(`Latest progress: ${record.wizard_type} for breakdown ${record.breakdown_id}`);
    }
    tests.push({ table: 'wizard_progress', status: 'success', count: progress.length });
    
  } catch (error) {
    log.error(`Wizard progress test failed: ${error.message}`);
    tests.push({ table: 'wizard_progress', status: 'error', error: error.message });
  }
  
  return tests;
}

/**
 * Test 4: API Endpoint Functionality
 */
async function testAPIEndpoints() {
  log.header('Testing API Endpoints');
  
  const endpoints = [
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/api/fleet?limit=2', method: 'GET', name: 'Fleet API' },
    { path: '/api/auth/supervisors', method: 'GET', name: 'Supervisors API' },
    { path: '/api/breakdowns?limit=2', method: 'GET', name: 'Breakdowns API' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${config.apiUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        log.success(`${endpoint.name}: ${response.status} OK`);
        if (data.data && Array.isArray(data.data)) {
          log.data(`  Returned ${data.data.length} records`);
        } else if (Array.isArray(data)) {
          log.data(`  Returned ${data.length} records`);
        } else if (data.status) {
          log.data(`  Status: ${data.status}`);
        }
        results.push({ ...endpoint, status: 'success', statusCode: response.status });
      } else {
        log.warning(`${endpoint.name}: ${response.status} - ${data.error || data.message || 'Unknown error'}`);
        results.push({ ...endpoint, status: 'warning', statusCode: response.status, error: data.error });
      }
      
    } catch (error) {
      log.error(`${endpoint.name}: ${error.message}`);
      results.push({ ...endpoint, status: 'error', error: error.message });
    }
  }
  
  return results;
}

/**
 * Test 5: Breakdown ID Generation Test
 */
async function testBreakdownIDGeneration() {
  log.header('Testing Breakdown ID Generation');
  
  try {
    // Check current year breakdown count
    const currentYear = new Date().getFullYear();
    const { count, error } = await supabase
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${currentYear}-01-01`)
      .lt('created_at', `${currentYear + 1}-01-01`);
    
    if (error) throw error;
    
    const nextId = `BD-${currentYear}-${String((count || 0) + 1).padStart(5, '0')}`;
    
    log.success(`Current year (${currentYear}) breakdown count: ${count}`);
    log.success(`Next breakdown ID would be: ${nextId}`);
    
    // Verify existing breakdown ID format
    const { data: latestBreakdown, error: latestError } = await supabase
      .from('breakdowns')
      .select('breakdown_id, created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (latestError) throw latestError;
    
    if (latestBreakdown.length > 0) {
      const latest = latestBreakdown[0];
      log.data(`Latest breakdown ID: ${latest.breakdown_id}`);
      
      // Validate format
      const idPattern = /^BD-\d{4}-\d{5}$/;
      if (idPattern.test(latest.breakdown_id)) {
        log.success('Breakdown ID format is correct');
      } else {
        log.warning('Breakdown ID format does not match expected pattern');
      }
    }
    
    return { status: 'success', currentCount: count, nextId };
    
  } catch (error) {
    log.error(`Breakdown ID test failed: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test 6: Real-time Functionality
 */
async function testRealtimeFunctionality() {
  log.header('Testing Real-time Functionality');
  
  try {
    // Test if we can set up a subscription (don't actually listen)
    const channel = supabase
      .channel('breakdown_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'breakdowns' },
        (payload) => console.log('Change detected:', payload)
      );
    
    log.success('Real-time channel setup successful');
    
    // Clean up immediately
    await supabase.removeChannel(channel);
    log.success('Real-time channel cleanup successful');
    
    return { status: 'success' };
    
  } catch (error) {
    log.error(`Real-time test failed: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

/**
 * Generate Test Report
 */
function generateReport(results) {
  log.header('Test Report Summary');
  
  const report = {
    timestamp: new Date().toISOString(),
    connectivity: results.connectivity,
    tables: results.tables,
    data: results.data,
    api: results.api,
    breakdownId: results.breakdownId,
    realtime: results.realtime,
    overall: 'unknown'
  };
  
  // Calculate overall status
  const criticalTests = [results.connectivity, results.tables];
  const hasCriticalFailures = criticalTests.some(test => test === false || (test && test.errors && test.errors.length > 0));
  
  if (hasCriticalFailures) {
    report.overall = 'failed';
    log.error('Overall Status: FAILED - Critical issues detected');
  } else {
    const allTestsPassed = [
      results.connectivity === true,
      results.data && results.data.every(t => t.status === 'success'),
      results.api && results.api.every(t => t.status === 'success'),
      results.breakdownId && results.breakdownId.status === 'success',
      results.realtime && results.realtime.status === 'success'
    ].every(Boolean);
    
    if (allTestsPassed) {
      report.overall = 'passed';
      log.success('Overall Status: PASSED - All tests successful');
    } else {
      report.overall = 'partial';
      log.warning('Overall Status: PARTIAL - Some non-critical issues detected');
    }
  }
  
  // Summary statistics
  if (results.tables && results.tables.production) {
    log.info(`Database contains ${Object.values(results.tables.production).reduce((sum, count) => sum + (count || 0), 0)} total records`);
  }
  
  console.log('\n' + '='.repeat(80));
  log.success('Supabase Integration Test Complete');
  console.log('='.repeat(80));
  
  return report;
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('🧪 Go North East Supabase Integration Test Suite');
  console.log('==================================================\n');
  
  const results = {};
  
  try {
    // Run all tests in sequence
    results.connectivity = await testDatabaseConnectivity();
    
    if (results.connectivity) {
      results.tables = await testTableStructure();
      results.data = await testDataRetrieval();
      results.api = await testAPIEndpoints();
      results.breakdownId = await testBreakdownIDGeneration();
      results.realtime = await testRealtimeFunctionality();
    } else {
      log.error('Skipping remaining tests due to connectivity failure');
    }
    
    // Generate and display report
    const report = generateReport(results);
    
    // Save report to file
    const fs = await import('fs');
    const reportPath = './supabase-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log.success(`Test report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(report.overall === 'failed' ? 1 : 0);
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  log.warning('Test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run the tests
runTests();