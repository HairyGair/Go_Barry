const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'public', 'breakdown-guide', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// Count initial occurrences
const initialTextCount = (content.match(/<span className="text-3xl font-black text-white">Go<\/span>/g) || []).length;
console.log(`Found ${initialTextCount} text-based "Go BARRY" headers to replace`);

// Replace all occurrences
const oldPattern = `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`;

const newPattern = `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`;

// Count how many will be replaced
const replacementCount = content.split(oldPattern).length - 1;
console.log(`Will replace ${replacementCount} instances`);

// Replace all
content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

// Verify
const finalTextCount = (content.match(/<span className="text-3xl font-black text-white">Go<\/span>/g) || []).length;
const finalLogoCount = (content.match(/img src="\.\.\/gobarry-logo\.png"/g) || []).length;

console.log('\nUpdate complete!');
console.log(`Remaining text-based headers: ${finalTextCount}`);
console.log(`Total logo headers: ${finalLogoCount}`);
