// Test if intelligenceAPINew.js can be imported in isolation
import { readFile } from 'fs/promises';

async function checkSyntax() {
  try {
    // Read the file content
    const content = await readFile('./routes/intelligenceAPINew.js', 'utf-8');
    
    // Check for common syntax issues
    console.log('File size:', content.length);
    console.log('Contains non-ASCII:', /[^\x00-\x7F]/.test(content));
    
    // Look for problematic characters
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Check for invisible characters
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(line)) {
        console.log(`Line ${index + 1} contains control characters`);
      }
      // Check for zero-width characters
      if (/[\u200B-\u200D\uFEFF]/.test(line)) {
        console.log(`Line ${index + 1} contains zero-width characters`);
      }
    });
    
    // Try dynamic import
    try {
      await import('./routes/intelligenceAPINew.js');
      console.log('✅ File can be imported');
    } catch (e) {
      console.log('❌ Import error:', e.message);
      console.log('Stack:', e.stack);
    }
    
  } catch (error) {
    console.error('Error reading file:', error);
  }
}

checkSyntax();
