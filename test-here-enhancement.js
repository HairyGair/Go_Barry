#!/usr/bin/env node
// Test script for enhanced HERE traffic flow integration
// Quick test to verify bus control room intelligence features

import dotenv from 'dotenv';
import { fetchHERETrafficFlow } from './backend/services/here.js';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

async function testHEREEnhancement() {
  console.log('🚌 Testing enhanced HERE traffic flow for bus control room...\n');
  
  // Debug environment loading
  console.log('🔍 Environment debugging:');
  console.log('HERE_API_KEY exists:', !!process.env.HERE_API_KEY);
  console.log('HERE_API_KEY length:', process.env.HERE_API_KEY?.length || 0);
  console.log('First 10 chars:', process.env.HERE_API_KEY?.substring(0, 10) || 'undefined');
  
  if (!process.env.HERE_API_KEY) {
    console.error('❌ HERE_API_KEY not found in environment variables');
    console.log('\n🔧 Trying to load directly from backend/.env file...');
    
    // Try reading the file directly
    try {
      const fs = await import('fs');
      const envContent = fs.readFileSync('./backend/.env', 'utf8');
      const hereKeyMatch = envContent.match(/HERE_API_KEY=(.+)/);
      
      if (hereKeyMatch) {
        console.log('✅ Found HERE_API_KEY in .env file');
        process.env.HERE_API_KEY = hereKeyMatch[1].trim();
        console.log('✅ Manually set HERE_API_KEY');
      } else {
        console.error('❌ HERE_API_KEY not found in .env file');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Could not read .env file:', error.message);
      process.exit(1);
    }
  }
  
  console.log('✅ HERE API key configured');
  console.log('🔄 Fetching traffic flow data...\n');
  
  try {
    const result = await fetchHERETrafficFlow();
    
    if (result.success) {
      console.log(`✅ SUCCESS: ${result.data.length} congestion alerts found`);
      
      if (result.data.length > 0) {
        console.log('\n📊 SAMPLE CONGESTION DATA:');
        console.log('=' .repeat(50));
        
        result.data.slice(0, 3).forEach((alert, i) => {
          console.log(`\n${i + 1}. ${alert.title}`);
          console.log(`   Location: ${alert.location}`);
          console.log(`   Speed: ${alert.currentSpeed}km/h (normal: ${alert.normalSpeed}km/h)`);
          console.log(`   Bus Delay: ${alert.estimatedDelay}`);
          console.log(`   Affects Routes: ${alert.affectsRoutes.join(', ')}`);
          console.log(`   Congestion Level: ${alert.congestionLevel}`);
        });
        
        console.log('\n🎯 CONTROL ROOM BENEFITS:');
        console.log('✓ Real-time speed vs normal speed comparison');
        console.log('✓ Estimated bus delay calculations');
        console.log('✓ Route-specific impact analysis');
        console.log('✓ Congestion severity levels for prioritization');
        
      } else {
        console.log('ℹ️  No significant congestion detected (all routes flowing normally)');
      }
      
    } else {
      console.error(`❌ FAILED: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHEREEnhancement().catch(console.error);
