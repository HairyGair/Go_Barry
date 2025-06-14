// test-all-data-feeds.js
// Comprehensive test for all Go BARRY data feeds
import axios from 'axios';

const API_BASE = 'https://go-barry.onrender.com';

async function testAllDataFeeds() {
  console.log('🧪 Testing ALL Go BARRY Data Feeds...');
  console.log('='.repeat(60));
  
  const tests = [
    {
      name: 'Enhanced Alerts Endpoint',
      url: `${API_BASE}/api/alerts-enhanced`,
      expected: ['alerts', 'metadata']
    },
    {
      name: 'Health Check',
      url: `${API_BASE}/api/health-extended`,
      expected: ['status']
    },
    {
      name: 'Data Flow Test', 
      url: `${API_BASE}/api/test/data-flow`,
      expected: ['dataFlow']
    }
  ];
  
  const results = {
    passed: 0,
    failed: 0,
    dataSources: {},
    alerts: []
  };
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      const response = await axios.get(test.url, { timeout: 30000 });
      
      if (response.status === 200 && response.data) {
        console.log(`✅ ${test.name}: PASS`);
        results.passed++;
        
        // Collect alert data for analysis
        if (test.name === 'Enhanced Alerts Endpoint') {
          const alerts = response.data.alerts || [];
          const metadata = response.data.metadata || {};
          
          console.log(`   📊 ${alerts.length} total alerts`);
          
          if (metadata.sources) {
            console.log(`   📡 Data sources:`);
            Object.entries(metadata.sources).forEach(([source, info]) => {
              const emoji = info.success ? '✅' : '❌';
              console.log(`      ${emoji} ${source.toUpperCase()}: ${info.count || 0} alerts`);
              if (info.error) {
                console.log(`         Error: ${info.error}`);
              }
            });
          }
          
          if (metadata.statistics) {
            const stats = metadata.statistics;
            console.log(`   🤖 Enhanced: ${stats.enhanced || 0}`);
            console.log(`   🎯 With Routes: ${stats.alertsWithRoutes || 0}`);
            console.log(`   📍 With Coordinates: ${stats.alertsWithCoordinates || 0}`);
          }
          
          // Check for Westerhope duplicates
          const westerhopeAlerts = alerts.filter(alert => 
            alert.location?.toLowerCase().includes('westerhope')
          );
          
          if (westerhopeAlerts.length > 0) {
            console.log(`   🔍 Westerhope alerts found: ${westerhopeAlerts.length}`);
            westerhopeAlerts.forEach((alert, i) => {
              console.log(`      ${i+1}. ${alert.title} (${alert.source}) - ${alert.location}`);
            });
          }
          
          results.alerts = alerts;
          results.dataSources = metadata.sources || {};
        }
        
      } else {
        console.log(`❌ ${test.name}: Invalid response`);
        results.failed++;
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results.failed++;
    }
  }
  
  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATA FEEDS TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / tests.length) * 100)}%`);
  
  // Deduplication Analysis
  if (results.alerts.length > 0) {
    console.log('\n🔍 DEDUPLICATION ANALYSIS:');
    
    // Group alerts by location similarity
    const locationGroups = {};
    results.alerts.forEach(alert => {
      const location = alert.location?.toLowerCase().replace(/[^a-z0-9\s]/g, '') || 'unknown';
      const key = location.split(' ').slice(0, 2).join(' '); // First two words
      
      if (!locationGroups[key]) {
        locationGroups[key] = [];
      }
      locationGroups[key].push(alert);
    });
    
    let duplicateGroups = 0;
    Object.entries(locationGroups).forEach(([location, alerts]) => {
      if (alerts.length > 1) {
        duplicateGroups++;
        console.log(`   ⚠️ ${location}: ${alerts.length} similar alerts`);
        alerts.forEach(alert => {
          console.log(`      - ${alert.source}: "${alert.location}"`);
        });
      }
    });
    
    if (duplicateGroups === 0) {
      console.log('   ✅ No obvious location duplicates detected');
    } else {
      console.log(`   ⚠️ Found ${duplicateGroups} potential duplicate groups`);
    }
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (results.failed === 0) {
    console.log('   🎉 All systems operational! Data feeds working perfectly.');
  } else if (results.failed <= 1) {
    console.log('   ⚠️ Minor issues detected. Check failed endpoints.');
  } else {
    console.log('   🚨 Major issues detected. Immediate attention required.');
  }
  
  console.log('\n🚀 Test complete!');
  
  return {
    success: results.failed === 0,
    passed: results.passed,
    failed: results.failed,
    dataSources: results.dataSources,
    alerts: results.alerts
  };
}

// Run tests
testAllDataFeeds()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });
