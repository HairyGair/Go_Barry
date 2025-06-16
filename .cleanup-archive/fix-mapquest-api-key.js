#!/usr/bin/env node
// fix-mapquest-api-key.js
// Quick script to update MapQuest API key in Go BARRY

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE = path.join(__dirname, 'backend/.env');

async function updateMapQuestAPIKey(newApiKey) {
  try {
    console.log('🔧 Updating MapQuest API key in Go BARRY...');
    
    // Read current .env file
    const envContent = await fs.readFile(ENV_FILE, 'utf-8');
    console.log('✅ Read backend/.env file');
    
    // Update the MapQuest API key line
    const lines = envContent.split('\n');
    let keyUpdated = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('MAPQUEST_API_KEY=')) {
        const oldKey = lines[i].split('=')[1];
        lines[i] = `MAPQUEST_API_KEY=${newApiKey}`;
        console.log(`🔄 Updated MapQuest API key:`);
        console.log(`   Old: MAPQUEST_API_KEY=${oldKey ? oldKey.substring(0, 8) + '...' : 'empty'}`);
        console.log(`   New: MAPQUEST_API_KEY=${newApiKey.substring(0, 8)}...`);
        keyUpdated = true;
        break;
      }
    }
    
    if (!keyUpdated) {
      // Add new line if not found
      lines.push(`MAPQUEST_API_KEY=${newApiKey}`);
      console.log(`➕ Added new MapQuest API key line`);
    }
    
    // Write back to file
    await fs.writeFile(ENV_FILE, lines.join('\n'));
    console.log('✅ Updated backend/.env file');
    
    return true;
  } catch (error) {
    console.error('❌ Error updating API key:', error.message);
    return false;
  }
}

async function promptForNewKey() {
  console.log('\n🔑 MAPQUEST API KEY UPDATE');
  console.log('==========================');
  console.log('Current key appears to be invalid or expired.');
  console.log('\nTo get a new MapQuest API key:');
  console.log('1. Go to: https://developer.mapquest.com/');
  console.log('2. Sign up/login and create an app');
  console.log('3. Enable Traffic API and Geocoding API');
  console.log('4. Copy your Consumer Key');
  console.log('\nThen run this script with your new key:');
  console.log('node fix-mapquest-api-key.js YOUR_NEW_API_KEY');
  console.log('\nExample:');
  console.log('node fix-mapquest-api-key.js AbCdEf123456789...');
}

async function main() {
  const newApiKey = process.argv[2];
  
  if (!newApiKey) {
    await promptForNewKey();
    return;
  }
  
  if (newApiKey.length < 10) {
    console.error('❌ API key seems too short. Please check and try again.');
    return;
  }
  
  console.log(`🔧 Updating MapQuest API key to: ${newApiKey.substring(0, 8)}...`);
  
  const success = await updateMapQuestAPIKey(newApiKey);
  
  if (success) {
    console.log('\n✅ SUCCESS! MapQuest API key updated.');
    console.log('\n🚀 Next steps:');
    console.log('1. Test the new key: node test-mapquest-fix.js');
    console.log('2. Restart your backend server');
    console.log('3. Check Go BARRY traffic alerts');
    console.log('\n📝 The updated .env file is at: backend/.env');
  } else {
    console.log('\n❌ Failed to update API key. Please check file permissions.');
  }
}

main().catch(console.error);
