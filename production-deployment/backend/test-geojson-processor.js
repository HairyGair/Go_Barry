// backend/test-geojson-processor.js
import './tomtom-fixed-implementation.js';
import { fetchTomTomTrafficGeoJSON } from './tomtom-fixed-implementation.js';

const result = await fetchTomTomTrafficGeoJSON();
console.log(`🎯 Result:`, result);

if (result.success) {
  console.log(`🚦 Found ${result.data.length} processed alerts`);
  if (result.data.length > 0) {
    console.log(`📍 Sample:`, result.data[0]);
  }
}