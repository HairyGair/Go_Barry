cd backend && node -e "
const dotenv = require('dotenv');
dotenv.config();

console.log('\\n🔑 Checking API Keys on Render vs Local:\\n');

console.log('TOMTOM_API_KEY should be:');
console.log('  ' + (process.env.TOMTOM_API_KEY || 'NOT SET'));
console.log('  Length:', (process.env.TOMTOM_API_KEY || '').length, 'characters\\n');

console.log('NATIONAL_HIGHWAYS_API_KEY should be:');
console.log('  ' + (process.env.NATIONAL_HIGHWAYS_API_KEY || 'NOT SET'));
console.log('  Length:', (process.env.NATIONAL_HIGHWAYS_API_KEY || '').length, 'characters\\n');

console.log('HERE_API_KEY:');
console.log('  ' + (process.env.HERE_API_KEY || 'NOT SET').substring(0, 10) + '...');
console.log('  Length:', (process.env.HERE_API_KEY || '').length, 'characters\\n');

console.log('MAPQUEST_API_KEY:');
console.log('  ' + (process.env.MAPQUEST_API_KEY || 'NOT SET').substring(0, 10) + '...');
console.log('  Length:', (process.env.MAPQUEST_API_KEY || '').length, 'characters\\n');

console.log('⚠️  Compare these values with what\\'s on Render.com');
console.log('📝 The exact character count should match!');
"
