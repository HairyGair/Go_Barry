// backend/test-server-status.js
// Quick script to check if the server is running and routes are available

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function checkServer() {
    console.log('🔍 Checking server status...\n');
    
    // Test 1: Check if server is running
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Server is running');
        console.log(`   Health status: ${response.data.status || 'OK'}`);
    } catch (error) {
        console.error('❌ Server is not running or not accessible');
        console.error(`   Error: ${error.message}`);
        console.log('\n💡 Start the server with: npm start');
        return false;
    }
    
    // Test 2: Check if test route works
    try {
        const response = await axios.get(`${BASE_URL}/api/test-route-fix`);
        console.log('✅ Route registration system is working');
        console.log(`   Routes registered: ${JSON.stringify(response.data.routes_registered)}`);
    } catch (error) {
        console.warn('⚠️  Test route not found - routes may need reloading');
    }
    
    // Test 3: Check breakdown routes
    console.log('\n🔍 Checking breakdown routes...');
    
    const routesToCheck = [
        { method: 'GET', path: '/api/breakdowns/recent', name: 'Breakdown Recent' },
        { method: 'GET', path: '/api/admin-breakdowns', name: 'Admin Breakdowns' },
        { method: 'GET', path: '/api/admin-breakdowns/stats', name: 'Breakdown Stats' }
    ];
    
    for (const route of routesToCheck) {
        try {
            await axios({
                method: route.method,
                url: `${BASE_URL}${route.path}`
            });
            console.log(`✅ ${route.name} route is accessible`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.error(`❌ ${route.name} route NOT FOUND (404)`);
            } else if (error.response?.status >= 400 && error.response?.status < 500) {
                console.log(`⚠️  ${route.name} route exists but returned error ${error.response.status}`);
            } else {
                console.error(`❌ ${route.name} route error: ${error.message}`);
            }
        }
    }
    
    return true;
}

checkServer().then(running => {
    if (!running) {
        console.log('\n📝 To start the server and test the breakdown logging system:');
        console.log('1. npm start (in another terminal)');
        console.log('2. Wait for server to fully start');
        console.log('3. Run: node test-breakdown-logging.js');
    } else {
        console.log('\n📝 If routes are not found:');
        console.log('1. Restart the server (Ctrl+C then npm start)');
        console.log('2. Make sure you have run: npm install');
        console.log('3. Check for any startup errors in the server logs');
    }
});
