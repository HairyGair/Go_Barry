// Quick password setup for Anthony Gair
import crypto from 'crypto';
import fs from 'fs';

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

fs.writeFileSync('./backend/data/supervisor-passwords.json', JSON.stringify(passwordData, null, 2));
console.log('✅ Password set for AG003 (Anthony123)');
console.log('Hash:', hash.substring(0, 20) + '...');
console.log('Salt:', salt);
