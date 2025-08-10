#!/usr/bin/env node

// Pre-integration checklist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Fleet Database Integration Checklist\n');

const checks = [
  {
    name: 'Fleet database exists',
    check: () => fs.existsSync(path.join(__dirname, 'gne-fleet-database.json'))
  },
  {
    name: 'Backend directory exists',
    check: () => fs.existsSync(path.join(__dirname, 'backend'))
  },
  {
    name: 'Breakdown guide directory exists',
    check: () => fs.existsSync(path.join(__dirname, 'Go_BARRY/public/breakdown-guide'))
  },
  {
    name: 'Integration directory created',
    check: () => fs.existsSync(path.join(__dirname, 'backend/integration'))
  },
  {
    name: 'Services directory exists',
    check: () => fs.existsSync(path.join(__dirname, 'backend/services'))
  }
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  const passed = check();
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) allPassed = false;
});

if (allPassed) {
  console.log('\n✅ All checks passed! Ready to integrate.');
  console.log('\nRun: ./integrate-fleet-database.mjs');
} else {
  console.log('\n❌ Some checks failed. Please fix the issues above.');
}

// Show fleet database stats if it exists
if (fs.existsSync(path.join(__dirname, 'gne-fleet-database.json'))) {
  const fleetData = JSON.parse(fs.readFileSync(path.join(__dirname, 'gne-fleet-database.json'), 'utf8'));
  console.log('\n📊 Fleet Database Stats:');
  console.log(`   Total Vehicles: ${fleetData.totalVehicles}`);
  console.log(`   Active Depots: ${fleetData.activeDepots.join(', ')}`);
}
