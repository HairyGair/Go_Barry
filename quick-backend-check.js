// quick-backend-check.js
// Check if backend is responsive for basic endpoints

const https = require('https');

async function quickCheck(endpoint, name, timeout = 10000) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing ${name}...`);
    const startTime = Date.now();
    
    const req = https.get(`https://go-barry.onrender.com${endpoint}`, {
      timeout: timeout
    }, (res) => {
      const duration = Date.now() - startTime;
      console.log(`   ✅ ${name}: ${res.statusCode} (${duration}ms)`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`   📄 Response: ${JSON.stringify(parsed).substring(0, 100)}...`);
          resolve({ success: true, status: res.statusCode, duration, data: parsed });
        } catch (e) {
          console.log(`   ⚠️ Non-JSON response: ${data.substring(0, 100)}...`);
          resolve({ success: true, status: res.statusCode, duration, data });
        }
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ ${name}: ${error.message} (${duration}ms)`);
      resolve({ success: false, error: error.message, duration });
    });
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`   ⏰ ${name}: Timeout (${duration}ms)`);
      req.destroy();
      resolve({ success: false, error: 'Timeout', duration });
    });
  });
}

async function runQuickBackendCheck() {
  console.log('⚡ QUICK BACKEND RESPONSIVENESS CHECK');
  console.log('====================================');
  
  // Test basic health check first (should be fast)
  const health = await quickCheck('/api/health', 'Health Check', 5000);
  
  if (!health.success) {
    console.log('\n💀 Backend health check failed - backend might be down');
    return;
  }
  
  // Test a simple API that doesn't aggregate multiple sources
  const emergency = await quickCheck('/api/emergency-alerts', 'Emergency Alerts (TomTom only)', 15000);
  
  if (!emergency.success) {
    console.log('\n⚠️ Single source API also failing');
  } else {
    console.log('\n✅ Single source API working');
  }
  
  // Test the problematic enhanced endpoint with longer timeout
  console.log('\n🔍 Testing enhanced endpoint with 60s timeout...');
  const enhanced = await quickCheck('/api/alerts-enhanced', 'Enhanced Alerts (All Sources)', 60000);
  
  if (!enhanced.success) {
    console.log('\n🚨 ISSUE IDENTIFIED:');
    console.log('   - Basic backend: ✅ Working');
    console.log('   - Single source: ✅ Working');  
    console.log('   - Multi-source aggregation: ❌ Failing/Timing out');
    console.log('\n🔧 LIKELY CAUSES:');
    console.log('   1. Some API keys causing very slow responses');
    console.log('   2. Backend waiting too long for all 4 sources');
    console.log('   3. Memory/performance issues with aggregation');
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('   1. Check Render logs for specific errors');
    console.log('   2. Verify API keys are set correctly');
    console.log('   3. Consider reducing API timeout in backend');
  } else {
    console.log('\n✅ Enhanced endpoint working (took longer than expected)');
    if (enhanced.data?.metadata?.sources) {
      const sources = enhanced.data.metadata.sources;
      console.log('\n📊 SOURCE STATUS:');
      Object.keys(sources).forEach(source => {
        const info = sources[source];
        if (info.success) {
          console.log(`   ✅ ${source.toUpperCase()}: ${info.count} alerts`);
        } else {
          console.log(`   ❌ ${source.toUpperCase()}: ${info.error || 'Failed'}`);
        }
      });
    }
  }
}

runQuickBackendCheck().catch(console.error);
