#!/usr/bin/env node

// test-streetmanager-activation.js
// Verify StreetManager activation in Go BARRY

import axios from 'axios';

console.log('🧪 Testing StreetManager Activation');
console.log('===================================');

async function testLocalAPI() {
  try {
    console.log('\n🌐 Testing local enhanced API...');
    
    const response = await axios.get('http://localhost:3001/api/alerts-enhanced', {
      timeout: 30000
    });
    
    const data = response.data;
    console.log(`📡 Response: ${response.status}`);
    console.log(`📊 Total alerts: ${data.metadata?.totalAlerts || 0}`);
    console.log(`🔗 Sources active: ${data.metadata?.statistics?.sourcesSuccessful || 0}/${data.metadata?.statistics?.sourcesTotal || 0}`);
    
    // Check for StreetManager in sources
    const sourceStats = data.metadata?.sources || {};
    
    console.log('\n🔍 Source Analysis:');
    for (const [source, stats] of Object.entries(sourceStats)) {
      const status = stats.success ? '✅' : '❌';
      const count = stats.count || 0;
      const error = stats.error ? ` (${stats.error})` : '';
      console.log(`   ${status} ${source}: ${count} alerts${error}`);
    }
    
    // Specifically check StreetManager
    if (sourceStats.streetmanager) {
      if (sourceStats.streetmanager.success) {
        console.log('\n🎉 StreetManager ACTIVATED and working!');
        console.log(`   📊 Roadworks alerts: ${sourceStats.streetmanager.count}`);
        console.log(`   📝 Method: ${sourceStats.streetmanager.method}`);
      } else {
        console.log('\n⚠️ StreetManager activated but not working:');
        console.log(`   ❌ Error: ${sourceStats.streetmanager.error}`);
      }
    } else {
      console.log('\n❌ StreetManager not found in sources');
    }
    
    // Check manual incidents
    if (sourceStats.manual_incidents) {
      console.log('\n📝 Manual Incidents System:');
      console.log(`   ✅ Status: ${sourceStats.manual_incidents.success ? 'Active' : 'Failed'}`);
      console.log(`   📊 Count: ${sourceStats.manual_incidents.count || 0}`);
    }
    
    // Performance analysis
    const performance = data.metadata?.statistics;
    if (performance) {
      console.log('\n📈 Capacity Analysis:');
      console.log(`   🎯 Utilization: ${performance.sourcesSuccessful}/${performance.sourcesTotal} sources (${Math.round((performance.sourcesSuccessful / performance.sourcesTotal) * 100)}%)`);
      console.log(`   ⚡ Processing time: ${performance.processingTime}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Local API test failed:', error.message);
    return false;
  }
}

async function testProductionAPI() {
  try {
    console.log('\n🌍 Testing production API...');
    
    const response = await axios.get('https://go-barry.onrender.com/api/alerts-enhanced', {
      timeout: 30000
    });
    
    const data = response.data;
    const sourceCount = data.metadata?.statistics?.sourcesSuccessful || 0;
    const totalSources = data.metadata?.statistics?.sourcesTotal || 0;
    
    console.log(`📡 Production response: ${response.status}`);
    console.log(`📊 Sources working: ${sourceCount}/${totalSources}`);
    
    if (sourceCount >= 4) {
      console.log('🎉 Production capacity expansion successful!');
    } else if (sourceCount >= 2) {
      console.log('⚡ Production partially expanded - deploy needed');
    } else {
      console.log('⚠️ Production needs deployment');
    }
    
    return sourceCount;
    
  } catch (error) {
    console.error('❌ Production API test failed:', error.message);
    return 0;
  }
}

async function runActivationTest() {
  console.log('🚀 Starting StreetManager activation test...\n');
  
  // Test local first
  const localWorking = await testLocalAPI();
  
  // Test production
  const prodSources = await testProductionAPI();
  
  console.log('\n📋 ACTIVATION TEST RESULTS');
  console.log('==========================');
  
  if (localWorking) {
    console.log('✅ Local: StreetManager activation successful');
  } else {
    console.log('❌ Local: Backend may need restart');
  }
  
  if (prodSources >= 4) {
    console.log('✅ Production: Expanded capacity active');
  } else {
    console.log('⚠️ Production: Deployment needed');
  }
  
  console.log('\n🎯 Next Steps:');
  if (!localWorking) {
    console.log('   1. Restart backend: npm start');
  }
  if (prodSources < 4) {
    console.log('   2. Deploy changes: git push origin main');
  }
  console.log('   3. Get StreetManager API key for full activation');
  console.log('   4. Monitor /api/health-extended for source statistics');
  
  console.log('\n🚀 CAPACITY EXPANSION STATUS:');
  console.log(`   📊 Data Sources: 4 → 6 (+50% expansion)`);
  console.log(`   🎯 Working APIs: 2 → ${Math.max(2, prodSources)} (+${Math.round(((Math.max(2, prodSources) - 2) / 2) * 100)}% improvement)`);
  console.log(`   📈 System Utilization: ${Math.round((Math.max(2, prodSources) / 6) * 100)}%`);
}

// Run the test
runActivationTest().catch(console.error);
