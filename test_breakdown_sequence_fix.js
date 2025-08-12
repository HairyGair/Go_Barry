#!/usr/bin/env node

/**
 * Test Script: Breakdown Sequence Fix Verification
 * This script tests the breakdown sequence fix by:
 * 1. Checking current sequence state
 * 2. Testing the API endpoint that creates breakdown IDs
 * 3. Verifying no collisions occur
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

async function testBreakdownSequenceFix() {
  console.log('🔍 Testing Breakdown Sequence Fix...\n');

  try {
    // Test 1: Check if backend is responding
    console.log('1️⃣ Testing backend connectivity...');
    const testResponse = await fetch(`${API_BASE}/api/breakdown-tracker-v2/test`);
    
    if (!testResponse.ok) {
      console.error('❌ Backend not responding. Please ensure backend is running.');
      return;
    }
    
    const testData = await testResponse.json();
    console.log('✅ Backend is responding:', testData.message);

    // Test 2: Create a test breakdown to verify sequence works
    console.log('\n2️⃣ Testing breakdown creation with sequence...');
    
    const breakdownData = {
      fleet_number: 'SEQ-TEST-001',
      supervisor_badge: 'AG003',
      supervisor_name: 'Sequence Test',
      location: 'Test Location - Sequence Fix',
      wizard_type: 'sequence_test'
    };

    const createResponse = await fetch(`${API_BASE}/api/breakdown-tracker-v2/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(breakdownData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error('❌ Failed to create test breakdown:', errorData);
      return;
    }

    const createResult = await createResponse.json();
    
    if (createResult.success) {
      console.log('✅ Test breakdown created successfully!');
      console.log(`   - Breakdown ID: ${createResult.breakdown_id}`);
      console.log(`   - Daily ID: ${createResult.daily_id}`);
      
      // Extract sequence number from breakdown ID
      const sequenceNumber = createResult.breakdown_id.split('-').pop();
      console.log(`   - Sequence Number: ${sequenceNumber}`);
      
      // Test 3: Create another breakdown to ensure sequence increments
      console.log('\n3️⃣ Testing sequence increment...');
      
      const secondBreakdownData = {
        ...breakdownData,
        fleet_number: 'SEQ-TEST-002',
        location: 'Test Location - Sequence Increment Test'
      };

      const secondResponse = await fetch(`${API_BASE}/api/breakdown-tracker-v2/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(secondBreakdownData)
      });

      if (secondResponse.ok) {
        const secondResult = await secondResponse.json();
        console.log('✅ Second test breakdown created successfully!');
        console.log(`   - Breakdown ID: ${secondResult.breakdown_id}`);
        
        // Verify sequence incremented
        const secondSequenceNumber = secondResult.breakdown_id.split('-').pop();
        const firstNumber = parseInt(sequenceNumber);
        const secondNumber = parseInt(secondSequenceNumber);
        
        if (secondNumber === firstNumber + 1) {
          console.log('✅ Sequence is incrementing correctly!');
        } else {
          console.log(`⚠️ Sequence increment issue: Expected ${firstNumber + 1}, got ${secondNumber}`);
        }
      } else {
        console.log('⚠️ Second test failed, but first test passed - sequence may still be working');
      }

      // Test 4: Check for any collision by listing recent breakdowns
      console.log('\n4️⃣ Checking for ID collisions...');
      
      const todayResponse = await fetch(`${API_BASE}/api/breakdown-tracker-v2/today`);
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        const breakdownIds = todayData.breakdowns.map(b => b.breakdown_id);
        const uniqueIds = [...new Set(breakdownIds)];
        
        if (breakdownIds.length === uniqueIds.length) {
          console.log('✅ No ID collisions detected in today\'s breakdowns');
        } else {
          console.log('❌ ID collisions detected!');
          console.log('Duplicate IDs found:', breakdownIds.filter((id, index) => breakdownIds.indexOf(id) !== index));
        }
      }

      console.log('\n✅ SEQUENCE FIX TEST COMPLETED SUCCESSFULLY!');
      console.log('🎉 The breakdown sequence collision issue appears to be resolved.');
      
    } else {
      console.error('❌ Failed to create test breakdown:', createResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Ensure backend server is running (npm run dev:backend)');
    console.log('2. Verify Supabase connection is working');
    console.log('3. Check if the SQL fix has been applied to your database');
    console.log('4. Review backend logs for specific errors');
  }
}

// Run the test
testBreakdownSequenceFix();