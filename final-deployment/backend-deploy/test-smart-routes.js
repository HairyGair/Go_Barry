// backend/test-smart-routes.js
import { getSmartRouteMatching, getRouteMatchConfidence } from './smart-route-matcher.js';

const testLocations = [
  { location: "Northumberland Street, Newcastle City Centre", lat: 54.9750, lng: -1.6150 },
  { location: "West Road, Cowgate", lat: 54.9806, lng: -1.6767 },
  { location: "A1 Gateshead", lat: 54.9500, lng: -1.6000 },
  { location: "Coast Road, Tynemouth", lat: 55.0200, lng: -1.4200 },
  { location: "Durham Road, Gateshead", lat: 54.9300, lng: -1.6000 }
];

console.log('🧪 Testing smart route matching...\n');

testLocations.forEach(test => {
  console.log(`📍 Testing: ${test.location}`);
  const routes = getSmartRouteMatching(test.location, test.lat, test.lng);
  const confidence = getRouteMatchConfidence(test.location, routes);
  console.log(`   Routes: ${routes.join(', ') || 'None'}`);
  console.log(`   Confidence: ${confidence}`);
  console.log('');
});