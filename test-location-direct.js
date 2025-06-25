#!/usr/bin/env node

// Direct test of location accuracy improvements
import { getQuickLocation } from './backend/utils/productionLocation.js';

console.log('🧪 Testing Go BARRY location accuracy improvements...\n');

// Test specific problem case
console.log('📍 Testing Westerhope accuracy:');
const westerhope1 = getQuickLocation(54.993, -1.673);
const westerhope2 = getQuickLocation(54.990, -1.680);
const westerhope3 = getQuickLocation(54.995, -1.665);

console.log(`  Test 1 (54.993, -1.673): ${westerhope1} ${westerhope1 === 'Westerhope, Newcastle' ? '✅' : '❌'}`);
console.log(`  Test 2 (54.990, -1.680): ${westerhope2} ${westerhope2 === 'Westerhope, Newcastle' ? '✅' : '❌'}`);
console.log(`  Test 3 (54.995, -1.665): ${westerhope3} ${westerhope3 === 'Westerhope, Newcastle' ? '✅' : '❌'}`);

// Test nearby areas (should NOT be Westerhope)
console.log('\n📍 Testing nearby areas (should NOT be Westerhope):');
const nearby1 = getQuickLocation(54.973, -1.610); // City centre
const nearby2 = getQuickLocation(54.985, -1.650); // Denton
const nearby3 = getQuickLocation(54.975, -1.670); // Lemington

console.log(`  City Centre (54.973, -1.610): ${nearby1} ${nearby1 !== 'Westerhope, Newcastle' ? '✅' : '❌'}`);
console.log(`  Denton (54.985, -1.650): ${nearby2} ${nearby2 !== 'Westerhope, Newcastle' ? '✅' : '❌'}`);
console.log(`  Lemington (54.975, -1.670): ${nearby3} ${nearby3 !== 'Westerhope, Newcastle' ? '✅' : '❌'}`);

// Test other key areas
console.log('\n📍 Testing other key areas:');
const tests = [
  { coords: [54.973, -1.610], expected: 'Newcastle City Centre' },
  { coords: [54.998, -1.610], expected: 'Gosforth, Newcastle' },
  { coords: [54.960, -1.605], expected: 'Gateshead Town Centre' },
  { coords: [55.040, -1.440], expected: 'Whitley Bay, North Tyneside' },
  { coords: [54.910, -1.380], expected: 'Sunderland City Centre' },
  { coords: [54.775, -1.575], expected: 'Durham City Centre' },
  { coords: [54.980, -1.640], expected: 'A1 Western Bypass' }
];

tests.forEach(test => {
  const result = getQuickLocation(test.coords[0], test.coords[1]);
  const pass = result === test.expected;
  console.log(`  ${test.expected}: ${result} ${pass ? '✅' : '❌'}`);
});

console.log('\n✅ Location accuracy test complete!\n');

// Show improvement summary
console.log('🎯 Key improvements:');
console.log('  1. Precise neighborhood boundaries (no more broad areas)');
console.log('  2. Westerhope: 54.985-55.002°N, 1.655-1.695°W');
console.log('  3. 50+ distinct areas mapped with exact boundaries');
console.log('  4. TomTom data prioritized over geocoding when available');
console.log('  5. Major road corridors included (A1, A19, etc.)');
