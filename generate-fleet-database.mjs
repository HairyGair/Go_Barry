// Generate comprehensive fleet database for Go North East
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bus type patterns based on fleet number ranges
const getBusType = (fleetNumber) => {
    const num = parseInt(fleetNumber);
    
    // Common GNE bus types by fleet number patterns
    if (num >= 3941 && num <= 3965) return 'Volvo B5TL Wright Eclipse Gemini 3';
    if (num >= 5210 && num <= 5284) return 'Wright Streetlite';
    if (num >= 5285 && num <= 5309) return 'Wright Streetlite DF';
    if (num >= 5310 && num <= 5337) return 'Wright Streetlite';
    if (num >= 5338 && num <= 5376) return 'Wright Streetlite Max';
    if (num >= 5377 && num <= 5409) return 'Wright Streetlite';
    if (num >= 5410 && num <= 5419) return 'Optare Solo SR';
    if (num >= 5420 && num <= 5452) return 'Wright Streetlite';
    if (num >= 5453 && num <= 5479) return 'Wright Streetlite DF';
    if (num >= 5480 && num <= 5499) return 'Wright Streetlite';
    if (num >= 6001 && num <= 6014) return 'Volvo B9TL Wright Eclipse Gemini 2';
    if (num >= 6043 && num <= 6070) return 'Volvo B9TL Wright Eclipse Gemini 2';
    if (num >= 6071 && num <= 6098) return 'Volvo B5LH Wright Eclipse Gemini 3';
    if (num >= 6099 && num <= 6117) return 'Volvo B5LH Wright Eclipse Gemini 3';
    if (num >= 6118 && num <= 6146) return 'Volvo B5LH Wright Eclipse Gemini 3';
    if (num >= 6147 && num <= 6161) return 'Volvo B9TL Wright Eclipse Gemini 2';
    if (num >= 6162 && num <= 6175) return 'ADL Enviro200 MMC';
    if (num >= 6308 && num <= 6332) return 'Volvo B5TL Wright Eclipse Gemini 3';
    if (num >= 6333 && num <= 6337) return 'Volvo B5TL Wright Eclipse Gemini 3';
    if (num >= 6338 && num <= 6355) return 'Volvo B5TL Wright Eclipse Gemini 3';
    if (num >= 6356 && num <= 6376) return 'Volvo B5TL Wright Eclipse Gemini 3';
    if (num >= 6917 && num <= 6999) return 'ADL Enviro400 MMC';
    if (num >= 8306 && num <= 8346) return 'Optare Solo';
    
    return 'Wright Streetlite'; // Default
};

// Get capacity based on bus type
const getCapacity = (busType) => {
    if (busType.includes('Solo')) return 29;
    if (busType.includes('Enviro200')) return 37;
    if (busType.includes('Streetlite') && !busType.includes('Max')) return 44;
    if (busType.includes('Streetlite Max')) return 58;
    if (busType.includes('B9TL') || busType.includes('B5TL')) return 85;
    if (busType.includes('B5LH')) return 85;
    if (busType.includes('Enviro400')) return 90;
    return 44; // Default
};

// Get year based on fleet number patterns
const getYear = (fleetNumber) => {
    const num = parseInt(fleetNumber);
    
    if (num >= 3941 && num <= 3965) return 2015;
    if (num >= 5210 && num <= 5249) return 2016;
    if (num >= 5250 && num <= 5284) return 2017;
    if (num >= 5285 && num <= 5309) return 2018;
    if (num >= 5310 && num <= 5337) return 2019;
    if (num >= 5338 && num <= 5376) return 2020;
    if (num >= 5377 && num <= 5409) return 2021;
    if (num >= 5410 && num <= 5419) return 2022;
    if (num >= 5420 && num <= 5452) return 2022;
    if (num >= 5453 && num <= 5479) return 2023;
    if (num >= 5480 && num <= 5499) return 2024;
    if (num >= 6001 && num <= 6014) return 2012;
    if (num >= 6043 && num <= 6070) return 2013;
    if (num >= 6071 && num <= 6098) return 2017;
    if (num >= 6099 && num <= 6117) return 2018;
    if (num >= 6118 && num <= 6146) return 2019;
    if (num >= 6147 && num <= 6161) return 2014;
    if (num >= 6162 && num <= 6175) return 2020;
    if (num >= 6308 && num <= 6332) return 2021;
    if (num >= 6333 && num <= 6337) return 2022;
    if (num >= 6338 && num <= 6355) return 2022;
    if (num >= 6356 && num <= 6376) return 2023;
    if (num >= 6917 && num <= 6999) return 2024;
    if (num >= 8306 && num <= 8346) return 2015;
    
    return 2020; // Default
};

// Generate registration based on year and sequence
const generateRegistration = (year, sequence) => {
    const yearSuffixes = {
        2012: 'CX',
        2013: 'DX',
        2014: 'EX',
        2015: 'FX',
        2016: 'GX',
        2017: 'HX',
        2018: 'JX',
        2019: 'KX',
        2020: 'LX',
        2021: 'MX',
        2022: 'NX',
        2023: 'PX',
        2024: 'RX'
    };
    
    const suffix = yearSuffixes[year] || 'XX';
    const letters = String.fromCharCode(65 + Math.floor(sequence / 999), 65 + Math.floor((sequence % 999) / 37), 65 + (sequence % 37));
    return `N${suffix}${year.toString().slice(-2)}${letters}`;
};

// Depot detection (from existing function)
function detectDepot(fleetNumber) {
    const num = parseInt(fleetNumber);
    
    if (num >= 3941 && num <= 3965) return 'Consett';
    if (num >= 5210 && num <= 5229) return 'Deptford';
    if (num >= 5230 && num <= 5249) return 'Percy Main';
    if (num >= 5250 && num <= 5274) return 'Deptford';
    if (num >= 5275 && num <= 5284) return 'Percy Main';
    if (num >= 5285 && num <= 5309) return 'Riverside';
    if (num >= 5310 && num <= 5337) return 'Washington';
    if (num >= 5338 && num <= 5376) return 'Consett';
    if (num >= 5377 && num <= 5409) return 'Deptford';
    if (num >= 5410 && num <= 5419) return 'Hexham';
    if (num >= 5420 && num <= 5437) return 'Percy Main';
    if (num >= 5438 && num <= 5452) return 'Riverside';
    if (num >= 5453 && num <= 5479) return 'Washington';
    if (num >= 5480 && num <= 5499) return 'Consett';
    if (num >= 6001 && num <= 6007) return 'Deptford';
    if (num >= 6008 && num <= 6014) return 'Hexham';
    if (num >= 6043 && num <= 6048) return 'Percy Main';
    if (num >= 6049 && num <= 6055) return 'Riverside';
    if (num >= 6056 && num <= 6070) return 'Washington';
    if (num >= 6071 && num <= 6084) return 'Consett';
    if (num >= 6085 && num <= 6098) return 'Washington';
    if (num >= 6099 && num <= 6117) return 'Riverside';
    if (num >= 6118 && num <= 6146) return 'Percy Main';
    if (num >= 6147 && num <= 6161) return 'Consett';
    if (num >= 6162 && num <= 6175) return 'Hexham';
    if (num >= 6308 && num <= 6332) return 'Consett';
    if (num >= 6333 && num <= 6337) return 'Washington';
    if (num >= 6338 && num <= 6355) return 'Percy Main';
    if (num >= 6356 && num <= 6376) return 'Riverside';
    if (num >= 6917 && num <= 6923) return 'Percy Main';
    if (num >= 6924 && num <= 6931) return 'Riverside';
    if (num >= 6932 && num <= 6949) return 'Percy Main';
    if (num >= 6950 && num <= 6964) return 'Washington';
    if (num >= 6965 && num <= 6970) return 'Percy Main';
    if (num >= 6971 && num <= 6999) return 'Riverside';
    if (num >= 8306 && num <= 8309) return 'Chester-le-Street';
    if (num >= 8310 && num <= 8319) return 'Stanley';
    if (num >= 8320 && num <= 8324) return 'Chester-le-Street';
    if (num >= 8325 && num <= 8327) return 'Stanley';
    if (num >= 8328 && num <= 8338) return 'Chester-le-Street';
    if (num >= 8339 && num <= 8346) return 'Stanley';
    
    return 'Unknown';
}

// Define fleet ranges to generate
const fleetRanges = [
    { start: 3941, end: 3965 },
    { start: 5210, end: 5284 },
    { start: 5285, end: 5337 },
    { start: 5338, end: 5409 },
    { start: 5410, end: 5419 },
    { start: 5420, end: 5479 },
    { start: 5480, end: 5499 },
    { start: 6001, end: 6014 },
    { start: 6043, end: 6070 },
    { start: 6071, end: 6098 },
    { start: 6099, end: 6146 },
    { start: 6147, end: 6175 },
    { start: 6308, end: 6337 },
    { start: 6338, end: 6376 },
    { start: 6917, end: 6999 },
    { start: 8306, end: 8346 }
];

// Generate the fleet database
function generateFleetDatabase() {
    const fleetDatabase = {};
    let sequenceCounter = 0;
    
    console.log('🚌 Generating Go North East fleet database...');
    
    fleetRanges.forEach(range => {
        for (let num = range.start; num <= range.end; num++) {
            const fleetNumber = num.toString();
            const busType = getBusType(fleetNumber);
            const year = getYear(fleetNumber);
            const registration = generateRegistration(year, sequenceCounter++);
            
            fleetDatabase[fleetNumber] = {
                fleetNumber: fleetNumber,
                registration: registration,
                busType: busType,
                depot: detectDepot(fleetNumber),
                capacity: getCapacity(busType),
                yearOfManufacture: year
            };
        }
    });
    
    // Write the database to file
    const outputPath = path.join(__dirname, 'backend/data/fleet-database.json');
    fs.writeFileSync(outputPath, JSON.stringify(fleetDatabase, null, 2));
    
    console.log(`✅ Fleet database generated successfully!`);
    console.log(`📊 Total vehicles: ${Object.keys(fleetDatabase).length}`);
    
    // Show depot distribution
    const depotCounts = {};
    Object.values(fleetDatabase).forEach(vehicle => {
        depotCounts[vehicle.depot] = (depotCounts[vehicle.depot] || 0) + 1;
    });
    
    console.log('\n📍 Depot Distribution:');
    Object.entries(depotCounts).sort().forEach(([depot, count]) => {
        console.log(`   ${depot}: ${count} vehicles`);
    });
    
    // Show bus type distribution
    const typeCount = {};
    Object.values(fleetDatabase).forEach(vehicle => {
        typeCount[vehicle.busType] = (typeCount[vehicle.busType] || 0) + 1;
    });
    
    console.log('\n🚌 Bus Type Distribution:');
    Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} vehicles`);
    });
    
    console.log(`\n📁 Database saved to: ${outputPath}`);
}

// Run the generator
generateFleetDatabase();
