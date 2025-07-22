const fs = require('fs');
const path = require('path');

// Read the App.js file
const filePath = path.join(__dirname, 'public', 'breakdown-guide', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match the header sections with text-based Go BARRY
const patterns = [
    // Pattern 1: Separate span elements
    /<div className="flex items-center">\s*<span className="text-3xl font-black text-white">Go<\/span>\s*<span className="text-3xl font-black text-red-500">BARRY<\/span>\s*<\/div>/g,
    
    // Pattern 2: With space between elements
    /<div className="flex items-center space-x-1">\s*<span className="text-3xl font-black text-white">Go<\/span>\s*<span className="text-3xl font-black text-red-500">BARRY<\/span>\s*<\/div>/g,
    
    // Pattern 3: Any variation with flex items-center containing the Go BARRY text
    /<div className="flex items-center(?:\s+space-x-\d+)?">\s*<span className="text-\d+xl font-black text-white">Go<\/span>\s*<span className="text-\d+xl font-black text-red-500">BARRY<\/span>\s*<\/div>/g
];

// Replacement with logo
const replacement = '<div className="flex items-center">\n                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />\n                                    </div>';

// Count replacements
let totalReplacements = 0;

// Apply all patterns
patterns.forEach((pattern, index) => {
    const matches = content.match(pattern) || [];
    console.log(`Pattern ${index + 1}: Found ${matches.length} matches`);
    totalReplacements += matches.length;
    content = content.replace(pattern, replacement);
});

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\nTotal replacements made: ${totalReplacements}`);
console.log('Headers updated successfully!');

// Show a sample of the updated headers
const updatedMatches = content.match(/<img src="\.\.\/gobarry-logo\.png"/g) || [];
console.log(`\nTotal logo images in file: ${updatedMatches.length}`);
