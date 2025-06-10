// Quick test for enhanced route matching
// Run this to verify all services work with the new enhanced matching

import { enhancedRouteMatchingWithLocation, enhancedTextOnlyRouteMatching } from './backend/utils/enhancedRouteMatching.js';

console.log('🧪 Testing Enhanced Route Matching...\n');

// Test 1: Location + Coordinates (TomTom/HERE style)
console.log('📍 Test 1: Enhanced matching with location + coordinates');
const test1 = enhancedRouteMatchingWithLocation(54.9783, -1.6178, 'A1 Gateshead', 250);
console.log(`   Location: "A1 Gateshead" at Newcastle coordinates`);
console.log(`   Result: ${test1.join(', ')} (${test1.length} routes)\n`);

// Test 2: Text-only matching (National Highways style)  
console.log('📝 Test 2: Text-only matching');
const test2 = enhancedTextOnlyRouteMatching('A19 Coast Road closure', 'roadworks affecting northbound traffic');
console.log(`   Location: "A19 Coast Road closure"`);
console.log(`   Result: ${test2.join(', ')} (${test2.length} routes)\n`);

// Test 3: Central area
console.log('🏙️ Test 3: Central Newcastle');
const test3 = enhancedRouteMatchingWithLocation(54.9733, -1.6143, 'Central Motorway, Newcastle', 200);
console.log(`   Location: "Central Motorway, Newcastle"`);
console.log(`   Result: ${test3.join(', ')} (${test3.length} routes)\n`);

// Test 4: Specific landmark
console.log('🌉 Test 4: Major landmark');
const test4 = enhancedTextOnlyRouteMatching('Tyne Bridge closure', 'temporary repairs');
console.log(`   Location: "Tyne Bridge closure"`);
console.log(`   Result: ${test4.join(', ')} (${test4.length} routes)\n`);

console.log('✅ Enhanced route matching test complete!');
console.log('🚀 Ready for deployment if all tests show relevant routes');
