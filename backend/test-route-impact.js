#!/usr/bin/env node
import { calculateAffectedRoutes, formatAffectedRoutesSummary } from './utils/routeImpactCalculator.js';

// Test roadwork data
const testRoadwork = {
  id: 'test-1',
  sm_street_name: 'Clayton Street',
  sm_location_description: 'Clayton Street, Newcastle upon Tyne',
  // Newcastle city center coordinates
  coordinates: [54.9783, -1.6178],
  coordinateSource: 'test',
  sm_works_description: 'Test roadwork for route impact calculation'
};

console.log('🧪 Testing Route Impact Calculator...\n');
console.log('📍 Test Location:', testRoadwork.sm_street_name);
console.log('📍 Coordinates:', testRoadwork.coordinates);
console.log('\n⏳ Calculating affected routes...\n');

try {
  const affectedRoutes = await calculateAffectedRoutes(testRoadwork);
  const summary = formatAffectedRoutesSummary(affectedRoutes);

  console.log('✅ Calculation complete!\n');
  console.log('📊 Summary:', summary || 'No routes affected');
  console.log(`📈 Total routes affected: ${affectedRoutes.length}`);
  
  if (affectedRoutes.length > 0) {
    console.log('\n🚌 Detailed Results:');
    affectedRoutes.forEach(route => {
      console.log(`  - Route ${route.routeNumber} (${route.direction})`);
      console.log(`    → ${route.headsign}`);
      console.log(`    Impact: ${route.impact.severity} (${route.impact.intersectionLength}m affected)`);
    });
  }

  // Test with LINESTRING data
  console.log('\n\n🧪 Testing with LINESTRING data...\n');
  
  const testRoadworkWithLinestring = {
    ...testRoadwork,
    works_location_coordinates: 'LINESTRING(-1.6178 54.9783, -1.6170 54.9785, -1.6165 54.9787)'
  };
  
  const affectedRoutesLinestring = await calculateAffectedRoutes(testRoadworkWithLinestring);
  const summaryLinestring = formatAffectedRoutesSummary(affectedRoutesLinestring);
  
  console.log('📊 Summary (LINESTRING):', summaryLinestring || 'No routes affected');
  console.log(`📈 Total routes affected: ${affectedRoutesLinestring.length}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n✅ Test complete!');
