// Quick test of coordinate conversion
import { processStreetManagerCoordinates } from './utils/coordinateConverter.js';

// Test with your actual Supabase data format
const testData = {
  sm_reference: "TEST123",
  raw_webhook_data: {
    object_data: {
      works_location_coordinates: "LINESTRING(428971.99 569001.32,428938.91 568752.61,428954.79 568589.89)"
    }
  }
};

console.log('🧪 Testing coordinate conversion...');
const result = processStreetManagerCoordinates(testData);
console.log('Result:', result);

if (result.coordinates) {
  console.log(`✅ SUCCESS: [${result.coordinates[0]}, ${result.coordinates[1]}]`);
  console.log(`📍 Google Maps: https://www.google.com/maps?q=${result.coordinates[0]},${result.coordinates[1]}`);
} else {
  console.log(`❌ FAILED: ${result.coordinateError}`);
}
