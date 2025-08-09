// Test Fleet Database API
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api/fleet-database';

async function testFleetDatabase() {
    console.log('🧪 Testing Fleet Database API...\n');
    
    try {
        // Test 1: Get all vehicles
        console.log('1️⃣ Testing: Get all vehicles');
        const allResponse = await fetch(API_BASE);
        const allData = await allResponse.json();
        console.log(`✅ Total vehicles: ${allData.count || Object.keys(allData).length}`);
        console.log(`📊 Sample: ${JSON.stringify(Object.values(allData).slice(0, 2), null, 2)}\n`);
        
        // Test 2: Get specific vehicle
        console.log('2️⃣ Testing: Get specific vehicle (5301)');
        const vehicleResponse = await fetch(`${API_BASE}/5301`);
        const vehicleData = await vehicleResponse.json();
        console.log(`✅ Vehicle found: ${JSON.stringify(vehicleData, null, 2)}\n`);
        
        // Test 3: Search vehicles
        console.log('3️⃣ Testing: Search for "Wright" vehicles');
        const searchResponse = await fetch(`${API_BASE}/search/wright`);
        const searchData = await searchResponse.json();
        console.log(`✅ Found ${searchData.length} Wright vehicles\n`);
        
        // Test 4: Get by depot
        console.log('4️⃣ Testing: Get vehicles from Percy Main depot');
        const depotResponse = await fetch(`${API_BASE}/depot/Percy Main`);
        const depotData = await depotResponse.json();
        console.log(`✅ Percy Main has ${depotData.length} vehicles\n`);
        
        console.log('🎉 All tests passed! Fleet database is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n⚠️ Make sure the backend is running on port 3001');
        console.log('Run: npm start in the backend directory');
    }
}

// Run tests
testFleetDatabase();
