// backend/test-coordinate-resolver.js
// Test script for the intelligent coordinate resolver
import { intelligentCoordinateResolver } from './services/intelligentCoordinateResolver.js';

const testCases = [
  {
    name: "Junction parsing test",
    roadwork: {
      id: "test-1",
      sm_location_description: "A1 northbound between J65 and J66",
      sm_highway_authority: "GATESHEAD COUNCIL"
    }
  },
  {
    name: "Postcode extraction test",
    roadwork: {
      id: "test-2",
      sm_location_description: "Works outside 123 High Street NE1 1AA",
      sm_street_name: "High Street",
      sm_highway_authority: "NEWCASTLE CITY COUNCIL"
    }
  },
  {
    name: "Landmark offset test",
    roadwork: {
      id: "test-3",
      sm_location_description: "500m north of Metro Centre",
      sm_highway_authority: "GATESHEAD COUNCIL"
    }
  },
  {
    name: "Simple street test",
    roadwork: {
      id: "test-4",
      sm_street_name: "Northumberland Street",
      sm_town: "Newcastle",
      sm_highway_authority: "NEWCASTLE CITY COUNCIL"
    }
  }
];

async function runTests() {
  console.log("🧪 Testing Intelligent Coordinate Resolver\n");
  
  for (const testCase of testCases) {
    console.log(`📍 Test: ${testCase.name}`);
    console.log(`   Input: ${JSON.stringify(testCase.roadwork, null, 2)}`);
    
    try {
      const result = await intelligentCoordinateResolver.resolveCoordinates(testCase.roadwork);
      
      if (result.coordinates) {
        console.log(`   ✅ Success!`);
        console.log(`   Strategy: ${result.coordinateStrategy}`);
        console.log(`   Coordinates: [${result.coordinates[0].toFixed(6)}, ${result.coordinates[1].toFixed(6)}]`);
        console.log(`   Accuracy: ${result.coordinateAccuracy}`);
      } else {
        console.log(`   ❌ Failed to resolve`);
        console.log(`   Suggestions:`, result.resolutionSuggestions);
      }
    } catch (error) {
      console.log(`   ⚠️ Error: ${error.message}`);
    }
    
    console.log("");
  }
}

// Run the tests
runTests().then(() => {
  console.log("✅ All tests complete!");
  process.exit(0);
}).catch(error => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
