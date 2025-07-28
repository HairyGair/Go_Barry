// Test imports one by one to find the problematic module
import express from 'express';
console.log('✅ express imported');

try {
  const { fetchTomTomTrafficWithStreetNames } = await import('./services/tomtom-enhanced.js');
  console.log('✅ tomtom-enhanced imported');
} catch (e) {
  console.log('❌ tomtom-enhanced failed:', e.message);
}

try {
  const adminAPI = await import('./routes/adminAPI.js');
  console.log('✅ adminAPI imported');
} catch (e) {
  console.log('❌ adminAPI failed:', e.message);
}

try {
  const supervisorManager = await import('./services/supervisorManager.js');
  console.log('✅ supervisorManager imported');
} catch (e) {
  console.log('❌ supervisorManager failed:', e.message);
}

try {
  const enhancedDataSourceManager = await import('./services/enhancedDataSourceManager.js');
  console.log('✅ enhancedDataSourceManager imported');
} catch (e) {
  console.log('❌ enhancedDataSourceManager failed:', e.message);
}

console.log('Test complete');
