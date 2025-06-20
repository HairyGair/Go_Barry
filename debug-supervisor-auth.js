// debug-supervisor-auth.js
// Simple test to debug supervisor authentication

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'https://go-barry.onrender.com';

async function testAuth() {
    console.log('🔍 Testing supervisor authentication...\n');
    console.log('🌐 API URL:', API_URL);
    
    // Test data
    const testData = {
        supervisorId: 'supervisor003',
        badge: 'AG003'
    };
    
    console.log('📤 Sending:', testData);
    
    try {
        // Make the request
        const response = await fetch(`${API_URL}/api/supervisor/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get raw text first
        const responseText = await response.text();
        console.log('📡 Raw response:', responseText);
        
        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e.message);
            return;
        }
        
        console.log('\n✅ Parsed response:');
        console.log('- Success:', data.success);
        console.log('- Session ID:', data.sessionId);
        console.log('- Supervisor:', data.supervisor);
        
        if (data.supervisor) {
            console.log('\n👤 Supervisor details:');
            console.log('- ID:', data.supervisor.id);
            console.log('- Name:', data.supervisor.name);
            console.log('- Badge:', data.supervisor.badge);
            console.log('- Role:', data.supervisor.role);
            console.log('- Permissions:', data.supervisor.permissions);
        }
        
        // Now check active supervisors
        console.log('\n\n🔍 Checking active supervisors...');
        const activeResponse = await fetch(`${API_URL}/api/supervisor/active`);
        const activeData = await activeResponse.json();
        
        console.log('📡 Active supervisors response:');
        console.log('- Count:', activeData.count);
        console.log('- Supervisors:', activeData.activeSupervisors);
        
        if (activeData.debug) {
            console.log('\n🐛 Debug info:');
            console.log('- Total sessions in memory:', activeData.debug.totalSessionsInMemory);
            console.log('- Session keys:', activeData.debug.sessionKeys);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
console.log('🚀 Supervisor Authentication Debug');
console.log('==================================\n');

testAuth().then(() => {
    console.log('\n✅ Test completed');
}).catch(error => {
    console.error('\n❌ Test failed:', error);
});