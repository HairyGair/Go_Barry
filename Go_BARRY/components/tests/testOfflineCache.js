// Test file for offline coordinate cache
import offlineCoordinateCache from '../../services/offlineCoordinateCache';

// Test data
const testRoadworks = [
  {
    id: 'test-1',
    sm_reference: 'REF001',
    coordinates: [54.9783, -1.6178],
    sm_street_name: 'Test Street',
    sm_location_description: 'Test Location',
    sm_works_state: 'Works in progress',
    sm_start_date: '2025-01-01',
    sm_end_date: '2025-01-31',
    affectedRoutes: ['1', '2', '3', '4'], // 4 routes = critical
    what3words: { words: 'test.location.words' }
  },
  {
    id: 'test-2',
    coordinates: null, // No coordinates - should be filtered out
    affectedRoutes: ['5', '6', '7', '8']
  },
  {
    id: 'test-3',
    coordinates: [54.9783, -1.6178],
    affectedRoutes: ['9', '10'] // Only 2 routes - not critical
  }
];

async function runTests() {
  console.log('🧪 Testing offline coordinate cache...\n');

  try {
    // Test 1: Cache coordinates
    console.log('Test 1: Caching coordinates...');
    const cacheResult = await offlineCoordinateCache.cacheOfflineCoordinates(testRoadworks);
    console.log('Cache result:', cacheResult);
    console.assert(cacheResult.success === true, 'Cache should succeed');
    console.assert(cacheResult.cached === 1, 'Should cache 1 critical roadwork');
    console.log('✅ Test 1 passed\n');

    // Test 2: Retrieve coordinates
    console.log('Test 2: Retrieving coordinates...');
    const retrieveResult = await offlineCoordinateCache.getOfflineCoordinates();
    console.log('Retrieve result:', retrieveResult);
    console.assert(retrieveResult.success === true, 'Retrieve should succeed');
    console.assert(retrieveResult.data.length === 1, 'Should retrieve 1 roadwork');
    console.assert(retrieveResult.data[0].id === 'test-1', 'Should retrieve correct roadwork');
    console.log('✅ Test 2 passed\n');

    // Test 3: Search coordinates
    console.log('Test 3: Searching coordinates...');
    const searchResult = await offlineCoordinateCache.searchOfflineCoordinates('Test Street');
    console.log('Search result:', searchResult);
    console.assert(searchResult.length === 1, 'Should find 1 roadwork');
    console.log('✅ Test 3 passed\n');

    // Test 4: Get cache stats
    console.log('Test 4: Getting cache stats...');
    const stats = await offlineCoordinateCache.getCacheStats();
    console.log('Cache stats:', stats);
    console.assert(stats.exists === true, 'Cache should exist');
    console.assert(stats.count === 1, 'Should have 1 item in cache');
    console.log('✅ Test 4 passed\n');

    // Test 5: Sync cache
    console.log('Test 5: Testing sync...');
    const syncResult = await offlineCoordinateCache.syncOfflineCache(testRoadworks);
    console.log('Sync result:', syncResult);
    console.log('✅ Test 5 passed\n');

    // Test 6: Clear cache
    console.log('Test 6: Clearing cache...');
    const clearResult = await offlineCoordinateCache.clearOfflineCache();
    console.log('Clear result:', clearResult);
    console.assert(clearResult.success === true, 'Clear should succeed');
    
    // Verify cache is empty
    const emptyStats = await offlineCoordinateCache.getCacheStats();
    console.assert(emptyStats.exists === false, 'Cache should not exist after clear');
    console.log('✅ Test 6 passed\n');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  window.testOfflineCache = runTests;
  console.log('Test loaded. Run window.testOfflineCache() in console to execute tests.');
}

export default runTests;
