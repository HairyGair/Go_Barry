#!/usr/bin/env node
import { processStreetManagerCoordinates } from './utils/coordinateConverter.js';
import { coordinateValidator } from './utils/coordinateValidator.js';
import { coordinateFallbackProcessor } from './utils/coordinateFallbackProcessor.js';

// Test case for Killingworth Way issue
const killingworthRoadwork = {
  id: 'killingworth-test',
  sm_street_name: 'KILLINGWORTH WAY',
  sm_location_description: 'KILLINGWORTH WAY, Section 50',
  sm_highway_authority: 'NORTH TYNESIDE COUNCIL',
  sm_permit_reference: 'NT-2025-KW-001',
  sm_promoter_organisation: 'NORTH TYNESIDE COUNCIL',
  sm_start_date: '2021-10-13',
  sm_end_date: '2025-11-04',
  // Simulate coordinates that point to Newcastle center (wrong location)
  coordinates: [54.9783, -1.6178], // Newcastle Haymarket
  coordinateSource: 'some_source'
};

console.log('🧪 Testing Killingworth Way Coordinate Validation\n');
console.log('=' .repeat(60));

async function testKillingworthValidation() {
  console.log('📍 Original Roadwork Data:');
  console.log(`Street: ${killingworthRoadwork.sm_street_name}`);
  console.log(`Authority: ${killingworthRoadwork.sm_highway_authority}`);
  console.log(`Original Coordinates: [${killingworthRoadwork.coordinates[0]}, ${killingworthRoadwork.coordinates[1]}]`);
  console.log(`Duration: ${killingworthRoadwork.sm_start_date} to ${killingworthRoadwork.sm_end_date}`);
  
  console.log('\n' + '-'.repeat(60));
  console.log('\n🔍 Step 1: Standard Coordinate Processing');
  
  let processed = processStreetManagerCoordinates(killingworthRoadwork);
  console.log(`Coordinates after processing: ${processed.coordinates ? `[${processed.coordinates[0]}, ${processed.coordinates[1]}]` : 'None'}`);
  console.log(`Source: ${processed.coordinateSource}`);
  
  console.log('\n' + '-'.repeat(60));
  console.log('\n🔍 Step 2: Coordinate Validation');
  
  const validation = coordinateValidator.validateCoordinates(processed);
  console.log(`Valid: ${validation.valid}`);
  console.log(`Reason: ${validation.reason}`);
  if (validation.detectedDefault) {
    console.log(`⚠️ Detected Default: ${validation.detectedDefault}`);
  }
  if (validation.suspiciousLocation) {
    console.log(`⚠️ Suspicious: ${validation.suspiciousLocation}`);
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('\n🔍 Step 3: Apply Validation');
  
  processed = coordinateValidator.processWithValidation(processed);
  console.log(`Coordinates after validation: ${processed.coordinates ? `[${processed.coordinates[0]}, ${processed.coordinates[1]}]` : 'None (removed)'}`);
  if (processed.coordinateValidation) {
    console.log(`Validation result: ${processed.coordinateValidation.reason}`);
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('\n🔍 Step 4: Fallback Processing');
  
  if (!processed.coordinates) {
    processed = await coordinateFallbackProcessor.processRoadworkWithFallbacks(processed);
    console.log(`Fallback Strategy: ${processed.coordinateFallbackStrategy}`);
    console.log(`New Coordinates: ${processed.coordinates ? `[${processed.coordinates[0]}, ${processed.coordinates[1]}]` : 'None'}`);
    console.log(`Source: ${processed.coordinateSource}`);
    
    if (processed.fallbackSuggestions) {
      console.log('\n📋 Fallback Suggestions:');
      processed.fallbackSuggestions.forEach(suggestion => {
        console.log(`  - ${suggestion.text}`);
        console.log(`    ${suggestion.detail}`);
      });
    }
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('\n✅ Final Result:');
  console.log(`Street: ${processed.sm_street_name}`);
  console.log(`Coordinates: ${processed.coordinates ? `[${processed.coordinates[0]}, ${processed.coordinates[1]}]` : 'None'}`);
  console.log(`Source: ${processed.coordinateSource}`);
  console.log(`Would show fallback UI: ${!processed.coordinates}`);
}

// Test additional cases
async function testAdditionalCases() {
  console.log('\n\n' + '='.repeat(60));
  console.log('🧪 Testing Additional Default Location Cases\n');
  
  const testCases = [
    {
      name: 'Wallsend roadwork with Newcastle coordinates',
      roadwork: {
        sm_street_name: 'STATION ROAD, WALLSEND',
        sm_highway_authority: 'NORTH TYNESIDE COUNCIL',
        coordinates: [54.9783, -1.6178] // Newcastle center
      }
    },
    {
      name: 'Zero coordinates',
      roadwork: {
        sm_street_name: 'HIGH STREET',
        sm_highway_authority: 'GATESHEAD COUNCIL',
        coordinates: [0, 0]
      }
    },
    {
      name: 'Valid North Tyneside coordinates',
      roadwork: {
        sm_street_name: 'COAST ROAD',
        sm_highway_authority: 'NORTH TYNESIDE COUNCIL',
        coordinates: [55.0182, -1.4858] // Actually in North Tyneside
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📍 Test: ${testCase.name}`);
    const validation = coordinateValidator.validateCoordinates(testCase.roadwork);
    console.log(`Valid: ${validation.valid}`);
    console.log(`Reason: ${validation.reason}`);
  }
}

// Run tests
testKillingworthValidation()
  .then(() => testAdditionalCases())
  .then(() => {
    console.log('\n✅ All tests complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
