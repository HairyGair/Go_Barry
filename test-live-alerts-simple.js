// test-live-alerts-simple.js
// Simple test for live Go BARRY alerts using Node.js built-in fetch

const API_BASE = 'https://go-barry.onrender.com';

async function testLiveAlerts() {
  console.log('🧪 Testing Live Go BARRY Alerts...');
  console.log('='.repeat(50));
  
  try {
    console.log('📡 Fetching live alerts...');
    const response = await fetch(`${API_BASE}/api/alerts-enhanced`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Go-BARRY-Test/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Successfully connected to Go BARRY API!');
    console.log('');
    
    // Basic stats
    const alerts = data.alerts || [];
    const metadata = data.metadata || {};
    
    console.log('📊 LIVE SYSTEM STATUS:');
    console.log(`   🚨 Total Alerts: ${alerts.length}`);
    
    // Data source breakdown
    if (metadata.sources) {
      console.log('   📡 Data Sources:');
      Object.entries(metadata.sources).forEach(([source, info]) => {
        const emoji = info.success ? '✅' : '❌';
        const count = info.count || 0;
        console.log(`      ${emoji} ${source.toUpperCase()}: ${count} alerts`);
        if (info.error) {
          console.log(`         ⚠️ Error: ${info.error}`);
        }
      });
    }
    
    // Statistics
    if (metadata.statistics) {
      const stats = metadata.statistics;
      console.log('   📈 System Stats:');
      console.log(`      🤖 Enhanced: ${stats.enhanced || 0}`);
      console.log(`      🎯 With Routes: ${stats.alertsWithRoutes || 0}`);
      console.log(`      📍 With Coordinates: ${stats.alertsWithCoordinates || 0}`);
      console.log(`      🚌 Routes Affected: ${stats.routesAffected || 0}`);
    }
    
    // Check for Westerhope incidents specifically
    console.log('');
    console.log('🔍 WESTERHOPE INCIDENT CHECK:');
    const westerhopeAlerts = alerts.filter(alert => 
      alert.location?.toLowerCase().includes('westerhope') ||
      alert.title?.toLowerCase().includes('westerhope') ||
      alert.description?.toLowerCase().includes('westerhope')
    );
    
    if (westerhopeAlerts.length > 0) {
      console.log(`   ⚠️ Found ${westerhopeAlerts.length} Westerhope-related alerts:`);
      westerhopeAlerts.forEach((alert, i) => {
        console.log(`      ${i+1}. ${alert.title || 'Incident'} (${alert.source})`);
        console.log(`         📍 ${alert.location}`);
        console.log(`         🕐 ${alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Unknown time'}`);
        if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
          console.log(`         🚌 Routes: ${alert.affectsRoutes.join(', ')}`);
        }
        console.log('');
      });
      
      // Check for potential duplicates
      if (westerhopeAlerts.length > 1) {
        console.log('   🔍 DUPLICATE ANALYSIS:');
        const locations = westerhopeAlerts.map(a => a.location?.toLowerCase().replace(/[^a-z0-9\s]/g, '')).filter(Boolean);
        const uniqueLocations = [...new Set(locations)];
        
        if (locations.length > uniqueLocations.length) {
          console.log('   ❌ POTENTIAL DUPLICATES DETECTED!');
          console.log(`      📊 ${westerhopeAlerts.length} alerts → ${uniqueLocations.length} unique locations`);
          console.log('      🔧 Deduplication may need improvement');
        } else {
          console.log('   ✅ No obvious duplicates - alerts are for different locations');
        }
      }
    } else {
      console.log('   ✅ No Westerhope incidents currently active');
    }
    
    // Recent alerts
    console.log('');
    console.log('📝 RECENT ALERTS (last 5):');
    alerts.slice(0, 5).forEach((alert, i) => {
      console.log(`   ${i+1}. ${alert.title || 'Traffic Incident'} (${alert.source})`);
      console.log(`      📍 ${alert.location || 'Unknown location'}`);
      console.log(`      🔥 ${alert.severity || 'Unknown'} severity`);
      if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
        console.log(`      🚌 Routes: ${alert.affectsRoutes.slice(0, 5).join(', ')}`);
      }
    });
    
    // Performance info
    if (metadata.debug) {
      console.log('');
      console.log('⚡ PERFORMANCE:');
      console.log(`   🕐 Processing Time: ${metadata.debug.processingDuration || 'Unknown'}`);
      console.log(`   🔗 Sources Active: ${metadata.debug.sourcesActive || 0}/${metadata.debug.totalSources || 6}`);
    }
    
    console.log('');
    console.log('🎯 SUMMARY:');
    if (westerhopeAlerts.length === 0) {
      console.log('   ✅ No Westerhope duplicates currently detected');
      console.log('   🎉 Deduplication system appears to be working!');
    } else if (westerhopeAlerts.length === 1) {
      console.log('   ✅ Only 1 Westerhope incident - no duplicates');
    } else {
      console.log(`   ⚠️ ${westerhopeAlerts.length} Westerhope incidents - check for duplicates`);
    }
    
    console.log(`   📊 System Status: ${alerts.length} total alerts from ${Object.keys(metadata.sources || {}).length} sources`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify Go BARRY backend is running: https://go-barry.onrender.com/api/health');
    console.log('   3. Check for CORS or network issues');
    return false;
  }
  
  console.log('');
  console.log('🚀 Test complete!');
  return true;
}

// Run the test
testLiveAlerts()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test crashed:', error.message);
    process.exit(1);
  });
