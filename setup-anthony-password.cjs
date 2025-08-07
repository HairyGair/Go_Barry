// Quick setup script to create proper password for Anthony Gair
// Run: node setup-anthony-password.cjs

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// This matches EXACTLY what the backend expects
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Generate hash for Anthony123
const password = 'Anthony123';
const { hash, salt } = hashPassword(password);

const passwordData = {
  "AG003": {
    hash,
    salt,
    lastChanged: new Date().toISOString(),
    mustChange: false
  }
};

// Write directly to the backend password file
const passwordFile = path.join(__dirname, 'backend', 'data', 'supervisor-passwords.json');
console.log('Writing to:', passwordFile);

fs.writeFileSync(passwordFile, JSON.stringify(passwordData, null, 2));

console.log('✅ Password has been set successfully!');
console.log('\nYou can now login with:');
console.log('  Supervisor: Anthony Gair (AG003)');
console.log('  Password: Anthony123');
console.log('\nHash (first 20 chars):', hash.substring(0, 20) + '...');
console.log('Salt:', salt);