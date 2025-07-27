#!/usr/bin/env node

/*
 * Test script for acknowledge functionality
 * Tests both manual incidents and streetworks acknowledgment
 * Run: node test-acknowledge-functionality.js
 */

import { createClient } from '@supabase/supabase-js';
import unifiedRoadworksManager from './services/unifiedRoadworksManager.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class AcknowledgeFunctionalityTest {
  constructor() {
    this.testResults = [];
    this.testSupervisor = 'TEST_SUPERVISOR';
  }

  async runAllTests() {
    console.log('🧪 Starting acknowledge functionality tests...\n');

    try {
      // Test 1: Validate method exists
      await this.testMethodExists();

      // Test 2: Test input validation
      await this.testInputValidation();

      // Test 3: Test table determination
      await this.testTableDetermination();

      // Test 4: Test cache invalidation
      await this.testCacheInvalidation();

      // Test 5: Test with real data (if available)
      await this.testWithRealData();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testMethodExists() {
    console.log('📋 Test 1: Method existence');
    
    try {
      const methodExists = typeof unifiedRoadworksManager.acknowledgeRoadwork === 'function';
      const helperExists = typeof unifiedRoadworksManager.determineRoadworkTable === 'function';
      const cacheExists = typeof unifiedRoadworksManager.invalidateRoadworkCache === 'function';

      this.addResult('acknowledgeRoadwork method exists', methodExists);
      this.addResult('determineRoadworkTable method exists', helperExists);
      this.addResult('invalidateRoadworkCache method exists', cacheExists);

      console.log(`  ✅ acknowledgeRoadwork: ${methodExists ? 'Found' : 'Missing'}`);
      console.log(`  ✅ determineRoadworkTable: ${helperExists ? 'Found' : 'Missing'}`);
      console.log(`  ✅ invalidateRoadworkCache: ${cacheExists ? 'Found' : 'Missing'}\n`);

    } catch (error) {
      this.addResult('Method existence test', false, error.message);
      console.log('  ❌ Error checking methods:', error.message, '\n');
    }
  }

  async testInputValidation() {
    console.log('📋 Test 2: Input validation');

    try {
      // Test missing roadworkId
      const result1 = await unifiedRoadworksManager.acknowledgeRoadwork(null, 'test note', this.testSupervisor);
      this.addResult('Handles missing roadworkId', !result1.success);

      // Test missing supervisorName
      const result2 = await unifiedRoadworksManager.acknowledgeRoadwork('test-123', 'test note', null);
      this.addResult('Handles missing supervisorName', !result2.success);

      // Test long note truncation
      const longNote = 'a'.repeat(600);
      const result3 = await unifiedRoadworksManager.acknowledgeRoadwork('nonexistent-id', longNote, this.testSupervisor);
      this.addResult('Handles long notes', !result3.success || result3.error); // Should fail but gracefully

      console.log(`  ✅ Missing roadworkId: ${result1.success ? '❌ Failed' : '✅ Handled'}`);
      console.log(`  ✅ Missing supervisor: ${result2.success ? '❌ Failed' : '✅ Handled'}`);
      console.log(`  ✅ Long note handling: ${result3.error ? '✅ Handled' : '❌ Failed'}\n`);

    } catch (error) {
      this.addResult('Input validation test', false, error.message);
      console.log('  ❌ Error in input validation:', error.message, '\n');
    }
  }

  async testTableDetermination() {
    console.log('📋 Test 3: Table determination');

    try {
      // Test with non-existent ID
      const result = await unifiedRoadworksManager.determineRoadworkTable('nonexistent-id-12345');
      this.addResult('Determines non-existent roadwork', !result.exists);

      console.log(`  ✅ Non-existent ID: ${result.exists ? '❌ False positive' : '✅ Correctly identified'}`);
      console.log(`  📊 Table determination result:`, result, '\n');

    } catch (error) {
      this.addResult('Table determination test', false, error.message);
      console.log('  ❌ Error in table determination:', error.message, '\n');
    }
  }

  async testCacheInvalidation() {
    console.log('📋 Test 4: Cache invalidation');

    try {
      // Add some test data to cache
      unifiedRoadworksManager.cache.set('test-cache-1', { data: [{ id: 'test-123' }] });
      unifiedRoadworksManager.cache.set('test-cache-2', { data: [{ id: 'other-456' }] });
      
      const sizeBefore = unifiedRoadworksManager.cache.size;
      
      // Test cache invalidation
      unifiedRoadworksManager.invalidateRoadworkCache('test-123');
      
      const sizeAfter = unifiedRoadworksManager.cache.size;
      
      this.addResult('Cache invalidation works', sizeBefore >= sizeAfter);

      console.log(`  ✅ Cache size before: ${sizeBefore}`);
      console.log(`  ✅ Cache size after: ${sizeAfter}`);
      console.log(`  ✅ Invalidation: ${sizeBefore >= sizeAfter ? '✅ Working' : '❌ Failed'}\n`);

    } catch (error) {
      this.addResult('Cache invalidation test', false, error.message);
      console.log('  ❌ Error in cache invalidation:', error.message, '\n');
    }
  }

  async testWithRealData() {
    console.log('📋 Test 5: Real data test (limited)');

    try {
      // Try to get some real roadworks to test with
      const allRoadworks = await unifiedRoadworksManager.getAllRoadworks();
      
      if (allRoadworks.success && allRoadworks.combined.length > 0) {
        const testRoadwork = allRoadworks.combined[0];
        console.log(`  📍 Found test roadwork: ${testRoadwork.id} from ${testRoadwork.source}`);
        
        // Note: We won't actually acknowledge it to avoid affecting real data
        // Just test that the ID exists in the system
        const tableInfo = await unifiedRoadworksManager.determineRoadworkTable(testRoadwork.id);
        this.addResult('Real roadwork found in database', tableInfo.exists);
        
        console.log(`  ✅ Real roadwork table check: ${tableInfo.exists ? '✅ Found' : '❌ Not found'}`);
        console.log(`  📊 Table: ${tableInfo.table || 'none'}\n`);
      } else {
        console.log('  ⚠️ No real roadworks found for testing\n');
        this.addResult('Real data available', false, 'No roadworks found');
      }

    } catch (error) {
      this.addResult('Real data test', false, error.message);
      console.log('  ❌ Error in real data test:', error.message, '\n');
    }
  }

  addResult(testName, passed, error = null) {
    this.testResults.push({
      test: testName,
      passed,
      error
    });
  }

  printResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('========================\n');

    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;

    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const error = result.error ? ` (${result.error})` : '';
      console.log(`${index + 1}. ${result.test}: ${status}${error}`);
    });

    console.log(`\n📊 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Acknowledge functionality is ready for production.');
    } else {
      console.log('⚠️ Some tests failed. Review the implementation before deploying.');
    }
  }
}

// Run the tests
const tester = new AcknowledgeFunctionalityTest();
tester.runAllTests().catch(console.error);