// backend/tests/coordinateAccuracyTest.js
// Test suite for Phase 1 Coordinate Accuracy Improvements

import enhancedCoordinateService from '../services/enhancedCoordinateService.js';

/**
 * Test cases representing real-world scenarios from Newcastle/Gateshead/Durham area
 * These cases include common issues found in Street Manager data
 */
const TEST_CASES = [
  // Postcode extraction tests
  {
    id: 'postcode_test_1',
    location: 'Roadworks on High Street, Newcastle NE1 6PA',
    expectedRegion: 'Newcastle',
    expectedConfidence: 90,
    description: 'Should extract NE1 6PA postcode and geocode accurately'
  },
  {
    id: 'postcode_test_2', 
    location: 'Street works Durham DH1 3LE near railway station',
    expectedRegion: 'Durham',
    expectedConfidence: 90,
    description: 'Should extract DH1 3LE postcode'
  },
  {
    id: 'postcode_test_3',
    location: 'Emergency repair Gateshead SR2 9TH vicinity shopping center',
    expectedRegion: 'Sunderland', // SR postcode
    expectedConfidence: 90,
    description: 'Should extract SR2 9TH despite Gateshead mention'
  },

  // Road-based location tests
  {
    id: 'road_test_1',
    location: 'A1 Newcastle near Central Station',
    expectedRegion: 'Newcastle',
    expectedConfidence: 95,
    description: 'Should match A1 Newcastle from known locations'
  },
  {
    id: 'road_test_2',
    location: 'A19 Tyne Tunnel southbound carriageway closure',
    expectedRegion: 'Newcastle',
    expectedConfidence: 95,
    description: 'Should match A19 Tyne Tunnel precisely'
  },
  {
    id: 'road_test_3',
    location: 'A167 Durham City Centre roadworks',
    expectedRegion: 'Durham',
    expectedConfidence: 95,
    description: 'Should match A167 Durham from enhanced known locations'
  },

  // Street Manager geometry simulation tests
  {
    id: 'geometry_test_1',
    location: 'Metro Centre access road',
    sm_easting: 420500,
    sm_northing: 563200,
    expectedRegion: 'Gateshead',
    expectedConfidence: 95,
    description: 'Should use BNG coordinates for Metro Centre area'
  },
  {
    id: 'geometry_test_2',
    location: 'Quayside development works',
    raw_webhook_data: JSON.stringify({
      object_data: {
        works_location_coordinates: 'POINT(424500 564200)',
        street_name: 'Quayside',
        area_name: 'Newcastle'
      }
    }),
    expectedRegion: 'Newcastle',
    expectedConfidence: 90,
    description: 'Should parse geometry from webhook data'
  },

  // Challenging/edge cases
  {
    id: 'edge_case_1',
    location: 'Near Team Valley Industrial Estate',
    expectedRegion: 'Gateshead',
    expectedConfidence: 75,
    description: 'Should geocode vague location description'
  },
  {
    id: 'edge_case_2',
    location: 'Utility repair adjacent to Cobalt Business Park',
    expectedRegion: 'Newcastle',
    expectedConfidence: 75,
    description: 'Should handle business park references'
  },
  {
    id: 'edge_case_3',
    location: 'UNKNOWN LOCATION',
    expectedRegion: 'Newcastle', // Should default to Newcastle
    expectedConfidence: 10,
    description: 'Should handle unknown locations gracefully'
  },

  // Real problematic cases from logs
  {
    id: 'real_case_1',
    location: 'Outside number 45 Westgate Road Newcastle',
    expectedRegion: 'Newcastle',
    expectedConfidence: 85,
    description: 'Should geocode specific street address'
  },
  {
    id: 'real_case_2',
    location: 'Junction of A184 and A19 Tyne Tunnel approach',
    expectedRegion: 'Newcastle',
    expectedConfidence: 90,
    description: 'Should handle junction descriptions'
  }
];

/**
 * Validate coordinate is within expected region
 */
function validateRegion(coordinates, expectedRegion) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return false;
  }

  const [lat, lng] = coordinates;
  
  // Define rough bounding boxes for regions
  const regions = {
    'Newcastle': { 
      latMin: 54.95, latMax: 55.02, 
      lngMin: -1.70, lngMax: -1.55 
    },
    'Gateshead': { 
      latMin: 54.92, latMax: 54.98, 
      lngMin: -1.68, lngMax: -1.58 
    },
    'Durham': { 
      latMin: 54.76, latMax: 54.79, 
      lngMin: -1.58, lngMax: -1.56 
    },
    'Sunderland': { 
      latMin: 54.89, latMax: 54.93, 
      lngMin: -1.40, lngMax: -1.36 
    }
  };

  const region = regions[expectedRegion];
  if (!region) {
    console.warn(`⚠️ Unknown region: ${expectedRegion}`);
    return false;
  }

  return lat >= region.latMin && lat <= region.latMax && 
         lng >= region.lngMin && lng <= region.lngMax;
}

/**
 * Run coordinate accuracy test for a single test case
 */
async function runSingleTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.id}`);
  console.log(`📝 Description: ${testCase.description}`);
  console.log(`📍 Location: "${testCase.location}"`);

  const startTime = Date.now();
  
  try {
    // Create mock alert object
    const mockAlert = {
      id: testCase.id,
      location: testCase.location,
      sm_easting: testCase.sm_easting,
      sm_northing: testCase.sm_northing,
      raw_webhook_data: testCase.raw_webhook_data
    };

    // Run coordinate enhancement
    const enhancedAlert = await enhancedCoordinateService.enhanceAlertCoordinates(mockAlert);
    const processingTime = Date.now() - startTime;

    // Analyze results
    const results = {
      testId: testCase.id,
      success: false,
      coordinates: enhancedAlert.coordinates,
      coordinateSource: enhancedAlert.coordinateSource,
      coordinateConfidence: enhancedAlert.coordinateConfidence,
      processingTime,
      regionValid: false,
      confidenceValid: false,
      issues: []
    };

    // Check if coordinates exist
    if (!enhancedAlert.coordinates) {
      results.issues.push('No coordinates returned');
      console.log(`❌ FAIL - No coordinates returned`);
      return results;
    }

    // Validate region
    results.regionValid = validateRegion(enhancedAlert.coordinates, testCase.expectedRegion);
    if (!results.regionValid) {
      results.issues.push(`Coordinates not in expected region (${testCase.expectedRegion})`);
    }

    // Validate confidence
    results.confidenceValid = enhancedAlert.coordinateConfidence >= testCase.expectedConfidence;
    if (!results.confidenceValid) {
      results.issues.push(`Confidence too low (${enhancedAlert.coordinateConfidence}% < ${testCase.expectedConfidence}%)`);
    }

    // Overall success
    results.success = results.regionValid && results.confidenceValid;

    // Log results
    console.log(`📊 Results:`);
    console.log(`   Coordinates: [${enhancedAlert.coordinates[0].toFixed(4)}, ${enhancedAlert.coordinates[1].toFixed(4)}]`);
    console.log(`   Source: ${enhancedAlert.coordinateSource}`);
    console.log(`   Confidence: ${enhancedAlert.coordinateConfidence}%`);
    console.log(`   Processing Time: ${processingTime}ms`);
    console.log(`   Region Valid: ${results.regionValid ? '✅' : '❌'}`);
    console.log(`   Confidence Valid: ${results.confidenceValid ? '✅' : '❌'}`);
    
    if (results.success) {
      console.log(`✅ PASS - All criteria met`);
    } else {
      console.log(`❌ FAIL - Issues: ${results.issues.join(', ')}`);
    }

    return results;

  } catch (error) {
    console.log(`❌ ERROR - ${error.message}`);
    return {
      testId: testCase.id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
      issues: [`Exception: ${error.message}`]
    };
  }
}

/**
 * Run full coordinate accuracy test suite
 */
async function runCoordinateAccuracyTests() {
  console.log('🚀 Starting Phase 1 Coordinate Accuracy Tests');
  console.log(`📊 Running ${TEST_CASES.length} test cases...\n`);

  const startTime = Date.now();
  const results = [];

  // Run all tests
  for (const testCase of TEST_CASES) {
    const result = await runSingleTest(testCase);
    results.push(result);
    
    // Small delay to prevent overwhelming services
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Analyze overall results
  const totalTime = Date.now() - startTime;
  const passCount = results.filter(r => r.success).length;
  const failCount = results.length - passCount;
  const averageTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 COORDINATE ACCURACY TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passCount} (${(passCount/results.length*100).toFixed(1)}%)`);
  console.log(`Failed: ${failCount} (${(failCount/results.length*100).toFixed(1)}%)`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time per Test: ${averageTime.toFixed(0)}ms`);
  
  // Service statistics
  const stats = enhancedCoordinateService.getStats();
  console.log('\n📈 SERVICE STATISTICS:');
  console.log(`Request Count: ${stats.requestCount}`);
  console.log(`Success Rate: ${stats.successRate}`);
  console.log(`Cache Hit Rate: ${stats.cacheHitRate}`);
  console.log(`Cache Size: ${stats.cacheSize} entries`);

  // Breakdown by source
  console.log('\n🔍 RESULTS BY COORDINATE SOURCE:');
  const sourceBreakdown = {};
  results.forEach(r => {
    if (r.coordinateSource) {
      sourceBreakdown[r.coordinateSource] = (sourceBreakdown[r.coordinateSource] || 0) + 1;
    }
  });
  
  Object.entries(sourceBreakdown).forEach(([source, count]) => {
    console.log(`   ${source}: ${count} (${(count/results.length*100).toFixed(1)}%)`);
  });

  // Failed tests details
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(r => {
      console.log(`   ${r.testId}: ${r.issues ? r.issues.join(', ') : r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  return {
    totalTests: results.length,
    passCount,
    failCount,
    passRate: passCount / results.length * 100,
    averageTime,
    totalTime,
    serviceStats: stats,
    sourceBreakdown,
    failedTests: failedTests.map(r => ({ 
      id: r.testId, 
      issues: r.issues || [r.error] 
    }))
  };
}

/**
 * Export test functions for use in other contexts
 */
export {
  runCoordinateAccuracyTests,
  runSingleTest,
  TEST_CASES
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCoordinateAccuracyTests()
    .then(results => {
      const success = results.passRate >= 80; // 80% pass rate target
      console.log(`\n🎯 Target: 80% pass rate`);
      console.log(`📊 Achieved: ${results.passRate.toFixed(1)}% - ${success ? '✅ PASS' : '❌ FAIL'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}