#!/usr/bin/env node
// backend/test-disruption-api.js
// Test script to verify the disruption logging API endpoints

import dotenv from 'dotenv';

dotenv.config();

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/disruptions`;

// Test data
const sampleDisruption = {
  title: 'Test Vehicle Breakdown - A1 Southbound',
  description: 'Lane 2 blocked due to vehicle breakdown between J65 and J66',
  type: 'breakdown',
  location: 'A1 Southbound, between Junction 65 and 66',
  supervisor_id: 'TEST_SUP_001',
  supervisor_name: 'Test Supervisor',
  depot: 'Gateshead',
  shift: 'Day Shift',
  affected_routes: ['21', 'X21', '25'],
  resolution_method: 'Recovery vehicle dispatched, traffic cleared',
  actions_taken: 'Coordinated with recovery service, directed traffic, updated control room',
  severity_level: 'medium',
  resolution_time_minutes: 25,
  response_time_minutes: 8,
  driver_notifications: 'All affected route drivers notified via radio',
  lessons_learned: 'Earlier coordination with recovery services could reduce resolution time',
  preventable: false,
  recurring_issue: false,
  follow_up_required: false
};

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

// Test functions
async function testHealthCheck() {
  try {
    log.info('Testing health check endpoint...');
    
    const response = await fetch(`${API_BASE}/health`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      log.success('Health check passed');
      console.log('  Status:', result.health.status);
      console.log('  Table accessible:', result.health.table_accessible);
      return true;
    } else {
      log.error(`Health check failed: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Health check error: ${error.message}`);
    return false;
  }
}

async function testLogDisruption() {
  try {
    log.info('Testing disruption logging...');
    
    const response = await fetch(`${API_BASE}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleDisruption)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      log.success('Disruption logged successfully');
      console.log('  Log ID:', result.data.id);
      console.log('  Title:', result.data.title);
      return result.data.id;
    } else {
      log.error(`Logging failed: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    log.error(`Logging error: ${error.message}`);
    return null;
  }
}

async function testGetLogs() {
  try {
    log.info('Testing logs retrieval...');
    
    const response = await fetch(`${API_BASE}/logs?limit=5`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      log.success(`Retrieved ${result.logs.length} logs`);
      
      if (result.logs.length > 0) {
        const latestLog = result.logs[0];
        console.log('  Latest log:', latestLog.title);
        console.log('  Logged at:', new Date(latestLog.logged_at).toLocaleString());
      }
      
      return result.logs;
    } else {
      log.error(`Retrieval failed: ${result.error || 'Unknown error'}`);
      return [];
    }
  } catch (error) {
    log.error(`Retrieval error: ${error.message}`);
    return [];
  }
}

async function testGetStatistics() {
  try {
    log.info('Testing statistics generation...');
    
    const response = await fetch(`${API_BASE}/statistics`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      log.success('Statistics generated successfully');
      const stats = result.statistics;
      
      console.log('  Total disruptions:', stats.total_disruptions);
      console.log('  Average resolution time:', stats.average_resolution_time + ' minutes');
      console.log('  Preventable percentage:', stats.preventable_percentage + '%');
      
      return stats;
    } else {
      log.error(`Statistics failed: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    log.error(`Statistics error: ${error.message}`);
    return null;
  }
}

async function testGetSpecificLog(logId) {
  if (!logId) {
    log.warning('Skipping specific log test - no log ID provided');
    return false;
  }
  
  try {
    log.info(`Testing specific log retrieval (ID: ${logId})...`);
    
    const response = await fetch(`${API_BASE}/logs/${logId}`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      log.success('Specific log retrieved successfully');
      console.log('  Title:', result.log.title);
      console.log('  Type:', result.log.type);
      return true;
    } else {
      log.error(`Specific log retrieval failed: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Specific log retrieval error: ${error.message}`);
    return false;
  }
}

async function testFiltering() {
  try {
    log.info('Testing log filtering...');
    
    // Test filtering by type
    const response = await fetch(`${API_BASE}/logs?type=breakdown&limit=10`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      log.success(`Filtering worked - found ${result.logs.length} breakdown logs`);
      
      // Verify all results are actually breakdowns
      const allBreakdowns = result.logs.every(log => log.type === 'breakdown');
      if (allBreakdowns || result.logs.length === 0) {
        log.success('Filter accuracy verified');
      } else {
        log.warning('Filter returned mixed results');
      }
      
      return true;
    } else {
      log.error(`Filtering failed: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Filtering error: ${error.message}`);
    return false;
  }
}

async function testValidation() {
  try {
    log.info('Testing input validation...');
    
    // Test with missing required fields
    const invalidData = {
      title: 'Missing required fields test'
      // Missing type, location, supervisor_id
    };
    
    const response = await fetch(`${API_BASE}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    });
    
    const result = await response.json();
    
    if (response.status === 400 && !result.success) {
      log.success('Validation working correctly - rejected invalid data');
      console.log('  Error message:', result.error);
      return true;
    } else {
      log.warning('Validation may not be working - invalid data was accepted');
      return false;
    }
  } catch (error) {
    log.error(`Validation test error: ${error.message}`);
    return false;
  }
}

async function testServerConnection() {
  try {
    log.info('Testing server connection...');
    
    const response = await fetch(BASE_URL, { 
      method: 'GET',
      timeout: 5000 
    });
    
    if (response.ok) {
      log.success('Server is reachable');
      return true;
    } else {
      log.error(`Server returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Server connection failed: ${error.message}`);
    log.warning('Make sure your backend server is running on ' + BASE_URL);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 BARRY Disruption API Test Suite');
  console.log('====================================');
  console.log(`Testing API at: ${API_BASE}`);
  console.log('');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const tests = [
    { name: 'Server Connection', fn: testServerConnection },
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Input Validation', fn: testValidation },
    { name: 'Log Disruption', fn: testLogDisruption },
    { name: 'Get Logs', fn: testGetLogs },
    { name: 'Get Statistics', fn: testGetStatistics },
    { name: 'Log Filtering', fn: testFiltering }
  ];
  
  let testLogId = null;
  
  for (const test of tests) {
    results.total++;
    console.log('');
    
    try {
      const result = await test.fn();
      
      if (result) {
        results.passed++;
        
        // Capture log ID for subsequent tests
        if (test.name === 'Log Disruption' && typeof result === 'string') {
          testLogId = result;
        }
      } else {
        results.failed++;
      }
    } catch (error) {
      log.error(`Test "${test.name}" threw exception: ${error.message}`);
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test specific log retrieval if we have an ID
  if (testLogId) {
    results.total++;
    console.log('');
    const specificLogResult = await testGetSpecificLog(testLogId);
    if (specificLogResult) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Print summary
  console.log('');
  console.log('📊 Test Results');
  console.log('================');
  console.log(`Total tests: ${results.total}`);
  log.success(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    log.error(`Failed: ${results.failed}`);
  }
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`Success rate: ${successRate}%`);
  
  if (results.failed === 0) {
    console.log('');
    log.success('🎉 All tests passed! Your disruption logging API is working correctly.');
  } else {
    console.log('');
    log.warning('⚠️  Some tests failed. Check the error messages above.');
    console.log('');
    console.log('Common issues:');
    console.log('- Make sure your backend server is running');
    console.log('- Check that the Supabase database table exists');
    console.log('- Verify your environment variables are set correctly');
    console.log('- Ensure the database schema has been created');
  }
  
  return results.failed === 0;
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'health':
      testHealthCheck().then(success => process.exit(success ? 0 : 1));
      break;
      
    case 'log':
      testLogDisruption().then(result => process.exit(result ? 0 : 1));
      break;
      
    case 'stats':
      testGetStatistics().then(result => process.exit(result ? 0 : 1));
      break;
      
    case 'all':
    default:
      runAllTests().then(success => process.exit(success ? 0 : 1));
      break;
  }
}

export { runAllTests, testHealthCheck, testLogDisruption, testGetLogs, testGetStatistics };
