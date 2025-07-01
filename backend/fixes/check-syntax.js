#!/usr/bin/env node
// Quick diagnostic script to find syntax errors

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkSyntax() {
  try {
    console.log('🔍 Checking index.js syntax...');
    
    // Try to import index.js
    const indexPath = join(dirname(__dirname), 'index.js');
    
    try {
      // Just check if we can read and parse it
      const content = await fs.readFile(indexPath, 'utf-8');
      
      // Look for potential syntax issues
      const lines = content.split('\n');
      
      // Check for missing semicolons after promise chains
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('}).catch') && i + 2 < lines.length) {
          if (lines[i+1].includes('});') === false && lines[i+2].trim() !== '' && !lines[i+2].trim().startsWith('//')) {
            console.log(`⚠️  Potential missing semicolon at line ${i+2}`);
            console.log(`   ${lines[i]}`);
            console.log(`   ${lines[i+1]}`);
            console.log(`   ${lines[i+2]}`);
          }
        }
      }
      
      // Check for object literals with missing commas
      let inObject = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('{') && !line.includes('=>') && !line.includes('function')) {
          inObject = true;
        }
        if (inObject && line.endsWith('}')) {
          inObject = false;
        }
        if (inObject && line.length > 0 && !line.endsWith(',') && !line.endsWith('{') && !line.endsWith('}') && i + 1 < lines.length) {
          const nextLine = lines[i+1].trim();
          if (nextLine.length > 0 && !nextLine.startsWith('}') && !nextLine.startsWith('//')) {
            console.log(`⚠️  Potential missing comma at line ${i+1}: ${line}`);
          }
        }
      }
      
      console.log('✅ Basic syntax check complete');
      
    } catch (error) {
      console.error('❌ Syntax error found:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkSyntax();
