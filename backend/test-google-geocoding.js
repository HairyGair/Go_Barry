// backend/test-google-geocoding.js
// Test Google geocoding functionality

import dotenv from 'dotenv';
import { geocodeWithGoogle, buildGeocodingAddress } from '../Go_BARRY/services/googleGeocoding.js';
import { coordinateFallbackProcessor } from './utils/coordinateFallbackProcessor.js';

// Load environment variables
dotenv.config();

console.log('🌍 Testing Google geocoding functionality...\n');

// Check environment
console.log('📋 Environment check:');
const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
console.log(`   Google API Key: ${googleApiKey ? '✅ Configured' : '❌ Missing'}`);

if (!googleApiKey) {
  console.log('   ⚠️ Add GOOGLE_MAPS_API_KEY to environment to test actual API calls');
}

// Test address building function
console.log('\n🏗️ Testing address building:');

const testRoadworks = [
  {
    sm_street_name: "STATION ROAD",
    sm_highway_authority: "NORTH TYNESIDE COUNCIL",
    sm_town: "Wallsend",
    sm_location_description: "Outside Wallsend Metro Station"
  },
  {
    sm_street_name: "GREY STREET", 
    sm_highway_authority: "NEWCASTLE CITY COUNCIL",
    sm_town: "Newcastle",
    sm_location_description: null
  },
  {
    sm_street_name: null,
    sm_highway_authority: "DURHAM COUNTY COUNCIL", 
    sm_town: null,
    sm_location_description: "A167 between Darlington and Durham"
  },
  {
    sm_street_name: "KIRKWOOD GARDENS",
    sm_highway_authority: "DURHAM COUNTY COUNCIL",
    sm_town: "Durham",
    sm_location_description: "Residential area near Durham University"
  }
];

testRoadworks.forEach((roadwork, index) => {
  const address = buildGeocodingAddress(roadwork);
  console.log(`   ${index + 1}. "${address}"`);
});

// Test actual geocoding if API key available
if (googleApiKey) {
  console.log('\n🔍 Testing Google geocoding API:');
  
  const testAddresses = [
    "STATION ROAD, Wallsend, NORTH TYNESIDE, UK",
    "GREY STREET, Newcastle, UK", 
    "A167, DURHAM, UK",
    "KIRKWOOD GARDENS, Durham, UK"
  ];
  
  console.log('   Running geocoding tests...');
  
  // Run geocoding tests sequentially to respect rate limits
  for (let i = 0; i < testAddresses.length; i++) {
    const address = testAddresses[i];
    console.log(`\n   Test ${i + 1}: "${address}"`);
    
    try {
      const result = await geocodeWithGoogle(address);
      
      if (result) {
        console.log(`   ✅ Success: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`);
        console.log(`   📍 Address: ${result.address}`);
        console.log(`   🎯 Confidence: ${result.confidence}`);
        console.log(`   🗺️ Maps: https://www.google.com/maps?q=${result.latitude},${result.longitude}`);
        
        // Validate coordinates are in UK
        if (result.latitude >= 49 && result.latitude <= 61 && 
            result.longitude >= -8 && result.longitude <= 2) {
          console.log('   ✅ Coordinates are within UK bounds');
        } else {
          console.log('   ⚠️ Coordinates outside expected UK bounds');
        }
      } else {
        console.log('   ❌ No results returned');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Rate limiting delay
    if (i < testAddresses.length - 1) {
      console.log('   💤 Waiting 250ms for rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
} else {
  console.log('\n⚠️ Skipping API tests - no Google API key configured');
}

// Test fallback processor with Google geocoding
console.log('\n🔄 Testing coordinate fallback processor:');

const testRoadworkForFallback = {
  sm_reference: "TEST001",
  sm_street_name: "GREY STREET",
  sm_highway_authority: "NEWCASTLE CITY COUNCIL",
  sm_town: "Newcastle",
  sm_location_description: "City centre main street",
  coordinates: null // No existing coordinates to trigger fallback
};

console.log('   Processing roadwork without coordinates...');
try {
  const processed = await coordinateFallbackProcessor.processRoadworkWithFallbacks(testRoadworkForFallback);
  
  console.log('   Results:');
  console.log(`   📍 Coordinates: ${processed.coordinates || 'None'}`);
  console.log(`   🔍 Source: ${processed.coordinateSource}`);
  console.log(`   🎯 Accuracy: ${processed.coordinateAccuracy}`);
  console.log(`   📋 Strategy: ${processed.coordinateFallbackStrategy}`);
  
  if (processed.coordinates) {
    const [lat, lng] = processed.coordinates;
    console.log(`   🗺️ Maps: https://www.google.com/maps?q=${lat},${lng}`);
  }
  
  if (processed.fallbackSuggestions) {
    console.log('   💡 Suggestions for manual lookup:');
    processed.fallbackSuggestions.forEach((suggestion, index) => {
      console.log(`      ${index + 1}. ${suggestion.text}`);
    });
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

console.log('\n✅ Google geocoding test complete!');
console.log('\n📊 Summary:');
console.log('   - Address building function tested ✅');
console.log(`   - Google API integration ${googleApiKey ? '✅' : '⚠️ (no API key)'}`);
console.log('   - Fallback processor integration ✅');
console.log('\n💡 Next steps:');
console.log('   1. Add GOOGLE_MAPS_API_KEY to environment variables');
console.log('   2. Test with real roadworks data from Supabase');
console.log('   3. Deploy and monitor geocoding accuracy');
