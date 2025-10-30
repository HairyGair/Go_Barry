// Test script for Fleet Intelligence / Defects API endpoints
// Run with: node test-defects.js

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';
let authToken = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper function to make authenticated API calls
async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    data
  };
}

// Test functions
async function testLogin() {
  console.log(`\n${colors.blue}=== Testing Authentication ===${colors.reset}`);

  try {
    const result = await apiCall('POST', '/api/auth/login', {
      email: 'anthony.gair@gonortheast.co.uk',
      password: 'test123'
    });

    if (result.status === 200 && result.data.token) {
      authToken = result.data.token;
      console.log(`${colors.green}✅ Login successful${colors.reset}`);
      console.log(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log(`${colors.red}❌ Login failed${colors.reset}`);
      console.log('Response:', result.data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Login error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testRepeatDefects() {
  console.log(`\n${colors.blue}=== Testing Repeat Defects Analysis ===${colors.reset}`);

  try {
    const result = await apiCall('POST', '/api/defects/repeat', {
      timeframe: '7d'
    });

    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}✅ Repeat defects analysis successful${colors.reset}`);
      console.log(`Total vehicles analyzed: ${result.data.totalVehiclesAnalyzed}`);
      console.log(`Vehicles with repeat defects: ${result.data.repeatDefectVehicles}`);

      if (result.data.vehicles.length > 0) {
        console.log(`\nTop 3 vehicles with repeat defects:`);
        result.data.vehicles.slice(0, 3).forEach((vehicle, index) => {
          console.log(`  ${index + 1}. ${vehicle.fleetNumber} - ${vehicle.defectCount} defects`);
        });
      }
    } else {
      console.log(`${colors.red}❌ Repeat defects analysis failed${colors.reset}`);
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testDefectTrends() {
  console.log(`\n${colors.blue}=== Testing Defect Trends Analysis ===${colors.reset}`);

  try {
    const result = await apiCall('POST', '/api/defects/trends', {
      timeframe: '7d',
      groupByType: true
    });

    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}✅ Defect trends analysis successful${colors.reset}`);
      console.log(`Current period defects: ${result.data.currentPeriod.totalDefects}`);
      console.log(`Comparison period defects: ${result.data.comparisonPeriod.totalDefects}`);
      console.log(`Rising trends: ${result.data.risingTrends}`);
      console.log(`Falling trends: ${result.data.fallingTrends}`);
      console.log(`Stable trends: ${result.data.stableTrends}`);

      if (result.data.trends.length > 0) {
        console.log(`\nTop 3 defect trends:`);
        result.data.trends.slice(0, 3).forEach((trend, index) => {
          const arrow = trend.trend === 'rising' ? '↑' :
                       trend.trend === 'falling' ? '↓' : '→';
          const color = trend.trend === 'rising' ? colors.red :
                       trend.trend === 'falling' ? colors.green : colors.yellow;

          console.log(`  ${index + 1}. ${trend.defectType}: ${trend.currentCount} (${color}${arrow} ${trend.changePercent}%${colors.reset})`);
        });
      }
    } else {
      console.log(`${colors.red}❌ Defect trends analysis failed${colors.reset}`);
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testDepotStats() {
  console.log(`\n${colors.blue}=== Testing Depot Statistics ===${colors.reset}`);

  try {
    const result = await apiCall('GET', '/api/defects/depot-stats?timeframe=7d');

    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}✅ Depot statistics retrieved successfully${colors.reset}`);
      console.log(`Total defects: ${result.data.totalDefects}`);

      if (result.data.depots.length > 0) {
        console.log(`\nDepot Statistics:`);
        result.data.depots.forEach((depot, index) => {
          console.log(`  ${index + 1}. ${depot.name}:`);
          console.log(`     Defect Rate: ${depot.defectRate}%`);
          console.log(`     Top Issue: ${depot.topIssue} (${depot.topIssueCount} occurrences)`);
          console.log(`     Trend: ${depot.trend}`);
        });
      }
    } else {
      console.log(`${colors.red}❌ Depot statistics failed${colors.reset}`);
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testPredictiveAlerts() {
  console.log(`\n${colors.blue}=== Testing Predictive Maintenance Alerts ===${colors.reset}`);

  try {
    const result = await apiCall('GET', '/api/defects/predictive');

    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}✅ Predictive alerts generated successfully${colors.reset}`);
      console.log(`Total alerts: ${result.data.alertCount}`);

      if (result.data.alerts.length > 0) {
        console.log(`\nPredictive Maintenance Alerts:`);
        result.data.alerts.forEach((alert, index) => {
          const priorityColor = alert.priority === 'high' ? colors.red :
                               alert.priority === 'medium' ? colors.yellow : colors.blue;
          console.log(`  ${index + 1}. [${priorityColor}${alert.priority.toUpperCase()}${colors.reset}] ${alert.type.toUpperCase()}`);
          console.log(`     ${alert.message}`);
          console.log(`     Recommendation: ${alert.recommendation}`);
        });
      }
    } else {
      console.log(`${colors.red}❌ Predictive alerts failed${colors.reset}`);
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testVehicleHistory() {
  console.log(`\n${colors.blue}=== Testing Vehicle Defect History ===${colors.reset}`);

  try {
    // Try to get a vehicle with defects
    const result = await apiCall('GET', '/api/defects/vehicle/6335?limit=10');

    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}✅ Vehicle defect history retrieved${colors.reset}`);
      console.log(`Fleet Number: ${result.data.fleetNumber}`);
      console.log(`Total Defects: ${result.data.totalDefects}`);
      console.log(`Average Severity: ${result.data.averageSeverity}`);

      if (result.data.mostCommonDefect) {
        console.log(`Most Common Defect: ${result.data.mostCommonDefect.type} (${result.data.mostCommonDefect.count} times)`);
      }

      if (result.data.defects.length > 0) {
        console.log(`\nRecent Defects (${result.data.defects.length}):`);
        result.data.defects.slice(0, 5).forEach((defect, index) => {
          console.log(`  ${index + 1}. ${defect.type} - ${defect.severity} (${new Date(defect.date).toLocaleDateString()})`);
        });
      }
    } else {
      console.log(`${colors.yellow}⚠️  No defect history found for vehicle 6335${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testDefectReport() {
  console.log(`\n${colors.blue}=== Testing Defect Report Generation ===${colors.reset}`);

  try {
    const result = await apiCall('POST', '/api/defects/report', {
      timeframe: '30d',
      includeRepeatDefects: true,
      includeTrends: true,
      includeDepotStats: true,
      includePredictive: true
    });

    if (result.status === 200 && result.data.success) {
      console.log(`${colors.green}✅ Defect report generated successfully${colors.reset}`);
      console.log(`Title: ${result.data.report.title}`);
      console.log(`Generated At: ${new Date(result.data.report.generatedAt).toLocaleString()}`);
      console.log(`Generated By: ${result.data.report.generatedBy}`);
      console.log(`Timeframe: ${result.data.report.timeframe}`);
      console.log(`\nSummary:`);
      console.log(`  Total Defects: ${result.data.report.summary.totalDefects}`);
      console.log(`  Days Analyzed: ${result.data.report.summary.daysAnalyzed}`);
      console.log(`\nSections Included:`);
      Object.keys(result.data.report.sections).forEach(section => {
        console.log(`  - ${section}`);
      });
    } else {
      console.log(`${colors.red}❌ Defect report generation failed${colors.reset}`);
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   Fleet Intelligence / Defects API Test Suite        ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nAPI URL: ${API_URL}`);

  // Authenticate first
  const loginSuccess = await testLogin();

  if (!loginSuccess) {
    console.log(`\n${colors.red}⚠️  Authentication failed - using development mode fallback${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Some tests may fail without proper authentication${colors.reset}`);
  }

  // Run all tests
  await testRepeatDefects();
  await testDefectTrends();
  await testDepotStats();
  await testPredictiveAlerts();
  await testVehicleHistory();
  await testDefectReport();

  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   Test Suite Complete                                 ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════╝${colors.reset}\n`);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
