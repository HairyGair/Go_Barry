// Find the exact syntax error
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function findSyntaxError() {
  console.log('Checking for syntax errors in intelligenceAPINew.js...\n');
  
  try {
    const filePath = join(__dirname, 'routes', 'intelligenceAPINew.js');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check each line for problematic characters
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for BOM
      if (i === 0 && line.charCodeAt(0) === 0xFEFF) {
        console.log(`❌ Line 1: Contains BOM (Byte Order Mark)`);
      }
      
      // Check for null bytes
      if (line.includes('\0')) {
        console.log(`❌ Line ${i + 1}: Contains null byte`);
      }
      
      // Check for other control characters
      for (let j = 0; j < line.length; j++) {
        const charCode = line.charCodeAt(j);
        if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
          console.log(`❌ Line ${i + 1}, position ${j + 1}: Control character (code ${charCode})`);
        }
        if (charCode > 127 && charCode < 160) {
          console.log(`❌ Line ${i + 1}, position ${j + 1}: Extended ASCII character (code ${charCode})`);
        }
      }
    }
    
    // Try to actually parse it
    console.log('\nAttempting to dynamically import the module...');
    try {
      const module = await import('./routes/intelligenceAPINew.js');
      console.log('✅ Module imported successfully!');
    } catch (error) {
      console.log('❌ Import failed:', error.message);
      
      // Try to extract line number from error
      const match = error.stack.match(/intelligenceAPINew\.js:(\d+):(\d+)/);
      if (match) {
        const lineNum = parseInt(match[1]);
        const colNum = parseInt(match[2]);
        console.log(`\n🎯 Error at line ${lineNum}, column ${colNum}`);
        if (lineNum <= lines.length) {
          console.log(`Line ${lineNum}: ${lines[lineNum - 1]}`);
          console.log(' '.repeat(colNum - 1) + '^');
        }
      }
    }
    
  } catch (error) {
    console.error('Error reading file:', error);
  }
}

findSyntaxError();
