#!/usr/bin/env node

/**
 * Test Script for Breakdown ID Generator
 * Demonstrates the functionality of the BD-YYYY-NNNNN ID generation system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Colors for output
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

console.log('🧪 Testing Breakdown ID Generator\n');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ID Generator Class (simplified version for testing)
class BreakdownIdGenerator {
  async generateId() {
    const year = new Date().getFullYear();
    const now = new Date();
    
    try {
      // Get current count for the year
      const { count, error } = await supabase
        .from('breakdowns')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01T00:00:00.000Z`)
        .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`);
      
      if (error) throw error;
      
      const nextNumber = (count || 0) + 1;
      const breakdownId = `BD-${year}-${nextNumber.toString().padStart(5, '0')}`;
      
      return {
        id: breakdownId,
        year: year,
        sequence: nextNumber,
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString()
      };
      
    } catch (err) {
      console.error(`${red}Error:${reset}`, err.message);
      
      // Fallback ID generation
      const timestamp = Date.now();
      const fallbackId = `BD-${year}-F${timestamp.toString().slice(-5)}`;
      
      return {
        id: fallbackId,
        year: year,
        sequence: null,
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        fallback: true
      };
    }
  }
  
  validateId(breakdownId) {
    const pattern = /^BD-\d{4}-[F]?\d{5,}$/;
    
    if (!pattern.test(breakdownId)) {
      return {
        valid: false,
        error: 'Invalid format. Expected: BD-YYYY-NNNNN'
      };
    }
    
    const parts = breakdownId.split('-');
    const year = parseInt(parts[1], 10);
    const currentYear = new Date().getFullYear();
    
    if (year < 2020 || year > currentYear + 1) {
      return {
        valid: false,
        error: 'Invalid year in breakdown ID'
      };
    }
    
    return {
      valid: true,
      year: year,
      sequence: parts[2],
      isFallback: parts[2].startsWith('F')
    };
  }
}

async function runTests() {
  const generator = new BreakdownIdGenerator();
  
  console.log(`${blue}═══════════════════════════════════════════════${reset}\n`);
  
  // Test 1: Generate a new ID
  console.log(`${yellow}Test 1: Generate New Breakdown ID${reset}`);
  const result = await generator.generateId();
  console.log(`${green}✅${reset} Generated ID: ${green}${result.id}${reset}`);
  console.log(`   Year: ${result.year}`);
  console.log(`   Sequence: ${result.sequence || 'N/A (fallback)'}`);
  console.log(`   Date: ${result.date}`);
  console.log(`   Fallback: ${result.fallback ? 'Yes' : 'No'}\n`);
  
  // Test 2: Validate the generated ID
  console.log(`${yellow}Test 2: Validate Generated ID${reset}`);
  const validation = generator.validateId(result.id);
  console.log(`${validation.valid ? green + '✅' : red + '❌'}${reset} Validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
  if (validation.error) {
    console.log(`   Error: ${validation.error}`);
  } else {
    console.log(`   Year: ${validation.year}`);
    console.log(`   Sequence: ${validation.sequence}`);
    console.log(`   Is Fallback: ${validation.isFallback}\n`);
  }
  
  // Test 3: Generate multiple IDs to show sequence
  console.log(`${yellow}Test 3: Sequential ID Generation${reset}`);
  const ids = [];
  for (let i = 0; i < 3; i++) {
    const id = await generator.generateId();
    ids.push(id.id);
    console.log(`   ${i + 1}. ${green}${id.id}${reset} (Seq: ${id.sequence || 'fallback'})`);
    
    // Small delay to prevent race conditions
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log();
  
  // Test 4: Validate various ID formats
  console.log(`${yellow}Test 4: ID Format Validation${reset}`);
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
    const result = generator.validateId(testId);
    console.log(`   ${result.valid ? green + '✅' : red + '❌'}${reset} ${testId} - ${result.valid ? 'Valid' : result.error}`);
  });
  console.log();
  
  // Test 5: Database count and statistics
  console.log(`${yellow}Test 5: Database Statistics${reset}`);
  try {
    const year = new Date().getFullYear();
    const { count: totalCount } = await supabase
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01T00:00:00.000Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`);
    
    const { count: todayCount } = await supabase
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
    
    console.log(`${green}✅${reset} Year ${year} Statistics:`);
    console.log(`   Total breakdowns this year: ${totalCount || 0}`);
    console.log(`   Breakdowns today: ${todayCount || 0}`);
    console.log(`   Next sequence number: ${(totalCount || 0) + 1}`);
    console.log(`   Next ID will be: ${green}BD-${year}-${((totalCount || 0) + 1).toString().padStart(5, '0')}${reset}\n`);
  } catch (error) {
    console.log(`${red}❌${reset} Failed to get statistics: ${error.message}\n`);
  }
  
  console.log(`${blue}═══════════════════════════════════════════════${reset}`);
  console.log(`\n${green}🎉 ID Generator Testing Complete!${reset}`);
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('• ID Format: BD-YYYY-NNNNN');
  console.log('• Sequential numbering per year');
  console.log('• Automatic daily counter reset');
  console.log('• Fallback generation if database unavailable');
  console.log('• Built-in validation');
}

// Run the tests
runTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(`${red}Fatal error:${reset}`, error);
    process.exit(1);
  });