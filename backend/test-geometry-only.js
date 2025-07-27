// test-geometry-only.js
// Test only the geometry parsing functions without database dependencies

import { parseStreetManagerGeometry } from './utils/bngToLatLng.js';

console.log('🧪 Testing StreetManager geometry parsing...\n');

// Test the geometry parsing functions with real examples from our analysis
const testGeometries = [
  'POINT(434715.758597043 563780.102213281)',
  'POLYGON((451278.25 518398.85,451285.34 518343.41,451290 518345.19,451283.12 518399.52,451278.25 518398.85))',
  'LINESTRING(432543 564988,432538 564964)',
  'POINT(425753.109375 566652.124998331)',
  'POINT(427263.75 562200.19)'
];

console.log('🗺️ Testing geometry parsing functions:');
testGeometries.forEach((geom, i) => {
  console.log(`\nTest ${i+1}: ${geom.substring(0, 50)}${geom.length > 50 ? '...' : ''}`);
  try {
    const result = parseStreetManagerGeometry(geom);
    if (result) {
      console.log(`✅ Parsed to: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)} (${result.source})`);
      
      // Convert to Google Maps link for verification
      const mapsUrl = `https://www.google.com/maps?q=${result.lat},${result.lng}&z=18&t=h`;
      console.log(`🔗 Verify: ${mapsUrl}`);
    } else {
      console.log('❌ Failed to parse');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
});

console.log('\n✅ Geometry parsing test complete');