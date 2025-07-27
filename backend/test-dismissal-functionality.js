#!/usr/bin/env node
// Test script for the enhanced dismissRoadwork functionality
// Tests both manual_incidents and streetworks dismissal logging

import { UnifiedRoadworksManager } from './services/unifiedRoadworksManager.js';

async function testDismissalFunctionality() {
  console.log('🧪 Testing dismissal functionality...\n');
  
  const manager = new UnifiedRoadworksManager();
  
  // Test data
  const testCases = [
    {
      roadworkId: 'test_manual_001',
      reason: 'Test dismissal for manual incident',
      supervisorName: 'Test Supervisor',
      supervisorBadge: 'TEST001',
      supervisorId: 'test-supervisor-id-001'
    },
    {
      roadworkId: 'test_street_001', 
      reason: 'Test dismissal for streetwork',
      supervisorName: 'Another Test Supervisor',
      supervisorBadge: 'TEST002',
      supervisorId: 'test-supervisor-id-002'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing dismissal for roadwork: ${testCase.roadworkId}`);
    console.log(`   Supervisor: ${testCase.supervisorName} (${testCase.supervisorBadge})`);
    console.log(`   Reason: ${testCase.reason}`);
    
    try {
      const result = await manager.dismissRoadwork(
        testCase.roadworkId,
        testCase.reason,
        testCase.supervisorName,
        testCase.supervisorBadge,
        testCase.supervisorId
      );
      
      if (result.success) {
        console.log(`   ✅ SUCCESS: Dismissal completed`);
        console.log(`   📊 Source: ${result.source || 'unknown'}`);
        console.log(`   📝 Data updated: ${result.data ? 'Yes' : 'No'}`);
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
        if (result.notFound) {
          console.log(`   ℹ️  This is expected for test IDs that don't exist in the database`);
        }
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Dismissal functionality test completed');
}

// Test parameter validation
async function testParameterValidation() {
  console.log('🧪 Testing parameter validation...\n');
  
  const manager = new UnifiedRoadworksManager();
  
  // Test missing required parameters
  const invalidCases = [
    { roadworkId: null, reason: 'test', supervisorName: 'test' },
    { roadworkId: 'test', reason: 'test', supervisorName: null },
    { roadworkId: '', reason: 'test', supervisorName: 'test' },
    { roadworkId: 'test', reason: 'test', supervisorName: '' }
  ];
  
  for (const testCase of invalidCases) {
    try {
      const result = await manager.dismissRoadwork(
        testCase.roadworkId,
        testCase.reason,
        testCase.supervisorName
      );
      
      if (!result.success && result.error.includes('Missing required parameters')) {
        console.log('✅ Parameter validation working correctly');
      } else {
        console.log('❌ Parameter validation failed - expected error but got success');
      }
    } catch (error) {
      console.log('❌ Unexpected exception during validation test');
    }
  }
  
  console.log('🏁 Parameter validation test completed\n');
}

// Run tests
async function runTests() {
  console.log('🚀 Starting dismissal functionality tests\n');
  
  await testParameterValidation();
  await testDismissalFunctionality();
  
  console.log('✨ All tests completed');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testDismissalFunctionality, testParameterValidation };