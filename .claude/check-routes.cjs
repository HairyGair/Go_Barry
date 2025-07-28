// Check backend/index.js for route registrations
const fs = require('fs');

try {
  const content = fs.readFileSync('/Users/anthony/Go BARRY App/backend/index.js', 'utf8');
  const lines = content.split('\n');
  
  console.log('=== SEARCHING FOR ROUTE REGISTRATIONS ===\n');
  
  // Find ALL app.use lines
  console.log('All app.use() calls found:');
  console.log('-------------------------');
  
  lines.forEach((line, index) => {
    if (line.includes('app.use(')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
  
  console.log('\n=== ROADWORKS-RELATED IMPORTS ===');
  console.log('----------------------------------');
  
  lines.forEach((line, index) => {
    if (line.includes('roadwork') && line.includes('import')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
  
  // Check if file continues after current endpoint
  const lastLine = lines[lines.length - 1];
  console.log(`\nTotal lines: ${lines.length}`);
  console.log(`Last line: "${lastLine}"`);
  
} catch (error) {
  console.error('Error reading file:', error.message);
}