#!/usr/bin/env node

/**
 * Test script for Go BARRY Bus Location API
 * Verifies the UK Bus Data API integration
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

const API_BASE = process.env.API_URL || 'http://localhost:3001';

console.log(chalk.blue('\n🚌 Testing Go BARRY Bus Location API Configuration\n'));

async function testEndpoint(endpoint, description) {
  try {
    console.log(chalk.yellow(`\nTesting: ${description}`));
    console.log(chalk.gray(`Endpoint: ${API_BASE}${endpoint}`));
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(chalk.green('✅ Success!'));
      return data;
    } else {
      console.log(chalk.red('❌ Failed:'), data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log(chalk.red('❌ Error:'), error.message);
    return null;
  }
}

async function runTests() {
  // Test 1: Check configuration
  const config = await testEndpoint('/api/bus-locations/config', 'Bus Location Service Configuration');
  if (config) {
    console.log(chalk.cyan('Configuration:'));
    console.log('  Primary URL:', config.configuration.primaryDataset.url);
    console.log('  API Key:', config.configuration.primaryDataset.apiKey);
    console.log('  Dataset ID:', config.configuration.primaryDataset.id);
  }

  // Test 2: Get statistics
  const stats = await testEndpoint('/api/bus-locations/stats', 'Bus Location Statistics');
  if (stats) {
    console.log(chalk.cyan('Statistics:'));
    console.log('  Total Vehicles:', stats.statistics.totalVehicles);
    console.log('  Active Vehicles:', stats.statistics.activeVehicles);
    console.log('  Data Source:', stats.statistics.dataSource);
    console.log('  Data Quality:', stats.statistics.dataQuality);
  }

  // Test 3: Test data sources
  const sources = await testEndpoint('/api/bus-locations/test-sources', 'Test Both Data Sources');
  if (sources) {
    console.log(chalk.cyan('Data Source Tests:'));
    console.log('  Specific Dataset (9264):', sources.testResults.specific.success ? chalk.green('Working') : chalk.red('Failed'));
    if (sources.testResults.specific.success) {
      console.log('    Vehicles found:', sources.testResults.specific.count);
    } else {
      console.log('    Error:', sources.testResults.specific.error);
    }
    console.log('  Generic Endpoint:', sources.testResults.generic.success ? chalk.green('Working') : chalk.red('Failed'));
    console.log('  Recommendation:', sources.recommendation);
  }

  // Test 4: Get actual bus locations
  const buses = await testEndpoint('/api/bus-locations', 'Get Current Bus Locations');
  if (buses) {
    console.log(chalk.cyan('Bus Locations:'));
    console.log('  Count:', buses.metadata.count);
    console.log('  Cached:', buses.metadata.cached ? 'Yes' : 'No');
    
    if (buses.buses && buses.buses.length > 0) {
      console.log(chalk.cyan('\n  Sample Buses:'));
      buses.buses.slice(0, 3).forEach(bus => {
        console.log(`    🚌 ${bus.routeName} - ${bus.vehicleRef}`);
        console.log(`       Status: ${bus.status}`);
        console.log(`       Location: ${bus.coordinates[0].toFixed(4)}, ${bus.coordinates[1].toFixed(4)}`);
      });
    }
  }

  // Test 5: Force refresh
  console.log(chalk.yellow('\nTesting force refresh (may take longer)...'));
  const refreshed = await testEndpoint('/api/bus-locations?forceRefresh=true', 'Force Refresh Bus Locations');
  if (refreshed) {
    console.log(chalk.green('✅ Force refresh successful'));
    console.log('  New count:', refreshed.metadata.count);
  }

  console.log(chalk.blue('\n\n📊 Test Summary:'));
  console.log('API Base URL:', API_BASE);
  console.log('Configuration:', config ? chalk.green('✅ Working') : chalk.red('❌ Failed'));
  console.log('Statistics:', stats ? chalk.green('✅ Working') : chalk.red('❌ Failed'));
  console.log('Data Sources:', sources ? chalk.green('✅ Tested') : chalk.red('❌ Failed'));
  console.log('Bus Locations:', buses ? chalk.green('✅ Retrieved') : chalk.red('❌ Failed'));
  
  if (buses && buses.metadata.count > 0) {
    console.log(chalk.green(`\n✅ Bus API is configured and working! Found ${buses.metadata.count} buses.`));
  } else if (buses && buses.metadata.count === 0) {
    console.log(chalk.yellow('\n⚠️ Bus API is configured but returned no buses. This might be normal if using mock data.'));
  } else {
    console.log(chalk.red('\n❌ Bus API configuration needs attention.'));
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('\n💥 Fatal error:'), error);
  process.exit(1);
});
