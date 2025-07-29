// Test with Supabase direct field format
import { processStreetManagerCoordinates } from './utils/coordinateConverter.js';

// Test with Supabase format (direct field)
const supabaseFormat = {
  id: "bf7c6bc3-10e6-443e-bfd1-aa7658b114ac",
  sm_reference: "SUPABASE_TEST",
  works_location_coordinates: "LINESTRING(428971.99 569001.32,428938.91 568752.61,428954.79 568589.89)",
  latitude: null,
  longitude: null
};

console.log('🧪 Testing Supabase format...');
const result = processStreetManagerCoordinates(supabaseFormat);

console.log('Result:', {
  id: result.id,
  coordinates: result.coordinates,
  coordinateSource: result.coordinateSource,
  coordinateError: result.coordinateError
});

if (result.coordinates) {
  console.log(`✅ SUCCESS: [${result.coordinates[0]}, ${result.coordinates[1]}]`);
  console.log(`📍 Google Maps: https://www.google.com/maps?q=${result.coordinates[0]},${result.coordinates[1]}`);
} else {
  console.log(`❌ FAILED: ${result.coordinateError}`);
}
