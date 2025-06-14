#!/usr/bin/env node

/**
 * Test API keys locally to verify they're still valid
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'backend', '.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testTomTom() {
  console.log(`\n${colors.blue}Testing TomTom API...${colors.reset}`);
  const apiKey = process.env.TOMTOM_API_KEY;
  
  if (!apiKey) {
    console.log(`${colors.red}❌ No TomTom API key found in .env${colors.reset}`);
    return;
  }
  
  console.log(`Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=-1.8,54.85,-1.4,55.05&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,aci{probabilityOfOccurrence,numberOfReports,lastReportTime}}}}`;
    
    const response = await fetch(url);
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (response.status === 403) {
      console.log(`${colors.red}❌ TomTom API key is invalid or rate limited${colors.reset}`);
    } else if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ TomTom API key is valid! (${data.incidents?.length || 0} incidents)${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testNationalHighways() {
  console.log(`\n${colors.blue}Testing National Highways API...${colors.reset}`);
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  
  if (!apiKey) {
    console.log(`${colors.red}❌ No National Highways API key found in .env${colors.reset}`);
    return;
  }
  
  console.log(`Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    const url = 'https://m.highwaysengland.co.uk/feeds/rss/UnplannedEvents.xml';
    const response = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      }
    });
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log(`${colors.red}❌ National Highways API key is invalid${colors.reset}`);
    } else if (response.ok) {
      console.log(`${colors.green}✅ National Highways API key is valid!${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testHERE() {
  console.log(`\n${colors.blue}Testing HERE API...${colors.reset}`);
  const apiKey = process.env.HERE_API_KEY;
  
  if (!apiKey) {
    console.log(`${colors.red}❌ No HERE API key found in .env${colors.reset}`);
    return;
  }
  
  console.log(`Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    const url = `https://data.traffic.hereapi.com/v7/incidents?locationReferencing=shape&bbox=-1.8,54.85,-1.4,55.05&apiKey=${apiKey}`;
    const response = await fetch(url);
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log(`${colors.red}❌ HERE API key is invalid${colors.reset}`);
    } else if (response.ok) {
      console.log(`${colors.green}✅ HERE API key is valid!${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

console.log(`${colors.yellow}🔑 Testing API Keys Locally${colors.reset}`);
console.log(`${'='.repeat(30)}`);

// Test all APIs
Promise.all([
  testTomTom(),
  testNationalHighways(),
  testHERE()
]).then(() => {
  console.log(`\n${colors.yellow}📋 Summary:${colors.reset}`);
  console.log(`If any keys show as invalid locally, they need to be renewed.`);
  console.log(`If they work locally but not on Render, the keys on Render are wrong.`);
});
