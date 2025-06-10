// detailed-source-test.js
// Test each data source individually to see which ones work

const https = require('https');

async function testSource(sourceName, endpoint) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing ${sourceName}...`);
    const startTime = Date.now();
    
    https.get(`https://go-barry.onrender.com${endpoint}`, {
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.metadata?.sources) {
            const sources = parsed.metadata.sources;
            console.log(`📊 ${sourceName} Response (${duration}ms):`);
            
            Object.keys(sources).forEach(source => {
              const info = sources[source];
              if (info.success) {
                console.log(`   ✅ ${source.toUpperCase()}: ${info.count} alerts`);
              } else {
                console.log(`   ❌ ${source.toUpperCase()}: ${info.error || 'Failed'}`);
              }
            });
            
            const workingSources = Object.values(sources).filter(s => s.success).length;
            const totalSources = Object.keys(sources).length;
            console.log(`   📈 Working: ${workingSources}/${totalSources} sources`);
            
            resolve({
              success: true,
              workingSources,
              totalSources,
              sources,
              duration
            });
          } else {
            console.log(`   ⚠️ No sources metadata in response`);
            resolve({ success: false, error: 'No sources metadata' });
          }
        } catch (error) {
          console.log(`   ❌ JSON parse error: ${error.message}`);
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    }).on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ ${sourceName} failed (${duration}ms): ${error.message}`);
      resolve({ success: false, error: error.message, duration });
    }).on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`   ⏰ ${sourceName} timeout (${duration}ms)`);
      resolve({ success: false, error: 'Timeout', duration });
    });
  });
}

async function runDetailedTest() {
  console.log('🔬 DETAILED SOURCE ANALYSIS');
  console.log('===========================');
  
  // Test the main enhanced endpoint that aggregates all sources
  const result = await testSource('Enhanced Alerts (All Sources)', '/api/alerts-enhanced');
  
  if (result.success && result.sources) {
    console.log('\n📋 DETAILED SOURCE BREAKDOWN:');
    console.log('==============================');
    
    const sourceDetails = {
      'TomTom': result.sources.tomtom,
      'HERE': result.sources.here, 
      'MapQuest': result.sources.mapquest,
      'National Highways': result.sources.national_highways
    };
    
    Object.entries(sourceDetails).forEach(([name, info]) => {
      if (info) {
        if (info.success) {
          console.log(`✅ ${name}: ${info.count} alerts (${info.method || 'API'})`);
        } else {
          console.log(`❌ ${name}: ${info.error || 'Unknown error'}`);
          if (info.lastUpdate) {
            console.log(`   Last attempt: ${info.lastUpdate}`);
          }
        }
      } else {
        console.log(`❓ ${name}: No data returned`);
      }
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('===================');
    
    const workingCount = Object.values(sourceDetails).filter(s => s?.success).length;
    const failingCount = 4 - workingCount;
    
    if (workingCount === 4) {
      console.log('🎉 All data sources working perfectly!');
    } else if (workingCount >= 2) {
      console.log(`✅ ${workingCount}/4 sources working - Good coverage`);
      console.log(`🔧 ${failingCount} sources need attention (see errors above)`);
    } else if (workingCount === 1) {
      console.log(`⚠️ Only ${workingCount}/4 sources working - Limited coverage`);
      console.log('🚨 Need to fix API key or configuration issues');
    } else {
      console.log('🚨 No sources working - Critical issue');
    }
    
    // Show specific next steps
    console.log('\n📝 NEXT STEPS:');
    if (!sourceDetails.HERE?.success && sourceDetails.HERE?.error) {
      console.log(`   🗺️ HERE API: ${sourceDetails.HERE.error}`);
    }
    if (!sourceDetails.MapQuest?.success && sourceDetails.MapQuest?.error) {
      console.log(`   🗺️ MapQuest API: ${sourceDetails.MapQuest.error}`);
    }
    if (!sourceDetails['National Highways']?.success && sourceDetails['National Highways']?.error) {
      console.log(`   🛣️ National Highways: ${sourceDetails['National Highways'].error}`);
    }
    
  } else {
    console.log('❌ Could not get detailed source information');
  }
}

runDetailedTest().catch(console.error);
