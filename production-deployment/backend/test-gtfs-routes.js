// backend/test-gtfs-routes.js
import findGTFSRoutesNearCoordinates from './gtfs-route-matcher.js';

const testCoordinates = [
  { name: "Coast Road, Tynemouth", lat: 55.0200, lng: -1.4200 },
  { name: "Newcastle City Centre", lat: 54.9750, lng: -1.6150 },
  { name: "A1 near Gateshead", lat: 54.9500, lng: -1.6000 },
  { name: "Durham Road", lat: 54.9300, lng: -1.6000 }
];

console.log('🧪 Testing GTFS route matching with real Go North East data...\n');

for (const test of testCoordinates) {
  console.log(`📍 Testing: ${test.name} (${test.lat}, ${test.lng})`);
  
  const routes = await findGTFSRoutesNearCoordinates(test.lat, test.lng);
  
  console.log(`   Actual GNE routes: ${routes.join(', ') || 'None found'}`);
  console.log('');
}