// Check for syntax errors in the problematic files
import { readFile } from 'fs/promises';

async function checkFileForSyntaxError(filePath) {
  console.log(`\nChecking ${filePath} for syntax errors...`);
  
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check for BOM or invisible characters
    if (content.charCodeAt(0) === 0xFEFF) {
      console.log('❌ File contains BOM (Byte Order Mark)');
    }
    
    // Check each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for null bytes
      if (line.includes('\0')) {
        console.log(`❌ Line ${i + 1}: Contains null byte`);
      }
      
      // Check for control characters
      for (let j = 0; j < line.length; j++) {
        const charCode = line.charCodeAt(j);
        if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
          console.log(`❌ Line ${i + 1}, position ${j + 1}: Control character (code ${charCode})`);
        }
      }
    }
    
    // Try to import
    try {
      await import(filePath);
      console.log('✅ File can be imported');
    } catch (error) {
      console.log('❌ Import error:', error.message);
      // Extract line number if available
      const match = error.stack.match(/:(\d+):(\d+)/);
      if (match) {
        const lineNum = parseInt(match[1]);
        const colNum = parseInt(match[2]);
        console.log(`\n🎯 Error at line ${lineNum}, column ${colNum}`);
        if (lineNum <= lines.length) {
          console.log(`Line ${lineNum}: ${lines[lineNum - 1]}`);
          console.log(' '.repeat(10 + colNum) + '^');
        }
      }
    }
    
  } catch (error) {
    console.error('Error reading file:', error);
  }
}

// Check both problematic files
checkFileForSyntaxError('./routes/unifiedRoadworksAPI.js');
checkFileForSyntaxError('./services/realTimeDisruptionScoring.js');
