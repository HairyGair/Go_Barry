// This script will update all remaining text-based "Go BARRY" headers to use the logo

const fs = require('fs');
const path = require('path');

// Read the file
const filePath = '/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/App.js';
let content = fs.readFileSync(filePath, 'utf8');

// Count initial occurrences
const initialTextCount = (content.match(/<span className="text-3xl font-black text-white">Go<\/span>/g) || []).length;
const initialLogoCount = (content.match(/img src="\.\.\/gobarry-logo\.png"/g) || []).length;

console.log('Initial state:');
console.log(`Text-based "Go BARRY": ${initialTextCount}`);
console.log(`Logo images: ${initialLogoCount}`);

// Replace all text-based headers with logo
const oldPattern = `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`;

const newPattern = `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`;

// Count how many replacements will be made
const matches = content.split(oldPattern).length - 1;
console.log(`\nReplacements to be made: ${matches}`);

// Replace all occurrences
content = content.split(oldPattern).join(newPattern);

// Write the updated file
fs.writeFileSync(filePath, content, 'utf8');

// Verify the update
const finalTextCount = (content.match(/<span className="text-3xl font-black text-white">Go<\/span>/g) || []).length;
const finalLogoCount = (content.match(/img src="\.\.\/gobarry-logo\.png"/g) || []).length;

console.log('\nFinal state:');
console.log(`Text-based "Go BARRY": ${finalTextCount}`);
console.log(`Logo images: ${finalLogoCount}`);
console.log('\nUpdate complete!');
