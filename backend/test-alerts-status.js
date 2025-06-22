// Test script to check what alerts are being returned
import axios from 'axios';

async function testAlerts() {
  try {
    console.log('🔍 Testing Go BARRY alert endpoints...\n');
    
    // Test enhanced endpoint
    console.log('1️⃣ Testing /api/alerts-enhanced...');
    const enhancedResponse = await axios.get('https://go-barry.onrender.com/api/alerts-enhanced');
    
    console.log('✅ Enhanced endpoint response:');
    console.log(`   - Success: ${enhancedResponse.data.success}`);
    console.log(`   - Total alerts: ${enhancedResponse.data.alerts?.length || 0}`);
    console.log(`   - Metadata:`, enhancedResponse.data.metadata);
    
    if (enhancedResponse.data.alerts && enhancedResponse.data.alerts.length > 0) {
      console.log('\n📊 Sample alerts:');
      enhancedResponse.data.alerts.slice(0, 3).forEach((alert, index) => {
        console.log(`\n   Alert ${index + 1}:`);
        console.log(`   - Title: ${alert.title}`);
        console.log(`   - Location: ${alert.location}`);
        console.log(`   - Source: ${alert.source}`);
        console.log(`   - Severity: ${alert.severity}`);
        console.log(`   - Routes: ${alert.affectsRoutes?.join(', ') || 'None'}`);
      });
    }
    
    // Check source breakdown
    if (enhancedResponse.data.metadata?.sources) {
      console.log('\n📡 Data source status:');
      Object.entries(enhancedResponse.data.metadata.sources).forEach(([source, info]) => {
        console.log(`   - ${source}: ${info.success ? '✅' : '❌'} (${info.count || 0} alerts)`);
        if (info.error) console.log(`     Error: ${info.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing alerts:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAlerts();
