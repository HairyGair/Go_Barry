// backend/test-breakdown-complete.js
// Final comprehensive test of the breakdown logging system

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function runCompleteTest() {
    console.log('🧪 Running Complete Breakdown System Test...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    try {
        // Test 1: API Health
        totalTests++;
        console.log('1️⃣ Testing API Health...');
        try {
            await axios.get(`${BASE_URL}/api/health`);
            console.log('✅ API is healthy\n');
            passedTests++;
        } catch (error) {
            console.log('❌ API health check failed\n');
        }
        
        // Test 2: Log a new breakdown
        totalTests++;
        console.log('2️⃣ Testing breakdown logging...');
        try {
            const newBreakdown = {
                supervisorId: 'TEST_FINAL',
                vehicleReg: 'FINAL123',
                fleetNo: 'FL9999',
                breakdownType: 'Complete Test'
            };
            const logResponse = await axios.post(`${BASE_URL}/api/breakdowns/log`, newBreakdown);
            console.log('✅ Successfully logged test breakdown');
            console.log(`   ID: ${logResponse.data.data?.id || 'generated'}\n`);
            passedTests++;
        } catch (error) {
            console.log('❌ Failed to log breakdown:', error.response?.data?.error || error.message);
        }
        
        // Test 3: Fetch all breakdowns
        totalTests++;
        console.log('3️⃣ Testing fetch all breakdowns...');
        try {
            const allResponse = await axios.get(`${BASE_URL}/api/admin-breakdowns`);
            console.log(`✅ Fetched ${allResponse.data.logs.length} total breakdowns`);
            console.log(`   Total in DB: ${allResponse.data.pagination.total || 'count not available'}\n`);
            passedTests++;
        } catch (error) {
            console.log('❌ Failed to fetch breakdowns:', error.response?.data?.error || error.message);
        }
        
        // Test 4: Test filtering
        totalTests++;
        console.log('4️⃣ Testing filters (after fix)...');
        try {
            const filterResponse = await axios.get(`${BASE_URL}/api/admin-breakdowns?breakdownType=Steering`);
            console.log(`✅ Filter working! Found ${filterResponse.data.logs.length} Steering breakdowns\n`);
            passedTests++;
        } catch (error) {
            console.log('❌ Filter test failed:', error.response?.data?.error || error.message);
            console.log('   (Server may need restart for filter fix)\n');
        }
        
        // Test 5: Statistics
        totalTests++;
        console.log('5️⃣ Testing statistics endpoint...');
        try {
            const statsResponse = await axios.get(`${BASE_URL}/api/admin-breakdowns/stats`);
            const stats = statsResponse.data.stats;
            console.log('✅ Statistics retrieved successfully');
            console.log(`   Total breakdowns: ${stats.totalBreakdowns}`);
            console.log(`   Breakdown types: ${Object.keys(stats.byType).length}`);
            console.log(`   Active supervisors: ${Object.keys(stats.bySupervisor).length}`);
            console.log(`   Vehicles affected: ${Object.keys(stats.byVehicle).length}\n`);
            passedTests++;
        } catch (error) {
            console.log('❌ Statistics test failed:', error.response?.data?.error || error.message);
        }
        
        // Test 6: Error handling
        totalTests++;
        console.log('6️⃣ Testing error handling...');
        try {
            await axios.post(`${BASE_URL}/api/breakdowns/log`, { supervisorId: 'TEST' });
            console.log('❌ Error handling failed - should have rejected incomplete data\n');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Error handling working correctly\n');
                passedTests++;
            } else {
                console.log('❌ Unexpected error response\n');
            }
        }
        
        // Test 7: Recent breakdowns
        totalTests++;
        console.log('7️⃣ Testing recent breakdowns endpoint...');
        try {
            const recentResponse = await axios.get(`${BASE_URL}/api/breakdowns/recent?limit=3`);
            console.log(`✅ Fetched ${recentResponse.data.breakdowns.length} recent breakdowns`);
            if (recentResponse.data.breakdowns.length > 0) {
                const latest = recentResponse.data.breakdowns[0];
                console.log(`   Latest: ${latest.breakdown_type} on ${latest.vehicle_reg}\n`);
            }
            passedTests++;
        } catch (error) {
            console.log('❌ Recent breakdowns test failed:', error.response?.data?.error || error.message);
        }
        
    } catch (error) {
        console.error('💥 Unexpected error:', error.message);
    }
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! System is fully operational!');
    } else if (passedTests >= totalTests - 1) {
        console.log('✅ System is working well! Minor issues to address.');
    } else {
        console.log('⚠️  Some issues need attention. Check the failed tests above.');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Next steps based on results
    if (passedTests < totalTests) {
        console.log('\n📝 Troubleshooting tips:');
        console.log('- If filters failed: Restart server to load the fix');
        console.log('- If all requests failed: Check server is running');
        console.log('- If auth errors: Check .env file has Supabase keys');
        console.log('- If table errors: Create table using sql/breakdowns_schema.sql');
    }
}

runCompleteTest().catch(console.error);
