#!/usr/bin/env node

// Quick script to update all test files with the correct port

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.argv[2];

if (!port) {
  console.log('Usage: node scripts/update-test-port.js [PORT]');
  console.log('Example: node scripts/update-test-port.js 8081');
  process.exit(1);
}

console.log(`Updating test scripts to use port ${port}...`);

const files = [
  'integration-test.js',
  'performance-test.js',
  'accessibility-test.js',
  'check-services.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all instances of port 19006
    content = content.replace(/localhost:19006/g, `localhost:${port}`);
    content = content.replace(/port 19006/g, `port ${port}`);
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${file}`);
  }
});

console.log(`\n✅ All test files updated to use port ${port}`);
console.log('\nNow you can run:');
console.log('  node scripts/check-services.js');
console.log('  node scripts/integration-test.js');
