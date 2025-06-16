#!/usr/bin/env node
// diagnose-mapquest-issue.js
// Diagnose MapQuest API issues in Go BARRY

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function diagnoseMapQuestIssue() {
  console.log('🔍 MAPQUEST API DIAGNOSTIC');
  console.log('==========================');
  
  try {
    // Check if .env file exists
    const envPath = path.join(__dirname, 'backend/.env');
    
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      console.log('✅ Found backend/.env file');
      
      // Parse environment variables
      const envVars = {};
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
      
      // Check MapQuest configuration
      console.log('\n📋 MAPQUEST CONFIGURATION:');
      
      const mapquestKey = envVars.MAPQUEST_API_KEY;
      if (mapquestKey) {
        console.log(`✅ MAPQUEST_API_KEY: ${mapquestKey.substring(0, 8)}... (${mapquestKey.length} characters)`);
        
        // Analyze the key format
        if (mapquestKey.length < 20) {
          console.log('⚠️  Warning: API key seems short for MapQuest format');
        }
        
        if (mapquestKey.includes('your_') || mapquestKey.includes('replace')) {
          console.log('❌ API key appears to be a placeholder - needs real key');
        }
        
        if (mapquestKey === 'OeLAVWPNIgnBjW66iam0yiD5kEecJl0N') {
          console.log('❌ Using example/demo API key - this will not work');
        }
      } else {
        console.log('❌ MAPQUEST_API_KEY: NOT SET');
      }
      
      // Check other API keys for comparison
      console.log('\n📋 OTHER API KEYS STATUS:');
      const apiKeys = ['TOMTOM_API_KEY', 'HERE_API_KEY', 'NATIONAL_HIGHWAYS_API_KEY'];
      
      for (const keyName of apiKeys) {
        if (envVars[keyName]) {
          console.log(`✅ ${keyName}: Set (${envVars[keyName].substring(0, 8)}...)`);
        } else {
          console.log(`❌ ${keyName}: Not set`);
        }
      }
      
    } catch (error) {
      console.log('❌ Cannot read backend/.env file');
      console.log('📝 Make sure backend/.env exists with API keys');
    }
    
    // Check MapQuest service file
    try {
      const mapquestServicePath = path.join(__dirname, 'backend/services/mapquest.js');
      await fs.access(mapquestServicePath);
      console.log('\n✅ MapQuest service file exists: backend/services/mapquest.js');
    } catch (error) {
      console.log('\n❌ MapQuest service file missing: backend/services/mapquest.js');
    }
    
    // Generate action plan
    console.log('\n🔧 DIAGNOSIS & ACTION PLAN:');
    console.log('===========================');
    
    const mapquestKey = process.env.MAPQUEST_API_KEY;
    
    if (!mapquestKey || mapquestKey.includes('your_') || mapquestKey === 'OeLAVWPNIgnBjW66iam0yiD5kEecJl0N') {
      console.log('❌ ISSUE: Invalid or placeholder MapQuest API key');
      console.log('\n🔧 SOLUTION:');
      console.log('1. Get new API key from https://developer.mapquest.com/');
      console.log('2. Create account and application');
      console.log('3. Enable Traffic API and Geocoding API');
      console.log('4. Copy Consumer Key');
      console.log('5. Update with: node fix-mapquest-api-key.js YOUR_NEW_KEY');
      
    } else {
      console.log('⚠️  ISSUE: API key format looks OK, but may be expired');
      console.log('\n🔧 SOLUTION:');
      console.log('1. Test current key: node test-mapquest-fix.js');
      console.log('2. If failed, get new key from https://developer.mapquest.com/');
      console.log('3. Update with: node fix-mapquest-api-key.js YOUR_NEW_KEY');
    }
    
    console.log('\n📚 HELPFUL LINKS:');
    console.log('• MapQuest Developer Portal: https://developer.mapquest.com/');
    console.log('• API Documentation: https://developer.mapquest.com/documentation/');
    console.log('• Traffic API Guide: https://developer.mapquest.com/documentation/traffic-api/');
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  }
}

diagnoseMapQuestIssue().catch(console.error);
