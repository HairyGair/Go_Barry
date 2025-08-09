// Quick test to check fleet database API
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Testing fleet database loading...');
console.log('Current directory:', __dirname);
console.log('Fleet DB path:', path.join(__dirname, 'backend', 'data', 'fleet-database.json'));

try {
  const fleetData = JSON.parse(readFileSync(path.join(__dirname, 'backend', 'data', 'fleet-database.json'), 'utf8'));
  console.log('✅ Fleet database loaded successfully');
  console.log('Number of vehicles:', Object.keys(fleetData).length);
  console.log('Sample vehicle:', Object.keys(fleetData)[0], ':', fleetData[Object.keys(fleetData)[0]]);
} catch (error) {
  console.error('❌ Failed to load fleet database:', error);
}