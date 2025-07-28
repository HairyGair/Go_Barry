const fs = require('fs');
const content = fs.readFileSync('/Users/anthony/Go BARRY App/backend/index.js', 'utf8');

// Search for all occurrences of roadworksAPI being used
const lines = content.split('\n');
const roadworksAPIUsages = [];

lines.forEach((line, index) => {
  if (line.includes('roadworksAPI') && !line.includes('import')) {
    roadworksAPIUsages.push({
      lineNumber: index + 1,
      content: line.trim()
    });
  }
});

console.log('roadworksAPI usages (excluding import):');
roadworksAPIUsages.forEach(usage => {
  console.log(`Line ${usage.lineNumber}: ${usage.content}`);
});

// Also check for any app.use with roadworks
console.log('\nAll app.use lines with roadworks:');
lines.forEach((line, index) => {
  if (line.includes('app.use') && line.toLowerCase().includes('roadwork')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});