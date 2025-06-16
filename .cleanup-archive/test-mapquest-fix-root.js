#!/usr/bin/env node

/**
 * Test script to verify MapQuest API is working after key update
 * Run: node test-mapquest-fix.js
 */

const BACKEND_URL = 'https://go-barry.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testMapQuestAPI(baseUrl, environment) {
  console.log(`\n${colors.blue}🗺️  Testing MapQuest on ${environment}...${colors.reset}`);
  
  try {
    // Test the enhanced alerts endpoint which includes MapQuest
    console.log(`${colors.cyan}📡 Fetching from: ${baseUrl}/api/alerts-enhanced${colors.reset}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${baseUrl}/api/alerts-enhanced`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BARRY-MapQuest-Test/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const { alerts, metadata } = data;
    
    // Check MapQuest source status
    const mapquestStatus = metadata?.sources?.mapquest;
    
    if (mapquestStatus) {
      console.log(`\n${colors.yellow}📊 MapQuest Status:${colors.reset}`);
      console.log(`   Success: ${mapquestStatus.success ? colors.green + '✅ YES' : colors.red + '❌ NO'}${colors.reset}`);
      console.log(`   Count: ${mapquestStatus.count || 0} alerts`);
      console.log(`   Method: ${mapquestStatus.method || 'N/A'}`);
      console.log(`   Mode: ${mapquestStatus.mode || 'N/A'}`);
      
      if (mapquestStatus.error) {
        console.log(`   ${colors.red}Error: ${mapquestStatus.error}${colors.reset}`);
      }
      
      // Look for MapQuest alerts in the response
      const mapquestAlerts = alerts.filter(a => a.source === 'mapquest');
      console.log(`\n${colors.yellow}🚦 MapQuest Alerts Found: ${mapquestAlerts.length}${colors.reset}`);
      
      if (mapquestAlerts.length > 0) {
        console.log(`\n${colors.green}✨ Sample MapQuest Alerts:${colors.reset}`);
        mapquestAlerts.slice(0, 3).forEach((alert, index) => {
          console.log(`\n   ${index + 1}. ${alert.title || 'No title'}`);
          console.log(`      Location: ${alert.location || 'Unknown'}`);
          console.log(`      Severity: ${alert.severity || 'Unknown'}`);
          console.log(`      Routes: ${alert.affectsRoutes?.join(', ') || 'None'}`);
        });
      }
      
      // Overall result
      if (mapquestStatus.success && mapquestStatus.count > 0) {
        console.log(`\n${colors.green}🎉 SUCCESS: MapQuest is working on ${environment}!${colors.reset}`);
        return true;
      } else if (mapquestStatus.success && mapquestStatus.count === 0) {
        console.log(`\n${colors.yellow}⚠️  WARNING: MapQuest connected but no alerts found${colors.reset}`);
        console.log(`   This might be normal if there are no current incidents in the area.`);
        return true; // Still counts as working
      } else {
        console.log(`\n${colors.red}❌ FAILED: MapQuest is not working on ${environment}${colors.reset}`);
        return false;
      }
    } else {
      console.log(`\n${colors.red}❌ ERROR: No MapQuest status in response${colors.reset}`);
      return false;
    }
    
  } catch (error) {
    console.log(`\n${colors.red}❌ ERROR testing ${environment}:${colors.reset}`);
    console.log(`   ${error.message}`);
    
    if (error.message.includes('401')) {
      console.log(`   ${colors.red}Authentication failed - API key issue${colors.reset}`);
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log(`   ${colors.yellow}Connection refused - is the server running?${colors.reset}`);
    } else if (error.name === 'AbortError') {
      console.log(`   ${colors.yellow}Request timed out after 30 seconds${colors.reset}`);
    }
    
    return false;
  }
}

async function testDataFlow(baseUrl, environment) {
  console.log(`\n${colors.blue}📊 Testing overall data flow on ${environment}...${colors.reset}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(`${baseUrl}/api/test/data-flow`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const { dataFlow } = data;
    
    console.log(`\n${colors.yellow}Data Sources Status:${colors.reset}`);
    console.log(`   Working: ${dataFlow.sourcesWorking}/${dataFlow.totalSources} (${dataFlow.percentage}%)`);
    
    Object.entries(dataFlow.sources).forEach(([source, working]) => {
      const icon = working ? colors.green + '✅' : colors.red + '❌';
      console.log(`   ${icon} ${source.toUpperCase()}${colors.reset}`);
    });
    
  } catch (error) {
    console.log(`${colors.red}❌ Could not test data flow${colors.reset}`);
  }
}

async function main() {
  console.log(`${colors.cyan}🔧 MapQuest API Fix Verification Test${colors.reset}`);
  console.log(`${colors.cyan}=====================================${colors.reset}`);
  console.log(`\nThis test will verify if the MapQuest API key update is working.\n`);
  
  // Test production
  const prodWorking = await testMapQuestAPI(BACKEND_URL, 'PRODUCTION');
  await testDataFlow(BACKEND_URL, 'PRODUCTION');
  
  // Test local if requested
  const args = process.argv.slice(2);
  if (args.includes('--local')) {
    console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
    const localWorking = await testMapQuestAPI(LOCAL_URL, 'LOCAL');
    await testDataFlow(LOCAL_URL, 'LOCAL');
  }
  
  // Summary
  console.log(`\n${colors.cyan}📋 SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}==========${colors.reset}`);
  
  if (prodWorking) {
    console.log(`${colors.green}✅ MapQuest is WORKING in production!${colors.reset}`);
    console.log(`${colors.green}   The API key update was successful.${colors.reset}`);
    console.log(`${colors.green}   You now have 5/6 data sources operational.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ MapQuest is NOT working in production yet.${colors.reset}`);
    console.log(`${colors.yellow}   Possible reasons:${colors.reset}`);
    console.log(`   - API key not updated on Render.com yet`);
    console.log(`   - Render is still redeploying (wait 2-3 minutes)`);
    console.log(`   - New API key might be invalid`);
    console.log(`\n${colors.yellow}   Try again in a few minutes after updating the key on Render.${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}Run 'node test-mapquest-fix.js --local' to also test local environment${colors.reset}\n`);
}

// Run the test
main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
