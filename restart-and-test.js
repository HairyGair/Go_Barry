// Quick fix script to restart and test the system
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function restartAndTest() {
  console.log('🔧 GO BARRY SYSTEM RESTART & TEST\n');
  
  try {
    // 1. Kill any existing backend processes
    console.log('1️⃣ Stopping any existing backend processes...');
    try {
      await execAsync('lsof -ti:3001 | xargs kill -9');
      console.log('   ✅ Stopped existing processes');
    } catch {
      console.log('   ℹ️ No existing processes found');
    }
    
    // 2. Start backend
    console.log('\n2️⃣ Starting backend...');
    exec('cd backend && npm start', (error, stdout, stderr) => {
      if (error) console.error('Backend error:', error);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    });
    
    // Wait for backend to start
    console.log('   ⏳ Waiting for backend to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. Test backend
    console.log('\n3️⃣ Testing backend...');
    const { default: fetch } = await import('node-fetch');
    
    try {
      const healthResponse = await fetch('http://localhost:3001/api/health');
      const healthData = await healthResponse.json();
      console.log('   Health check:', healthData.success ? '✅ Healthy' : '❌ Unhealthy');
      
      const alertsResponse = await fetch('http://localhost:3001/api/alerts-enhanced');
      const alertsData = await alertsResponse.json();
      console.log('   Alerts endpoint:', alertsData.success ? '✅ Working' : '❌ Failed');
      console.log('   Total alerts:', alertsData.alerts?.length || 0);
      
      if (alertsData.metadata?.sources) {
        console.log('   Sources:');
        Object.entries(alertsData.metadata.sources).forEach(([source, info]) => {
          console.log(`     - ${source}: ${info.success ? `✅ (${info.count} alerts)` : `❌ ${info.error}`}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Backend test failed:', error.message);
    }
    
    console.log('\n4️⃣ Next steps:');
    console.log('   - Check if TomTom API key is valid');
    console.log('   - Run: cd backend && node test-tomtom-direct.js');
    console.log('   - Check Convex dashboard for real-time data');
    console.log('   - Clear Metro cache: cd Go_BARRY && npx expo start -c');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

restartAndTest();
