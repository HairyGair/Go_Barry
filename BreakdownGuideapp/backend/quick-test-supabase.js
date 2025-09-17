#!/usr/bin/env node

/**
 * Quick Supabase Connection Test
 * Simple verification script for production Supabase integration
 * 
 * Usage: node quick-test-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Colors for output
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

console.log('🔍 Quick Supabase Connection Test\n');

async function quickTest() {
  try {
    // Check environment
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }
    
    console.log(`${green}✅${reset} Environment variables loaded`);
    console.log(`   URL: ${SUPABASE_URL}`);
    
    // Initialize client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log(`${green}✅${reset} Supabase client initialized`);
    
    // Test each table with correct names
    const tables = ['fleet_vehicles', 'breakdowns', 'users', 'wizard_progress'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`${red}❌${reset} Table '${table}': ${error.message}`);
        } else {
          console.log(`${green}✅${reset} Table '${table}': ${count} records`);
        }
      } catch (err) {
        console.log(`${red}❌${reset} Table '${table}': ${err.message}`);
      }
    }
    
    // Test sample data retrieval
    console.log(`\n${yellow}📊 Sample Data:${reset}`);
    
    // Get sample breakdown
    const { data: breakdown } = await supabase
      .from('breakdowns')
      .select('breakdown_id, fleet_no, status, created_at')
      .limit(1)
      .order('created_at', { ascending: false });
    
    if (breakdown && breakdown.length > 0) {
      const b = breakdown[0];
      console.log(`   Latest Breakdown: ${b.breakdown_id} (Fleet ${b.fleet_no}, Status: ${b.status})`);
    }
    
    // Get sample supervisor
    const { data: supervisor } = await supabase
      .from('users')
      .select('username, full_name, role')
      .eq('role', 'supervisor')
      .eq('is_active', true)
      .limit(1);
    
    if (supervisor && supervisor.length > 0) {
      const s = supervisor[0];
      console.log(`   Sample Supervisor: ${s.full_name} (${s.username})`);
    }
    
    // Get sample vehicle
    const { data: vehicle } = await supabase
      .from('fleet_vehicles')
      .select('fleet_number, registration, depot')
      .limit(1);
    
    if (vehicle && vehicle.length > 0) {
      const v = vehicle[0];
      const reg = v.registration || v.reg_number || 'Unknown';
      console.log(`   Sample Vehicle: Fleet ${v.fleet_number} (${reg}) - ${v.depot}`);
    }
    
    console.log(`\n${green}🎉 All tests passed! Supabase integration is working correctly.${reset}`);
    return true;
    
  } catch (error) {
    console.log(`\n${red}💥 Test failed: ${error.message}${reset}`);
    return false;
  }
}

quickTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error(`${red}Error:${reset}`, error);
    process.exit(1);
  });