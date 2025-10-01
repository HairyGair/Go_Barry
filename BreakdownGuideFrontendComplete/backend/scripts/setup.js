#!/usr/bin/env node

/*
 * Quick Setup Script
 * Ensures everything is ready to run
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Breakdown Guide Backend - Quick Setup');
console.log('=========================================\n');

// Check Node version
const nodeVersion = process.version;
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if .env exists
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

if (!existsSync(envPath)) {
  console.log('📝 Creating .env file from .env.example...');
  try {
    copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
    console.log('⚠️  Please edit .env with your configuration\n');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
} else {
  console.log('✅ .env file exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (!existsSync(nodeModulesPath)) {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n✨ Setup complete!');
console.log('\n📚 Next steps:');
console.log('  1. Edit .env file with your configuration');
console.log('  2. Run: npm start');
console.log('  3. Test: npm test');
console.log('  4. Visit: http://localhost:3003/api-docs');
console.log('\n🚀 Happy coding!');
