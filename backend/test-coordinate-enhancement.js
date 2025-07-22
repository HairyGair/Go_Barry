// backend/test-coordinate-enhancement.js
// Test script for coordinate enhancement
// Run with: node backend/test-coordinate-enhancement.js

import coordinateEnhancer from './services/geocoding/coordinateEnhancer.js';

console.log('🧪 Testing Coordinate Enhancement System...\n');

// Test alerts without coordinates
const testAlerts = [
  {
    id: 'test-1',
    title: 'Traffic incident on A1 Junction 65',
    location: 'A1 Northbound J65 Birtley',
    description: 'Lane closure due to broken down vehicle'
  },
  {
    id: 'test-2',
    title: 'Roadworks on Tyne Bridge',
    location: 'Tyne Bridge, Newcastle',
    description: 'Bridge maintenance work'
  },
  {
    id: 'test-3',
    title: 'Congestion in Sunderland city centre',
    location: 'Sunderland',
    description: 'Heavy traffic due to football match'
  },
  {
    id: 'test-4',
    title: 'A19 Silverlink Roundabout delays',
    location: 'A19 Silverlink',
    description: 'Traffic building up at roundabout'
  },
  {
    id: 'test-5',
    title: 'Incident with partial coordinates',
    location: 'Newcastle',
    coordinates: [54.9783, -1.6178] // Array format
  },
  {
    id: 'test-6',
    title: 'Alert with object coordinates',
    location: 'Gateshead',
    coordinates: { lat: 54.9527, lng: -1.6038 } // Object format
  }
];

async function runTests() {
  console.log('📍 Testing individual coordinate enhancement...\n');
  
  for (const alert of testAlerts) {
    console.log(`\nTesting: "${alert.title}"`);
    console.log(`Original location: ${alert.location}`);
    console.log(`Has coordinates: ${coordinateEnhancer.hasValidCoordinates(alert)}`);
    
    const enhanced = await coordinateEnhancer.enhanceAlertCoordinates(alert);
    
    console.log(`Enhanced coordinates: ${enhanced.coordinates.lat}, ${enhanced.coordinates.lng}`);
    console.log(`Coordinate source: ${enhanced.coordinateSource}`);
    console.log(`Accuracy: ${enhanced.coordinateAccuracy}`);
    if (enhanced.enhancedLocation && enhanced.enhancedLocation !== alert.location) {
      console.log(`Enhanced location: ${enhanced.enhancedLocation}`);
    }
    console.log(`Map URL: https://www.google.com/maps?q=${enhanced.coordinates.lat},${enhanced.coordinates.lng}`);
  }
  
  console.log('\n\n📦 Testing batch enhancement...\n');
  
  const batchEnhanced = await coordinateEnhancer.enhanceMultipleAlerts(testAlerts);
  
  console.log('Batch enhancement results:');
  console.log(`- Total alerts: ${batchEnhanced.length}`);
  console.log(`- With original coords: ${batchEnhanced.filter(a => a.coordinateSource === 'original').length}`);
  console.log(`- Geocoded: ${batchEnhanced.filter(a => a.coordinateSource === 'geocoded').length}`);
  console.log(`- From junction data: ${batchEnhanced.filter(a => a.coordinateSource === 'junction').length}`);
  console.log(`- Fallback coords: ${batchEnhanced.filter(a => a.coordinateSource === 'fallback').length}`);
  console.log(`- Default coords: ${batchEnhanced.filter(a => a.coordinateSource === 'default').length}`);
  
  console.log('\n📊 System statistics:');
  const stats = coordinateEnhancer.getStats();
  console.log(`- Cache size: ${stats.cacheSize} entries`);
  console.log(`- Region centers: ${stats.regionCenters} locations`);
  console.log(`- Junction coordinates: ${stats.junctionCoordinates} junctions`);
  
  console.log('\n✅ Coordinate enhancement test complete!');
}

// Run the tests
runTests().catch(console.error);
