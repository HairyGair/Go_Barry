// Monitor weather API usage for Go BARRY
// Run with: node monitor-weather-api.js

import fetch from 'node-fetch';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://go-barry.onrender.com' 
  : 'http://localhost:3001';

async function checkWeatherAPIStatus() {
  console.log('🌤️  GO BARRY Weather API Monitor');
  console.log('================================\n');
  
  try {
    // Check API status
    const statusResponse = await fetch(`${API_URL}/api/weather/status`);
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      const status = statusData.status;
      
      console.log('📊 API Usage Status:');
      console.log(`   Current Time: ${status.currentTime}`);
      console.log(`   Working Hours: ${status.workingHours} 🕰️`);
      console.log(`   Currently: ${status.isInWorkingHours ? '✅ WITHIN WORKING HOURS' : '🌙 OUTSIDE WORKING HOURS'}`);
      console.log(`\n   Daily Calls Used: ${status.dailyCallCount}/${status.dailyCallLimit}`);
      console.log(`   Remaining Calls: ${status.remainingCalls}`);
      console.log(`   Usage Percentage: ${status.percentageUsed}%`);
      console.log(`   Can Make Calls: ${status.canMakeCall ? '✅ YES' : '❌ NO'}`);
      console.log(`   Cache Duration: ${status.cacheExpiry} minutes`);
      console.log(`   Estimated Daily Usage: ${status.estimatedDailyUsage} calls (within working hours)`);
      console.log(`   If 24/7 Operation: ${status.estimatedDailyUsageAllDay} calls`);
      console.log(`   Savings from Hours: ${status.savingsFromWorkingHours}`);
      console.log(`   Status: ${status.recommendation}`);
      console.log(`   Last Reset: ${status.lastResetDate}\n`);
      
      // Visual progress bar
      const progressBar = createProgressBar(status.percentageUsed);
      console.log(`   Usage: ${progressBar}`);
      
      // Warnings
      if (status.percentageUsed > 80) {
        console.log('\n⚠️  WARNING: Approaching daily limit!');
      }
      if (status.estimatedDailyUsage > 900) {
        console.log('⚠️  WARNING: Current settings may exceed daily limit!');
        console.log('   Recommendation: Increase cache duration or reduce fetch frequency');
      }
      
    } else {
      console.error('❌ Failed to get weather API status:', statusData.error);
    }
    
    // Check current weather data
    console.log('\n📍 Current Weather Data:');
    const weatherResponse = await fetch(`${API_URL}/api/weather/summary`);
    const weatherData = await weatherResponse.json();
    
    if (weatherData.success) {
      const data = weatherData.data;
      console.log(`   Last Update: ${new Date(data.lastUpdate).toLocaleString()}`);
      
      if (data.locations) {
        console.log('\n   Location Temperatures:');
        Object.entries(data.locations).forEach(([city, info]) => {
          console.log(`   - ${city}: ${info.temp}°C ${info.icon} ${info.condition}`);
        });
      }
      
      if (data.windSpeed) {
        console.log(`\n   🌬️  Redheugh Bridge Wind: ${data.windSpeed}mph`);
        if (data.windAlert) {
          console.log(`   ⚠️  WIND ALERT: ${data.windAlert.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error monitoring weather API:', error.message);
  }
}

function createProgressBar(percentage) {
  const width = 30;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  let color = '\x1b[32m'; // green
  if (percentage > 80) color = '\x1b[31m'; // red
  else if (percentage > 60) color = '\x1b[33m'; // yellow
  
  return `[${color}${'█'.repeat(filled)}\x1b[0m${'░'.repeat(empty)}] ${percentage}%`;
}

// Run the monitor
checkWeatherAPIStatus();

// Optionally set up continuous monitoring
if (process.argv.includes('--watch')) {
  console.log('\n\n🔄 Monitoring every 5 minutes... (Ctrl+C to stop)\n');
  setInterval(async () => {
    console.clear();
    await checkWeatherAPIStatus();
  }, 5 * 60 * 1000);
}
