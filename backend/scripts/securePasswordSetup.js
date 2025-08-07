#!/usr/bin/env node
// backend/scripts/securePasswordSetup.js
// Simple script to set up secure passwords for existing supervisor system

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../utils/secureAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PASSWORDS_FILE = path.join(__dirname, '../data/supervisor-passwords.json');
const DEFAULT_PASSWORD = 'Barry123!';

// All Go North East supervisors
const SUPERVISORS = {
  'AG003': 'Anthony Gair',
  'BP009': 'Barry Perryman', 
  'AW001': 'Alex Woodcock',
  'AC002': 'Andrew Cowley',
  'CF004': 'Claire Fiddler',
  'DH005': 'David Hall',
  'JD006': 'James Daglish',
  'JP007': 'John Paterson',
  'SG008': 'Simon Glass'
};

async function setupSecurePasswords() {
  console.log('🔐 Setting up secure passwords for Go BARRY supervisors...');
  
  try {
    // Read existing file
    let existingData = {};
    try {
      const data = await fs.readFile(PASSWORDS_FILE, 'utf8');
      existingData = JSON.parse(data);
    } catch (error) {
      console.log('No existing password file found, creating new one');
    }
    
    const securePasswords = {
      _note: "Secure password hashes for Go BARRY supervisors",
      _created: new Date().toISOString(),
      _defaultPassword: "Barry123! (change immediately after first login)",
      _hashAlgorithm: "bcrypt with 12 rounds",
    };
    
    console.log('Generating secure password hashes...');
    
    for (const [badge, name] of Object.entries(SUPERVISORS)) {
      console.log(`  Processing ${badge} (${name})...`);
      
      // Check if already has a secure hash
      if (existingData[badge] && existingData[badge].hash && existingData[badge].hash.startsWith('$2b$')) {
        console.log(`    ✅ Already has bcrypt hash, keeping existing`);
        securePasswords[badge] = existingData[badge];
      } else {
        // Generate new hash
        const hash = await hashPassword(DEFAULT_PASSWORD);
        securePasswords[badge] = {
          hash: hash,
          name: name,
          lastChanged: new Date().toISOString(),
          mustChange: true,
          setupCompleted: true,
          migrated: true
        };
        console.log(`    ✅ Generated secure hash`);
      }
    }
    
    // Save secure passwords
    await fs.writeFile(PASSWORDS_FILE, JSON.stringify(securePasswords, null, 2));
    
    console.log('');
    console.log('✅ SECURE PASSWORD SETUP COMPLETE');
    console.log('========================================');
    console.log(`📁 Updated: ${PASSWORDS_FILE}`);
    console.log(`👥 Supervisors: ${Object.keys(SUPERVISORS).length}`);
    console.log(`🔒 Algorithm: bcrypt (12 rounds)`);
    console.log(`🔑 Default password: ${DEFAULT_PASSWORD}`);
    console.log('');
    console.log('⚠️  SECURITY NOTICE:');
    console.log('   • All supervisors MUST change their password immediately');
    console.log('   • Default password is temporary only');
    console.log('   • Passwords are now stored as bcrypt hashes');
    console.log('   • JWT tokens will be used for session management');
    console.log('');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupSecurePasswords();