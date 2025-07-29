// backend/test-coordinates.js
// Test coordinate conversion with real Street Manager data

import { processStreetManagerCoordinates, osgb36ToWGS84, parseWKTLinestring, getLinestringCentroid } from './utils/coordinateConverter.js';

// Test with the actual data from your Supabase
const testRoadwork = {
  sm_reference: "HY001278STATIONRDWALLSEN",
  sm_street_name: "STATION ROAD",
  raw_webhook_data: {
    object_data: {
      works_location_coordinates: "LINESTRING(428971.99 569001.32,428938.91 568752.61,428954.79 568589.89,428981.25 568590.12)"
    }
  }
};

console.log('🧪 Testing coordinate conversion with real Street Manager data...\n');

// Test individual functions
console.log('1. Testing WKT LINESTRING parsing:');
const coords = parseWKTLinestring(testRoadwork.raw_webhook_data.object_data.works_location_coordinates);
console.log('   Parsed coordinates:', coords);

console.log('\n2. Testing centroid calculation:');
const centroid = getLinestringCentroid(coords);
console.log('   Centroid:', centroid);

console.log('\n3. Testing OSGB36 to WGS84 conversion:');
if (centroid) {
  const [easting, northing] = centroid;
  const wgs84 = osgb36ToWGS84(easting, northing);
  console.log(`   OSGB36 [${easting}, ${northing}] → WGS84 [${wgs84?.[0]?.toFixed(6)}, ${wgs84?.[1]?.toFixed(6)}]`);
  
  // Validate result
  if (wgs84) {
    const [lat, lng] = wgs84;
    console.log(`   Validation: Lat ${lat.toFixed(6)} (should be ~55.0), Lng ${lng.toFixed(6)} (should be ~-1.5)`);
    
    // This should be near Wallsend, North Tyneside
    if (lat > 54.9 && lat < 55.1 && lng > -1.6 && lng < -1.4) {
      console.log('   ✅ Coordinates look correct for Wallsend area!');
    } else {
      console.log('   ❌ Coordinates seem wrong for Wallsend area');
    }
  }
}

console.log('\n4. Testing complete processing function:');
const processed = processStreetManagerCoordinates(testRoadwork);
console.log('   Processed roadwork:', {
  reference: processed.sm_reference,
  coordinates: processed.coordinates,
  coordinateSource: processed.coordinateSource,
  coordinateAccuracy: processed.coordinateAccuracy,
  originalCoordinates: processed.originalCoordinates,
  coordinatePoints: processed.coordinatePoints,
  error: processed.coordinateError
});

console.log('\n🗺️ Google Maps test link:');
if (processed.coordinates) {
  const [lat, lng] = processed.coordinates;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=18`;
  console.log(`   ${mapsUrl}`);
  console.log('   ^ This should show Station Road, Wallsend if conversion is correct');
}

console.log('\n✅ Coordinate conversion test complete!');
