import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Checking for GNE Fleet Master Excel file...\n');

// Check current directory
if (fs.existsSync('GNE_Fleet_Master.xlsx')) {
    console.log('✅ Found GNE_Fleet_Master.xlsx in current directory');
    console.log('📊 Running fleet database generator...\n');
    
    try {
        execSync('node generate-gne-fleet-json.mjs', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Error generating database:', error.message);
    }
} else {
    console.log('❌ GNE_Fleet_Master.xlsx not found in current directory');
    console.log('\nPlease do one of the following:');
    console.log('1. Copy GNE_Fleet_Master.xlsx to this directory');
    console.log('2. Run with the path to your Excel file:');
    console.log('   node generate-gne-fleet-json.mjs /path/to/GNE_Fleet_Master.xlsx');
    console.log('\nExample:');
    console.log('   node generate-gne-fleet-json.mjs ~/Downloads/GNE_Fleet_Master.xlsx');
}
