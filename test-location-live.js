import { spawn } from 'child_process';

console.log('🚀 Testing location accuracy improvements...\n');

// Start the backend temporarily to test
const backend = spawn('node', ['backend/index.js'], {
  env: { ...process.env, NODE_ENV: 'production' }
});

// Wait for backend to start
setTimeout(async () => {
  try {
    const response = await fetch('http://localhost:3001/api/alerts-enhanced');
    const data = await response.json();
    
    console.log(`📊 Total alerts: ${data.data?.length || 0}`);
    
    // Check first few TomTom alerts for location accuracy
    const tomtomAlerts = data.data?.filter(alert => alert.source === 'tomtom').slice(0, 5) || [];
    
    console.log('\n🗺️ Checking TomTom location accuracy:\n');
    
    tomtomAlerts.forEach(alert => {
      console.log(`📍 ${alert.location}`);
      console.log(`   Coordinates: ${alert.coordinates?.[0]}, ${alert.coordinates?.[1]}`);
      console.log(`   Routes: ${alert.affectsRoutes?.join(', ') || 'none'}\n`);
    });
    
    // Test specific coordinates
    console.log('🧪 Testing specific coordinate mapping:\n');
    
    // Import our location function
    const { getQuickLocation } = await import('./backend/utils/productionLocation.js');
    
    // Westerhope test
    const westerhope = getQuickLocation(54.993, -1.673);
    console.log(`Westerhope test (54.993, -1.673): ${westerhope}`);
    console.log(`Expected: Westerhope, Newcastle`);
    console.log(`Result: ${westerhope === 'Westerhope, Newcastle' ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Newcastle City Centre test
    const city = getQuickLocation(54.973, -1.610);
    console.log(`City Centre test (54.973, -1.610): ${city}`);
    console.log(`Expected: Newcastle City Centre`);
    console.log(`Result: ${city === 'Newcastle City Centre' ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Gosforth test
    const gosforth = getQuickLocation(54.998, -1.610);
    console.log(`Gosforth test (54.998, -1.610): ${gosforth}`);
    console.log(`Expected: Gosforth, Newcastle`);
    console.log(`Result: ${gosforth === 'Gosforth, Newcastle' ? '✅ PASS' : '❌ FAIL'}\n`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    backend.kill();
    process.exit(0);
  }
}, 5000);

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});
