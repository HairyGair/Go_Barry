// check-gtfs-structure.js
// Quick script to check GTFS data structure

import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';

async function checkGTFSStructure() {
    console.log('🔍 Checking GTFS data structure...\n');
    
    try {
        // Check trips.txt structure
        const tripsContent = await fs.readFile('./backend/data/trips.txt', 'utf-8');
        const tripsData = parse(tripsContent, { 
            columns: true, 
            skip_empty_lines: true,
            to_line: 10 // Just first 10 lines
        });
        
        console.log('📋 TRIPS.TXT Structure:');
        console.log('Columns:', Object.keys(tripsData[0]));
        console.log('Sample row:', tripsData[0]);
        
        // Check stop_times.txt structure
        const stopTimesContent = await fs.readFile('./backend/data/stop_times.txt', 'utf-8');
        const stopTimesData = parse(stopTimesContent, { 
            columns: true, 
            skip_empty_lines: true,
            to_line: 10
        });
        
        console.log('\n📋 STOP_TIMES.TXT Structure:');
        console.log('Columns:', Object.keys(stopTimesData[0]));
        console.log('Sample row:', stopTimesData[0]);
        
        // Check calendar.txt structure
        const calendarContent = await fs.readFile('./backend/data/calendar.txt', 'utf-8');
        const calendarData = parse(calendarContent, { 
            columns: true, 
            skip_empty_lines: true,
            to_line: 10
        });
        
        console.log('\n📋 CALENDAR.TXT Structure:');
        console.log('Columns:', Object.keys(calendarData[0]));
        console.log('Sample row:', calendarData[0]);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkGTFSStructure();