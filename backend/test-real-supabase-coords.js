// Test with actual Supabase sm_easting/sm_northing format
import { processStreetManagerCoordinates } from './utils/coordinateConverter.js';

// Test with actual Supabase format
const realSupabaseData = {
  id: "bf7c6bc3-10e6-443e-bfd1-aa7658b114ac",
  sm_reference: "REAL_SUPABASE_TEST", 
  sm_easting: "428971.99",  // This is what's actually in your Supabase
  sm_northing: "569001.32", // This is what's actually in your Supabase
  latitude: null,
  longitude: null
};

console.log('🧪 Testing with REAL Supabase sm_easting/sm_northing format...');
const result = processStreetManagerCoordinates(realSupabaseData);

console.log('Result:', {
  id: result.id,
  coordinates: result.coordinates,
  coordinateSource: result.coordinateSource,
  coordinateAccuracy: result.coordinateAccuracy,
  coordinateError: result.coordinateError,
  originalCoordinates: result.originalCoordinates
});

if (result.coordinates) {
  console.log(`✅ SUCCESS: [${result.coordinates[0]}, ${result.coordinates[1]}]`);
  console.log(`📍 Google Maps: https://www.google.com/maps?q=${result.coordinates[0]},${result.coordinates[1]}`);
  console.log(`📊 Source: ${result.coordinateSource}`);
} else {
  console.log(`❌ FAILED: ${result.coordinateError}`);
}
