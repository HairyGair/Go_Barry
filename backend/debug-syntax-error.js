#!/usr/bin/env node
/*
 * Debug script to find syntax errors in backend modules
 * Run: node debug-syntax-error.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of service files to check
const serviceFiles = [
  'busLocationService.js',
  'gtfsRouteShapesService.js',
  'bods.js',
  'serviceFrequencyService.js',
  'realTimeDisruptionScoring.js',
  'convexSync.js'
];

async function checkFile(filePath) {
  try {
    console.log(`Checking ${filePath}...`);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Look for potential syntax issues
    const lines = content.split('\n');
    let inObjectLiteral = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Check for function declarations that might be missing commas
      if (line.includes('compareScheduledVsActual') || 
          (line.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(.*\)\s*{/) && !line.includes('function'))) {
        console.log(`⚠️  Line ${lineNum}: Possible missing comma before method: ${line.trim()}`);
      }
      
      // Track object literals
      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;
      
      // Check for method definitions in objects without commas
      if (braceCount > 0 && line.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/)) {
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*[:(]/)) {
          if (!line.trim().endsWith(',')) {
            console.log(`❌ Line ${lineNum}: Missing comma after property: ${line.trim()}`);
          }
        }
      }
    }
    
    // Try to dynamically import to catch syntax errors
    try {
      await import(filePath);
      console.log(`✅ ${path.basename(filePath)} - No syntax errors found`);
    } catch (error) {
      console.error(`❌ ${path.basename(filePath)} - Syntax Error:`, error.message);
      if (error.message.includes('compareScheduledVsActual')) {
        console.log('🎯 FOUND THE ERROR!');
      }
    }
    
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🔍 Searching for syntax errors in backend services...\n');
  
  for (const file of serviceFiles) {
    const filePath = join(__dirname, 'services', file);
    await checkFile(filePath);
    console.log('---');
  }
  
  // Also check index.js
  console.log('\nChecking index.js...');
  await checkFile(join(__dirname, 'index.js'));
}

main().catch(console.error);
