// Test alert categorization and display functionality
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchNationalHighways } from './services/nationalHighways.js';
import { enhanceAlertWithCategory } from './services/alertCategorizer.js';

async function testAlertCategorization() {
  console.log('🔍 Testing Alert Categorization System...\n');
  
  try {
    // Fetch alerts from sources
    console.log('1️⃣ Fetching alerts from TomTom...');
    const tomtomResult = await fetchTomTomTrafficWithStreetNames();
    
    console.log('2️⃣ Fetching alerts from National Highways...');
    const nhResult = await fetchNationalHighways();
    
    // Combine all alerts
    const allAlerts = [
      ...(tomtomResult.success ? tomtomResult.data : []),
      ...(nhResult.success ? nhResult.data : [])
    ];
    
    console.log(`\n📊 Total alerts fetched: ${allAlerts.length}`);
    
    // Categorize alerts
    console.log('\n3️⃣ Categorizing alerts...');
    const categorizedAlerts = allAlerts.map(enhanceAlertWithCategory);
    
    // Count by category
    const roadworks = categorizedAlerts.filter(a => a.isRoadwork);
    const incidents = categorizedAlerts.filter(a => a.isIncident);
    
    console.log(`\n📈 Categorization Results:`);
    console.log(`   🚧 Roadworks: ${roadworks.length}`);
    console.log(`   🚨 Incidents: ${incidents.length}`);
    
    // Show samples
    if (roadworks.length > 0) {
      console.log('\n🚧 Sample Roadworks:');
      roadworks.slice(0, 3).forEach((rw, i) => {
        console.log(`   ${i + 1}. ${rw.title}`);
        console.log(`      Location: ${rw.location}`);
        console.log(`      Source: ${rw.source}`);
        console.log(`      Routes: ${rw.affectsRoutes?.join(', ') || 'None'}`);
      });
    }
    
    if (incidents.length > 0) {
      console.log('\n🚨 Sample Incidents:');
      incidents.slice(0, 3).forEach((inc, i) => {
        console.log(`   ${i + 1}. ${inc.title}`);
        console.log(`      Location: ${inc.location}`);
        console.log(`      Source: ${inc.source}`);
        console.log(`      Severity: ${inc.severity}`);
        console.log(`      Routes: ${inc.affectsRoutes?.join(', ') || 'None'}`);
      });
    }
    
    // Test API endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    
    const roadworksEndpoint = await fetch('https://go-barry.onrender.com/api/roadworks-alerts');
    const roadworksData = await roadworksEndpoint.json();
    console.log(`   /api/roadworks-alerts: ${roadworksData.success ? '✅' : '❌'} (${roadworksData.roadworks?.length || 0} alerts)`);
    
    const incidentsEndpoint = await fetch('https://go-barry.onrender.com/api/incident-alerts');
    const incidentsData = await incidentsEndpoint.json();
    console.log(`   /api/incident-alerts: ${incidentsData.success ? '✅' : '❌'} (${incidentsData.incidents?.length || 0} alerts)`);
    
    console.log('\n✅ Alert categorization test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAlertCategorization();
