// Test Google geocoding with real API key
import dotenv from 'dotenv';
dotenv.config();

console.log('🌍 Testing Google Maps Geocoding API...\n');

// Check API key
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
console.log(`Google API Key: ${apiKey ? '✅ Loaded' : '❌ Missing'}`);

if (!apiKey) {
  console.log('❌ No Google API key found in environment');
  process.exit(1);
}

// Test a simple geocoding request
const testAddress = "GREY STREET, Newcastle, UK";
const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;

console.log(`📍 Testing geocoding for: "${testAddress}"`);
console.log(`🌐 Request URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);

try {
  const response = await fetch(url);
  const data = await response.json();
  
  console.log(`📡 Response status: ${data.status}`);
  
  if (data.status === 'OK' && data.results && data.results.length > 0) {
    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    
    console.log('✅ Geocoding successful!');
    console.log(`📍 Coordinates: ${lat}, ${lng}`);
    console.log(`📮 Formatted address: ${result.formatted_address}`);
    console.log(`🏷️ Types: ${result.types.join(', ')}`);
    console.log(`🗺️ Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
    
    // Validate UK coordinates
    if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
      console.log('✅ Coordinates are within UK bounds');
    } else {
      console.log('⚠️ Coordinates outside expected UK bounds');
    }
  } else if (data.status === 'ZERO_RESULTS') {
    console.log('⚠️ No results found for this address');
  } else {
    console.log(`❌ API error: ${data.status}`);
    if (data.error_message) {
      console.log(`📝 Error message: ${data.error_message}`);
    }
  }
} catch (error) {
  console.log(`❌ Request failed: ${error.message}`);
}

console.log('\n✅ Google geocoding test complete!');
