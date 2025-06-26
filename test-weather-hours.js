// Test weather API working hours
// Run with: node test-weather-hours.js

import { weatherService } from './backend/services/weatherService.js';

console.log('🕐 Testing Weather API Working Hours');
console.log('=====================================\n');

// Test different times
const testTimes = [
  { hour: 5, minute: 59, expected: false, desc: '05:59 - Just before start' },
  { hour: 6, minute: 0, expected: true, desc: '06:00 - Start of working hours' },
  { hour: 12, minute: 0, expected: true, desc: '12:00 - Midday' },
  { hour: 18, minute: 30, expected: true, desc: '18:30 - Evening' },
  { hour: 23, minute: 59, expected: true, desc: '23:59 - Late night' },
  { hour: 0, minute: 0, expected: true, desc: '00:00 - Midnight' },
  { hour: 0, minute: 14, expected: true, desc: '00:14 - Just before cutoff' },
  { hour: 0, minute: 15, expected: true, desc: '00:15 - Last minute' },
  { hour: 0, minute: 16, expected: false, desc: '00:16 - Just after cutoff' },
  { hour: 2, minute: 0, expected: false, desc: '02:00 - Middle of night' },
];

// Save original date
const originalDate = Date;

testTimes.forEach(test => {
  // Mock the date
  global.Date = class extends originalDate {
    constructor() {
      super();
      this.getHours = () => test.hour;
      this.getMinutes = () => test.minute;
    }
    
    static now() {
      return originalDate.now();
    }
    
    toDateString() {
      return new originalDate().toDateString();
    }
    
    toLocaleTimeString() {
      return `${test.hour.toString().padStart(2, '0')}:${test.minute.toString().padStart(2, '0')}:00`;
    }
  };
  
  // Test
  const inWorkingHours = weatherService.isWithinWorkingHours();
  const canMakeCall = weatherService.canMakeAPICall();
  const status = test.expected ? '✅' : '❌';
  const result = inWorkingHours === test.expected ? 'PASS ✓' : 'FAIL ✗';
  
  console.log(`${status} ${test.desc}`);
  console.log(`   Expected: ${test.expected}, Got: ${inWorkingHours} - ${result}`);
  console.log(`   Can make API call: ${canMakeCall}\n`);
});

// Restore original date
global.Date = originalDate;

// Show current status
console.log('\n📊 Current Weather API Status:');
const currentStatus = weatherService.getAPIStatus();
console.log(`   Time: ${currentStatus.currentTime}`);
console.log(`   Working Hours: ${currentStatus.workingHours}`);
console.log(`   Currently: ${currentStatus.isInWorkingHours ? 'WITHIN WORKING HOURS' : 'OUTSIDE WORKING HOURS'}`);
console.log(`   Can Make Calls: ${currentStatus.canMakeCall ? 'YES' : 'NO'}`);
console.log(`   Daily Usage: ${currentStatus.dailyCallCount}/${currentStatus.dailyCallLimit}`);
console.log(`   Estimated Daily: ${currentStatus.estimatedDailyUsage} calls`);
console.log(`   Savings: ${currentStatus.savingsFromWorkingHours}`);
