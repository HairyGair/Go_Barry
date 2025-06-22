// Quick test to check if backend is returning alerts
import fetch from 'node-fetch';

async function checkBackendAlerts() {
  console.log('🔍 Checking Go BARRY Backend for alerts...\n');
  
  try {
    // Test the enhanced endpoint
    console.log('1️⃣ Testing /api/alerts-enhanced...');
    const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    console.log('Total alerts:', data.alerts?.length || 0);
    
    if (data.metadata?.sources) {
      console.log('\n📊 Source breakdown:');
      Object.entries(data.metadata.sources).forEach(([source, info]) => {
        console.log(`  ${source}: ${info.success ? '✅' : '❌'} (${info.count || 0} alerts)`);
        if (info.error) console.log(`    Error: ${info.error}`);
      });
    }
    
    // Show a sample alert if any
    if (data.alerts && data.alerts.length > 0) {
      console.log('\n📍 Sample alert:');
      const alert = data.alerts[0];
      console.log('  ID:', alert.id);
      console.log('  Title:', alert.title);
      console.log('  Location:', alert.location);
      console.log('  Category:', alert.alertCategory);
      console.log('  Source:', alert.source);
      console.log('  Coordinates:', alert.coordinates);
    } else {
      console.log('\n⚠️ No alerts returned from backend!');
    }
    
    // Test categorized endpoints
    console.log('\n2️⃣ Testing /api/roadworks-alerts...');
    const rwResponse = await fetch('https://go-barry.onrender.com/api/roadworks-alerts');
    const rwData = await rwResponse.json();
    console.log('Roadworks alerts:', rwData.roadworks?.length || 0);
    
    console.log('\n3️⃣ Testing /api/incident-alerts...');
    const incResponse = await fetch('https://go-barry.onrender.com/api/incident-alerts');
    const incData = await incResponse.json();
    console.log('Incident alerts:', incData.incidents?.length || 0);
    
  } catch (error) {
    console.error('❌ Error checking backend:', error.message);
  }
}

checkBackendAlerts();
