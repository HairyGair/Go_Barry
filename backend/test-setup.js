#!/usr/bin/env node
// test-setup.js
// Test the enhanced setup to ensure everything works

import { autoIncidentCreator } from './services/autoIncidentCreator.js';
import { trafficIntelligence } from './services/unifiedTrafficIntelligence.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function testSetup() {
  console.log('🧪 Testing enhanced incident creation setup...');
  
  // Test 1: Check if services import correctly
  console.log('✅ Auto-incident creator imported successfully');
  console.log('✅ Traffic intelligence imported successfully');
  
  // Test 2: Test Supabase connection
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Test manual_incidents table
    console.log('🔍 Testing manual_incidents table...');
    const { data, error } = await supabase
      .from('manual_incidents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ manual_incidents table does not exist:', error.message);
      console.log('🔧 You need to create the table first using:');
      console.log('   node create-manual-incidents-table.js');
      return false;
    } else {
      console.log('✅ manual_incidents table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
  
  // Test 3: Test traffic intelligence
  try {
    console.log('🔍 Testing traffic intelligence...');
    const testAlert = {
      id: 'test_alert_' + Date.now(),
      type: 'incident',
      location: 'A1 Southbound',
      severity: 'High',
      status: 'red',
      affectsRoutes: ['21', '22', 'X21'],
      congestionLevel: 70,
      source: 'tomtom',
      lastUpdated: new Date().toISOString()
    };
    
    const intelligenceScore = trafficIntelligence.calculateIntelligenceScore(testAlert);
    const routeImpact = trafficIntelligence.assessRouteImpact(testAlert);
    const timeContext = trafficIntelligence.generateTimeContext(testAlert);
    
    console.log('✅ Traffic intelligence scoring works');
    console.log(`  Intelligence Score: ${intelligenceScore}/100`);
    console.log(`  Route Impact: ${routeImpact.level} (${routeImpact.totalRoutes} routes)`);
    console.log(`  Time Context: ${timeContext.timeOfDay} (${timeContext.dayType})`);
    
  } catch (error) {
    console.error('❌ Traffic intelligence test failed:', error.message);
    return false;
  }
  
  // Test 4: Test auto-incident creator evaluation
  try {
    console.log('🔍 Testing auto-incident creator...');
    const testAlert = {
      id: 'test_alert_' + Date.now(),
      type: 'incident',
      location: 'A1 Southbound',
      severity: 'High',
      status: 'red',
      affectsRoutes: ['21', '22', 'X21'],
      congestionLevel: 70,
      source: 'tomtom',
      intelligenceScore: 85,
      routeImpact: { level: 'high', totalRoutes: 3 },
      timeContext: { rushHour: true, timeOfDay: 'morning' },
      lastUpdated: new Date().toISOString()
    };
    
    const evaluation = autoIncidentCreator.evaluateAlertForIncident(testAlert);
    
    console.log('✅ Auto-incident creator evaluation works');
    console.log(`  Should Create: ${evaluation.shouldCreate}`);
    console.log(`  Score: ${evaluation.score}/100`);
    console.log(`  Priority: ${evaluation.priority}`);
    console.log(`  Reason: ${evaluation.reason}`);
    
  } catch (error) {
    console.error('❌ Auto-incident creator test failed:', error.message);
    return false;
  }
  
  console.log('🎉 All tests passed! The enhanced incident creation system is ready.');
  console.log('');
  console.log('✅ Next steps:');
  console.log('1. Create the manual_incidents table in Supabase (if not done already)');
  console.log('2. Start the backend with: npm start');
  console.log('3. The auto-incident creator will automatically start monitoring');
  console.log('4. High-priority traffic alerts will automatically create incidents');
  console.log('');
  console.log('📊 System capabilities:');
  console.log('- Intelligence scoring for all traffic alerts');
  console.log('- Route impact assessment');
  console.log('- Time context analysis');
  console.log('- Automatic incident creation for high-priority alerts');
  console.log('- Enhanced alert processing with priority sorting');
  
  return true;
}

testSetup().catch(console.error);