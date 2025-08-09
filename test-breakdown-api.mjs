// Quick test script to check breakdown logging (ES Module version)
import fetch from 'node-fetch';

async function testBreakdownLogging() {
    console.log('🧪 Testing Breakdown Logging System...\n');
    
    // Test logging a breakdown
    console.log('1️⃣ Testing breakdown logging...');
    try {
        const logResponse = await fetch('http://localhost:8080/api/breakdowns/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                supervisorId: 'TEST001',
                vehicleReg: 'TEST123',
                fleetNo: '9999',
                breakdownType: 'API Test',
                timestamp: new Date().toISOString()
            })
        });
        
        const logResult = await logResponse.json();
        console.log('✅ Logging result:', logResult);
    } catch (error) {
        console.error('❌ Logging failed:', error.message);
    }
    
    // Test fetching breakdowns
    console.log('\n2️⃣ Testing breakdown retrieval...');
    try {
        const fetchResponse = await fetch('http://localhost:8080/api/admin-breakdowns?limit=5');
        const fetchResult = await fetchResponse.json();
        
        if (fetchResult.success) {
            console.log(`✅ Found ${fetchResult.logs.length} breakdowns`);
            console.log('📊 Latest breakdowns:');
            fetchResult.logs.forEach(log => {
                console.log(`   - ${log.breakdown_type} | ${log.vehicle_reg} | ${new Date(log.timestamp).toLocaleString()}`);
            });
        } else {
            console.error('❌ Fetch failed:', fetchResult.error);
        }
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        console.log('\n⚠️  Is your backend server running?');
        console.log('   Start it with: cd backend && npm start');
    }
    
    // Test statistics
    console.log('\n3️⃣ Testing breakdown statistics...');
    try {
        const statsResponse = await fetch('http://localhost:8080/api/admin-breakdowns/stats');
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
            console.log('✅ Statistics:');
            console.log(`   Total breakdowns: ${statsResult.stats.totalBreakdowns}`);
            console.log('   By type:', statsResult.stats.byType);
        }
    } catch (error) {
        console.error('❌ Stats error:', error.message);
    }
}

// Run the test
testBreakdownLogging();
