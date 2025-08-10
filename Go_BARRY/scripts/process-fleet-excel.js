// Script to process GNE Fleet Master Excel and create JSON database
// This processes the Excel file and creates fleet-database.json

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Helper function to extract year from registration
function extractYear(regNumber) {
    if (!regNumber) return 2015;
    
    // Common registration prefixes and their years
    const patterns = {
        'NL74': 2024, 'NL73': 2023, 'YY72': 2022, 'YY22': 2022, 'YX71': 2021, 'YX21': 2021,
        'YX70': 2020, 'YX20': 2020, 'NK69': 2019, 'NX69': 2019, 'NK19': 2019,
        'SN18': 2018, 'SN67': 2017, 'SP67': 2017, 'NK66': 2016, 'SP16': 2016,
        'SN65': 2015, 'SN15': 2015, 'NK64': 2014, 'SN64': 2014, 'NK13': 2013,
        'NK62': 2012, 'NK61': 2011, 'NK60': 2010, 'NK59': 2009, 'NX58': 2008,
        'NK57': 2007, 'NK56': 2006, 'NK55': 2005, 'NK54': 2004, 'NK53': 2003
    };
    
    // Check patterns
    for (const [pattern, year] of Object.entries(patterns)) {
        if (regNumber.toUpperCase().includes(pattern)) return year;
    }
    
    // Try standard UK format (AB12 CDE)
    const match = regNumber.match(/^[A-Z]{2}(\d{2})/);
    if (match) {
        const yearCode = parseInt(match[1]);
        if (yearCode >= 51 && yearCode <= 99) {
            return 2000 + yearCode - 50;
        } else if (yearCode >= 1 && yearCode <= 50) {
            return 2000 + yearCode;
        }
    }
    
    return 2015; // Default
}

// Helper function to determine capacity based on vehicle type
function extractCapacity(busType) {
    if (!busType) return 50;
    
    const typeStr = busType.toLowerCase();
    
    // Double deckers
    if (typeStr.includes('double deck') || typeStr.includes('streetdeck') || 
        typeStr.includes('enviro400') || typeStr.includes('b9tl') || 
        typeStr.includes('volvo b7tl')) {
        return 85;
    }
    
    // Large single decks
    if (typeStr.includes('omnicity') || typeStr.includes('citaro') || 
        typeStr.includes('enviro300') || typeStr.includes('eclipse')) {
        return 75;
    }
    
    // Medium buses
    if (typeStr.includes('versa') || typeStr.includes('streetlite')) {
        return 40;
    }
    
    // Small buses
    if (typeStr.includes('solo')) {
        return 30;
    }
    
    // Minibuses
    if (typeStr.includes('sprinter') || typeStr.includes('minibus')) {
        return 16;
    }
    
    // Coaches
    if (typeStr.includes('coach') || typeStr.includes('levante')) {
        return 53;
    }
    
    return 50; // Default
}

// Main processing function
function processFleetExcel(inputFile, outputFile) {
    console.log('📂 Reading Excel file:', inputFile);
    
    // Read the workbook
    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    console.log(`📊 Found ${rawData.length} rows in Excel file`);
    
    // Process the data
    const fleetData = {};
    let validRecords = 0;
    let skippedRecords = 0;
    
    // Skip header row, process from row 2
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Skip empty rows
        if (!row || row.length === 0) {
            skippedRecords++;
            continue;
        }
        
        // Extract fields
        const fleetNo = row[3]?.toString().trim();
        const regNumber = row[4]?.toString().trim();
        
        // Skip rows without fleet number or registration
        if (!fleetNo || !regNumber || fleetNo === '' || regNumber === '') {
            skippedRecords++;
            continue;
        }
        
        // Create vehicle object
        const vehicle = {
            fleetNumber: fleetNo,
            registration: regNumber,
            depot: row[1] || row[0] || 'Unknown',
            busType: row[5] || 'Unknown',
            capacity: extractCapacity(row[5]),
            yearOfManufacture: extractYear(regNumber)
        };
        
        fleetData[fleetNo] = vehicle;
        validRecords++;
    }
    
    console.log(`✅ Processed ${validRecords} valid vehicles`);
    console.log(`⚠️  Skipped ${skippedRecords} invalid/empty rows`);
    
    // Show depot distribution
    const depotCounts = {};
    Object.values(fleetData).forEach(v => {
        depotCounts[v.depot] = (depotCounts[v.depot] || 0) + 1;
    });
    
    console.log('\n📊 Fleet Distribution by Depot:');
    Object.entries(depotCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([depot, count]) => {
            console.log(`   ${depot}: ${count} vehicles`);
        });
    
    // Write the JSON file
    const jsonContent = JSON.stringify(fleetData, null, 2);
    fs.writeFileSync(outputFile, jsonContent);
    
    console.log(`\n✅ Fleet database created: ${outputFile}`);
    console.log(`📦 File size: ${(jsonContent.length / 1024).toFixed(2)} KB`);
    
    // Show sample entries
    console.log('\n📋 Sample entries:');
    const samples = Object.values(fleetData).slice(0, 3);
    samples.forEach(v => {
        console.log(`   Fleet ${v.fleetNumber} - ${v.registration} (${v.busType})`);
    });
    
    return fleetData;
}

// Run the script if called directly
if (require.main === module) {
    const inputFile = path.join(__dirname, '../public/GNE_Fleet_Master.xlsx');
    const outputFile = path.join(__dirname, '../public/backend/data/fleet-database.json');
    
    if (!fs.existsSync(inputFile)) {
        console.error('❌ Excel file not found:', inputFile);
        process.exit(1);
    }
    
    processFleetExcel(inputFile, outputFile);
}

module.exports = { processFleetExcel };
