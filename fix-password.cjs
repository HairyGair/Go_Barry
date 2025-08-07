const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate proper hash for Anthony123
const password = 'Anthony123';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

const passwordData = {
  "AG003": {
    hash: hash,
    salt: salt,
    lastChanged: new Date().toISOString(),
    mustChange: false
  }
};

// Write to the password file
const passwordFile = path.join(__dirname, 'backend', 'data', 'supervisor-passwords.json');
fs.writeFileSync(passwordFile, JSON.stringify(passwordData, null, 2));

console.log('✅ Password set for AG003!');
console.log('You can now login with:');
console.log('  Badge: AG003');
console.log('  Password: Anthony123');