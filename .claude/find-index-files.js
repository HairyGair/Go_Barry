const fs = require('fs');
const path = require('path');

function findIndexFiles(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findIndexFiles(fullPath, results);
      } else if (file === 'index.jsx') {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  return results;
}

const goBarryPath = '/Users/anthony/Go BARRY App/Go_BARRY';
const indexFiles = findIndexFiles(goBarryPath);

console.log('Found index.jsx files:');
indexFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
  
  // Check if file contains fetchDisruptionStats
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('fetchDisruptionStats') || 
        content.includes('/api/roadworks') || 
        content.includes('/api/incident-alerts')) {
      console.log('   ⚠️  Contains relevant API calls!');
      
      // Find the specific line
      const lines = content.split('\n');
      lines.forEach((line, lineIndex) => {
        if (line.includes('/api/roadworks') || line.includes('/api/incident-alerts')) {
          console.log(`   Line ${lineIndex + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (error) {
    console.log('   Error reading file:', error.message);
  }
});