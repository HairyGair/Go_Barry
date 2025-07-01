// Quick fix script to add missing semicolons
// This adds semicolons after common patterns that might be missing them

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.js');
let content = fs.readFileSync(indexPath, 'utf-8');

// Add semicolons after promise chains if missing
content = content.replace(/\}\)\.catch\(.*?\}\)(\s*\n)/g, (match, newline) => {
  if (!match.endsWith('});')) {
    return match.slice(0, -newline.length) + ';' + newline;
  }
  return match;
});

// Add semicolons after console.log statements if missing
content = content.replace(/console\.log\([^)]+\)(\s*\n)/g, (match, newline) => {
  if (!match.includes(';')) {
    return match.slice(0, -newline.length) + ';' + newline;
  }
  return match;
});

// Save the fixed file
fs.writeFileSync(indexPath + '.fixed', content);
console.log('Fixed file saved as index.js.fixed');
console.log('Review the changes and rename to index.js if correct');
