// Test Convex sync from backend
import { convexSync } from './services/convexSync.js';
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';

async function testConvexSync() {
  console.log('🔍 Testing Convex sync...\n');
  
  // Test connection first
  console.log('1️⃣ Testing Convex connection...');
  const connectionTest = await convexSync.testConnection();
  console.log('Connection result:', connectionTest);
  
  if (!connectionTest.success) {
    console.error('❌ Cannot connect to Convex. Check CONVEX_URL environment variable.');
    return;
  }
  
  // Fetch some test alerts
  console.log('\n2️⃣ Fetching test alerts from TomTom...');
  const tomtomResult = await fetchTomTomTrafficWithStreetNames();
  
  if (!tomtomResult.success || !tomtomResult.data || tomtomResult.data.length === 0) {
    console.error('❌ No alerts from TomTom to sync');
    return;
  }
  
  console.log(`✅ Got ${tomtomResult.data.length} alerts from TomTom`);
  console.log('Sample alert:', JSON.stringify(tomtomResult.data[0], null, 2));
  
  // Try to sync to Convex
  console.log('\n3️⃣ Syncing alerts to Convex...');
  const syncResult = await convexSync.syncAlerts(tomtomResult.data);
  console.log('Sync result:', syncResult);
  
  if (syncResult.success) {
    console.log(`\n✅ Successfully synced ${syncResult.count} alerts to Convex!`);
  } else {
    console.log('\n❌ Failed to sync alerts:', syncResult.error);
  }
}

testConvexSync().catch(console.error);
