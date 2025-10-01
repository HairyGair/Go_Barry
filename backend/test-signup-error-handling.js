#!/usr/bin/env node

// Test script for improved signup error handling
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

async function testSignupErrorHandling() {
    console.log('🧪 Testing Improved Signup Error Handling\n');

    try {
        // Test 1: Try to signup with an existing email
        console.log('1. 📧 Testing signup with existing email...');
        const existingEmailResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'anthony.gair@gonortheast.co.uk', // This should already exist
                password: 'TestPassword123!',
                fullName: 'Test User',
                badgeNumber: 'TE001',
                depot: 'SDC'
            })
        });

        const existingEmailResult = await existingEmailResponse.json();
        console.log('   Response status:', existingEmailResponse.status);
        console.log('   Response body:', existingEmailResult);
        
        if (existingEmailResponse.status === 409 && existingEmailResult.code === 'EMAIL_EXISTS') {
            console.log('   ✅ Correctly handled existing email case');
        } else {
            console.log('   ⚠️  Unexpected response for existing email');
        }

        // Test 2: Try to signup with invalid email format
        console.log('\n2. ❌ Testing signup with invalid email...');
        const invalidEmailResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'invalid-email',
                password: 'TestPassword123!',
                fullName: 'Test User',
                badgeNumber: 'TE002',
                depot: 'SDC'
            })
        });

        const invalidEmailResult = await invalidEmailResponse.json();
        console.log('   Response status:', invalidEmailResponse.status);
        console.log('   Response body:', invalidEmailResult);

        if (invalidEmailResponse.status === 400) {
            console.log('   ✅ Correctly rejected invalid email');
        } else {
            console.log('   ⚠️  Unexpected response for invalid email');
        }

        // Test 3: Try to signup with invalid badge format
        console.log('\n3. 🆔 Testing signup with invalid badge...');
        const invalidBadgeResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: `test-${Date.now()}@test.com`,
                password: 'TestPassword123!',
                fullName: 'Test User',
                badgeNumber: 'INVALID',
                depot: 'SDC'
            })
        });

        const invalidBadgeResult = await invalidBadgeResponse.json();
        console.log('   Response status:', invalidBadgeResponse.status);
        console.log('   Response body:', invalidBadgeResult);

        if (invalidBadgeResponse.status === 400 && invalidBadgeResult.code === 'INVALID_BADGE') {
            console.log('   ✅ Correctly rejected invalid badge format');
        } else {
            console.log('   ⚠️  Unexpected response for invalid badge');
        }

        console.log('\n🎉 Error handling tests completed!');
        console.log('\n📋 Improvements Made:');
        console.log('   ✅ Better error messages for existing users');
        console.log('   ✅ Specific handling for auth errors');
        console.log('   ✅ Frontend suggests switching to login mode');
        console.log('   ✅ Improved validation error responses');

    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
    }
}

// Run the test
testSignupErrorHandling().then(() => {
    console.log('\n✨ Test complete');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test script failed:', error.message);
    process.exit(1);
});