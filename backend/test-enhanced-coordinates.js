// test-enhanced-coordinates.js
// Test the enhanced coordinate extraction system

import dotenv from 'dotenv';
import { parseStreetManagerGeometry } from './utils/bngToLatLng.js';
import unifiedRoadworksManager from './services/unifiedRoadworksManagerFixed.js';

dotenv.config();

console.log('🧪 Testing enhanced coordinate extraction system...\n');

// Test the geometry parsing functions
const testGeometries = [
  'POINT(434715.758597043 563780.102213281)',
  'POLYGON((451278.25 518398.85,451285.34 518343.41,451290 518345.19,451283.12 518399.52,451278.25 518398.85))',
  'LINESTRING(432543 564988,432538 564964)'
];

console.log('🗺️ Testing geometry parsing functions:');
testGeometries.forEach((geom, i) => {
  console.log(`\nTest ${i+1}: ${geom}`);
  try {
    const result = parseStreetManagerGeometry(geom);
    if (result) {
      console.log(`✅ Parsed to: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)} (${result.source})`);
    } else {
      console.log('❌ Failed to parse');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
});

console.log('\n📊 Testing unified roadworks manager:');

try {
  const result = await unifiedRoadworksManager.getAllRoadworks();
  
  if (result.success && result.streetManager && result.streetManager.length > 0) {
    console.log(`\n✅ Found ${result.streetManager.length} StreetManager roadworks`);
    
    // Analyze coordinate extraction success
    const withCoords = result.streetManager.filter(work => work.coordinates && work.coordinates.length === 2);
    const coordPercent = Math.round((withCoords.length / result.streetManager.length) * 100);
    
    console.log(`📍 Coordinate success: ${withCoords.length}/${result.streetManager.length} (${coordPercent}%)`);
    
    // Show first few examples
    console.log('\n🎯 Sample coordinates:');
    result.streetManager.slice(0, 5).forEach((work, i) => {
      if (work.coordinates) {
        console.log(`  ${i+1}. ${work.location} → ${work.coordinates[0].toFixed(6)}, ${work.coordinates[1].toFixed(6)} (${work.coordinateSource})`);
      } else {
        console.log(`  ${i+1}. ${work.location} → No coordinates (${work.coordinateSource || 'none'})`);
      }
    });
    
  } else {
    console.log('❌ No StreetManager roadworks found');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n✅ Enhanced coordinate extraction test complete');