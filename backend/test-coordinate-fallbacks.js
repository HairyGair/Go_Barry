#!/usr/bin/env node
import { coordinateFallbackProcessor } from './utils/coordinateFallbackProcessor.js';

// Test roadworks with different scenarios
const testRoadworks = [
  {
    id: 'test-1-no-coords',
    sm_street_name: 'Clayton Street',
    sm_location_description: 'Clayton Street, Newcastle upon Tyne',
    sm_highway_authority: 'NEWCASTLE CITY COUNCIL',
    sm_permit_reference: 'NE-2025-001234',
    sm_promoter_organisation: 'Northern Gas Networks'
  },
  {
    id: 'test-2-linestring',
    sm_street_name: 'Gosforth High Street',
    works_location_coordinates: 'LINESTRING(-1.6178 54.9783, -1.6170 54.9785, -1.6165 54.9787)',
    sm_highway_authority: 'NEWCASTLE CITY COUNCIL',
    sm_permit_reference: 'NE-2025-001235'
  },
  {
    id: 'test-3-osgb36',
    sm_street_name: 'Market Street',
    sm_easting: 425000,
    sm_northing: 565000,
    sm_highway_authority: 'NEWCASTLE CITY COUNCIL'
  },
  {
    id: 'test-4-minimal',
    sm_location_description: 'Works near Central Station',
    sm_highway_authority: 'NEWCASTLE CITY COUNCIL'
  },
  {
    id: 'test-5-no-location',
    sm_works_description: 'Gas main replacement',
    sm_promoter_organisation: 'Northern Gas Networks',
    sm_highway_authority: 'GATESHEAD COUNCIL'
  }
];

console.log('🧪 Testing Comprehensive Coordinate Fallback System\n');
console.log('=' .repeat(60));

async function testFallbacks() {
  for (const roadwork of testRoadworks) {
    console.log(`\n📍 Test Case: ${roadwork.id}`);
    console.log(`Location: ${roadwork.sm_street_name || roadwork.sm_location_description || 'Unknown'}`);
    console.log(`Authority: ${roadwork.sm_highway_authority || 'Unknown'}`);
    
    console.log('\nProcessing...');
    
    try {
      const result = await coordinateFallbackProcessor.processRoadworkWithFallbacks(roadwork);
      
      console.log('\n✅ Results:');
      console.log(`Strategy Used: ${result.coordinateFallbackStrategy}`);
      console.log(`Coordinates: ${result.coordinates ? `[${result.coordinates[0]}, ${result.coordinates[1]}]` : 'None'}`);
      console.log(`Source: ${result.coordinateSource}`);
      console.log(`Accuracy: ${result.coordinateAccuracy}`);
      
      if (result.fallbackSuggestions) {
        console.log('\n📋 Fallback Suggestions:');
        result.fallbackSuggestions.forEach(suggestion => {
          console.log(`  - ${suggestion.text}`);
          console.log(`    ${suggestion.detail}`);
        });
      }
      
      if (result.geocodingDetails) {
        console.log('\n🌍 Geocoding Details:');
        console.log(`  Display Name: ${result.geocodingDetails.display_name}`);
        console.log(`  Type: ${result.geocodingDetails.type}`);
        console.log(`  Importance: ${result.geocodingDetails.importance}`);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    console.log('\n' + '-'.repeat(60));
  }
}

// Run tests
testFallbacks().then(() => {
  console.log('\n✅ All tests complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
