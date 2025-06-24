// check-environment.js
// Check environment setup for Go BARRY
import dotenv from 'dotenv';

console.log('🔍 Checking Go BARRY Environment Setup...\n');

// Load environment variables
dotenv.config();

// Check Node.js version
console.log('📊 System Information:');
console.log(`   Node.js version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);

// Check environment variables
console.log('\n🔑 Environment Variables:');
const requiredVars = [
  'TOMTOM_API_KEY',
  'NATIONAL_HIGHWAYS_API_KEY'
];

let envIssues = 0;

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.substring(0, 8)}...${value.slice(-4)}`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
    envIssues++;
  }
}

// Check file system access
console.log('\n📁 File System Check:');
import fs from 'fs/promises';
import path from 'path';

const filesToCheck = [
  'data/routes.txt',
  'data/stops.txt', 
  'data/trips.txt',
  'data/shapes.txt'
];

let fileIssues = 0;

for (const filePath of filesToCheck) {
  try {
    await fs.access(filePath);
    const stats = await fs.stat(filePath);
    console.log(`   ✅ ${filePath}: ${(stats.size / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.log(`   ❌ ${filePath}: ${error.message}`);
    fileIssues++;
  }
}

// Summary
console.log('\n📋 Environment Summary:');
console.log(`   Environment variables: ${requiredVars.length - envIssues}/${requiredVars.length} configured`);
console.log(`   GTFS data files: ${filesToCheck.length - fileIssues}/${filesToCheck.length} available`);

if (envIssues > 0) {
  console.log('\n⚠️ Missing API keys will cause some tests to fail');
  console.log('   To fix: Copy .env.example to .env and add your API keys');
}

if (fileIssues > 0) {
  console.log('\n⚠️ Missing GTFS files will limit route matching capability');
  console.log('   GTFS files should be in the data/ directory');
}

if (envIssues === 0 && fileIssues === 0) {
  console.log('\n🎉 Environment setup looks good!');
}

console.log('\n✅ Environment check complete');
