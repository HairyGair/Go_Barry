// Quick fix to reset Street Manager circuit breaker
// Run this file once to reset the circuit breaker

import dotenv from 'dotenv';
dotenv.config();

// Set up global for getSupabaseClient
import { createClient } from '@supabase/supabase-js';
global.getSupabaseClient = async () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
};

// Set up getFetch
import { getFetch } from './utils/fetchHelper.js';

import unifiedRoadworksManager from './services/unifiedRoadworksManager.js';

console.log('🔄 Resetting Street Manager circuit breaker...');

// Reset all circuit breaker values
unifiedRoadworksManager.streetManagerFailures = 0;
unifiedRoadworksManager.streetManagerLastFailure = 0;
unifiedRoadworksManager.streetManagerDisabled = false;
unifiedRoadworksManager.streetManagerDisabledUntil = 0;

console.log('✅ Circuit breaker reset!');
console.log('Current status:', {
  disabled: unifiedRoadworksManager.streetManagerDisabled,
  failures: unifiedRoadworksManager.streetManagerFailures
});

// Test fetching Street Manager data
console.log('\n🧪 Testing Street Manager fetch...');
const result = await unifiedRoadworksManager.getStreetManagerRoadworks();
console.log('Result:', {
  success: result.success,
  dataCount: result.data ? result.data.length : 0,
  error: result.error
});

process.exit(0);
