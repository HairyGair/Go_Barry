// emergency-api-test.js
// Comprehensive test of all API endpoints to diagnose issues

const API_BASE = 'https://go-barry.onrender.com';

async function testAllEndpoints() {
  console.log('🚨 EMERGENCY API DIAGNOSTIC');
  console.log('==========================');
  
  const tests = [
    {
      name: 'Basic Health Check',
      url: `${API_BASE}/api/health`,
      critical: true
    },
    {
      name: 'Enhanced Alerts (Display Screen)',
      url: `${API_BASE}/api/alerts-enhanced`,
      critical: true
    },
    {
      name: 'Simple Alerts (Fallback)',
      url: `${API_BASE}/api/alerts`,
      critical: true
    },
    {
      name: 'Supervisor API',
      url: `${API_BASE}/api/supervisor/active`,
      critical: false
    },
    {
      name: 'Intelligence Health',
      url: `${API_BASE}/api/intelligence/health`,
      critical: false
    }
  ];
  
  const results = { working: 0, failed: 0, issues: [] };
  
  for (const test of tests) {
    try {
      console.log(`\\n🔍 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BARRY-Emergency-Test'
        },
        timeout: 15000
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (test.name === 'Enhanced Alerts (Display Screen)') {
          console.log(`   ✅ Alerts: ${data.alerts?.length || 0}`);
          console.log(`   ✅ Sources: ${Object.keys(data.metadata?.sources || {}).length}`);
          console.log(`   ✅ Enhancement: ${data.metadata?.enhancement || 'Unknown'}`);
          
          if (!data.alerts || data.alerts.length === 0) {
            results.issues.push('⚠️ DISPLAY ISSUE: No alerts returned');
          }
        }
        
        if (test.name === 'Supervisor API') {
          console.log(`   ✅ Active Supervisors: ${data.activeSupervisors?.length || 0}`);
          if (data.activeSupervisors?.length === 0) {
            results.issues.push('⚠️ SUPERVISOR ISSUE: No active supervisors');
          }
        }
        
        console.log(`   ✅ ${test.name}: WORKING`);
        results.working++;
        
      } else {
        console.log(`   ❌ ${test.name}: HTTP ${response.status}`);
        results.failed++;
        
        if (test.critical) {
          results.issues.push(`🚨 CRITICAL: ${test.name} failing`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
      results.failed++;
      
      if (test.critical) {
        results.issues.push(`🚨 CRITICAL: ${test.name} - ${error.message}`);
      }
    }
  }
  
  // Summary
  console.log('\\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Working: ${results.working}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🎯 Success Rate: ${Math.round((results.working / tests.length) * 100)}%`);
  
  if (results.issues.length > 0) {
    console.log('\\n🚨 ISSUES FOUND:');
    results.issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  // Specific fixes needed
  console.log('\\n🔧 REQUIRED FIXES:');
  
  if (results.issues.some(i => i.includes('DISPLAY ISSUE'))) {
    console.log('   📺 DISPLAY SCREEN: No data coming through');
    console.log('      → Check backend data sources');
    console.log('      → Verify API endpoint responses');
    console.log('      → Test individual source APIs');
  }
  
  if (results.issues.some(i => i.includes('SUPERVISOR ISSUE'))) {
    console.log('   👮 SUPERVISOR TRACKING: Not showing logged in supervisors');
    console.log('      → Check supervisor session storage');
    console.log('      → Verify backend session tracking');
    console.log('      → Test supervisor login flow');
  }
  
  return results;
}

// Run the diagnostic
testAllEndpoints()
  .then(results => {
    if (results.failed === 0) {
      console.log('\\n🎉 All systems working!');
    } else {
      console.log('\\n🚨 Issues found - need immediate fixes');
    }
  })
  .catch(error => {
    console.error('💥 Diagnostic failed:', error);
  });