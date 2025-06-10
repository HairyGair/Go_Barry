// quick-test-data-feeds.js
// Emergency test to verify data feeds are working

const https = require('https');

const API_BASE = 'https://go-barry.onrender.com';

function testEndpoint(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const parsed = JSON.parse(data);
          
          if (name === 'Enhanced Alerts') {
            const alertCount = parsed.alerts ? parsed.alerts.length : 0;
            const sourcesWorking = parsed.metadata?.sources ? 
              Object.keys(parsed.metadata.sources).filter(s => parsed.metadata.sources[s].success).length : 0;
            
            console.log(`✅ ${name}: ${alertCount} alerts from ${sourcesWorking} sources (${duration}ms)`);
            
            if (alertCount > 0) {
              console.log(`   📍 Sample alert: ${parsed.alerts[0].title || 'No title'}`);
            }
            
            if (parsed.metadata?.dataFlow) {
              console.log(`   🔄 Data Flow: ${parsed.metadata.dataFlow}`);
            }
          }
          
          if (name === 'Active Supervisors') {
            const supCount = parsed.activeSupervisors ? parsed.activeSupervisors.length : 0;
            console.log(`✅ ${name}: ${supCount} supervisors active (${duration}ms)`);
            
            if (supCount > 0) {
              console.log(`   👤 Sample: ${parsed.activeSupervisors[0].name || 'Unknown'}`);
            }
          }
          
          resolve({ success: true, data: parsed, duration });
          
        } catch (error) {
          console.log(`❌ ${name}: Invalid JSON response (${duration}ms)`);
          resolve({ success: false, error: 'Invalid JSON', duration });
        }
      });
      
    }).on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${name}: ${error.message} (${duration}ms)`);
      resolve({ success: false, error: error.message, duration });
    });
    
    // 30 second timeout
    setTimeout(() => {
      console.log(`⏰ ${name}: Timeout after 30 seconds`);
      resolve({ success: false, error: 'Timeout', duration: 30000 });
    }, 30000);
  });
}

async function runQuickTest() {
  console.log('🧪 QUICK TEST: Verifying Go BARRY data feeds...');
  console.log('=' .repeat(60));
  
  const tests = [
    { url: `${API_BASE}/api/alerts-enhanced`, name: 'Enhanced Alerts' },
    { url: `${API_BASE}/api/supervisor/active`, name: 'Active Supervisors' },
    { url: `${API_BASE}/api/health`, name: 'Health Check' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.name);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\\n' + '=' .repeat(60));
  console.log('📊 QUICK TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\\n🎉 ALL TESTS PASSED - Data feeds are working!');
    console.log('\\n🎯 Next steps:');
    console.log('   1. Check Display Screen: https://gobarry.co.uk/display');
    console.log('   2. Check Supervisor Dashboard: https://gobarry.co.uk');
  } else {
    console.log('\\n⚠️ Some tests failed - Check the errors above');
    console.log('\\n🔧 Troubleshooting:');
    console.log('   1. Wait 2-3 minutes for deployment to complete');
    console.log('   2. Re-run this test: node quick-test-data-feeds.js');
    console.log('   3. Check backend logs on Render.com');
  }
  
  console.log('\\n🚀 Test complete!');
}

runQuickTest().catch(console.error);