// Test the diversion engine with TomTom integration

import diversionEngine from './backend/services/intelligence/diversionEngine.js';

async function testDiversionEngine() {
  console.log('🧪 Testing Intelligent Diversion Engine with TomTom...\n');
  
  // Test incident: Road closure at Newcastle Central Station
  const testIncident = {
    id: 'test_001',
    type: 'road_closure',
    location: 'Newcastle Central Station',
    coordinates: {
      latitude: 54.9783,
      longitude: -1.6178
    },
    description: 'Road closure due to emergency works',
    severity: 'High',
    priority: 'CRITICAL',
    affectsRoutes: ['21', '22', 'Q3', '1', '2']
  };
  
  try {
    console.log('📍 Test Incident:', testIncident.location);
    console.log('🚌 Affected Routes:', testIncident.affectsRoutes.join(', '));
    console.log('\n🔄 Generating AI diversions...\n');
    
    const suggestions = await diversionEngine.getDiversionSuggestions(testIncident);
    const formatted = diversionEngine.formatDiversionsForDisplay(suggestions);
    
    console.log('✅ RESULTS:\n');
    console.log('Summary:', formatted.summary);
    console.log('Priority:', formatted.priority);
    
    if (formatted.tomtomRoutes.length > 0) {
      console.log('\n🗺️ TomTom Live Traffic Routes:');
      formatted.tomtomRoutes.forEach(route => {
        console.log(`  • ${route.summary}`);
        console.log(`    Time: ${route.duration}, Distance: ${route.distance}`);
        console.log(`    Traffic: ${route.trafficDelay}`);
        console.log(`    Data: ${route.confidence}`);
      });
    }
    
    if (formatted.diversions.length > 0) {
      console.log('\n🚌 Bus Route Diversions:');
      formatted.diversions.forEach(div => {
        console.log(`  • Route ${div.route} → ${div.primaryAlternative}`);
        console.log(`    ${div.instructions}`);
      });
    }
    
    if (formatted.keyAdvice.length > 0) {
      console.log('\n💡 Key Advice:');
      formatted.keyAdvice.forEach(advice => {
        console.log(`  • ${advice}`);
      });
    }
    
    if (formatted.interchanges.length > 0) {
      console.log('\n🚏 Nearby Interchanges:');
      formatted.interchanges.forEach(int => {
        console.log(`  • ${int.name} (${int.distance})`);
        console.log(`    Routes: ${int.availableRoutes}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('🚀 Starting diversion engine test...\n');
testDiversionEngine().then(() => {
  console.log('\n✅ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test error:', error);
  process.exit(1);
});
