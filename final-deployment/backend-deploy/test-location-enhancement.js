// backend/test-location-enhancement.js
import enhanceLocationWithNames from './location-enhancer.js';

console.log('🧪 Testing location enhancement...');

const testCoordinates = [
  { lat: 54.9783, lng: -1.6178, name: 'Newcastle City Centre' },
  { lat: 54.9500, lng: -1.6000, name: 'Gateshead' },
  { lat: 55.0077, lng: -1.4618, name: 'Tyne Tunnel' },
  { lat: 54.8951, lng: -1.5418, name: 'Durham Road' }
];

for (const coord of testCoordinates) {
  console.log(`\n🗺️ Testing: ${coord.name}`);
  
  const enhanced = await enhanceLocationWithNames(
    coord.lat, 
    coord.lng, 
    `${coord.name} (${coord.lat}, ${coord.lng})`
  );
  
  console.log(`   Enhanced: ${enhanced}`);
}

console.log('\n✅ Location enhancement test complete');