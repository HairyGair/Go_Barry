import fs from 'fs/promises';

const content = await fs.readFile('/Users/anthony/Go BARRY App/backend/index.js', 'utf8');
const lines = content.split('\n');

console.log(`Total lines in file: ${lines.length}`);
console.log(`File ends with: "${lines[lines.length - 1]}"`);

// Find the line that says "Add more route registrations here..."
const addMoreIndex = lines.findIndex(line => line.includes('Add more route registrations here...'));
console.log(`\n"Add more route registrations here..." found at line: ${addMoreIndex + 1}`);

// Check if there's content after this line
if (addMoreIndex >= 0 && addMoreIndex < lines.length - 1) {
  console.log('\nContent after "Add more route registrations here...":');
  for (let i = addMoreIndex + 1; i < Math.min(addMoreIndex + 20, lines.length); i++) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
} else {
  console.log('\nNo content after "Add more route registrations here..."');
}