#!/usr/bin/env node

/**
 * Quick diagnostic to check all data sources
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkAllSources() {
  console.log(`${colors.cyan}🔍 Checking all data sources on production...${colors.reset}\n`);
  
  try {
    const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced', {
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    const sources = data.metadata?.sources || {};
    
    console.log(`${colors.yellow}📊 Detailed Source Status:${colors.reset}\n`);
    
    let workingCount = 0;
    let totalAlerts = 0;
    
    Object.entries(sources).forEach(([source, status]) => {
      const isWorking = status.success && status.count > 0;
      if (isWorking) workingCount++;
      if (status.count) totalAlerts += status.count;
      
      console.log(`${colors.blue}${source.toUpperCase()}:${colors.reset}`);
      console.log(`  Status: ${status.success ? colors.green + '✅ Connected' : colors.red + '❌ Failed'}${colors.reset}`);
      console.log(`  Alerts: ${status.count || 0}`);
      if (status.error) {
        console.log(`  Error: ${colors.red}${status.error}${colors.reset}`);
      }
      console.log();
    });
    
    console.log(`${colors.cyan}📈 Summary:${colors.reset}`);
    console.log(`  Working sources: ${workingCount}/5`);
    console.log(`  Total alerts: ${totalAlerts}`);
    
    // Check specific API endpoints
    console.log(`\n${colors.cyan}🔌 Testing individual API health...${colors.reset}\n`);
    
    const healthResponse = await fetch('https://go-barry.onrender.com/api/health-extended');
    const healthData = await healthResponse.json();
    
    if (healthData.dataSources) {
      Object.entries(healthData.dataSources).forEach(([source, status]) => {
        console.log(`${source}: ${status.status === 'operational' ? colors.green + '✅' : colors.red + '❌'} ${status.status}${colors.reset}`);
      });
    }
    
  } catch (error) {
    console.error(`${colors.red}Error checking sources:${colors.reset}`, error.message);
  }
}

checkAllSources();
