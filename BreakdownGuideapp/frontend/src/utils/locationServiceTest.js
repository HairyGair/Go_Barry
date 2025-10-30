/**
 * Location Service Test - Quick validation of location conversion functionality
 * Test known landmarks and coordinates within Go North East operational area
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import locationService from './locationService.js';

const testCoordinates = [
  // Test landmarks - should return landmark names
  { name: 'Gateshead Interchange', lat: 54.9611, lng: -1.5797, expected: 'Gateshead Interchange' },
  { name: 'Eldon Square', lat: 54.9764, lng: -1.6144, expected: 'Eldon Square Bus Station' },
  { name: 'Central Station', lat: 54.9684, lng: -1.6176, expected: 'Central Station' },
  { name: 'MetroCentre', lat: 54.9586, lng: -1.6659, expected: 'MetroCentre' },
  { name: 'RVI Hospital', lat: 54.9843, lng: -1.6226, expected: 'Royal Victoria Infirmary (RVI)' },

  // Test near landmarks - should return "near" descriptions
  { name: 'Near Tyne Bridge', lat: 54.9695, lng: -1.6025, expected: 'Tyne Bridge' },
  { name: 'Near Team Valley', lat: 54.9230, lng: -1.5740, expected: 'Team Valley Retail World' },

  // Test general areas - should return area names with coordinates
  { name: 'Newcastle City Centre', lat: 54.9750, lng: -1.6130, expected: 'Newcastle upon Tyne' },
  { name: 'Sunderland area', lat: 54.9000, lng: -1.3850, expected: 'Sunderland' },
  { name: 'Durham area', lat: 54.7800, lng: -1.5700, expected: 'Durham' },

  // Test outside operational area - should return fallback
  { name: 'London (outside area)', lat: 51.5074, lng: -0.1278, expected: 'Outside operational area' },

  // Test edge cases
  { name: 'Invalid coordinates', lat: null, lng: null, expected: 'Unknown' }
];

/**
 * Run all location service tests
 * @returns {Promise<void>}
 */
const runLocationServiceTests = async () => {
  console.log('🧪 Starting Location Service Tests...\n');

  let passed = 0;
  let failed = 0;

  for (const test of testCoordinates) {
    try {
      console.log(`Testing: ${test.name} (${test.lat}, ${test.lng})`);

      const result = await locationService.getLocationName(test.lat, test.lng);
      const isMatch = typeof test.expected === 'string' && result.includes(test.expected);

      if (isMatch) {
        console.log(`✅ PASS: "${result}"`);
        passed++;
      } else {
        console.log(`❌ FAIL: Expected "${test.expected}" but got "${result}"`);
        failed++;
      }

    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
      failed++;
    }

    console.log(''); // Empty line for readability
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
};

/**
 * Test the detailed location functionality
 */
const testDetailedLocation = async () => {
  console.log('\n🔍 Testing Detailed Location Functionality...\n');

  const testLat = 54.9611; // Gateshead Interchange
  const testLng = -1.5797;

  try {
    const detailed = await locationService.getDetailedLocation(testLat, testLng, '56');

    console.log('Detailed Location Result:');
    console.log('Display Name:', detailed.displayName);
    console.log('General Area:', detailed.generalArea);
    console.log('Coordinates String:', detailed.coordinatesString);
    console.log('Closest Landmark:', detailed.closestLandmark);
    console.log('Route Context:', detailed.routeContext);

    // Test different formats
    console.log('\nFormat Tests:');
    console.log('Short:', await locationService.formatLocation(testLat, testLng, 'short'));
    console.log('Detailed:', await locationService.formatLocation(testLat, testLng, 'detailed'));
    console.log('Emergency:', await locationService.formatLocation(testLat, testLng, 'emergency'));
    console.log('Coordinates:', await locationService.formatLocation(testLat, testLng, 'coordinates'));

  } catch (error) {
    console.log('❌ Error testing detailed location:', error.message);
  }
};

/**
 * Test nearby landmarks functionality
 */
const testNearbyLandmarks = async () => {
  console.log('\n🏢 Testing Nearby Landmarks Functionality...\n');

  const testLat = 54.9750; // Newcastle city centre
  const testLng = -1.6130;

  try {
    const nearby = locationService.getNearbyLandmarks(testLat, testLng, 2); // 2km radius

    console.log(`Found ${nearby.length} landmarks within 2km:`);
    nearby.slice(0, 5).forEach((landmark, index) => {
      console.log(`${index + 1}. ${landmark.name} (${landmark.distance.toFixed(2)}km) - ${landmark.type}`);
    });

  } catch (error) {
    console.log('❌ Error testing nearby landmarks:', error.message);
  }
};

/**
 * Export test functions for use in console or other testing
 */
export {
  runLocationServiceTests,
  testDetailedLocation,
  testNearbyLandmarks,
  testCoordinates
};

// Auto-run tests if this file is run directly (for development)
if (typeof window !== 'undefined') {
  // Make tests available globally for browser console testing
  window.locationServiceTests = {
    runAll: runLocationServiceTests,
    detailed: testDetailedLocation,
    nearby: testNearbyLandmarks
  };

  console.log('Location Service Tests loaded! Run window.locationServiceTests.runAll() to test.');
}