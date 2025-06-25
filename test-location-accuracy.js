// Test script for location accuracy improvements
import { getQuickLocation } from './backend/utils/productionLocation.js';

console.log('🧪 Testing location accuracy improvements...\n');

// Test cases with real coordinates
const testCases = [
  // Westerhope specific test
  { lat: 54.993, lng: -1.673, expected: 'Westerhope, Newcastle' },
  
  // Other Newcastle areas
  { lat: 54.978, lng: -1.610, expected: 'Newcastle City Centre' },
  { lat: 54.998, lng: -1.610, expected: 'Gosforth, Newcastle' },
  { lat: 54.985, lng: -1.595, expected: 'Jesmond, Newcastle' },
  { lat: 54.980, lng: -1.580, expected: 'Heaton, Newcastle' },
  { lat: 54.972, lng: -1.655, expected: 'Benwell, Newcastle' },
  
  // Gateshead areas
  { lat: 54.960, lng: -1.605, expected: 'Gateshead Town Centre' },
  { lat: 54.945, lng: -1.755, expected: 'Whickham, Gateshead' },
  { lat: 54.940, lng: -1.605, expected: 'Low Fell, Gateshead' },
  
  // North Tyneside
  { lat: 55.040, lng: -1.440, expected: 'Whitley Bay, North Tyneside' },
  { lat: 55.010, lng: -1.445, expected: 'North Shields, North Tyneside' },
  
  // Sunderland
  { lat: 54.910, lng: -1.380, expected: 'Sunderland City Centre' },
  { lat: 54.900, lng: -1.520, expected: 'Washington, Sunderland' },
  
  // Durham
  { lat: 54.775, lng: -1.575, expected: 'Durham City Centre' },
  { lat: 54.855, lng: -1.570, expected: 'Chester-le-Street, Durham' },
  
  // Major roads
  { lat: 54.980, lng: -1.640, expected: 'A1 Western Bypass' },
  { lat: 54.950, lng: -1.560, expected: 'A19 Corridor' },
  
  // Edge cases - should fall back to broader areas
  { lat: 54.850, lng: -1.700, expected: 'County Durham' },
  { lat: 55.100, lng: -1.500, expected: 'North East England' }
];

// Run tests
let passed = 0;
let failed = 0;

console.log('Testing coordinate-to-location mapping:\n');

testCases.forEach(test => {
  const result = getQuickLocation(test.lat, test.lng);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ ${test.lat}, ${test.lng} → ${result}`);
    passed++;
  } else {
    console.log(`❌ ${test.lat}, ${test.lng} → ${result} (expected: ${test.expected})`);
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`✨ Accuracy: ${((passed / testCases.length) * 100).toFixed(1)}%`);

// Test boundary precision
console.log('\n🔍 Testing boundary precision:');

// Points just inside/outside Westerhope
const westerhopeBoundaryTests = [
  { lat: 54.985, lng: -1.655, desc: 'East edge' },
  { lat: 54.985, lng: -1.654, desc: 'Just outside east' },
  { lat: 55.002, lng: -1.675, desc: 'North edge' },
  { lat: 55.003, lng: -1.675, desc: 'Just outside north' },
  { lat: 54.993, lng: -1.695, desc: 'West edge' },
  { lat: 54.993, lng: -1.696, desc: 'Just outside west' },
  { lat: 54.985, lng: -1.675, desc: 'South edge' },
  { lat: 54.984, lng: -1.675, desc: 'Just outside south' }
];

console.log('\nWesterhope boundary tests:');
westerhopeBoundaryTests.forEach(test => {
  const result = getQuickLocation(test.lat, test.lng);
  console.log(`  ${test.desc}: ${test.lat}, ${test.lng} → ${result}`);
});

console.log('\n✅ Location accuracy improvements complete!');
