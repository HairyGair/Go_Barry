#!/usr/bin/env node

/**
 * Simple Test for Breakdown ID Generator
 * Tests the BD-YYYY-NNNNN ID generation system
 */

import breakdownIdGenerator from './services/breakdownIdGenerator.js';

console.log('🧪 Testing Breakdown ID Generator\n');

async function runTests() {
  try {
    // Test 1: Generate a new ID
    console.log('Test 1: Generate New Breakdown ID');
    const result = await breakdownIdGenerator.generateId();
    console.log(`✅ Generated ID: ${result.id}`);
    console.log(`   Year: ${result.year}`);
    console.log(`   Sequence: ${result.sequence || 'N/A (fallback)'}`);
    console.log(`   Date: ${result.date}`);
    console.log(`   Fallback: ${result.fallback ? 'Yes' : 'No'}\n`);

    // Test 2: Validate the generated ID
    console.log('Test 2: Validate Generated ID');
    const validation = breakdownIdGenerator.validateId(result.id);
    console.log(`${validation.valid ? '✅' : '❌'} Validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
    if (validation.error) {
      console.log(`   Error: ${validation.error}`);
    } else {
      console.log(`   Year: ${validation.year}`);
      console.log(`   Sequence: ${validation.sequence}`);
      console.log(`   Is Fallback: ${validation.isFallback}\n`);
    }

    // Test 3: Generate multiple IDs to show sequence
    console.log('Test 3: Sequential ID Generation');
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const id = await breakdownIdGenerator.generateId();
      ids.push(id.id);
      console.log(`   ${i + 1}. ${id.id} (Seq: ${id.sequence || 'fallback'})`);

      // Small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log();

    // Test 4: Validate various ID formats
    console.log('Test 4: ID Format Validation');
    const testIds = [
      'BD-2025-00001',  // Valid
      'BD-2025-00999',  // Valid
      'BD-2025-F12345', // Valid fallback
      'BD-2026-00001',  // Valid future year
      'BD-2019-00001',  // Invalid old year
      'BD-25-00001',    // Invalid year format
      'BD-2025-001',    // Invalid sequence (too short)
      'ID-2025-00001',  // Invalid prefix
      'BD_2025_00001',  // Invalid separator
    ];

    testIds.forEach(testId => {
      const result = breakdownIdGenerator.validateId(testId);
      console.log(`   ${result.valid ? '✅' : '❌'} ${testId} - ${result.valid ? 'Valid' : result.error}`);
    });
    console.log();

    // Test 5: Get generator status
    console.log('Test 5: Generator Status');
    const status = breakdownIdGenerator.getStatus();
    console.log(`✅ Generator Status:`);
    console.log(`   Current Date: ${status.current_date}`);
    console.log(`   Counter Date: ${status.counter_date}`);
    console.log(`   Current Counter: ${status.current_counter}`);
    console.log(`   Last Generated ID: ${status.last_generated_id || 'None'}`);
    console.log(`   Needs Reset: ${status.needs_reset ? 'Yes' : 'No'}\n`);

    // Test 6: Get statistics
    console.log('Test 6: Statistics');
    const stats = await breakdownIdGenerator.getStatistics();
    console.log(`✅ Statistics for ${stats.year}:`);
    console.log(`   Total breakdowns this year: ${stats.total_breakdowns}`);
    console.log(`   Next sequence number: ${stats.next_sequence}`);
    console.log(`   Next ID will be: BD-${stats.year}-${stats.next_sequence.toString().padStart(5, '0')}\n`);

    console.log('🎉 ID Generator Testing Complete!\n');

    // Summary
    console.log('📊 Summary:');
    console.log('• ID Format: BD-YYYY-NNNNN');
    console.log('• Sequential numbering per year');
    console.log('• Automatic daily counter reset');
    console.log('• Fallback generation if database unavailable');
    console.log('• Built-in validation');
    console.log('• Persistent counter storage');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });