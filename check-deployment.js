#!/usr/bin/env node
// check-deployment.js - Monitor Go BARRY deployment status

import https from 'https';
import { setTimeout } from 'timers/promises';

const BACKEND_URL = 'https://go-barry.onrender.com';
const HEALTH_ENDPOINT = '/api/health';
const MAX_RETRIES = 30; // 5 minutes with 10-second intervals
const RETRY_INTERVAL = 10000; // 10 seconds

console.log('🚀 Go BARRY Deployment Monitor');
console.log('===============================');
console.log(`Checking: ${BACKEND_URL}${HEALTH_ENDPOINT}`);
console.log(`Max retries: ${MAX_RETRIES} (${(MAX_RETRIES * RETRY_INTERVAL) / 1000}s timeout)`);
console.log('');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Go-BARRY-Deployment-Monitor/1.0'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: response.statusCode,
            data: jsonData,
            headers: response.headers
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            data: data,
            headers: response.headers,
            parseError: error.message
          });
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkDeployment() {
  let attempt = 1;
  
  while (attempt <= MAX_RETRIES) {
    const timestamp = new Date().toISOString();
    process.stdout.write(`[${timestamp}] Attempt ${attempt}/${MAX_RETRIES}: `);
    
    try {
      const response = await makeRequest(`${BACKEND_URL}${HEALTH_ENDPOINT}`);
      
      if (response.status === 200) {
        console.log('✅ SUCCESS!');
        console.log('');
        console.log('📊 Health Check Response:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');
        
        // Check for new features
        if (response.data.features) {
          console.log('🆕 New Features Deployed:');
          response.data.features.forEach(feature => {
            console.log(`   • ${feature}`);
          });
          console.log('');
        }
        
        // Check memory usage
        if (response.data.memory) {
          const memoryUsage = response.data.memory;
          const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
          const maxMemoryMB = 2048; // 2GB limit
          const memoryPercent = Math.round((memoryMB / maxMemoryMB) * 100);
          
          console.log(`💾 Memory Usage: ${memoryMB}MB / ${maxMemoryMB}MB (${memoryPercent}%)`);
          
          if (memoryPercent > 80) {
            console.log('⚠️  Warning: High memory usage detected');
          } else {
            console.log('✅ Memory usage within normal limits');
          }
          console.log('');
        }
        
        console.log('🎉 Deployment successful! Backend is running.');
        return true;
      } else {
        console.log(`❌ HTTP ${response.status} - Service not ready`);
        if (response.data) {
          console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
    
    if (attempt < MAX_RETRIES) {
      console.log(`   Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
      await setTimeout(RETRY_INTERVAL);
    }
    
    attempt++;
  }
  
  console.log('');
  console.log('💥 Deployment check failed - service not responding after timeout');
  console.log('');
  console.log('🔍 Troubleshooting suggestions:');
  console.log('   1. Check Render.com dashboard for build/deployment errors');
  console.log('   2. Verify environment variables are configured correctly');
  console.log('   3. Check application logs for startup errors');
  console.log(`   4. Test manually: curl ${BACKEND_URL}${HEALTH_ENDPOINT}`);
  
  return false;
}

// Run the deployment check
checkDeployment().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Deployment monitor failed:', error);
  process.exit(1);
});