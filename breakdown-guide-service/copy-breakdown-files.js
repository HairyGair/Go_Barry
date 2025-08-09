#!/usr/bin/env node

/*
 * Script to copy Breakdown Guide files from main project to standalone service
 * Run this before deployment to ensure latest files are included
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_DIR = join(__dirname, '../Go_BARRY/public/breakdown-guide');
const DEST_DIR = join(__dirname, 'public');

// Create destination directory if it doesn't exist
mkdirSync(DEST_DIR, { recursive: true });

// Function to copy directory recursively
function copyDirectory(source, destination) {
  // Create destination directory
  mkdirSync(destination, { recursive: true });
  
  // Read source directory
  const files = readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = join(source, file);
    const destPath = join(destination, file);
    
    const stat = statSync(sourcePath);
    
    if (stat.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy file
      copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${file}`);
    }
  });
}

console.log('Starting Breakdown Guide files copy...');
console.log(`Source: ${SOURCE_DIR}`);
console.log(`Destination: ${DEST_DIR}`);

try {
  // Copy all breakdown guide files
  copyDirectory(SOURCE_DIR, DEST_DIR);
  
  // Also copy the logo from parent directory
  const logoSource = join(__dirname, '../Go_BARRY/public/breakdown-guide/gobarry-logo.png');
  const logoDest = join(DEST_DIR, 'gobarry-logo.png');
  
  try {
    copyFileSync(logoSource, logoDest);
    console.log('Copied: gobarry-logo.png');
  } catch (err) {
    console.log('Logo file may already be in breakdown-guide directory');
  }
  
  console.log('\n✅ Successfully copied all Breakdown Guide files!');
  console.log(`Total files in ${DEST_DIR}:`, readdirSync(DEST_DIR).length);
  
} catch (error) {
  console.error('❌ Error copying files:', error.message);
  process.exit(1);
}