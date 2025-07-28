#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'index.js');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`File size: ${content.length} bytes`);
  console.log(`Total lines: ${lines.length}`);
  console.log(`\nLast 10 lines of file:`);
  console.log('=======================');
  
  for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
  
  // Check if file seems complete
  const hasExport = content.includes('export default') || content.includes('module.exports');
  const endsAbruptly = lines[lines.length - 1].trim() === '// Add more route registrations here...';
  
  console.log(`\nFile analysis:`);
  console.log(`- Has export statement: ${hasExport}`);
  console.log(`- Ends abruptly: ${endsAbruptly}`);
  
  if (endsAbruptly) {
    console.log('\n⚠️  WARNING: File appears to be incomplete!');
    console.log('The route registrations are not finished.');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}