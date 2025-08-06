import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple password hashing (same as in passwordManagement.js)
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Default passwords for existing users
const defaultPasswords = {
  'AG003': 'Anthony123',
  'BP009': 'Barry123',
  'JD006': 'James123',
  'JP007': 'John123',
  'SG008': 'Simon123'
};

async function initializePasswords() {
  const passwords = {};
  
  for (const [badge, password] of Object.entries(defaultPasswords)) {
    const { hash, salt } = hashPassword(password);
    passwords[badge] = {
      hash,
      salt,
      lastChanged: new Date().toISOString(),
      mustChange: false,
      initialized: true
    };
    console.log(`Initialized password for ${badge}`);
  }
  
  // Save to file
  const filePath = path.join(__dirname, '../data/supervisor-passwords.json');
  await fs.writeFile(filePath, JSON.stringify(passwords, null, 2));
  console.log('Password initialization complete!');
}

initializePasswords().catch(console.error);