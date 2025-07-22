const fs = require('fs');

// Read the App.js file
const filePath = '/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/App.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of the GoBARRY text branding with the logo
// Pattern 1: Text within divs with font styling (text-3xl)
const pattern1 = /<div className="flex items-center">\s*<span className="text-3xl font-black text-white">Go<\/span>\s*<span className="text-3xl font-black text-red-500">BARRY<\/span>\s*<\/div>/g;
const replacement1 = '<div className="flex items-center">\n                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />\n                                    </div>';

// Pattern 2: H1 with text-2xl
const pattern2 = /<h1 className="text-2xl font-bold">\s*<span className="text-white">Go<\/span>\s*<span className="text-red-500">BARRY<\/span>\s*<\/h1>/g;
const replacement2 = '<img src="../gobarry-logo.png" alt="Go BARRY" className="h-8 w-auto" />';

// Count matches
const matches1 = content.match(pattern1) || [];
const matches2 = content.match(pattern2) || [];

console.log(`Found ${matches1.length} instances of pattern 1 (text-3xl)`);
console.log(`Found ${matches2.length} instances of pattern 2 (text-2xl)`);

// Replace
content = content.replace(pattern1, replacement1);
content = content.replace(pattern2, replacement2);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`Total replacements made: ${matches1.length + matches2.length}`);
console.log('File updated successfully!');