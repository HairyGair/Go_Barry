#!/usr/bin/env node

// Quick password setup script for Go BARRY
// Run this from the Go BARRY App directory: node quick-password-fix.js

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate hash for Anthony123
const password = 'Anthony123';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

const passwordData = {
  "AG003": {
    hash,
    salt,
    lastChanged: new Date().toISOString(),
    mustChange: false
  }
};

// Write to the backend password file
const passwordFile = path.join(__dirname, 'backend', 'data', 'supervisor-passwords.json');
fs.writeFileSync(passwordFile, JSON.stringify(passwordData, null, 2));

console.log('✅ Password set successfully for AG003!');
console.log('📝 You can now login with:');
console.log('   Badge: AG003');
console.log('   Password: Anthony123');
console.log('');
console.log('File updated:', passwordFile);
