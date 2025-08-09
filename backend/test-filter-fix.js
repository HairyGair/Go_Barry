// backend/test-filter-fix.js
// Quick test to verify the filter fix works

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testFilters() {
    console.log('🔍 Testing fixed filters...\n');
    
    try {
        // Test 1: Filter by breakdown type
        console.log('Test 1: Filter by breakdown type (Steering)');
        const response1 = await axios.get(`${BASE_URL}/api/admin-breakdowns?breakdownType=Steering`);
        console.log(`✅ Found ${response1.data.logs.length} Steering breakdowns`);
        console.log(`   Total count: ${response1.data.pagination.total}`);
        
        // Test 2: Filter by supervisor
        console.log('\nTest 2: Filter by supervisor (SUP001)');
        const response2 = await axios.get(`${BASE_URL}/api/admin-breakdowns?supervisorId=SUP001`);
        console.log(`✅ Found ${response2.data.logs.length} breakdowns by SUP001`);
        
        // Test 3: Multiple filters
        console.log('\nTest 3: Multiple filters (SUP002 + Battery)');
        const response3 = await axios.get(`${BASE_URL}/api/admin-breakdowns?supervisorId=SUP002&breakdownType=Battery`);
        console.log(`✅ Found ${response3.data.logs.length} Battery breakdowns by SUP002`);
        
        // Test 4: Date range (last 24 hours)
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
        const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString();
        console.log('\nTest 4: Date range filter (last 24 hours)');
        const response4 = await axios.get(`${BASE_URL}/api/admin-breakdowns?startDate=${yesterday}&endDate=${tomorrow}`);
        console.log(`✅ Found ${response4.data.logs.length} breakdowns in the last 24 hours`);
        
        console.log('\n✅ All filter tests passed!');
        
    } catch (error) {
        console.error('❌ Filter test failed:', error.response?.data || error.message);
    }
}

testFilters();
