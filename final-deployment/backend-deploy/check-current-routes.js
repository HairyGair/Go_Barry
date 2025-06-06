// backend/check-current-routes.js
// Check what routes are actually in the GTFS data

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkCurrentRoutes() {
  console.log('🔍 Checking current routes in GTFS data...\n');
  
  try {
    // Read routes.txt
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const content = await fs.readFile(routesPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) {
      console.log('❌ No route data found');
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('📋 Headers:', headers);
    
    const routeIdIndex = headers.indexOf('route_id');
    const routeShortNameIndex = headers.indexOf('route_short_name');
    const routeLongNameIndex = headers.indexOf('route_long_name');
    
    const routes = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        const route = {
          id: values[routeIdIndex],
          shortName: values[routeShortNameIndex],
          longName: values[routeLongNameIndex]
        };
        
        if (route.id && route.shortName) {
          routes.push(route);
        }
      }
    }
    
    console.log(`📊 Found ${routes.length} routes in GTFS data\n`);
    
    // Group and analyze routes
    const routesByType = {
      numbers: [],
      letters: [],
      x_routes: [],
      q_routes: [],
      other: []
    };
    
    routes.forEach(route => {
      const name = route.shortName;
      
      if (/^\d+$/.test(name)) {
        routesByType.numbers.push(route);
      } else if (/^[A-Z]$/.test(name)) {
        routesByType.letters.push(route);
      } else if (name.startsWith('X')) {
        routesByType.x_routes.push(route);
      } else if (name.startsWith('Q')) {
        routesByType.q_routes.push(route);
      } else {
        routesByType.other.push(route);
      }
    });
    
    // Display by category
    console.log('📊 Routes by type:');
    console.log('==================\n');
    
    if (routesByType.numbers.length > 0) {
      console.log(`🔢 Numbered Routes (${routesByType.numbers.length}):`);
      const numberRoutes = routesByType.numbers.map(r => r.shortName).sort((a, b) => parseInt(a) - parseInt(b));
      console.log(`   ${numberRoutes.join(', ')}\n`);
    }
    
    if (routesByType.x_routes.length > 0) {
      console.log(`🚌 X Routes (${routesByType.x_routes.length}):`);
      const xRoutes = routesByType.x_routes.map(r => r.shortName).sort();
      console.log(`   ${xRoutes.join(', ')}\n`);
    }
    
    if (routesByType.q_routes.length > 0) {
      console.log(`🅿️ Q Routes (${routesByType.q_routes.length}):`);
      const qRoutes = routesByType.q_routes.map(r => r.shortName).sort();
      console.log(`   ${qRoutes.join(', ')}`);
      console.log(`   ⚠️ Note: Q routes may be discontinued - please verify\n`);
    }
    
    if (routesByType.letters.length > 0) {
      console.log(`🔤 Letter Routes (${routesByType.letters.length}):`);
      const letterRoutes = routesByType.letters.map(r => r.shortName).sort();
      console.log(`   ${letterRoutes.join(', ')}\n`);
    }
    
    if (routesByType.other.length > 0) {
      console.log(`🎯 Other Routes (${routesByType.other.length}):`);
      const otherRoutes = routesByType.other.map(r => r.shortName).sort();
      console.log(`   ${otherRoutes.join(', ')}\n`);
    }
    
    // Check for specific questionable routes
    console.log('🔍 Checking for potentially discontinued routes:');
    console.log('===============================================\n');
    
    const questionableRoutes = ['Q1', 'Q2', 'Q3', '10', '11'];
    const foundQuestionable = [];
    const notFoundQuestionable = [];
    
    questionableRoutes.forEach(routeName => {
      const found = routes.find(r => r.shortName === routeName);
      if (found) {
        foundQuestionable.push(found);
      } else {
        notFoundQuestionable.push(routeName);
      }
    });
    
    if (foundQuestionable.length > 0) {
      console.log('⚠️ Found these potentially discontinued routes in GTFS:');
      foundQuestionable.forEach(route => {
        console.log(`   ${route.shortName}: ${route.longName}`);
      });
      console.log('   → This suggests the GTFS data may be outdated\n');
    }
    
    if (notFoundQuestionable.length > 0) {
      console.log('✅ These routes are NOT in GTFS (correctly discontinued):');
      console.log(`   ${notFoundQuestionable.join(', ')}\n`);
    }
    
    // Sample some actual current-looking routes
    console.log('🎯 Sample of routes that look current:');
    console.log('=====================================\n');
    
    const currentLookingRoutes = routes.filter(r => {
      const name = r.shortName;
      return /^\d+$/.test(name) || name.startsWith('X') || ['H', 'TOON'].includes(name);
    }).slice(0, 20);
    
    currentLookingRoutes.forEach(route => {
      console.log(`   ${route.shortName}: ${route.longName || 'No description'}`);
    });
    
    // Check when this GTFS data might be from
    console.log('\n📅 Trying to determine GTFS data age...');
    
    // Check calendar.txt for date ranges
    try {
      const calendarPath = path.join(__dirname, 'data', 'calendar.txt');
      const calendarContent = await fs.readFile(calendarPath, 'utf8');
      const calendarLines = calendarContent.split('\n');
      
      if (calendarLines.length > 1) {
        const calendarHeaders = calendarLines[0].split(',');
        const startDateIndex = calendarHeaders.indexOf('start_date');
        const endDateIndex = calendarHeaders.indexOf('end_date');
        
        if (startDateIndex !== -1 && endDateIndex !== -1) {
          let earliestStart = '99999999';
          let latestEnd = '00000000';
          
          for (let i = 1; i < Math.min(10, calendarLines.length); i++) {
            if (calendarLines[i].trim()) {
              const values = calendarLines[i].split(',');
              const startDate = values[startDateIndex];
              const endDate = values[endDateIndex];
              
              if (startDate && startDate < earliestStart) earliestStart = startDate;
              if (endDate && endDate > latestEnd) latestEnd = endDate;
            }
          }
          
          if (earliestStart !== '99999999' && latestEnd !== '00000000') {
            const startFormatted = `${earliestStart.slice(0,4)}-${earliestStart.slice(4,6)}-${earliestStart.slice(6,8)}`;
            const endFormatted = `${latestEnd.slice(0,4)}-${latestEnd.slice(4,6)}-${latestEnd.slice(6,8)}`;
            
            console.log(`📅 GTFS date range: ${startFormatted} to ${endFormatted}`);
            
            const endDate = new Date(endFormatted);
            const now = new Date();
            const daysDiff = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 0) {
              console.log(`⚠️ Data expired ${daysDiff} days ago - may be outdated`);
            } else {
              console.log(`✅ Data is current (expires in ${Math.abs(daysDiff)} days)`);
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ Could not read calendar.txt to check dates');
    }
    
  } catch (error) {
    console.error('❌ Error checking routes:', error.message);
  }
}

checkCurrentRoutes();