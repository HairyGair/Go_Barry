// Test script for AI Diversion Engine with TomTom integration
// Run with: node test-ai-diversions.js

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.PORT ? 'http://localhost:' + process.env.PORT : 'http://localhost:3001';

console.log('🧪 Testing AI Diversion Engine with TomTom Integration');
console.log(`📡 API Base: ${API_BASE}`);

async function testDiversionEngine() {
  try {
    // First, create a test incident
    console.log('\n1️⃣ Creating test incident...');
    
    const incidentData = {
      type: 'road_closure',
      subtype: 'Major Incident',
      location: 'Newcastle Central Station',
      coordinates: {
        latitude: 54.9783,
        longitude: -1.6178
      },
      description: 'Major road closure affecting multiple bus routes',
      severity: 'High',
      affectsRoutes: ['21', '22', 'Q3', '1', '2'],
      createdBy: 'Test Script',
      createdByRole: 'System Test'
    };
    
    const createResponse = await fetch(`${API_BASE}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incidentData)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create incident: ${createResponse.status}`);
    }
    
    const { incident } = await createResponse.json();
    console.log(`✅ Created incident: ${incident.id} at ${incident.location}`);
    console.log(`   Affecting routes: ${incident.affectsRoutes.join(', ')}`);
    
    // Now test the diversion engine
    console.log('\n2️⃣ Getting AI diversion suggestions...');
    
    const diversionResponse = await fetch(`${API_BASE}/api/incidents/${incident.id}/diversions`);
    
    if (!diversionResponse.ok) {
      throw new Error(`Failed to get diversions: ${diversionResponse.status}`);
    }
    
    const diversionData = await diversionResponse.json();
    
    if (diversionData.success) {
      console.log('\n✅ AI Diversion Engine Results:');
      console.log('================================');
      
      // Show formatted summary
      const { formatted, suggestions } = diversionData;
      
      if (formatted.keyAdvice && formatted.keyAdvice.length > 0) {
        console.log('\n📋 Key Advice:');
        formatted.keyAdvice.forEach((advice, idx) => {
          console.log(`   ${idx + 1}. ${advice}`);
        });
      }
      
      if (formatted.diversions && formatted.diversions.length > 0) {
        console.log('\n🚌 Route-Specific Diversions:');
        formatted.diversions.forEach(div => {
          console.log(`   Route ${div.route}: ${div.instructions}`);
          if (div.primaryAlternative) {
            console.log(`     → Use ${div.primaryAlternative} instead`);
          }
        });
      }
      
      if (formatted.tomtomRoutes && formatted.tomtomRoutes.length > 0) {
        console.log('\n🗺️ TomTom Live Traffic Routes:');
        formatted.tomtomRoutes.forEach((route, idx) => {
          console.log(`   ${idx + 1}. ${route.summary}`);
          console.log(`      • Duration: ${route.duration}`);
          console.log(`      • Distance: ${route.distance}`);
          console.log(`      • Traffic: ${route.trafficDelay || 'No delays'}`);
          console.log(`      • Data: ${route.confidence}`);
          if (route.via) {
            console.log(`      • Via: ${route.via}`);
          }
        });
      }
      
      if (formatted.interchanges && formatted.interchanges.length > 0) {
        console.log('\n🚏 Nearest Interchanges:');
        formatted.interchanges.forEach(int => {
          console.log(`   • ${int.name} (${int.distance})`);
          console.log(`     Routes: ${int.availableRoutes}`);
        });
      }
      
      console.log('\n📊 Summary:');
      console.log(`   • Severity: ${suggestions.severity}`);
      console.log(`   • Total diversions: ${suggestions.diversions.length}`);
      console.log(`   • TomTom routes: ${suggestions.tomtomRoutes?.length || 0}`);
      console.log(`   • Interchanges found: ${suggestions.interchanges.length}`);
      console.log(`   • General advice: ${suggestions.generalAdvice.length}`);
      
    } else {
      console.error('❌ Failed to get diversions:', diversionData.error);
    }
    
    // Clean up - delete test incident
    console.log('\n3️⃣ Cleaning up test incident...');
    const deleteResponse = await fetch(`${API_BASE}/api/incidents/${incident.id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test incident deleted');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Test AI Disruption Manager endpoint availability
async function testAIManagerEndpoints() {
  console.log('\n4️⃣ Testing AI Disruption Manager endpoints...');
  
  try {
    // Test incidents endpoint
    const incidentsResponse = await fetch(`${API_BASE}/api/incidents`);
    console.log(`   • GET /api/incidents: ${incidentsResponse.ok ? '✅' : '❌'} (${incidentsResponse.status})`);
    
    // Test incident alerts endpoint
    const alertsResponse = await fetch(`${API_BASE}/api/incident-alerts`);
    console.log(`   • GET /api/incident-alerts: ${alertsResponse.ok ? '✅' : '❌'} (${alertsResponse.status})`);
    
    // Test diagnostic endpoint
    const diagResponse = await fetch(`${API_BASE}/api/test/diversions`);
    console.log(`   • GET /api/test/diversions: ${diagResponse.ok ? '✅' : '❌'} (${diagResponse.status})`);
    
  } catch (error) {
    console.error('❌ Endpoint test failed:', error.message);
  }
}

// Run tests
console.log('\n🚀 Starting AI Diversion Engine tests...\n');

testDiversionEngine()
  .then(() => testAIManagerEndpoints())
  .then(() => {
    console.log('\n✅ All tests complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Open Go BARRY in browser');
    console.log('   2. Navigate to "AI Disruption Manager"');
    console.log('   3. Create or select an incident');
    console.log('   4. Click "AI Diversion" to see TomTom-powered suggestions');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
